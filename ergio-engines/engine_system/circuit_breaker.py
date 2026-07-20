"""
ERGIO Circuit Breaker + Retry Logic
Prevents cascade failures. Auto-disables broken services. Retries with backoff.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import time
from typing import Callable, Any, Optional
from utils.logger import log


class CircuitBreaker:
    """
    Tracks failures per service (MCP, plugin, engine).
    After 3 failures within 60 seconds, the circuit opens (service disabled) for 5 minutes.
    After 5 minutes, the circuit half-opens (one test request allowed).
    If the test succeeds, the circuit closes (service re-enabled).
    """
    
    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 300, window: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout  # 5 minutes
        self.window = window  # failures must occur within this window (seconds)
        self._states: dict[str, dict] = {}  # service_name -> {state, failures, last_failure_time, opened_at}
    
    def _get_state(self, service: str) -> dict:
        if service not in self._states:
            self._states[service] = {
                "state": "closed",      # closed = working, open = disabled, half_open = testing
                "failures": [],         # list of failure timestamps
                "opened_at": None,
            }
        return self._states[service]
    
    def is_available(self, service: str) -> bool:
        state = self._get_state(service)
        if state["state"] == "open":
            # Check if recovery timeout has passed
            if state["opened_at"] and (time.time() - state["opened_at"]) >= self.recovery_timeout:
                state["state"] = "half_open"
                log.info(f"🔄 Circuit breaker for {service}: OPEN -> HALF_OPEN (testing)")
                return True
            return False  # still open, service unavailable
        return True  # closed or half_open
    
    def record_success(self, service: str):
        state = self._get_state(service)
        if state["state"] == "half_open":
            state["state"] = "closed"
            state["failures"] = []
            state["opened_at"] = None
            log.info(f"✅ Circuit breaker for {service}: HALF_OPEN -> CLOSED (recovered)")
    
    def record_failure(self, service: str):
        state = self._get_state(service)
        now = time.time()
        # Clean old failures outside the window
        state["failures"] = [t for t in state["failures"] if now - t < self.window]
        state["failures"].append(now)
        
        if state["state"] == "half_open":
            # Failed during test, back to open
            state["state"] = "open"
            state["opened_at"] = now
            log.warn(f"🔴 Circuit breaker for {service}: HALF_OPEN -> OPEN (test failed)")
            return
        
        if len(state["failures"]) >= self.failure_threshold:
            state["state"] = "open"
            state["opened_at"] = now
            log.error(f"🔴 Circuit breaker for {service}: CLOSED -> OPEN ({len(state['failures'])} failures in {self.window}s)")
    
    def get_status(self) -> dict:
        return {
            service: {
                "state": s["state"],
                "failures": len(s["failures"]),
                "opened_at": s["opened_at"],
            }
            for service, s in self._states.items()
        }


# Global circuit breaker instance
breaker = CircuitBreaker()


async def with_retry(
    func: Callable,
    *args,
    service_name: str = "unknown",
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 15.0,
    timeout: float = 60.0,
    **kwargs,
) -> Any:
    """
    Execute a function with retry logic, circuit breaker, and timeout.
    
    Retries: 3 attempts with exponential backoff (1s, 5s, 15s).
    After 3 failures, circuit breaker opens for that service.
    Each attempt has a 60-second timeout.
    """
    if not breaker.is_available(service_name):
        raise RuntimeError(f"Circuit breaker OPEN for {service_name}. Service temporarily disabled.")
    
    last_error = None
    for attempt in range(max_retries):
        try:
            result = await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=timeout,
            )
            breaker.record_success(service_name)
            return result
        except asyncio.TimeoutError:
            last_error = RuntimeError(f"{service_name} timed out after {timeout}s (attempt {attempt + 1})")
            log.warn(f"⏱️ {last_error}")
        except Exception as e:
            last_error = e
            log.warn(f"⚠️ {service_name} failed (attempt {attempt + 1}/{max_retries}): {e}")
        
        if attempt < max_retries - 1:
            delay = min(base_delay * (5 ** attempt), max_delay)  # 1s, 5s, 15s
            log.info(f"⏳ Retrying {service_name} in {delay}s...")
            await asyncio.sleep(delay)
    
    breaker.record_failure(service_name)
    raise last_error or RuntimeError(f"{service_name} failed after {max_retries} retries")

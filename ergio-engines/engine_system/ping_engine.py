"""
ERGIO Ping Engine v5.1
Keeps the Render free tier server awake by pinging it every 10 minutes.
Render free tier sleeps after 15 min of inactivity — this prevents that.
Also monitors uptime and reports status.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import httpx
import time
from datetime import datetime
from utils.logger import log


class PingEngine:
    """
    Pings the Render server every 10 minutes to prevent free tier sleep.
    Also tracks uptime history and can ping external services.
    """
    
    def __init__(self):
        self.ping_url = os.getenv("PING_URL", "")  # Set to your Render URL
        self.interval_seconds = int(os.getenv("PING_INTERVAL", "600"))  # 10 min default
        self.uptime_history = []
        self.last_ping = None
        self.total_pings = 0
        self.successful_pings = 0
        self.failed_pings = 0
        self._running = False
    
    def set_url(self, url: str):
        """Set the URL to ping (your Render deployment URL)."""
        self.ping_url = url
        log.info(f"PingEngine target set to: {url}")
    
    async def ping_once(self, url: str = None) -> dict:
        """Ping the server once and return status."""
        target = url or self.ping_url or "http://localhost:8000/health"
        start = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(target)
                elapsed = time.time() - start
                success = resp.status_code == 200
                
                result = {
                    "url": target,
                    "status_code": resp.status_code,
                    "success": success,
                    "response_time_ms": round(elapsed * 1000, 2),
                    "timestamp": datetime.utcnow().isoformat(),
                }
                
                self.total_pings += 1
                if success:
                    self.successful_pings += 1
                    log.info(f"Ping OK: {target} ({result['response_time_ms']}ms)")
                else:
                    self.failed_pings += 1
                    log.warn(f"Ping FAIL: {target} (status {resp.status_code})")
                
                self.last_ping = result
                self.uptime_history.append(result)
                # Keep only last 100 pings
                if len(self.uptime_history) > 100:
                    self.uptime_history = self.uptime_history[-100:]
                
                return result
                
        except Exception as e:
            elapsed = time.time() - start
            self.failed_pings += 1
            self.total_pings += 1
            result = {
                "url": target,
                "status_code": 0,
                "success": False,
                "response_time_ms": round(elapsed * 1000, 2),
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
            self.last_ping = result
            self.uptime_history.append(result)
            if len(self.uptime_history) > 100:
                self.uptime_history = self.uptime_history[-100:]
            log.error(f"Ping ERROR: {target} — {e}")
            return result
    
    async def start_keepalive(self):
        """Start the keepalive loop — pings every 10 minutes."""
        if self._running:
            log.info("PingEngine already running")
            return
        
        self._running = True
        log.info(f"PingEngine started — pinging every {self.interval_seconds}s")
        
        while self._running:
            try:
                await self.ping_once()
            except Exception as e:
                log.error(f"PingEngine loop error: {e}")
            await asyncio.sleep(self.interval_seconds)
    
    def stop_keepalive(self):
        """Stop the keepalive loop."""
        self._running = False
        log.info("PingEngine stopped")
    
    def get_status(self) -> dict:
        """Get ping engine status and uptime stats."""
        uptime_pct = 0
        if self.total_pings > 0:
            uptime_pct = round((self.successful_pings / self.total_pings) * 100, 2)
        
        return {
            "running": self._running,
            "target_url": self.ping_url or "not set",
            "interval_seconds": self.interval_seconds,
            "total_pings": self.total_pings,
            "successful": self.successful_pings,
            "failed": self.failed_pings,
            "uptime_percentage": uptime_pct,
            "last_ping": self.last_ping,
            "recent_history": self.uptime_history[-10:],
        }
    
    async def ping_multiple(self, urls: list) -> list:
        """Ping multiple URLs at once (useful for monitoring all ERGIO services)."""
        tasks = [self.ping_once(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r if not isinstance(r, Exception) else {"error": str(r)} for r in results]


# Global instance
ping_engine = PingEngine()

"""
ERGIO AI Router v5.2 — Multi-Model Intelligence
Routes requests to the best AI model across 10+ platforms.
Auto-falls back to next provider on failure. Circuit breaker protected.

Platforms: Groq, OpenAI, Google (Gemini), Cerebras, OpenRouter, 
Together AI, Anthropic, Mistral, Fireworks, Pollinations, Cohere, DeepSeek
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import httpx
import json
import asyncio
import time
from typing import Optional
from utils.logger import log
from engine_system.circuit_breaker import with_retry, breaker


# ── AI Provider Registry ──
AI_PROVIDERS = {
    "groq": {
        "name": "Groq",
        "base_url": "https://api.groq.com/openai/v1/chat/completions",
        "auth_type": "bearer",
        "key_env": "GROQ_API_KEY",
        "format": "openai",  # OpenAI-compatible format
        "models": {
            "smart": "llama-3.3-70b-versatile",
            "fast": "llama-3.1-8b-instant",
            "reasoning": "deepseek-r1-distill-llama-70b",
            "vision": "llama-3.2-90b-vision-preview",
        },
        "max_tokens": 8192,
        "speed_tier": "ultra_fast",
    },
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1/chat/completions",
        "auth_type": "bearer",
        "key_env": "OPENAI_API_KEY",
        "format": "openai",
        "models": {
            "smart": "gpt-4o",
            "fast": "gpt-4o-mini",
            "reasoning": "o3-mini",
            "vision": "gpt-4o",
        },
        "max_tokens": 16384,
        "speed_tier": "fast",
    },
    "google": {
        "name": "Google Gemini",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/models",
        "auth_type": "query_param",
        "key_env": "GOOGLE_API_KEY",
        "key_param": "key",
        "format": "google",
        "models": {
            "smart": "gemini-2.5-flash",
            "fast": "gemini-2.0-flash-lite",
            "reasoning": "gemini-2.5-pro",
            "vision": "gemini-2.5-flash",
        },
        "max_tokens": 8192,
        "speed_tier": "fast",
    },
    "cerebras": {
        "name": "Cerebras",
        "base_url": "https://api.cerebras.ai/v1/chat/completions",
        "auth_type": "bearer",
        "key_env": "CEREBRAS_API_KEY",
        "format": "openai",
        "models": {
            "smart": "llama-4-scout-17b-16e-instruct",
            "fast": "llama3.1-8b-instruct",
            "reasoning": "llama-4-maverick-17b-128e-instruct",
        },
        "max_tokens": 8192,
        "speed_tier": "ultra_fast",  # Cerebras is the fastest inference
    },
    "openrouter": {
        "name": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1/chat/completions",
        "auth_type": "bearer",
        "key_env": "OPENROUTER_API_KEY",
        "format": "openai",
        "extra_headers": {
            "HTTP-Referer": "https://ergio.vercel.app",
            "X-Title": "ERGIO Engines",
        },
        "models": {
            "smart": "anthropic/claude-3.5-sonnet",
            "fast": "meta-llama/llama-3.1-8b-instruct",
            "reasoning": "openai/o3-mini",
            "vision": "google/gemini-2.5-flash",
            "free": "meta-llama/llama-3.1-8b-instruct:free",
        },
        "max_tokens": 16384,
        "speed_tier": "fast",
    },
    "together": {
        "name": "Together AI",
        "base_url": "https://api.together.xyz/v1/chat/completions",
        "auth_type": "bearer",
        "key_env": "TOGETHER_API_KEY",
        "format": "openai",
        "models": {
            "smart": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            "fast": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            "reasoning": "deepseek-ai/DeepSeek-R1",
            "vision": "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
        },
        "max_tokens": 8192,
        "speed_tier": "fast",
    },
    "anthropic": {
        "name": "Anthropic Claude",
        "base_url": "https://api.anthropic.com/v1/messages",
        "auth_type": "header",
        "key_env": "ANTHROPIC_API_KEY",
        "key_header": "x-api-key",
        "extra_headers": {"anthropic-version": "2023-06-01"},
        "format": "anthropic",
        "models": {
            "smart": "claude-3-5-sonnet-20241022",
            "fast": "claude-3-5-haiku-20241022",
            "reasoning": "claude-3-5-sonnet-20241022",
        },
        "max_tokens": 8192,
        "speed_tier": "fast",
    },
    "mistral": {
        "name": "Mistral AI",
        "base_url": "https://api.mistral.ai/v1/chat/completions",
        "auth_type": "bearer",
        "key_env": "MISTRAL_API_KEY",
        "format": "openai",
        "models": {
            "smart": "mistral-large-latest",
            "fast": "mistral-small-latest",
            "reasoning": "mistral-large-latest",
        },
        "max_tokens": 8192,
        "speed_tier": "fast",
    },
    "fireworks": {
        "name": "Fireworks AI",
        "base_url": "https://api.fireworks.ai/inference/v1/chat/completions",
        "auth_type": "bearer",
        "key_env": "FIREWORKS_API_KEY",
        "format": "openai",
        "models": {
            "smart": "accounts/fireworks/models/llama-v3p3-70b-instruct",
            "fast": "accounts/fireworks/models/llama-v3p1-8b-instruct",
            "reasoning": "accounts/fireworks/models/deepseek-r1",
        },
        "max_tokens": 8192,
        "speed_tier": "fast",
    },
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1/chat/completions",
        "auth_type": "bearer",
        "key_env": "DEEPSEEK_API_KEY",
        "format": "openai",
        "models": {
            "smart": "deepseek-chat",
            "fast": "deepseek-chat",
            "reasoning": "deepseek-reasoner",
        },
        "max_tokens": 8192,
        "speed_tier": "fast",
    },
    "cohere": {
        "name": "Cohere",
        "base_url": "https://api.cohere.com/v2/chat",
        "auth_type": "bearer",
        "key_env": "COHERE_API_KEY",
        "format": "cohere",
        "models": {
            "smart": "command-r-plus",
            "fast": "command-r",
            "reasoning": "command-r-plus",
        },
        "max_tokens": 8192,
        "speed_tier": "fast",
    },
    "pollinations": {
        "name": "Pollinations (Free Fallback)",
        "base_url": "https://text.pollinations.ai",
        "auth_type": "none",
        "key_env": None,
        "format": "pollinations",
        "models": {
            "smart": "openai",
            "fast": "llama",
        },
        "max_tokens": 4096,
        "speed_tier": "medium",
    },
}


class AIRouter:
    """
    Routes AI requests to the best available provider.
    Falls back automatically on failure. Circuit breaker protected.
    """
    
    def __init__(self):
        self.providers = AI_PROVIDERS
        self._default_provider = None
        self._fallback_chain = []
        self._detect_configured()
    
    def _detect_configured(self):
        """Build a fallback chain from configured providers."""
        configured = []
        for key, provider in self.providers.items():
            env = provider.get("key_env")
            if env is None or os.getenv(env, ""):
                configured.append(key)
        
        # Priority order: Groq (fastest) > Cerebras > OpenAI > Google > OpenRouter > Together > rest
        priority = ["groq", "cerebras", "openai", "google", "openrouter", "together", "anthropic", "mistral", "deepseek", "fireworks", "cohere", "pollinations"]
        
        self._fallback_chain = [p for p in priority if p in configured]
        
        if self._fallback_chain:
            self._default_provider = self._fallback_chain[0]
            log.info(f"AI Router: {len(configured)} providers configured. Primary: {self._default_provider}")
            log.info(f"AI Router fallback chain: {' → '.join(self._fallback_chain)}")
        else:
            self._default_provider = "pollinations"  # Always available
            self._fallback_chain = ["pollinations"]
            log.warn("AI Router: No API keys configured. Using Pollinations (free) only.")
    
    def list_providers(self) -> dict:
        """List all AI providers and their configuration status."""
        result = {}
        for key, provider in self.providers.items():
            env = provider.get("key_env")
            result[key] = {
                "name": provider["name"],
                "configured": env is None or bool(os.getenv(env, "")),
                "speed_tier": provider.get("speed_tier", "unknown"),
                "models": list(provider.get("models", {}).keys()),
                "format": provider.get("format"),
            }
        return result
    
    def get_provider_for_task(self, task_type: str = "smart") -> str:
        """
        Pick the best provider for a task type.
        task_type: 'smart', 'fast', 'reasoning', 'vision', 'free'
        """
        for provider_key in self._fallback_chain:
            provider = self.providers[provider_key]
            if task_type in provider.get("models", {}):
                return provider_key
        return self._fallback_chain[0] if self._fallback_chain else "pollinations"
    
    async def complete(
        self,
        prompt: str,
        system: str = "You are ERGIO, an AI business operating system.",
        task_type: str = "smart",
        json_mode: bool = False,
        temperature: float = 0.7,
        max_tokens: int = None,
        provider: str = None,
        model: str = None,
    ) -> str:
        """
        Get a text completion from the best available AI model.
        Auto-falls back through the provider chain on failure.
        """
        # Determine provider
        if provider and provider in self._fallback_chain:
            chain = [provider] + [p for p in self._fallback_chain if p != provider]
        else:
            chain = self._fallback_chain
        
        last_error = None
        for provider_key in chain:
            if not breaker.is_available(f"ai_{provider_key}"):
                continue
            
            try:
                result = await self._call_provider(
                    provider_key, prompt, system, task_type,
                    json_mode, temperature, max_tokens, model,
                )
                return result
            except Exception as e:
                last_error = e
                log.warn(f"AI {provider_key} failed: {e}. Trying next provider...")
                breaker.record_failure(f"ai_{provider_key}")
                continue
        
        raise RuntimeError(f"All AI providers failed. Last error: {last_error}")
    
    async def complete_json(
        self,
        prompt: str,
        system: str = "Return only valid JSON.",
        task_type: str = "smart",
        temperature: float = 0.3,
        provider: str = None,
    ) -> dict:
        """Get a JSON completion."""
        text = await self.complete(
            prompt, system, task_type, json_mode=True,
            temperature=temperature, provider=provider,
        )
        # Try to parse JSON
        try:
            # Strip markdown code fences if present
            text = text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON in the text
            import re
            match = re.search(r'\{[\s\S]*\}', text)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass
            raise ValueError(f"Could not parse JSON from AI response: {text[:200]}")
    
    async def _call_provider(
        self, provider_key: str, prompt: str, system: str,
        task_type: str, json_mode: bool, temperature: float,
        max_tokens: int, model_override: str,
    ) -> str:
        """Call a specific AI provider."""
        provider = self.providers[provider_key]
        model = model_override or provider["models"].get(task_type, provider["models"].get("smart", "default"))
        max_tok = max_tokens or provider.get("max_tokens", 4096)
        fmt = provider.get("format", "openai")
        
        headers = {}
        env = provider.get("key_env")
        if env:
            key = os.getenv(env, "")
            if not key:
                raise RuntimeError(f"Missing {env}")
            if provider["auth_type"] == "bearer":
                headers["Authorization"] = f"Bearer {key}"
            elif provider["auth_type"] == "header":
                headers[provider.get("key_header", "Authorization")] = key
        
        # Add extra headers
        for k, v in provider.get("extra_headers", {}).items():
            headers[k] = v
        
        headers["Content-Type"] = "application/json"
        
        # Build request based on format
        if fmt == "openai":
            url = provider["base_url"]
            body = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "temperature": temperature,
                "max_tokens": max_tok,
            }
            if json_mode:
                body["response_format"] = {"type": "json_object"}
            
            async def _call():
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(url, headers=headers, json=body)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
            
            return await with_retry(_call, service_name=f"ai_{provider_key}", max_retries=2, timeout=120.0)
        
        elif fmt == "google":
            url = f"{provider['base_url']}/{model}:generateContent"
            if provider["auth_type"] == "query_param":
                key = os.getenv(env, "")
                url += f"?key={key}"
            
            body = {
                "contents": [{"parts": [{"text": f"{system}\n\n{prompt}"}]}],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tok,
                },
            }
            if json_mode:
                body["generationConfig"]["responseMimeType"] = "application/json"
            
            async def _call():
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(url, headers={"Content-Type": "application/json"}, json=body)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
            
            return await with_retry(_call, service_name=f"ai_{provider_key}", max_retries=2, timeout=120.0)
        
        elif fmt == "anthropic":
            url = provider["base_url"]
            body = {
                "model": model,
                "max_tokens": max_tok,
                "system": system,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
            }
            
            async def _call():
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(url, headers=headers, json=body)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["content"][0]["text"]
            
            return await with_retry(_call, service_name=f"ai_{provider_key}", max_retries=2, timeout=120.0)
        
        elif fmt == "cohere":
            url = provider["base_url"]
            body = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "temperature": temperature,
                "max_tokens": max_tok,
            }
            
            async def _call():
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(url, headers=headers, json=body)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["message"]["content"][0]["text"]
            
            return await with_retry(_call, service_name=f"ai_{provider_key}", max_retries=2, timeout=120.0)
        
        elif fmt == "pollinations":
            import urllib.parse
            encoded = urllib.parse.quote(f"{system}\n\n{prompt}")
            url = f"{provider['base_url']}/{encoded}"
            if model:
                url += f"?model={model}"
            
            async def _call():
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    return resp.text
            
            return await with_retry(_call, service_name=f"ai_{provider_key}", max_retries=2, timeout=60.0)
        
        else:
            raise ValueError(f"Unknown format: {fmt}")
    
    async def race_models(self, prompt: str, system: str = "", task_type: str = "fast", providers: list = None) -> dict:
        """
        Race multiple AI models in parallel and return the fastest valid response.
        Inspired by STEW AI's instant_execute mode.
        """
        if not providers:
            providers = [p for p in self._fallback_chain[:3]]  # Top 3 configured
        
        tasks = []
        for p in providers:
            tasks.append(self.complete(prompt, system, task_type, provider=p))
        
        done, pending = await asyncio.wait(
            [asyncio.create_task(t) for t in tasks],
            return_when=asyncio.FIRST_COMPLETED,
            timeout=30.0,
        )
        
        # Cancel pending
        for t in pending:
            t.cancel()
        
        # Return first completed
        for t in done:
            try:
                result = t.result()
                return {"text": result, "provider": "fastest_available"}
            except:
                continue
        
        raise RuntimeError("All models failed in race")


# Global instance
ai_router = AIRouter()

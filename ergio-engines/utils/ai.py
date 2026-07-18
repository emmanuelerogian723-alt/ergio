"""
ERGIO Engines — Groq AI Client
Wraps Groq SDK for AI tasks: lead scoring, outreach writing, social content, etc.
"""

import json
import re
from typing import Any, Optional
from groq import Groq
from config import settings
from utils.logger import log

_client: Optional[Groq] = None

def get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY not set — get one at https://console.groq.com/keys")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client

def ai_complete(
    prompt: str,
    system: str = "You are ERGIO's AI engine. Return only valid JSON when asked.",
    model: str = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
    json_mode: bool = True,
) -> str:
    """Call Groq and return raw text."""
    client = get_client()
    use_model = model or settings.GROQ_MODEL_SMART

    kwargs = {
        "model": use_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""

def ai_json(
    prompt: str,
    system: str = "Return only valid JSON.",
    model: str = None,
    temperature: float = 0.5,
    max_tokens: int = 2048,
) -> dict:
    """Call Groq and parse JSON response. Falls back to regex extraction."""
    raw = ai_complete(prompt, system, model, temperature, max_tokens, json_mode=True)

    # Try direct parse first
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        pass

    # Try to find a JSON object or array
    for pattern in [r'\{[\s\S]*\}', r'\[[\s\S]*\]']:
        match = re.search(pattern, raw)
        if match:
            try:
                return json.loads(match.group())
            except (json.JSONDecodeError, TypeError):
                continue

    log.warning(f"Failed to parse AI JSON response: {raw[:200]}")
    return {}

def ai_fast(prompt: str, system: str = "Return only valid JSON.", temperature: float = 0.3) -> dict:
    """Fast model for quick tasks like scoring."""
    return ai_json(prompt, system, model=settings.GROQ_MODEL_FAST, temperature=temperature, max_tokens=1024)

def ai_smart(prompt: str, system: str = "Return only valid JSON.", temperature: float = 0.7) -> dict:
    """Smart model for complex tasks like content generation."""
    return ai_json(prompt, system, model=settings.GROQ_MODEL_SMART, temperature=temperature, max_tokens=2048)

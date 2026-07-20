"""
ERGIO Event Bus
Redis Pub/Sub for inter-engine communication.
When a lead is captured, the Lead Engine publishes an event.
The Workflow Engine subscribes and triggers the next step.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import json
from typing import Callable, Any, Optional
from utils.logger import log


class EventBus:
    """
    Redis-based event bus for inter-engine communication.
    Falls back to in-memory pub/sub if Redis is not available.
    
    Channels:
    - lead_captured    → Lead Engine → Workflow Engine
    - lead_scored      → Lead Engine → Outreach Engine
    - booking_created  → Booking Engine → Invoice Engine
    - invoice_paid     → Payment Engine → Analytics Engine
    - content_ready    → Content Engine → Social Media Plugins
    - review_received  → Reputation Engine → Approval Gateway
    - approval_needed  → Any Engine → Dashboard notification
    - business_built   → Website Engine → All Engines (activate)
    """
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url
        self._redis = None
        self._subscribers: dict[str, list[Callable]] = {}  # in-memory fallback
        self._connected = False
    
    async def connect(self):
        """Connect to Redis if available."""
        if self.redis_url:
            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(self.redis_url, decode_responses=True)
                await self._redis.ping()
                self._connected = True
                log.info("🚌 Event bus connected to Redis")
            except Exception as e:
                log.warn(f"⚠️ Redis not available, using in-memory event bus: {e}")
                self._connected = False
        else:
            log.info("🚌 No Redis URL — using in-memory event bus")
    
    async def publish(self, channel: str, data: dict):
        """Publish an event to a channel."""
        event = {
            "channel": channel,
            "data": data,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        }
        
        if self._connected and self._redis:
            await self._redis.publish(channel, json.dumps(event))
            log.info(f"📢 Published to {channel}: {data.get('type', 'event')}")
        else:
            # In-memory fallback
            await self._notify_in_memory(channel, event)
    
    async def subscribe(self, channel: str, handler: Callable):
        """Subscribe to a channel with a handler function."""
        if self._connected and self._redis:
            pubsub = self._redis.pubsub()
            await pubsub.subscribe(channel)
            log.info(f"👂 Subscribed to {channel}")
            
            # Start listener task
            async def _listen():
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        try:
                            event = json.loads(message["data"])
                            await handler(event["data"])
                        except Exception as e:
                            log.error(f"❌ Event handler error for {channel}: {e}")
            
            asyncio.create_task(_listen())
        else:
            # In-memory fallback
            if channel not in self._subscribers:
                self._subscribers[channel] = []
            self._subscribers[channel].append(handler)
            log.info(f"👂 Subscribed to {channel} (in-memory)")
    
    async def _notify_in_memory(self, channel: str, event: dict):
        """Notify in-memory subscribers."""
        handlers = self._subscribers.get(channel, [])
        for handler in handlers:
            try:
                await handler(event["data"])
            except Exception as e:
                log.error(f"❌ In-memory handler error for {channel}: {e}")
    
    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            log.info("🚌 Event bus disconnected")


# Global event bus instance
event_bus = EventBus(redis_url=__import__("os").getenv("REDIS_URL", ""))

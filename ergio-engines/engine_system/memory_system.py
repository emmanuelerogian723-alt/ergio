"""
ERGIO Memory System v5.2 — 3-Layer Architecture
Inspired by Hermes Agent: durable facts, procedural skills, session search.

Layer 1: Durable Facts (MEMORY.md) — stable info, preferences, conventions
Layer 2: Procedural Skills — reusable workflows with commands and verification
Layer 3: Session Search — recall past conversations without storing raw transcripts
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import time
from datetime import datetime
from typing import Optional
from utils.logger import log

try:
    from db.supabase_client import is_db_ready, get_supabase
except:
    pass


class MemorySystem:
    """
    3-Layer Memory for ERGIO Conductor.
    Makes future agent runs require less repeated context and fewer corrections.
    """
    
    def __init__(self):
        self.layer1 = DurableFacts()
        self.layer2 = ProceduralSkills()
        self.layer3 = SessionSearch()
        log.info("MemorySystem initialized — 3 layers active")
    
    async def remember(self, fact: str, category: str = "general", business_id: str = None) -> dict:
        """Save a durable fact (Layer 1)."""
        return await self.layer1.save(fact, category, business_id)
    
    async def recall(self, query: str, business_id: str = None, limit: int = 10) -> list:
        """Recall relevant facts (Layer 1)."""
        return await self.layer1.search(query, business_id, limit)
    
    async def learn_skill(self, name: str, steps: list, trigger: str = "", verification: str = "") -> dict:
        """Learn a procedural skill (Layer 2)."""
        return await self.layer2.save(name, steps, trigger, verification)
    
    async def get_skill(self, name: str) -> dict:
        """Retrieve a skill (Layer 2)."""
        return await self.layer2.get(name)
    
    async def search_sessions(self, query: str, business_id: str = None, limit: int = 5) -> list:
        """Search past sessions (Layer 3)."""
        return await self.layer3.search(query, business_id, limit)
    
    async def save_session(self, session_id: str, summary: str, business_id: str = None, metadata: dict = None) -> dict:
        """Save a session for future recall (Layer 3)."""
        return await self.layer3.save(session_id, summary, business_id, metadata)
    
    def build_context(self, query: str, business_id: str = None) -> str:
        """
        Build a context string from all 3 layers for the Conductor prompt.
        This is what makes ERGIO remember and improve over time.
        """
        import asyncio
        loop = asyncio.get_event_loop()
        
        facts = loop.run_until_complete(self.recall(query, business_id, limit=5))
        skills = loop.run_until_complete(self.layer2.list_all())
        sessions = loop.run_until_complete(self.search_sessions(query, business_id, limit=3))
        
        context_parts = []
        
        if facts:
            context_parts.append("=== DURABLE FACTS (Layer 1) ===")
            for f in facts:
                context_parts.append(f"- [{f.get('category', 'general')}] {f.get('fact', '')}")
        
        if skills:
            context_parts.append("\n=== AVAILABLE SKILLS (Layer 2) ===")
            for s in skills:
                context_parts.append(f"- {s.get('name', '')}: {s.get('trigger', '')}")
        
        if sessions:
            context_parts.append("\n=== RELEVANT PAST SESSIONS (Layer 3) ===")
            for s in sessions:
                context_parts.append(f"- [{s.get('date', '')}] {s.get('summary', '')}")
        
        if not context_parts:
            return "No prior memory. This is a fresh context."
        
        return "\n".join(context_parts)


class DurableFacts:
    """Layer 1: Stable facts that shape future behavior."""
    
    async def save(self, fact: str, category: str, business_id: str = None) -> dict:
        entry = {
            "fact": fact,
            "category": category,
            "business_id": business_id,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        if is_db_ready():
            try:
                sb = get_supabase()
                sb.table("ergio_memory").insert(entry).execute()
                log.info(f"Fact saved to DB: [{category}] {fact[:60]}")
            except Exception as e:
                log.warn(f"DB save failed, using file: {e}")
                self._save_file(entry)
        else:
            self._save_file(entry)
        
        return {"status": "saved", "fact": fact, "layer": 1}
    
    async def search(self, query: str, business_id: str = None, limit: int = 10) -> list:
        if is_db_ready():
            try:
                sb = get_supabase()
                q = sb.table("ergio_memory").select("*").order("created_at", desc=True).limit(limit)
                if business_id:
                    q = q.eq("business_id", business_id)
                resp = q.execute()
                return resp.data or []
            except:
                pass
        return self._search_file(query, limit)
    
    def _save_file(self, entry: dict):
        path = os.path.join(os.path.dirname(__file__), "..", "memory_facts.json")
        data = []
        if os.path.exists(path):
            with open(path) as f:
                try: data = json.load(f)
                except: pass
        data.append(entry)
        with open(path, "w") as f:
            json.dump(data[-500:], f, indent=2)  # Keep last 500
    
    def _search_file(self, query: str, limit: int) -> list:
        path = os.path.join(os.path.dirname(__file__), "..", "memory_facts.json")
        if not os.path.exists(path):
            return []
        with open(path) as f:
            data = json.load(f)
        # Simple keyword search
        query_lower = query.lower()
        scored = [(d, sum(1 for w in query_lower.split() if w in d.get("fact", "").lower())) for d in data]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [d for d, s in scored[:limit] if s > 0]


class ProceduralSkills:
    """Layer 2: Reusable workflows with commands and verification steps."""
    
    async def save(self, name: str, steps: list, trigger: str = "", verification: str = "") -> dict:
        entry = {
            "name": name,
            "steps": steps,
            "trigger": trigger,
            "verification": verification,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        if is_db_ready():
            try:
                sb = get_supabase()
                sb.table("ergio_skills").insert(entry).execute()
            except:
                self._save_file(entry)
        else:
            self._save_file(entry)
        
        return {"status": "learned", "skill": name, "steps": len(steps), "layer": 2}
    
    async def get(self, name: str) -> dict:
        if is_db_ready():
            try:
                sb = get_supabase()
                resp = sb.table("ergio_skills").select("*").eq("name", name).execute()
                if resp.data:
                    return resp.data[0]
            except:
                pass
        return self._get_file(name)
    
    async def list_all(self) -> list:
        if is_db_ready():
            try:
                sb = get_supabase()
                resp = sb.table("ergio_skills").select("name,trigger").execute()
                return resp.data or []
            except:
                pass
        return self._list_file()
    
    def _save_file(self, entry):
        path = os.path.join(os.path.dirname(__file__), "..", "memory_skills.json")
        data = []
        if os.path.exists(path):
            with open(path) as f:
                try: data = json.load(f)
                except: pass
        # Replace if exists
        data = [d for d in data if d.get("name") != entry["name"]]
        data.append(entry)
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
    
    def _get_file(self, name):
        data = self._list_file()
        for d in data:
            if d.get("name") == name:
                return d
        return {}
    
    def _list_file(self):
        path = os.path.join(os.path.dirname(__file__), "..", "memory_skills.json")
        if not os.path.exists(path):
            return []
        with open(path) as f:
            try: return json.load(f)
            except: return []


class SessionSearch:
    """Layer 3: Recall past conversations without storing raw transcripts."""
    
    async def save(self, session_id: str, summary: str, business_id: str = None, metadata: dict = None) -> dict:
        entry = {
            "session_id": session_id,
            "summary": summary,
            "business_id": business_id,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        }
        
        if is_db_ready():
            try:
                sb = get_supabase()
                sb.table("ergio_sessions").insert(entry).execute()
            except:
                self._save_file(entry)
        else:
            self._save_file(entry)
        
        return {"status": "saved", "session_id": session_id, "layer": 3}
    
    async def search(self, query: str, business_id: str = None, limit: int = 5) -> list:
        if is_db_ready():
            try:
                sb = get_supabase()
                q = sb.table("ergio_sessions").select("*").order("created_at", desc=True).limit(limit)
                if business_id:
                    q = q.eq("business_id", business_id)
                resp = q.execute()
                return resp.data or []
            except:
                pass
        return self._search_file(query, limit)
    
    def _save_file(self, entry):
        path = os.path.join(os.path.dirname(__file__), "..", "memory_sessions.json")
        data = []
        if os.path.exists(path):
            with open(path) as f:
                try: data = json.load(f)
                except: pass
        data.append(entry)
        with open(path, "w") as f:
            json.dump(data[-200:], f, indent=2)
    
    def _search_file(self, query, limit):
        path = os.path.join(os.path.dirname(__file__), "..", "memory_sessions.json")
        if not os.path.exists(path):
            return []
        with open(path) as f:
            data = json.load(f)
        query_lower = query.lower()
        scored = [(d, sum(1 for w in query_lower.split() if w in d.get("summary", "").lower())) for d in data]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [d for d, s in scored[:limit] if s > 0]


# Global instance
memory = MemorySystem()

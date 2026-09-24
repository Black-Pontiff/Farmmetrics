from __future__ import annotations
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable
@dataclass
class _Entry: value: Any; expires_at: float
class TTLCache:
 def __init__(self): self._store={}
 def get(self,k):
  e=self._store.get(k)
  if not e:return None
  if e.expires_at<time.monotonic(): self._store.pop(k,None); return None
  return e.value
 def set(self,k,v,ttl_seconds): self._store[k]=_Entry(v,time.monotonic()+ttl_seconds)
 def invalidate(self,k): self._store.pop(k,None)
 async def get_or_set(self,k,ttl_seconds,factory:Callable[[],Awaitable[Any]]):
  v=self.get(k)
  if v is None: v=await factory(); self.set(k,v,ttl_seconds) if v is not None else None
  return v
cache=TTLCache()

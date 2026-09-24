from __future__ import annotations
import time
from collections import defaultdict
class TokenBucket:
 def __init__(self,max_requests,window_s):
  if max_requests<=0 or window_s<=0: raise ValueError('parameters must be positive')
  self.max_requests=max_requests; self.window_s=window_s; self._hits=defaultdict(list)
 def allow(self,key,now=None):
  now=time.monotonic() if now is None else now; hits=self._hits[key]; cutoff=now-self.window_s
  while hits and hits[0]<cutoff: hits.pop(0)
  if len(hits)>=self.max_requests:return False
  hits.append(now); return True
 def reset(self,key): self._hits.pop(key,None)
 def current_load(self,key): return len(self._hits.get(key,[]))

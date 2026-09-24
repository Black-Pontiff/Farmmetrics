from __future__ import annotations
import asyncio, sqlite3
Row=sqlite3.Row
class Cursor:
 def __init__(self,c): self._c=c
 @property
 def lastrowid(self): return self._c.lastrowid
 async def fetchone(self): return await asyncio.to_thread(self._c.fetchone)
 async def fetchall(self): return await asyncio.to_thread(self._c.fetchall)
class Connection:
 def __init__(self,path): self._c=sqlite3.connect(path,check_same_thread=False)
 @property
 def row_factory(self): return self._c.row_factory
 @row_factory.setter
 def row_factory(self,v): self._c.row_factory=v
 async def execute(self,sql,params=()): return Cursor(await asyncio.to_thread(self._c.execute,sql,tuple(params)))
 async def executescript(self,sql): await asyncio.to_thread(self._c.executescript,sql)
 async def commit(self): await asyncio.to_thread(self._c.commit)
 async def close(self): await asyncio.to_thread(self._c.close)
async def connect(path): return await asyncio.to_thread(Connection,path)

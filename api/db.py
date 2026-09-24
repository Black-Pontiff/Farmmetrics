from __future__ import annotations
import os
from . import _sqlite_compat as _sqlite
SCHEMA='''CREATE TABLE IF NOT EXISTS telemetry (id INTEGER PRIMARY KEY AUTOINCREMENT,device_id TEXT NOT NULL,ts TEXT NOT NULL,soil_moisture REAL NOT NULL,temperature REAL NOT NULL,humidity REAL NOT NULL,light_lux INTEGER NOT NULL,anomaly_score REAL NOT NULL DEFAULT 0,crop_type TEXT); CREATE TABLE IF NOT EXISTS merkle_leaves (id INTEGER PRIMARY KEY AUTOINCREMENT,telemetry_id INTEGER NOT NULL,ts TEXT NOT NULL,data_hash TEXT NOT NULL,batch_date TEXT NOT NULL); CREATE TABLE IF NOT EXISTS merkle_roots (batch_date TEXT PRIMARY KEY,root_hash TEXT NOT NULL,signature TEXT NOT NULL,signing_mode TEXT NOT NULL,leaf_count INTEGER NOT NULL,anchored_txid TEXT,finalized_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS inventory (sku TEXT PRIMARY KEY,name TEXT NOT NULL,quantity REAL NOT NULL,unit TEXT NOT NULL,reorder_threshold REAL NOT NULL DEFAULT 0);'''
class Database:
 def __init__(self,path='farm_metrics.db'): self.path=path; self._conn=None
 async def connect(self): self._conn=await _sqlite.connect(self.path); await self._conn.executescript(SCHEMA); await self._conn.commit()
 async def close(self):
  if self._conn: await self._conn.close(); self._conn=None
 @property
 def connected(self): return self._conn is not None
 @property
 def conn(self):
  if not self._conn: raise RuntimeError('Database.connect() was not called')
  return self._conn
 async def insert_telemetry(self,device_id,ts,soil,temp,humidity,light,anomaly=0,crop_type=None):
  c=await self.conn.execute('INSERT INTO telemetry(device_id,ts,soil_moisture,temperature,humidity,light_lux,anomaly_score,crop_type) VALUES (?,?,?,?,?,?,?,?)',(device_id,ts,soil,temp,humidity,light,anomaly,crop_type)); await self.conn.commit(); return c.lastrowid
 async def latest_telemetry(self,device_id=None):
  self.conn.row_factory=_sqlite.Row; c=await self.conn.execute('SELECT * FROM telemetry '+('WHERE device_id=? ' if device_id else '')+'ORDER BY id DESC LIMIT 1',((device_id,) if device_id else ())); r=await c.fetchone(); return dict(r) if r else None
 async def history(self,limit=200,before_id=None,device_id=None):
  self.conn.row_factory=_sqlite.Row; clauses=[]; p=[]
  if device_id: clauses.append('device_id=?'); p.append(device_id)
  if before_id: clauses.append('id<?'); p.append(before_id)
  p.append(limit); c=await self.conn.execute('SELECT * FROM telemetry '+(('WHERE '+' AND '.join(clauses)) if clauses else '')+' ORDER BY id DESC LIMIT ?',p); return [dict(x) for x in await c.fetchall()]
 async def add_leaf(self,telemetry_id,ts,data_hash,batch_date):
  c=await self.conn.execute('INSERT INTO merkle_leaves(telemetry_id,ts,data_hash,batch_date) VALUES(?,?,?,?)',(telemetry_id,ts,data_hash,batch_date)); await self.conn.commit(); return c.lastrowid
 async def leaves_for_batch(self,d):
  self.conn.row_factory=_sqlite.Row; c=await self.conn.execute('SELECT * FROM merkle_leaves WHERE batch_date=? ORDER BY id ASC',(d,)); return [dict(x) for x in await c.fetchall()]
 async def get_telemetry(self,i):
  self.conn.row_factory=_sqlite.Row; c=await self.conn.execute('SELECT * FROM telemetry WHERE id=?',(i,)); r=await c.fetchone(); return dict(r) if r else None
 async def save_root(self,r):
  from datetime import datetime,timezone
  await self.conn.execute('INSERT OR REPLACE INTO merkle_roots VALUES (?,?,?,?,?,?,?)',(r['batch_date'],r['root_hash'],r['signature'],r['signing_mode'],r['leaf_count'],r.get('anchored_txid'),datetime.now(timezone.utc).isoformat())); await self.conn.commit()
 async def get_root(self,d):
  self.conn.row_factory=_sqlite.Row; c=await self.conn.execute('SELECT * FROM merkle_roots WHERE batch_date=?',(d,)); r=await c.fetchone(); return dict(r) if r else None
 async def all_roots(self):
  self.conn.row_factory=_sqlite.Row; c=await self.conn.execute('SELECT * FROM merkle_roots ORDER BY batch_date DESC'); return [dict(x) for x in await c.fetchall()]
 async def inventory(self):
  self.conn.row_factory=_sqlite.Row; c=await self.conn.execute('SELECT * FROM inventory'); return [dict(x) for x in await c.fetchall()]
db=Database(os.environ.get('FARM_DB_PATH','farm_metrics.db'))

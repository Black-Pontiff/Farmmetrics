from __future__ import annotations
import logging,random
from contextlib import asynccontextmanager
from datetime import date,datetime,timezone
from fastapi import BackgroundTasks,Depends,FastAPI,HTTPException
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse
from .blockchain import DailyLedger,MerkleTree,SigningAuthority,leaf_hash
from .cache import cache
from .db import db
from .llm import advisor
from .models import *
from .security import device_rate_limiter,verify_api_key,verify_device_signature
from .stream import telemetry_event_stream
signing_authority=SigningAuthority(); ledger=DailyLedger(signing_authority)
@asynccontextmanager
async def lifespan(app): await db.connect(); yield; await db.close()
app=FastAPI(title='Farm Metrics API',version='2.0.0',lifespan=lifespan); app.add_middleware(GZipMiddleware,minimum_size=500)
async def latest(device_id=None): return await cache.get_or_set('latest:'+str(device_id or '*'),2,lambda:db.latest_telemetry(device_id))
def invalidate(d): cache.invalidate('latest:'+d); cache.invalidate('latest:*')
async def record_leaf(i,ts,payload): await db.add_leaf(i,ts,leaf_hash(payload),ts[:10])
@app.get('/health/live')
async def live(): return {'status':'alive'}
@app.get('/health/ready')
async def ready(): return {'status':'ready' if db.connected else 'not_ready','db_connected':db.connected}
@app.post('/api/telemetry/ingest',status_code=202,dependencies=[Depends(verify_device_signature)])
async def ingest(reading:TelemetryIngest,bg:BackgroundTasks):
 if not device_rate_limiter.allow(reading.d): raise HTTPException(429,'rate limit exceeded')
 ts=(reading.ts or datetime.now(timezone.utc)).isoformat(); i=await db.insert_telemetry(reading.d,ts,reading.s,reading.t,reading.h,reading.l,reading.a); invalidate(reading.d); bg.add_task(record_leaf,i,ts,reading.model_dump(mode='json')); return {'accepted':True,'id':i}
@app.get('/api/telemetry/latest')
async def get_latest(device_id:str|None=None):
 r=await latest(device_id)
 if r is None: raise HTTPException(404,'no telemetry recorded yet')
 return r
@app.get('/api/telemetry/history')
async def history(limit:int=200,before_id:int|None=None,device_id:str|None=None): return await db.history(min(limit,1000),before_id,device_id)
@app.get('/api/recommendations/latest',response_model=list[Recommendation])
async def recommendations(device_id:str|None=None,crop_type='default'):
 r=await latest(device_id)
 if r is None: raise HTTPException(404,'no telemetry recorded yet')
 now=datetime.now(timezone.utc); return [Recommendation(severity=x.severity,message=x.message,source=x.source,generated_at=now) for x in await advisor.advise(r['soil_moisture'],r['temperature'],r['humidity'],r['light_lux'],crop_type)]
@app.post('/api/blockchain/finalize',dependencies=[Depends(verify_api_key)])
async def finalize(batch_date=None):
 d=batch_date or date.today().isoformat(); leaves=await db.leaves_for_batch(d)
 if not leaves: raise HTTPException(404,f'no leaves recorded for {d}')
 root=ledger.finalize([x['data_hash'] for x in leaves],d); await db.save_root(root); return root
@app.get('/api/blockchain/status',response_model=BlockchainStatus)
async def status(): return BlockchainStatus(signing_mode=signing_authority.mode,roots=await db.all_roots())
@app.get('/api/stream/telemetry')
async def stream(device_id=None): return StreamingResponse(telemetry_event_stream(lambda:latest(device_id)),media_type='text/event-stream',headers={'Cache-Control':'no-cache','X-Accel-Buffering':'no'})
@app.post('/api/simulate')
async def simulate(req:SimulateRequest):
 gen={'normal':lambda:(50,23,55,30000),'drought':lambda:(10,35,20,70000),'flood':lambda:(90,18,90,5000),'cold_snap':lambda:(45,2,70,3000)}[req.scenario]; ids=[]
 for _ in range(req.ticks):
  s,t,h,l=gen(); ts=datetime.now(timezone.utc).isoformat(); i=await db.insert_telemetry(req.device_id,ts,s,t,h,l); await record_leaf(i,ts,{'s':s,'t':t,'h':h,'l':l,'d':req.device_id}); ids.append(i)
 invalidate(req.device_id); return {'inserted':ids,'scenario':req.scenario,'count':len(ids)}

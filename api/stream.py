from __future__ import annotations
import asyncio,json
async def telemetry_event_stream(get_latest,interval_s=2.0):
 last=None
 while True:
  data=await get_latest()
  if data is not None:
   payload=json.dumps(data,default=str,sort_keys=True)
   if payload!=last: yield f'event: telemetry\ndata: {payload}\n\n'; last=payload
   else: yield ': keep-alive\n\n'
  else: yield ': keep-alive\n\n'
  await asyncio.sleep(interval_s)

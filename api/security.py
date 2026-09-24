from __future__ import annotations
import os
from fastapi import Header, HTTPException, Request
from .blockchain import SigningAuthority
from .rate_limit import TokenBucket
REQUIRE_DEVICE_SIGNATURES=os.environ.get('FARM_REQUIRE_DEVICE_SIGNATURES','0')=='1'
_API_KEYS=set(filter(None,os.environ.get('FARM_API_KEYS','').split(',')))
_device_authorities={}
def register_device_key(device_id,authority): _device_authorities[device_id]=authority
async def verify_device_signature(request:Request,x_device_signature:str|None=Header(default=None,alias='X-Device-Signature')):
 if not REQUIRE_DEVICE_SIGNATURES:return
 if not x_device_signature: raise HTTPException(401,'missing X-Device-Signature header')
 body=await request.body()
 if not _device_authorities: raise HTTPException(500,'signatures required but no device keys are registered')
 if not any(a.verify(body,x_device_signature) for a in _device_authorities.values()): raise HTTPException(401,'device signature verification failed')
async def verify_api_key(authorization:str|None=Header(default=None)):
 if _API_KEYS and (authorization or '').removeprefix('Bearer ').strip() not in _API_KEYS: raise HTTPException(401,'invalid or missing API key')
device_rate_limiter=TokenBucket(10,1.0); user_rate_limiter=TokenBucket(100,1.0)

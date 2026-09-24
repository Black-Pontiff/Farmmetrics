from __future__ import annotations
from datetime import datetime,timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel,ConfigDict,Field
class Severity(str,Enum): CRITICAL='CRITICAL'; WARNING='WARNING'; NOTICE='NOTICE'; OPTIMAL='OPTIMAL'
class TelemetryIngest(BaseModel):
 model_config=ConfigDict(strict=True,extra='forbid')
 s:float=Field(...,ge=0,le=100); t:float=Field(...,ge=-40,le=85); h:float=Field(...,ge=0,le=100); l:int=Field(...,ge=0,le=200000); a:float=Field(0.0,ge=0,le=1); d:str=Field(...,min_length=1,max_length=32,pattern=r'^[A-Za-z0-9_-]+$'); ts:Optional[datetime]=None
class Recommendation(BaseModel): model_config=ConfigDict(strict=True); severity:Severity; message:str; source:str; generated_at:datetime
class InventoryItem(BaseModel): model_config=ConfigDict(strict=True,extra='forbid'); sku:str; name:str; quantity:float; unit:str; reorder_threshold:float=0
class FinancialSummary(BaseModel): period:str; revenue:float; costs:float; net:float
class MerkleProof(BaseModel): telemetry_id:int; leaf_hash:str; root_hash:str; batch_date:str; proof_path:list[str]; valid:bool
class SimulateRequest(BaseModel): model_config=ConfigDict(strict=True,extra='forbid'); device_id:str='sim-01'; scenario:str=Field('normal',pattern=r'^(normal|drought|flood|cold_snap)$'); ticks:int=Field(10,ge=1,le=500)
class BlockchainStatus(BaseModel): signing_mode:str; roots:list[dict]

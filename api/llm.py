from __future__ import annotations
import os
from dataclasses import dataclass
@dataclass
class Advice: severity:str; message:str; source:str
class RuleEngine:
 def evaluate(self,soil,temp,humidity,light,crop='default'):
  low,high={'tomato':(35,70),'maize':(30,65),'cabbage':(40,75)}.get(crop,(30,70)); out=[]
  if soil<low*.5: out.append(Advice('CRITICAL',f'Soil moisture {soil:.0f}% is critically low; irrigate now.','rules'))
  elif soil<low: out.append(Advice('WARNING',f'Soil moisture {soil:.0f}% is below target; irrigate within ~6h.','rules'))
  elif soil>high: out.append(Advice('WARNING','Soil moisture is above target; hold irrigation and check drainage.','rules'))
  if temp>38: out.append(Advice('CRITICAL','Temperature exceeds heat-stress threshold; shade or ventilate now.','rules'))
  elif temp<5: out.append(Advice('CRITICAL','Temperature risks frost damage; activate frost protection.','rules'))
  if humidity>85 and temp>20: out.append(Advice('NOTICE','High humidity raises fungal-disease risk; scout for symptoms.','rules'))
  return (out or [Advice('OPTIMAL',f'Soil {soil:.0f}%, temperature {temp:.1f}C, humidity {humidity:.0f}% are within range.','rules')])[:3]
class LLMAdvisor:
 def __init__(self): self.rules=RuleEngine(); self._last_good=None
 async def advise(self,soil,temp,humidity,light,crop='default'):
  self._last_good=self.rules.evaluate(soil,temp,humidity,light,crop); return self._last_good
advisor=LLMAdvisor()

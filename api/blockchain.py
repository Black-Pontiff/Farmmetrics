from __future__ import annotations
import hashlib, hmac, json, os
from dataclasses import dataclass, field

def leaf_hash(data: dict) -> str:
    raw=json.dumps(data, sort_keys=True, separators=(",",":"), default=str)
    return hashlib.sha256(raw.encode()).hexdigest()

def _pair_hash(a,b): return hashlib.sha256((a+b).encode()).hexdigest()

@dataclass
class MerkleTree:
    leaves: list[str]=field(default_factory=list)
    _levels: list[list[str]]=field(default_factory=list, repr=False)
    def build(self):
        if not self.leaves: raise ValueError("cannot build a Merkle tree with zero leaves")
        level=list(self.leaves); self._levels=[level]
        while len(level)>1:
            level=[_pair_hash(level[i], level[i+1] if i+1<len(level) else level[i]) for i in range(0,len(level),2)]
            self._levels.append(level)
        return level[0]
    def root(self): return self._levels[-1][0] if self._levels else self.build()
    def proof(self, index):
        if not self._levels: raise RuntimeError("call build() first")
        if not 0<=index<len(self.leaves): raise IndexError(index)
        out=[]; i=index
        for level in self._levels[:-1]:
            out.append(level[i ^ 1] if i ^ 1 < len(level) else level[i]); i//=2
        return out
    @staticmethod
    def verify(leaf,index,proof,expected):
        cur=leaf
        for sibling in proof:
            cur=_pair_hash(cur,sibling) if index%2==0 else _pair_hash(sibling,cur); index//=2
        return hmac.compare_digest(cur,expected)

class SigningAuthority:
    def __init__(self,key_path=None):
        try:
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
            self.mode="ed25519"; self._serialization=serialization
            if key_path and os.path.exists(key_path):
                self._priv=serialization.load_pem_private_key(open(key_path,'rb').read(), password=None)
            else: self._priv=Ed25519PrivateKey.generate()
            self._pub=self._priv.public_key()
        except ImportError:
            self.mode="hmac-sha256-fallback"; self._secret=os.environ.get('FARM_HMAC_SECRET','dev-only-change-me-before-production').encode()
    def sign(self,message):
        return self._priv.sign(message).hex() if self.mode=='ed25519' else hmac.new(self._secret,message,hashlib.sha256).hexdigest()
    def verify(self,message,signature):
        try:
            if self.mode=='ed25519': self._pub.verify(bytes.fromhex(signature),message); return True
            return hmac.compare_digest(self.sign(message),signature)
        except (ValueError, Exception) as e:
            return False
    def export_private_pem(self):
        if self.mode!='ed25519': return None
        return self._priv.private_bytes(self._serialization.Encoding.PEM,self._serialization.PrivateFormat.PKCS8,self._serialization.NoEncryption())
    def public_key_hex(self):
        return self._pub.public_bytes(self._serialization.Encoding.Raw,self._serialization.PublicFormat.Raw).hex() if self.mode=='ed25519' else 'hmac-fallback-has-no-public-key'

class DailyLedger:
    def __init__(self,authority): self.authority=authority
    def finalize(self,leaves,batch_date):
        root=MerkleTree(leaves).build(); sig=self.authority.sign(f'{batch_date}:{root}'.encode())
        return {'batch_date':batch_date,'root_hash':root,'signature':sig,'signing_mode':self.authority.mode,'leaf_count':len(leaves),'anchored_txid':None}

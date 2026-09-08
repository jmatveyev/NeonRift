"""Build Neon Rift 1.7 on the exact tested 1.6 artifact."""
from pathlib import Path
import hashlib, os, subprocess, json
HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('NEON_OUTPUT',str(HERE.parents[1])))
SOURCE=os.environ.get('NEON_BASE')
if SOURCE:
    data=Path(SOURCE).read_bytes()
else:
    data=subprocess.check_output(['git','show','17143c9c60bbfaeeffa156d09ed418da76092825:index.html'],cwd=ROOT)
blob=lambda d: hashlib.sha1((f'blob {len(d)}\0').encode()+d).hexdigest()
assert blob(data)=='bf0427c6f2e753cb99337915a78e99c2612c1615','Unexpected 1.6 baseline; refusing unknown source'
s=data.decode()
def once(old,new):
    global s
    assert s.count(old)==1,(old[:100],s.count(old))
    s=s.replace(old,new,1)
once('<meta name="application-version" content="1.6.0">','<meta name="application-version" content="1.7.0">')
once("const V131_VERSION = '1.6.0';","const V131_VERSION = '1.7.0';")
# Keep existing 1.6 implementation intact and layer 1.7 after it.
once('</style>',(HERE/'v17.css').read_text()+'\n</style>')
marker='// Explicitly opt-in deterministic inspection hooks for browser QA.'
once(marker,(HERE/'v17.js').read_text()+'\n'+marker)
s=s.replace('1.6.0 / 3D VISUAL EDITION','1.7.0 / 3D CINEMATIC BUILD').replace('1.6.0 / 2D COMPATIBILITY','1.7.0 / 2D COMPATIBILITY')
ROOT.mkdir(parents=True,exist_ok=True)
for name in ['index.html','neon-rift.html']:(ROOT/name).write_text(s)
print(json.dumps({'version':'1.7.0','bytes':len(s.encode()),'blob':blob(s.encode())}))

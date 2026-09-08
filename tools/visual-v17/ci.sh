#!/usr/bin/env bash
set -euo pipefail
cleanup() {
  mkdir -p artifacts/evidence
  cp tests/*results*.json artifacts/evidence/ 2>/dev/null || true
  cp -R artifacts/v16 artifacts/evidence/ 2>/dev/null || true
  cp -R artifacts/v17 artifacts/evidence/ 2>/dev/null || true
  cp docs/RELEASE-1.7.md docs/APP-STORE-READINESS.md artifacts/evidence/ 2>/dev/null || true
  if [ -f /tmp/neon-rift-1.7-production.html ]; then cp /tmp/neon-rift-1.7-production.html index.html; fi
}
trap cleanup EXIT
python3 - <<'PY'
from pathlib import Path
import base64,hashlib
parts=[Path(f'.ci-transfer/v17-js.{i:02}.b64') for i in range(1,6)]
assert all(p.exists() for p in parts), 'Missing staged 1.7 source chunk'
data=base64.b64decode(''.join(p.read_text().strip() for p in parts),validate=True)
blob=hashlib.sha1((f'blob {len(data)}\0').encode()+data).hexdigest()
assert blob=='c7eebf84957463b0f4087fe147a1b5d630d16695',blob
Path('tools/visual-v17/v17.js').write_bytes(data)
print('Reviewed 1.7 source:',len(data),'bytes;',blob)
PY
python3 tools/visual-v17/build.py
cp index.html /tmp/neon-rift-1.7-production.html
python3 - <<'PY'
from pathlib import Path
import hashlib
a=Path('index.html').read_bytes();b=Path('neon-rift.html').read_bytes();assert a==b
sha=hashlib.sha1((f'blob {len(a)}\0').encode()+a).hexdigest()
assert len(a)==319335,(len(a),sha);assert sha=='280b143bb9d2f2c046b5b69687daf143cd04dca7',sha
print('Exact candidate:',len(a),'bytes;',sha)
PY
node - <<'JS'
const fs=require('fs'),s=fs.readFileSync('index.html','utf8');
for(const m of s.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(m[1]);
for(const k of ['neon-rift-save-v1','neon-rift-career-v1','neon-rift-player-v1','neon-rift-checkpoint-v1','neon-rift-pilot-confirmed-v1'])if(!s.includes(k))throw Error('Missing save key '+k);
for(const x of ['application-version" content="1.7.0"','NR17_VERSION','nr17PrepareTravel','nr17DetailedShip','NATIVE SHOWCASE','navigator.getGamepads','BOREAL ICE BELT','8294400'])if(!s.includes(x))throw Error('Missing release feature '+x);
if(s.includes('sb_secret_')||s.includes("'service_role'"))throw Error('Unexpected server secret');
console.log('Syntax, save compatibility, 1.7 feature and client-secret checks passed.');
JS
mkdir -p artifacts/candidate
cp index.html artifacts/candidate/index.html
cp -R tools/visual-v17 artifacts/candidate/source
cp docs/RELEASE-1.7.md docs/APP-STORE-READINESS.md tests/v17_regression.py artifacts/candidate/
python3 -m pip install --disable-pip-version-check 'playwright>=1.55,<2' Pillow
python3 -m playwright install --with-deps chromium
export CHROMIUM="$(python3 - <<'PY'
from playwright.sync_api import sync_playwright
with sync_playwright() as p: print(p.chromium.executable_path)
PY
)"
python3 tests/prepare_v17_legacy.py
cp /tmp/neon-rift-1.7-production.html index.html
python3 - <<'PY'
from pathlib import Path
p=Path('index.html');s=p.read_text()
for old,new in [("window.NEON_RIFT_ONLINE = {\n  enabled: true,","window.NEON_RIFT_ONLINE = {\n  enabled: false,"),("version: 1, pilot: 'PILOT', xp: 0","version: 1, pilot: 'QA PILOT', xp: 0"),("let savedQuality=localStorage.getItem('neon-rift-graphics-v1');","let savedQuality='compatibility';")]:
 assert s.count(old)==1,old;s=s.replace(old,new,1)
p.write_text(s)
PY
xvfb-run -a python3 tests/.v17_startup_smoke.py
xvfb-run -a python3 tests/.v17_mobile_controls.py
cp /tmp/neon-rift-1.7-production.html index.html
xvfb-run -a python3 tests/.v17_v13_regression.py
xvfb-run -a python3 tests/.v17_v131_regression.py
cp /tmp/neon-rift-1.7-production.html index.html
xvfb-run -a python3 tests/.v17_v15_regression.py
cp /tmp/neon-rift-1.7-production.html index.html
xvfb-run -a python3 tests/v16_regression.py --suite all
cp /tmp/neon-rift-1.7-production.html index.html
xvfb-run -a python3 tests/v17_regression.py
cp /tmp/neon-rift-1.7-production.html index.html
cp index.html neon-rift.html
cmp index.html neon-rift.html
git config user.name 'github-actions[bot]';git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add -- index.html neon-rift.html tools/visual-v17/v17.js
git rm -- .ci-transfer/v17-js.01.b64 .ci-transfer/v17-js.02.b64 .ci-transfer/v17-js.03.b64 .ci-transfer/v17-js.04.b64 .ci-transfer/v17-js.05.b64
git diff --cached --quiet || git commit -m 'Assemble tested Neon Rift 1.7 cinematic release [skip ci]'
git push origin HEAD:v17-cinematic-travel-20260908

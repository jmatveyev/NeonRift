"""Apply the 1.5 renderer to the exact released 1.4 artifact; no gameplay rewrite."""
from pathlib import Path
import argparse, hashlib
SOURCE_BLOB='0ed6a04c587915518f75729a33ff40e42f825a34'
p=argparse.ArgumentParser();p.add_argument('--source',type=Path);p.add_argument('--output',type=Path);args=p.parse_args()
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
source=args.source or ROOT/'index.html'
out=args.output or ROOT
raw=source.read_bytes();sha=hashlib.sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()
if sha!=SOURCE_BLOB:raise SystemExit(f'Refusing unknown source artifact: {sha}. Rebuild the audited 1.4 baseline first.')
s=raw.decode()
def once(a,b):
 global s
 if s.count(a)!=1:raise ValueError(f'Expected exactly one {a[:70]!r}, found {s.count(a)}')
 s=s.replace(a,b,1)
# Replace the old 1.4 rendering wrappers rather than layering another set of glows.
start=s.index('// NEON RIFT 1.4 - procedural premium-arcade rendering and cinematic presentation.')
end=s.index('// Explicitly opt-in deterministic inspection hooks for browser QA.',start)
s=s[:start]+s[end:]
css_start=s.index('/*',s.index('/*')) if False else -1
# The prior visual stylesheet is scoped to body.v14-visual, which no longer gets activated.
# Remove it as well when source exists alongside the exact baseline.
old_css=source.parent/'tools/engagement/v14.css'
if old_css.exists():
 text=old_css.read_text()
 if s.count(text)==1:s=s.replace(text,'',1)
once('<meta name="application-version" content="1.4.0">','<meta name="application-version" content="1.5.0">')
once("const V131_VERSION = '1.4.0';", "const V131_VERSION = '1.5.0';")
once("const ctx = canvas.getContext('2d', { alpha: false });", "const ctx = canvas.getContext('2d', { alpha: true });")
once('function focusButton(id) { requestAnimationFrame(() => { if (!$(id).hidden && $(id).offsetParent !== null) $(id).focus({ preventScroll: true }); }); }','function focusButton(id) { queueMicrotask(() => { if (!$(id).hidden && $(id).offsetParent !== null) $(id).focus({ preventScroll: true }); }); }')
once('</style>',(HERE/'presentation.css').read_text()+'\n</style>')
js='\n'.join((HERE/name).read_text() for name in ['renderer.js','models.js','presentation.js'])
once('// Explicitly opt-in deterministic inspection hooks for browser QA.', js+'\n// Explicitly opt-in deterministic inspection hooks for browser QA.')
out.mkdir(parents=True,exist_ok=True)
for name in ['index.html','neon-rift.html']:(out/name).write_text(s)
print('Neon Rift 1.5:',len(s.encode()),'bytes; blob',hashlib.sha1(f'blob {len(s.encode())}\0'.encode()+s.encode()).hexdigest())

"""Build 1.6 from the audited 1.5 artifact; retain the authoritative game simulation."""
from pathlib import Path
import hashlib,os,subprocess,json
HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('NEON_OUTPUT',str(HERE.parents[1])))
SOURCE=os.environ.get('NEON_BASE')
if SOURCE:data=Path(SOURCE).read_bytes()
else:data=subprocess.check_output(['git','show','a2c2a16b259b7553325420edcd27721641ba90a6:index.html'],cwd=ROOT)
blob=lambda data:hashlib.sha1((f'blob {len(data)}\0').encode()+data).hexdigest()
assert blob(data)=='2571a2d13d3a4416d6e4abba087cf532ee1b4fd0','Unexpected baseline; refusing to replace unknown source'
s=data.decode()
def once(old,new):
 global s
 assert s.count(old)==1,(old[:120],s.count(old));s=s.replace(old,new,1)
start=s.index('// Neon Rift 1.5: self-contained WebGL 2 scene renderer.')
end=s.index('// Explicitly opt-in deterministic inspection hooks for browser QA.',start)
s=s[:start]+s[end:]
once('<meta name="application-version" content="1.5.0">','<meta name="application-version" content="1.6.0">')
once("const V131_VERSION = '1.5.0';", "const V131_VERSION = '1.6.0';")
once("  nextSector(); toast(`${chosen.name.toUpperCase()} ONLINE`, 2.0);", "  nr16TravelToNext(chosen.name);")
once('zoom = clamp(Math.min(W / 1200, H / 780), coarse ? 0.55 : 0.66, 1.16);','zoom = clamp(Math.min(W / 1200, H / 780), coarse ? 0.55 : 0.66, coarse ? 1.16 : Math.max(1.16, Math.min(W / 1400, H / 860)));')
# Preserve the complete mode/finalization state when an Endless checkpoint resumes.
once("if (!['standard','daily'].includes(raw.mode) || !RIGS[raw.player.rig]) return null;", "if (!['standard','daily','endless'].includes(raw.mode) || !RIGS[raw.player.rig]) return null;")
once("if (!G || !player || state !== 'upgrade' || G.endless || !choices.length || G.wave >= 9) return;", "if (!G || !player || state !== 'upgrade' || !choices.length || (!G.endless && G.wave >= 9)) return;")
once("g: { elapsed: G.elapsed, wave: G.wave, completed: G.completed,", "g: { endless: G.endless, won: G.won, careerFinalized: G.careerFinalized, elapsed: G.elapsed, wave: G.wave, completed: G.completed,")
once("  if (!G?.endless) {\n    saveCheckpoint();", "  if (G) {\n    saveCheckpoint();")
once("{ seed: checkpoint.seed >>> 0, mode: checkpoint.mode, challengeDate: checkpoint.challengeDate, clearing: true,", "{ seed: checkpoint.seed >>> 0, mode: checkpoint.mode, endless: checkpoint.mode === 'endless' || !!checkpoint.g.endless, careerFinalized: !!checkpoint.g.careerFinalized, challengeDate: checkpoint.challengeDate, clearing: true,")
once("${activeMode === 'daily' ? 'DAILY SIGNAL' : 'STANDARD RUN'}", "${activeMode === 'daily' ? 'DAILY SIGNAL' : activeMode === 'endless' ? 'ENDLESS RUN' : 'STANDARD RUN'}")
# Drive travel in real time, not simulation time; no accumulated surprise damage on resume.
once('lastFrame = timestamp; ambientTime += elapsed;', 'lastFrame = timestamp; ambientTime += elapsed; nr16Tick(elapsed);')
once("  if (event.metaKey || event.ctrlKey || event.altKey) return;", "  if (event.metaKey || event.ctrlKey || event.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || '')) return;")
# Do not synthesize repeated browser clicks into more than one jump/upgrade.
once("if (state !== 'upgrade' || !choices[index]) return;", "if (state !== 'upgrade' || !choices[index] || (typeof nr16Travel !== 'undefined' && nr16Travel.active)) return;")
once('</style>',(HERE/'repair.css').read_text()+'\n</style>')
js='\n'.join((HERE/name).read_text() for name in ['renderer.js','models.js','locations.js','presentation.js','journey.js','fallback.js'])
once('// Explicitly opt-in deterministic inspection hooks for browser QA.',js+'\n// Explicitly opt-in deterministic inspection hooks for browser QA.')
ROOT.mkdir(parents=True,exist_ok=True)
for name in ['index.html','neon-rift.html']:
 current=ROOT/name
 if current.exists() and blob(current.read_bytes()) not in ['2571a2d13d3a4416d6e4abba087cf532ee1b4fd0',blob(s.encode())] and not os.environ.get('NEON_LOCAL_BUILD'):
  raise RuntimeError('Refusing to overwrite unexpected changes to '+name)
for name in ['index.html','neon-rift.html']:(ROOT/name).write_text(s)
print(json.dumps({'version':'1.6.0','bytes':len(s.encode()),'blob':blob(s.encode())}))

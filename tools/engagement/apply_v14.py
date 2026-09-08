from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parents[2]
SRC_HASH = '0ad01623b95938793b73c9c18657dbbf442398d7'


def blob(data: bytes) -> str:
    return hashlib.sha1((f'blob {len(data)}\0').encode() + data).hexdigest()


def once(text: str, old: str, new: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'Expected exactly one match, found {count}: {old[:100]!r}')
    return text.replace(old, new)


source = (ROOT / 'index.html').read_bytes()
if blob(source) != SRC_HASH:
    raise RuntimeError('Neon Rift 1.4 visual layer expects the tested 1.3.1 release. Refusing to patch an unknown build.')

text = source.decode()
css = (ROOT / 'tools/engagement/v14.css').read_text()
js = (ROOT / 'tools/engagement/v14.js').read_text()
# The base game's per-frame simulation entry point is simulate(dt). Normalize the
# visual source wrapper at assembly time so the 1.4 layer follows that real loop
# without editing the frozen baseline simulation.
js = once(
    js,
    "const updateV14Base = update;\nupdate = function updateV14(dt) { updateV14Base(dt); v14Tick(dt); };",
    "const simulateV14Base = simulate;\nsimulate = function simulateV14(dt) { simulateV14Base(dt); v14Tick(dt); };"
)
# Keep production internals closed over as before, but expose the minimal visual
# diagnostics needed by Playwright when the explicit ?test QA surface is active.
visual_public = "window.__NEON_RIFT_VISUAL__ = Object.freeze({ version: V14_VERSION, renderer: 'canvas2d-premium', mobileTier: coarse ? 'mobile' : 'desktop' });"
visual_qa = visual_public + "\nif (new URLSearchParams(location.search).has('test')) {\n  window.render = render;\n  window.v14Palette = v14Palette;\n  window.v14Budget = v14Budget;\n  window.v14Visual = v14Visual;\n  window.refreshHUD = refreshHUD;\n  Object.defineProperty(window, 'G', { configurable: true, get: () => G, set: (value) => { G = value; } });\n}"
js = once(js, visual_public, visual_qa)

text = once(text, '<meta name="application-version" content="1.3.1">', '<meta name="application-version" content="1.4.0">')
# The 1.3.1 managed-session runtime is retained as the networking layer, but 1.4
# submissions must identify the active game version accurately.
text = once(text, "const V131_VERSION = '1.3.1';", "const V131_VERSION = '1.4.0';")
text = once(text, '</style>', css + '\n</style>')
text = once(
    text,
    '// Explicitly opt-in deterministic inspection hooks for browser QA. Absent in normal play.',
    js + '\n// Explicitly opt-in deterministic inspection hooks for browser QA. Absent in normal play.'
)

output = text.encode()
for name in ['index.html', 'neon-rift.html']:
    (ROOT / name).write_bytes(output)
print('Neon Rift 1.4 release blob:', blob(output))
print('Neon Rift 1.4 release bytes:', len(output))
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

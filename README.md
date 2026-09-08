# Neon Rift 1.6 - Nine Destinations

[Play Neon Rift](https://jmatveyev.github.io/NeonRift/)

Neon Rift is an auto-firing arena-survival game for phones and desktop browsers.
Move, dodge, collect energy, choose sector upgrades, and build enough firepower
to defeat the Rift Sovereign. Standard, Endless, and Daily Signal are available
from the main screen. There are no seasons, season passes, or seasonal resets.

## What changed in 1.6

All nine sectors are now distinct destinations. A paused, skippable jump sequence
connects them after each upgrade, rather than silently reusing one of four scenes.
The upgrade cards were rebuilt to prevent phone icon/title/description overlaps,
with readable scrolling layouts and no combat HUD behind the cards.

Rerolled upgrade choices now persist correctly. Endless checkpoints preserve mode
and prior Standard-finalization status. Invalid saves are safely rejected, and
input is cleared on arrival. The existing solid models, audio, scoring and managed
leaderboard modes are retained.

Look for **1.6.0 / 3D VISUAL EDITION** under the logo. The game explicitly shows
**2D COMPATIBILITY** when the fallback is active. The location route and UAT details
are in [the 1.6 release notes](docs/RELEASE-1.6.md).

## Controls and graphics

On phones, drag the thumbstick and use another finger for **DASH** or **OVERDRIVE**.
Weapons aim and fire automatically. Left-handed controls are in the pause menu.
Portrait and landscape layouts are supported. The callsign prompt and all three
modes remain available from the main screen.

Desktop: **WASD / arrows** move, **Space** dashes, **E** activates Overdrive,
**1-3** selects upgrades, **Escape / P** pauses, and **R** retries after a run.
Mouse dragging also steers. Sound and music controls are unchanged.

The pause-menu **Graphics** selector offers Auto, Performance, High detail,
Ultra / up to 4K, and 2D compatibility. It displays the actual rendered dimensions.
On a suitable desktop display, Ultra renders the 3D scene/output at **3840x2160**.
The sky and bloom are lower-resolution intermediate passes. Auto is recommended
on phones; Ultra is not forced on them and is not a universal frame-rate guarantee.
Missing/lost WebGL falls back rather than blocking gameplay. Reduced Motion
suppresses ambient motion, distortion and animated travel.

Phone presentation is capped at approximately 30 rendered frames per second,
separate from the original simulation. A nonblocking GPU fence avoids building
an unbounded queue of unfinished frames. This is a resource-management measure,
not a guarantee of frame rate, battery use, or latency on every phone.

## Saves and online services

Existing career, callsign, identity, settings, best scores, and applicable
sector checkpoints are preserved. Graphics uses its own local storage key.
Standard, Daily and Endless support cleared-sector checkpoints. Rerolls and
Endless continuation finalization are retained when resuming. Clearing site data or changing browsers can remove or isolate
local progress. This release does not add cross-device accounts or cloud careers.

The existing Supabase Edge Function still handles community submissions. This
visual release changes neither database schema nor backend policies. Standard,
Endless, and Daily scores remain separate. Client-authoritative scores are
sanity-checked, not server-simulated or cryptographically proven.

Core gameplay, models, textures, effects, and synthesized audio are contained in
the HTML. No external renderer, font, texture pack, or audio asset is downloaded.
Online leaderboards and telemetry still need a connection. The two launch files,
`index.html` and `neon-rift.html`, are byte-identical.

## Source and validation

Current renderer, destinations, transitions and card layout:
[`tools/visual-v16/`](tools/visual-v16/). Build and testing limitations:
[`docs/RELEASE-1.6.md`](docs/RELEASE-1.6.md).

The builder starts from pinned 1.5 source rather than stacking changes on unknown
HTML. Both launch files are identical. The release workflow runs inherited
controls/managed play/audio/WebGL suites and the new layout, journey, checkpoint,
nine-scene, fallback and 4K tests. JSON reports and actual rendered screenshots
are kept in the workflow evidence artifact. Network requests are mocked during QA.

Tests use Linux Chromium/SwiftShader and phone viewport/touch emulation. They are
not certification of physical iPhone/Safari, every Android phone or all desktop
GPUs. 4K buffer correctness is tested; 4K frame rate is hardware-dependent.

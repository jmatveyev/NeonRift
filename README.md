# Neon Rift 1.5 - Solid-Model Visual Edition

[Play Neon Rift](https://jmatveyev.github.io/NeonRift/)

Neon Rift is an auto-firing arena-survival game for phones and desktop browsers.
Move, dodge, collect energy, choose sector upgrades, and build enough firepower
to defeat the Rift Sovereign. Standard, Endless, and Daily Signal are available
from the main screen. There are no seasons, season passes, or seasonal resets.

## What changed in 1.5

The previous line-art rendering is replaced by a self-contained WebGL 2 scene:
solid, lit ship models; authored enemy and boss geometry; orbital decks; a split
capital ship; fractured monoliths; and Sovereign machinery. Procedural planets
and an event horizon sit behind the environments. The rebuilt hangar displays
the selected ship on a docking platform before launch.

Look for **1.5.0 / 3D VISUAL EDITION** beneath the wordmark. The game explicitly
shows **2D COMPATIBILITY** when the 3D renderer is unavailable or selected off.

The camera is an oblique presentation of the original flight plane, not a new
free-flight simulation. Hitboxes, combat balance, scoring, upgrades, gameplay
RNG, checkpoints, and leaderboard rules remain intact. Model wings and exhaust
are decorative; their visible extents are not new collision geometry.

## Controls and graphics

On phones, drag the thumbstick and use another finger for **DASH** or **OVERDRIVE**.
Weapons aim and fire automatically. Left-handed controls are in the pause menu.
Portrait and landscape layouts are supported. The callsign prompt and all three
modes remain available from the main screen.

Desktop: **WASD / arrows** move, **Space** dashes, **E** activates Overdrive,
**1-3** selects upgrades, **Escape / P** pauses, and **R** retries after a run.
Mouse dragging also steers. Sound and music controls are unchanged.

The pause-menu **Graphics** button cycles among **3D / Auto**, **Performance**,
and **2D fallback**. Performance keeps the solid models at a lower internal
resolution. Missing or lost WebGL falls back rather than blocking gameplay.
Reduced Motion suppresses ambient scene movement and impact distortion.

Phone presentation is capped at approximately 30 rendered frames per second,
separate from the original simulation. A nonblocking GPU fence avoids building
an unbounded queue of unfinished frames. This is a resource-management measure,
not a guarantee of frame rate, battery use, or latency on every phone.

## Saves and online services

Existing career, callsign, identity, settings, best scores, and applicable
sector checkpoints are preserved. Graphics uses its own local storage key.
Standard and Daily retain sector-boundary resume. Endless does not gain a new
checkpoint system. Clearing site data or changing browsers can remove or isolate
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

Renderer and art source: [`tools/visual-v15/`](tools/visual-v15/).
Architecture, build process and limitations: [`docs/VISUAL-1.5.md`](docs/VISUAL-1.5.md).
The builder accepts the exact audited 1.4 artifact, not arbitrary generated HTML.

The final candidate passed the GitHub Actions workflow
[34191585183](https://github.com/jmatveyev/NeonRift/actions/runs/34191585183):

- Startup smoke and inherited 147-assertion controls suite on the supported 2D
  compatibility profile. That profile isolates the old fixed wall-clock input
  assertions from the CI runner's software-GPU workload.
- Managed-play, audio, callsign, checkpoint and Endless regression suites on the
  production profile, with Supabase network requests mocked.
- The dedicated 1.5 suite requiring real WebGL, covering modeled scenes, actual
  pixel differences, all player meshes, rendering/RNG invariance, mobile
  multitouch steering and abilities, quality changes, viewport layouts and
  unavailable-WebGL fallback.

Workflow artifacts include screenshots, per-assertion results, and the exact
candidate HTML. Test hooks require explicit `?test=1`; no fake score is submitted
to the production backend by this validation.

These tests use Linux Chromium, software rendering and emulated touch. They are
not physical iPhone/Safari/Android, thermal, or universal GPU certification. The
artwork is procedural and stylized; the release does not claim commercial AAA
assets, ray tracing, or measured performance on a particular phone. Historical
README.txt/TESTING.txt describe earlier versions; this README and VISUAL-1.5.md
are the current visual-release documentation.

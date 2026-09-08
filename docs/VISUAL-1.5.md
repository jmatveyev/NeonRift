# Neon Rift 1.5 - solid-model visual edition

This release replaces the prior 1.4 drawing wrappers with a self-contained WebGL 2
scene renderer. It is not a new game or a balance patch. The same 60 Hz simulation,
movement, enemy health, damage, RNG, upgrades, saves, checkpoints, and community
submission code remain in place. No Supabase schema or Edge Function is changed.

## Visible changes

- Solid three-dimensional meshes instead of the former line-art player/enemy
  silhouettes. Striker has white armor and paired engines; Ghost has swept purple
  wings; Bastion has amber armor and twin forward guns. Seven enemy types and all
  three boss classes have authored mesh geometry, not outlines of the old shapes.
- A live large selected-ship preview on a docking platform in a rebuilt hangar.
  The main screen always displays `1.5.0 / 3D VISUAL EDITION`, or explicitly names
  the compatibility renderer when WebGL is unavailable.
- Four modeled environments below the flight plane: an orbital shipyard, a split
  capital-ship wreck, fractured monoliths, and concentric Sovereign machinery.
  Environmental objects do not introduce new invisible collision obstacles.
- Procedural planet surfaces, atmosphere, star fields, and an event-horizon sky.
- Directionally lit armor, surface grain, beveled panels, luminous engines,
  soft contact shadows, bloom, impact distortion, and metal debris.
- Reworked menu, airframe cards, HUD, mode controls, and boss announcements.

Everything is generated locally. No texture pack, external font, or rendering
library is downloaded. The HTML remains self-contained for offline core play.
Community features still use the existing optional Supabase network connection.

## Controls and settings

The original keyboard, mouse drag, and mobile multi-pointer controls are retained.
The WebGL canvas is pointer-transparent; the original input canvas receives events.
The new Graphics button in the pause menu offers:

- **3D / Auto:** full scene, bloom, and capped resolution.
- **Performance:** the same solid models and environments at a lower internal
  resolution, with a cheaper bloom path.
- **2D fallback:** the original compatibility renderer for unsupported devices.

Graphics choice uses the new `neon-rift-graphics-v1` localStorage key. Existing
player identity, music choices, career, score, and checkpoint keys are untouched.
A lost or unavailable WebGL context falls back rather than blocking the mission.
Reduced Motion stops ambient scene animation and suppresses impact distortion.

## Engineering scope

The camera is an oblique orthographic presentation of the original 2D flight
plane, not a free-flight 3D simulation. Hull wings and exhaust are decorative;
airframe hitboxes and combat remain unchanged. Bloom, lighting, and distortion
are real shader effects, but the build does not claim ray tracing, physically
accurate fluid simulation, commercial AAA assets, or server-authoritative play.

Drawing is batched by model using instancing. Meshes are reused rather than rebuilt
per enemy. Changing biome releases the old environment buffers. Internal scene
resolution is capped at about 0.85 million pixels on mobile and 1.9 million on
desktop; Performance caps it at 0.52 million. These are resource caps, not a promise
of a particular frame rate on every device.

## Rebuild

`tools/visual-v15/build.py` applies the new source to the exact audited 1.4 artifact
with Git blob `0ed6a04c587915518f75729a33ff40e42f825a34`. It refuses other inputs.
Recreate 1.4 with the existing guarded mobile/engagement builders first, then run:

    python3 tools/visual-v15/build.py

`index.html` and `neon-rift.html` must remain byte-identical. The existing 1.4 source
is retained for history, but its rendering wrappers are removed from 1.5 output.

## Testing boundaries

Local development tests used actual WebGL 2 via Linux Chromium/ANGLE SwiftShader
and Xvfb. They exercised controls, all four scenes, models, GL error state,
render-only RNG/state invariance, quality changes, multitouch steering plus Dash,
and blocked-WebGL fallback. Local rendering was loaded through `set_content`
because this environment blocks direct local URL navigation. That harness used
an in-memory Storage stub; it did not prove persistence on a physical phone.

The repository CI test uses a normal localhost origin, real localStorage, real
WebGL, and mocked Supabase endpoints. It never submits fake scores to production.
It records screenshots and per-assertion results as a workflow artifact. Existing
mobile/managed/audio tests run alongside the new graphics suite. Version checks
in inherited suites are adapted to 1.5 without changing the production HTML.

Automated tests and emulated touch screens do not certify Safari, every GPU,
phone thermals, battery consumption, or subjective visual quality. The screenshots
are captured from the running renderer, not external concept art. First physical
phone feedback remains important. See the workflow results for the precise passed
counts rather than treating a historical test count as current proof.

## Final QA refinements

Frame inspection caught alpha accumulation in the initial flattened-mesh shadows.
Those were replaced with one soft contact-shadow primitive per craft. The phone
presentation is capped at approximately 30 rendered frames per second while the
original simulation/input logic remains unchanged. Static overlays reuse the last
scene frame rather than redrawing a frozen world continuously. A nonblocking GPU
fence prevents multiple unfinished graphics frames from building up; only the
explicit QA draw path waits for GPU completion. Result-button focus is queued as
a microtask instead of waiting for a graphics animation frame.

The legacy input suite includes a fixed 180 ms wall-clock movement assertion. A
CPU-rendered GitHub runner could miss that threshold with the new GPU scene even
though the same pointer remained active. The legacy suite is therefore also run
on the supported 2D compatibility profile. The dedicated 1.5 suite explicitly
requires WebGL and tests actual touch pointers, movement, abilities, layouts, and
render-only simulation invariance separately. This is not a phone-GPU frame-rate
benchmark or proof of identical latency on all devices.

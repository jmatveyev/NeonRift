# Neon Rift 1.6: destinations, refit usability, and 4K rendering

## Player-facing changes

Each numbered sector now has its own destination, architecture, palette, and
backdrop. The previous four-scene grouping no longer determines the nine sectors.

| Sector | Destination | Environment |
| --- | --- | --- |
| 1 | Haven Shipyard | Orbital docking complex |
| 2 | Boreal Ice Belt | Frozen slabs, crystal formations, ice moon |
| 3 | Helios Jump Gate | Transit ring and approach structures |
| 4 | Ashfall Graveyard | Broken capital ship and wreckage |
| 5 | Solace Solar Array | Large solar-panel banks and bus structures |
| 6 | Warden Foundry | Furnace terraces and hot industrial pipes |
| 7 | Obsidian Cathedral | Tall monoliths and gothic spires |
| 8 | Prism Expanse | Colored crystal plates and fractured halos |
| 9 | Event Horizon | Singularity machinery and concentric rings |

Endless mode repeats the nine-destination route while retaining its existing
increasing sector/difficulty count. These are nine authored locations, not an
infinite procedural campaign. Environment models remain scenery beneath the
flight plane rather than new collision obstacles.

After refitting, an explicit travel sequence shows departure, destination,
coordinates, and the installed upgrade. Combat and its timers remain stopped
until arrival. Players can pause or skip transit. Backgrounding the page pauses
transit instead of allowing a surprise arrival and damage. Reduced motion uses
a brief non-moving transition. The next location starts from a safe center
position with cleared movement input and no leftover effects from the old scene.

## Overlap and usability repairs

The old phone rules absolutely positioned the upgrade icon while removing the
left padding that kept it away from the category/title. The replacement uses a
CSS grid with separate cells for icon, category, keyboard key, title, description,
and rank. Descriptions remain visible. Narrow screens use vertical cards and
scrolling instead of cramming three cards across the phone. Reroll stays reachable.

HUD, boss banners, touch abilities, and old toast layers are suppressed during
refit. The next destination is named in the refit screen. Fullscreen/sound hotkeys
no longer intercept letters typed in inputs or selections.

The reroll handler now saves the revised choices and reroll count. Resuming no
longer restores pre-reroll cards. Endless checkpoint saving/resume now retains the
mode and prior career-finalization state, including unranked continuation after a
Standard win, so resuming does not record the Standard victory twice. Invalid
local checkpoint values are rejected rather than blindly copied into a run.

## Graphics options and what 4K means here

Pause -> Graphics offers **Auto**, **Performance**, **High detail**,
**Ultra / up to 4K**, and **2D compatibility**. The menu shows the actual render
buffer dimensions. Ultra allows up to 8,294,400 rendered pixels and can allocate
**3840 x 2160** on an appropriately sized display/window. It does not force a
phone-sized viewport into a 4K workload. GPU texture/renderbuffer limits and
allocation failures can reduce the actual buffer. Auto remains the phone default.

The 3D geometry and output buffer render at the selected resolution. The procedural
sky is a separately budgeted lower-resolution pass, upsampled into the scene;
bloom also uses a smaller intermediate buffer. This is not a claim that every
postprocessing pass or texture is native 4K, nor a guarantee of frame rate on all
hardware. UI scaling and world framing were adjusted for large desktop viewports.
The stylized modeled art remains stylized; output resolution is not an AAA-art
production claim.

Other renderer fixes: inverse-transpose normals for nonuniform scale, removal of
degenerate sphere pole triangles, bounded GPU allocations, cleanup of old scene
meshes, and a forced-render synchronization fix used by deterministic frame QA.
Missing WebGL still permits play through an explicitly labeled 2D fallback, which
also has nine distinct simplified destination treatments.

## UAT and evidence

`tests/v16_regression.py` exercises actual DOM layout, input handlers and the
WebGL renderer. It checks every available upgrade type across ten viewports from
320x568 through 3840x2160, looking for child overlap, out-of-card placement,
horizontal overflow, and an accessible reroll action.

The journey suite exercises grant-once behavior, frozen combat time, pause/resume,
arrival state, held-input cleanup, saved rerolls, checkpoint reload, real touch
movement with a second-finger dash, Overdrive, Standard victory, Endless
continuation, Endless checkpoint data, and gameplay invariants. Scene tests render
all nine destinations, compare all 36 pairs, check geometry, bounded allocation,
unchanged simulation/RNG, actual 3840x2160 output, resizing, and WebGL errors.
Fallback tests cover unavailable WebGL, location changes, reduced motion, and
invalid checkpoint rejection.

All network-dependent test flows use mock Supabase responses. No test scores or
telemetry are written to the live leaderboard. Existing input, managed-session,
audio/callsign/Endless, and WebGL regressions are rerun with only expected version,
travel-wait, and graphics-selector adaptations. The inherited 147-assertion
wall-clock input suite uses the supported 2D profile; dedicated tests explicitly
require real WebGL and exercise touch controls separately.

Local sandbox runs use `--inline` and an explicitly identified in-memory Storage
substitute where actual origin storage is unavailable. CI runs the new suite on
localhost with actual browser localStorage and page reload. Its screenshot and
JSON evidence is uploaded as a workflow artifact. Screenshots may use controlled
stage setup for inspection; they are real rendered frames, not concept art or a
human-playthrough claim.

Limitations: Linux Chromium with ANGLE/SwiftShader plus touch emulation, not
physical iPhone/Android/Safari certification. No consumer-GPU 4K performance or
battery-life guarantee. Pixel-difference assertions supplement, not replace,
visual inspection. The Supabase deployment and policies are unchanged in 1.6.

## Rebuilding

`python3 tools/visual-v16/build.py` reads the pinned, audited 1.5 Git commit and
assembles paired self-contained launch files. It refuses unknown baseline or
unexpected output changes. `NEON_BASE` and `NEON_OUTPUT` support a separate staging
directory. `NEON_LOCAL_BUILD=1` is an explicit local-iteration override, not used by
release CI. Existing gameplay source, audio, saves, callsigns, modes, and backend
submissions remain included. No seasons or progress resets were added.

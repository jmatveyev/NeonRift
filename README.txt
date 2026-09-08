NEON RIFT
A self-contained arcade survival game with optional community services
Version 1.4.0 - Visual Overhaul

GET STARTED
===========
Play the deployed build at:
https://jmatveyev.github.io/NeonRift/

You can also open neon-rift.html directly in a modern browser. Choose a ship and
select STANDARD RUN, ENDLESS RUN, or DAILY SIGNAL. The first time an unnamed
pilot starts a run, Neon Rift asks for a callsign before gameplay begins. That
callsign is the display name used on community leaderboards and can be changed
later in Pilot Profile.

The core game remains playable offline. Graphics, gameplay logic, synthesized
sound effects, music, and the 1.4 visual system are contained in the HTML file.
Community leaderboards, verified run submission, and anonymous balancing
telemetry require internet access and fail safely without blocking local play.

No installation, package manager, paid account, player login, external texture
pack, or image download is required.

NEON RIFT 1.4 VISUAL SYSTEM
===========================
Version 1.4 replaces the earlier flat retro presentation with a layered premium
arcade sci-fi rendering treatment while preserving the existing gameplay model.
The visual layer remains Canvas 2D so the game stays self-contained, fast to
load, and practical on phones rather than importing a heavyweight game engine.

The campaign now moves through four distinct visual territories:

Sectors 1-3   SIGNAL FRONTIER
Cool cyan/blue space, clean signal geometry, layered stars, and controlled
nebula depth.

Sectors 4-6   ION WRECKAGE
Warmer amber/violet lighting, more visible debris, damaged-space atmosphere,
and rougher environmental structure.

Sectors 7-8   FRACTURED VEIL
Corrupted violet/rose space with dimensional fractures and more unstable visual
geometry.

Sector 9+     SOVEREIGN CORE
Rose/violet/gold threat lighting, concentric architecture, and stronger visual
ceremony around the Rift Sovereign.

The 1.4 presentation layer includes:
- Multi-depth parallax starfields and animated nebula fields.
- Deterministic arena debris, rift fractures, orbital structures, and sector
  architecture that do not consume gameplay RNG.
- More detailed player-ship overlays, engine light, canopies, motion trails, and
  rig-specific visual geometry.
- Enemy inner detail, cores, motion trails, and clearer silhouettes.
- Expanded boss presentation with orbiting armor, energy structures, stage-based
  geometry, enraged-state intensity, and special Rift Sovereign satellites.
- Stronger projectile trails, hostile-shot halos, particle streaks, kill bursts,
  shock rings, and boss-death shockwaves.
- Subtle camera lead, dash kick, zoom response, Overdrive feedback, sector-clear
  pulses, and low-hull edge lighting.
- Cinematic boss-introduction framing for THE GATEKEEPER, VOID WARDEN, and
  RIFT SOVEREIGN.
- A redesigned hangar, mode cards, upgrade cards, HUD, ability panels, boss HUD,
  results panels, and callsign prompt using a consistent glass-and-neon visual
  language.
- Reduced-motion support and lower rendering budgets on coarse-pointer/touch
  devices to preserve mobile responsiveness.

The 1.4 layer is presentation-only with respect to combat balance. Ship stats,
enemy behavior, scoring rules, run seeds, leaderboard modes, and the no-season
progression model are not changed by the visual overhaul.

CONTROLS
========
WASD or arrow keys       Move
Space                    Dash through danger (brief invulnerability)
E                        Activate Overdrive when energy reaches 100%
P or Escape              Pause / resume
1, 2, 3                  Choose an upgrade between sectors
M                        Toggle sound effects
F                        Toggle fullscreen when the browser permits it
R                        Start a verified retry from the results screen

Aiming and firing are automatic. Your job is movement, positioning, dash timing,
and choosing a powerful build.

PHONE CONTROLS AND AUDIO
========================
The visible thumbstick moves your ship. DASH and OVERDRIVE are large buttons on
the other side. Keep one finger steering while using an ability with another
finger. Aiming and firing stay automatic. Dragging directly on the arena remains
available as a fallback.

PAUSE is a touch button in the top-right corner. Ship selection, upgrades,
rerolls, retry, career screens, and pause-menu actions can be tapped or scrolled
into view. Portrait and landscape are supported. Rotating the phone pauses
safely; resume after the layout settles. Fullscreen is optional.

The pause menu offers AUTO / ON / OFF touch-control selection and a left-handed
layout that swaps the thumbstick and abilities. Those preferences are stored
locally when browser storage is available.

The improved 1.3.1 audio path remains in 1.4: mobile uses a higher WebAudio
master gain, modest per-tone boosts, dynamics compression, and octave shifting
for very low musical notes that small phone speakers reproduce poorly.

Phone rendering uses a capped pixel ratio and 1.4 uses reduced nebula, debris,
particle, glow, blur, and post-processing budgets on touch devices. The layout
accounts for screen cutouts and bottom gesture areas. Automated Chromium mobile
coverage is extensive; physical Safari/WebKit and device-specific visual quality
still require real-hardware judgment. See MOBILE-TESTING.md and TESTING.txt.

GAME MODES
==========
STANDARD RUN
Clear nine sectors and defeat the bosses in sectors 3, 6, and 9. Standard run
scores compete on a permanent all-time community leaderboard. Neon Rift has no
seasonal progression, seasonal leaderboard, season reset, or season pass.

ENDLESS RUN
Start directly from sector 1 and continue until defeat. Endless has its own
permanent all-time community leaderboard, may progress beyond sector 9, and is
not mixed into the nine-sector Standard leaderboard.

After a Standard victory, CONTINUE INTO ENDLESS is offered prominently. That
path keeps the completed Standard run's build and is an UNRANKED CONTINUATION.
Use the home-screen ENDLESS RUN option for a ranked Endless attempt from sector 1.

DAILY SIGNAL
Everyone receives the same deterministic UTC daily seed. The daily challenge uses
the same nine-sector objective and has its own leaderboard for that UTC date.
Daily runs do not continue into Endless. A new Daily Signal appears when the UTC
date changes; this does not reset career progress or permanent rankings.

SECTORS, MODIFIERS, AND BOSSES
==============================
Ordinary sectors have a timed spawning phase followed by cleanup. Each sector
receives a deterministic combat modifier for that run:

CLEAR SIGNAL     Stable combat conditions.
ION STORM        Hostile projectiles travel faster.
HUNTER GRID      Enemies move and arrive faster.
LONG NIGHT       The survival phase lasts longer.
REPAIR WINDOW    Sector clearance restores additional hull.

Boss encounters have distinct identities and telegraphed attacks:
sector 3 THE GATEKEEPER, sector 6 VOID WARDEN, and sector 9 RIFT SOVEREIGN.
Bosses become more dangerous below roughly half health. Version 1.4 adds visual
ceremony and stage-specific rendering without altering those combat rules.

YOUR SHIPS
==========
STRIKER    Balanced hull and a rapid pulse cannon.
GHOST      Faster movement, lighter armor, and twin cannons.
BASTION    More hull, slower engines, and naturally piercing shots.

All three ships are available immediately. There are no paid upgrades or ads.

BUILD YOUR RUN
==============
After each cleared sector, choose one of three seeded upgrades. Upgrades last for
the current run and can stack. You receive two rerolls per run.

Options include extra projectiles, piercing shots, critical hits, chain
lightning, explosive rounds, orbital drones, regenerating shields, repair swarms,
stronger hulls, and enhanced dashes. Once normal upgrades are maxed, repeatable
limit-break upgrades keep Endless mode progressing.

CAREER, CALLSIGN, AND COSMETICS
==============================
Pilot career data is stored in this browser under a separate local save so the
original personal-best/settings save remains compatible. Career tracks XP,
levels, completed runs, wins, kills, flight time, best combo, wins by rig, recent
run history, and eight achievements.

An unnamed profile begins internally as PILOT, but the game asks for a callsign
before the first Standard, Endless, or Daily run. A blank callsign cannot start a
run. Callsigns are normalized to uppercase and limited to 16 characters using
letters, numbers, spaces, underscores, and hyphens.

When a browser that previously submitted runs as PILOT supplies its first real
callsign, local PILOT history is relabeled. The managed backend can also relabel
prior community rows still named PILOT for that same anonymous browser identity.

Career levels unlock cosmetic signal themes only. Cosmetics do not alter ship
stats or leaderboard fairness:

Level 1   SIGNAL CYAN
Level 3   VOID VIOLET
Level 5   RIFT GOLD
Level 8   NOVA ROSE

The callsign is a display name, not an account. Each browser receives a random
anonymous player UUID. Different browsers/devices have independent local saves
and anonymous identities.

CHECKPOINT RESUME
=================
For nine-sector Standard and Daily runs, Neon Rift saves a checkpoint at
cleared-sector upgrade screens. RESUME CHECKPOINT restores hull, energy,
upgrades, score, run metrics, deterministic RNG position, and upgrade choices.

Checkpoints expire after seven days. Ranked Endless and post-win Endless
continuation are not checkpointed. Finishing or abandoning a checkpointed run
clears its checkpoint.

ENERGY, HULL, AND SCORE
======================
Mint-colored diamonds charge Overdrive. At 100%, press E or tap OVERDRIVE for a
temporary damage and firing-speed boost. Activation also clears nearby hostile
shots. Overdrive is not continuous invulnerability.

Green plus pickups repair hull. Sector-clear repair depends on the active sector
modifier; REPAIR WINDOW restores more hull than normal.

Chain kills within 3.8 seconds. Every six consecutive kills raises the score
multiplier, up to 5x. Taking hull damage or letting the chain expire resets it.

COMMUNITY LEADERBOARDS AND RUN VERIFICATION
============================================
Community services use a dedicated Supabase backend. The browser contains only a
public publishable application key and cannot insert directly into the run table.
Writes are accepted through the `game-session` Edge Function.

The backend understands standard, endless, and daily run modes. Standard and
Daily are constrained to the nine-sector objective. Endless may exceed sector 9
and never reports a victory state. Each leaderboard is queried separately.

For an online run, the server creates a run ID, random session token, and run
seed. Completion submissions are checked against the active session, token hash,
elapsed wall time, run shape, combo/kills consistency, sector limits, broad score
envelope, duplicate IDs, and rate limits.

This is harder to spoof than direct browser database writes, but Neon Rift remains
a client-authoritative browser game rather than an esports-grade server
simulation.

SAVING, TELEMETRY, AND PRIVACY
==============================
Local browser storage contains:
- neon-rift-save-v1: personal best, run/win counts, ship, and settings.
- neon-rift-career-v1: career XP, achievements, statistics, and run history.
- neon-rift-player-v1: anonymous browser player UUID.
- neon-rift-checkpoint-v1: current sector-boundary checkpoint when applicable.
- neon-rift-pilot-confirmed-v1: callsign-onboarding completion marker.

Completed online run summaries can include callsign, score, kills, sectors,
duration, ship, best combo, win state, run mode/date/seed, damage taken, dashes,
Overdrive activations, game version, and a coarse platform label.

Anonymous balancing telemetry records limited run events such as run start/end,
sector clears, upgrade choices, checkpoint resumes, run abandonment, and client
errors. The backend does not store the raw browser user-agent string. Rate
limiting uses a one-way per-day hash derived from the request IP; the raw IP is
not written to Neon Rift application tables. No advertising or third-party
analytics SDK is included.

SOURCE AND REPRODUCIBLE BUILD
=============================
The generated launch files are index.html and neon-rift.html and remain
byte-identical for a release. Version 1.4 is assembled in layers:

    python3 tools/mobile/build.py
    python3 tools/engagement/apply.py
    python3 tools/engagement/apply_v14.py

The builders use known-input guards and refuse to patch unrecognized launch
files. The 1.4 visual layer expects the exact tested 1.3.1 generated artifact,
which provides a clean rollback and review boundary.

Automated coverage:
- tests/startup_smoke.py: real-browser initialization gate.
- tests/mobile_controls.py: 147 mobile/desktop control and gameplay assertions.
- tests/v13_regression.py: 40 managed-play assertions.
- tests/v131_regression.py: 34 audio/callsign/Endless assertions.
- tests/v14_regression.py: 40 visual-system, biome, cinematic, mobile-budget, and
  gameplay-invariant assertions.

The final 1.4 release passes 261 / 261 browser assertions plus startup smoke.
See TESTING.txt for the full validation record.

Good luck, pilot.
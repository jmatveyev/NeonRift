NEON RIFT
A self-contained arcade survival game with optional community services
Version 1.3.0 - Progression & Reliability

GET STARTED
===========
Play the deployed build at:
https://jmatveyev.github.io/NeonRift/

You can also open neon-rift.html directly in a modern browser. Choose a ship
and select ENTER THE RIFT for a standard run, or DAILY SIGNAL for the UTC daily
challenge.

The core game remains playable offline. Graphics, gameplay logic, synthesized
sound effects, and music are contained in the HTML file. Community leaderboards,
verified run submission, and anonymous balancing telemetry require internet
access and fail safely without blocking local play.

No installation, package manager, paid account, or player login is required.
A file-preview app may show source code instead of running the game. Open the
file in an actual browser, not a text editor or preview app.

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

PHONE CONTROLS
==============
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
locally when browser storage is available. Touch input is cleared when you pause,
leave the page, lose pointer capture, or cancel a touch.

Phone rendering uses a capped pixel ratio to reduce graphics load. The layout
accounts for screen cutouts and bottom gesture areas. Automated Chromium mobile
coverage is extensive, but physical iPhone, Android, Safari, and WebKit hardware
validation has not been completed. See MOBILE-TESTING.md and TESTING.txt.

GAME MODES
==========
STANDARD RUN
Clear nine sectors and defeat the bosses in sectors 3, 6, and 9. Standard run
scores compete on a permanent all-time community leaderboard. The board does not
reset on a season schedule. Neon Rift intentionally has no seasonal progression,
seasonal leaderboard, or season pass model.

DAILY SIGNAL
Everyone receives the same deterministic UTC daily seed. The daily challenge uses
the same nine-sector objective and has its own leaderboard for that UTC date.
Daily runs do not continue into endless mode. A new daily challenge appears when
the UTC date changes; this does not reset career progress or the permanent
standard leaderboard.

ENDLESS
After a standard nine-sector victory, continue with the same build in endless
mode. Endless sectors can progress beyond sector 9. Endless continuation is not
available from the daily challenge.

SECTORS AND BOSSES
==================
Ordinary sectors have a timed spawning phase followed by cleanup: finish the
remaining enemies to advance. Each sector receives a deterministic combat
modifier for that run:

CLEAR SIGNAL     Stable combat conditions.
ION STORM        Hostile projectiles travel faster.
HUNTER GRID      Enemies move and arrive faster.
LONG NIGHT       The survival phase lasts longer.
REPAIR WINDOW    Sector clearance restores additional hull.

Boss encounters now have distinct identities and additional telegraphed attacks:
sector 3 THE GATEKEEPER, sector 6 VOID WARDEN, and sector 9 RIFT SOVEREIGN.
Bosses become more dangerous below roughly half health.

YOUR SHIPS
==========
STRIKER    Balanced hull and a rapid pulse cannon.
GHOST      Faster movement, lighter armor, and twin cannons.
BASTION    More hull, slower engines, and naturally piercing shots.

All three ships are available immediately. There are no paid upgrades or ads.

BUILD YOUR RUN
==============
After each cleared sector, choose one of three seeded upgrades. Upgrades last for
the current run and can stack. You receive two rerolls per run. The cards explain
each upgrade and its next rank.

Options include extra projectiles, piercing shots, critical hits, chain
lightning, explosive rounds, orbital drones, regenerating shields, repair swarms,
stronger hulls, and enhanced dashes. Once normal upgrades are maxed, repeatable
limit-break upgrades keep endless mode progressing.

CAREER AND COSMETICS
====================
Pilot career data is stored in this browser under a separate local save so the
original personal-best/settings save remains compatible. Career tracks XP,
levels, completed runs, wins, kills, flight time, best combo, wins by rig, recent
run history, and eight achievements.

Career levels unlock cosmetic signal themes only. Cosmetics do not alter ship
stats or leaderboard fairness:

Level 1   SIGNAL CYAN
Level 3   VOID VIOLET
Level 5   RIFT GOLD
Level 8   NOVA ROSE

The pilot name is a display name, not an account. Each browser receives a random
anonymous player UUID used to associate verified community runs from that browser.
Changing the pilot display name does not create a new local career. Different
browsers or devices have independent local saves and anonymous identities.

CHECKPOINT RESUME
=================
For normal nine-sector standard and daily runs, Neon Rift saves a checkpoint at
cleared-sector upgrade screens. If the page is reloaded or closed, RESUME
CHECKPOINT restores the run at that secured sector, including hull, energy,
upgrades, score, run metrics, deterministic RNG position, and upgrade choices.

Checkpoints expire after seven days. They are sector-boundary checkpoints, not
continuous mid-sector saves. Endless mode is not checkpointed. Finishing or
abandoning a run clears its checkpoint.

ENERGY, HULL, AND SCORE
======================
Mint-colored diamonds charge Overdrive. At 100%, press E or tap OVERDRIVE for a
temporary damage and firing-speed boost. Activation also clears nearby hostile
shots. Overdrive is not continuous invulnerability: keep dodging.

Green plus pickups repair hull. Sector-clear repair depends on the active sector
modifier; REPAIR WINDOW restores more hull than normal. Reinforced Hull upgrades
also immediately repair you to full health.

Chain kills within 3.8 seconds. Every six consecutive kills raises the score
multiplier, up to 5x. Taking hull damage or letting the chain expire resets it.

COMMUNITY LEADERBOARDS AND RUN VERIFICATION
============================================
Community services use a dedicated Supabase backend. The browser has only a
public publishable application key. It cannot insert directly into the run table.
Public database access is read-only; writes are accepted only through the
`game-session` Edge Function.

For an online run, the server creates a run ID, a random session token, and the
run seed. Only a hash of the session token is stored server-side. Completion
submissions are checked against the active session, elapsed wall time, run shape,
combo/kills consistency, sector limits, a broad score envelope, duplicate run
IDs, and rate limits before a leaderboard row is written.

This is substantially harder to spoof than direct browser database writes, but
Neon Rift is still a client-authoritative browser game. It is not an esports-grade
server simulation and cannot prove every gameplay event cryptographically.

SAVING, TELEMETRY, AND PRIVACY
==============================
Local browser storage contains:
- neon-rift-save-v1: personal best, run/win counts, ship, and settings.
- neon-rift-career-v1: career XP, achievements, statistics, and run history.
- neon-rift-player-v1: anonymous browser player UUID.
- neon-rift-checkpoint-v1: current sector-boundary checkpoint when applicable.

Browser privacy settings, clearing site data, private browsing, or using a
different browser/profile can remove or isolate local data. The game remains
playable when storage or community services are unavailable.

Completed online run summaries can include pilot display name, score, kills,
sectors, duration, ship, best combo, win state, run mode/date/seed, damage taken,
dashes, Overdrive activations, game version, and a coarse platform label such as
`touch-portrait` or `desktop-landscape`.

Anonymous balancing telemetry records limited run events such as run start/end,
sector clears, upgrade choices, checkpoint resumes, run abandonment, and client
errors. The backend does not store a raw browser user-agent string. Rate limiting
uses a one-way per-day hash derived from the request IP; the raw IP is not written
to the Neon Rift application tables. No advertising or third-party analytics SDK
is included.

Sound is synthesized locally and begins only after a user gesture. Music is on by
default for new players and can be toggled in the top bar or pause menu. Reduced
motion controls are also available in the pause menu.

SOURCE AND REPRODUCIBLE BUILD
=============================
The generated launch files are index.html and neon-rift.html and remain
byte-identical for a release. The build is assembled from reviewed source layers:

    python3 tools/mobile/build.py
    python3 tools/engagement/apply.py

The builders use known-input guards and refuse to patch unrecognized launch
files. Mobile regression coverage is in tests/mobile_controls.py. Neon Rift 1.3
managed-run coverage is in tests/v13_regression.py, with startup diagnostics in
tests/startup_smoke.py.

The version-controlled Supabase schema migrations are under supabase/migrations/
and the deployed Edge Function source is under supabase/functions/game-session/.
The function depends on Supabase's hosted runtime and @supabase/supabase-js; those
services are needed only for community features, not local gameplay.

Good luck, pilot.

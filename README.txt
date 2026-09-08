NEON RIFT
A complete, self-contained arcade survival game
Version 1.1.0 - Mobile Controls

GET STARTED
===========
Open neon-rift.html in a web browser. On a desktop, double-click the file
or drag it into a Chrome or Edge window. Choose a ship and select
ENTER THE RIFT.

No installation, package manager, account, web server, or internet
connection is required. All graphics, game logic, sound effects, and
music are inside the HTML file. Keep the file's .html extension.

A file-preview app may show source code instead of running the game.
Open the file in an actual browser, not a text editor or preview app.

CONTROLS
========
WASD or arrow keys       Move
Space                   Dash through danger (brief invulnerability)
E                       Activate Overdrive when energy reaches 100%
P or Escape             Pause / resume
1, 2, 3                 Choose an upgrade between sectors
M                       Toggle sound effects
F                       Toggle fullscreen when the browser permits it
R                       Start a new run from the results screen

Aiming and firing are automatic. Your job is movement, positioning,
dash timing, and choosing a powerful build.

PHONE CONTROLS
==============
Open the deployed GitHub Pages site in a phone browser. The visible thumbstick
moves your ship. DASH and OVERDRIVE are large buttons on the other side.
Keep one finger steering while using an ability with another finger. Aiming
and firing stay automatic. Dragging directly on the arena also still works.

PAUSE is a touch button in the top-right corner. Ship selection, upgrades,
rerolls, retry, and all pause-menu actions can be tapped or scrolled into view.
Portrait and landscape are supported. Rotating the phone pauses safely; tap
BACK TO THE RIFT after the layout settles. Fullscreen is optional, not required.

The pause menu offers AUTO / ON / OFF touch-control selection and a left-handed
layout that swaps the thumbstick and abilities. Those preferences are saved
locally when browser storage is available. Touch input is cleared when you
pause, leave the page, lose pointer capture, or cancel a touch.

Phone rendering uses a capped pixel ratio to reduce graphics load. The control
layout accounts for screen cutouts and bottom gesture areas. Actual iPhone and
Android hardware has not been tested; see MOBILE-TESTING.md for exact coverage.
A file-preview app may not execute HTML. Use the deployed website or open the
standalone file in a browser. Both index.html and neon-rift.html contain the
complete game and remain byte-identical, with no runtime network dependencies.

THE MISSION
===========
Clear nine sectors and defeat the bosses in sectors 3, 6, and 9.
Ordinary sectors have a timed spawning phase followed by a cleanup:
finish the remaining enemies to advance.

A successful run is usually around four to six minutes of combat,
plus time spent choosing upgrades. After victory, you can continue
with the same build in endless mode.

YOUR SHIPS
==========
STRIKER    Balanced hull and a rapid pulse cannon.
GHOST      Faster movement, lighter armor, and twin cannons.
BASTION    More hull, slower engines, and naturally piercing shots.

All three are available immediately. There are no paid upgrades,
locked ships, ads, accounts, or online leaderboards.

BUILD YOUR RUN
==============
After each cleared sector, choose one of three random upgrades.
Upgrades last for the current run and can stack. You receive two
rerolls per run. The cards explain each upgrade and its next rank.

Options include extra projectiles, piercing shots, critical hits,
chain lightning, explosive rounds, orbital drones, regenerating
shields, repair swarms, stronger hulls, and enhanced dashes.

Once the normal upgrades are maxed out, repeatable limit-break
upgrades keep endless mode progressing.

ENERGY, HULL, AND SCORE
======================
Mint-colored diamonds charge Overdrive. At 100%, press E or tap the
Overdrive button for a temporary damage and firing-speed boost.
Activation also clears nearby hostile shots. Overdrive is not
continuous invulnerability: keep dodging.

Green plus pickups repair hull. Clearing a sector collects remaining
pickups and repairs up to 18 additional hull. Reinforced Hull upgrades
also immediately repair you to full health.

Chain kills within 3.8 seconds of one another. Every six consecutive
kills raises your score multiplier, up to 5x. Taking hull damage or
letting the chain expire resets it.

QUICK TIPS
==========
- Keep moving in broad arcs rather than backing into a corner.
- Dash through a closing gap; your dash briefly ignores damage.
- Watch the warning lines before gunner shots and charging attacks.
- Split Chamber is strong early. Aegis Field buys room for mistakes.
- Bosses become more aggressive below roughly half health.
- A lost run is a fresh chance to try a different combination.

SAVING AND PRIVACY
==================
Your personal best, run count, victory count, selected ship, and
settings are stored in this browser when local storage is available.
Active runs are not saved after the page is closed or reloaded.

Browser privacy settings, clearing browsing data, private browsing,
or moving the HTML file can affect saved records. The game remains
playable when browser storage is unavailable.

There are no external assets, analytics, telemetry, or network calls
in the game code. Sound is synthesized locally and starts only after
a user gesture. Music is on by default for new players; toggle it in the top bar or
the pause menu. Reduced-motion controls are also in the pause menu.

SOURCE CODE
===========
The complete readable HTML, CSS, and JavaScript source is contained
in neon-rift.html. Open it in a text editor to inspect or modify it.
There are no third-party runtime dependencies or required player build steps.
The mobile update can be reproduced with Python 3:
    python3 tools/mobile/build.py
The builder applies the reviewed mobile changes to a frozen copy of the original
source, verifies the tested output hash, and updates both launch files. It refuses
to overwrite unrecognized edits. When changing the game, update the source/build
recipe deliberately and retest rather than silently replacing manual edits.
Automated mobile regression tests are in tests/mobile_controls.py.

Good luck, pilot.

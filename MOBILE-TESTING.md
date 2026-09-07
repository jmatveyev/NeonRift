# Mobile controls release 1.1.0

Based on main commit `f8bbd1d72777c797d347e6f54ffea7ed12e827ec`.
The original game, ships, combat, progression, and desktop inputs are preserved.

## Changes

Persistent analog thumbstick; larger DASH and OVERDRIVE buttons; independent
pointer ownership for simultaneous movement and abilities; immediate multitouch
Pause handling; left-handed layout; automatic/forced/disabled phone controls;
safe-area spacing; scrollable portrait and landscape menus; capped mobile render
resolution; and pointer cleanup on cancellation, pause, rotation, or page exit.
The two launch files are identical and self-contained.

## Completed checks

147 assertions passed in Chromium using desktop and mobile-device emulation.
Tests cover real browser touch pointers, analog dead zone, steering, dash and
Overdrive while steering, releasing one finger without stopping another,
ability-first input, touch cancellation, fallback arena dragging, multitouch
Pause, resume, rotation-event handling, handedness, control modes, page exit,
upgrades, rerolls, defeat, retry, and retained keyboard/mouse controls.

Control hit-testing and menu traversal were checked at 320x568, 360x640,
375x667, 390x844, 430x932, 568x320, 667x375, 844x390, 932x430, and 1024x768.
An uninstrumented production copy also starts and pauses through native taps.
No uncaught JavaScript errors were observed in the completed regression run.

## Test limitations

These are browser-emulation results, not physical iPhone/Android certification.
Safari/WebKit, physical screen cutouts, browser chrome behavior on real phones,
and native GPU frame rates were not verified. Direct navigation is blocked by
this execution environment's administrator policy, so the HTML was loaded with
Playwright set_content. The test harness enables the existing opt-in test API;
production play does not expose it unless the explicit ?test query is supplied.
Selected state-transition tests use invulnerability, charged energy, or forced
sector completion to isolate input and menu behavior. They are not full human
campaign playtests. Storage persistence across device/browser restarts was not
verified. Fullscreen remains browser-dependent and is never required to play.

Run tests/mobile_controls.py with Python Playwright and Chromium. Set CHROMIUM
to the local Chromium executable path when it is not /usr/bin/chromium. The
script writes its assertion results to tests/mobile-results.json.

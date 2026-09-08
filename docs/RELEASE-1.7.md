# Neon Rift 1.7: cinematic transit and native showcase rendering

## Player-facing changes

The between-sector transition is now a real rendered flight sequence rather than a loading card. The selected ship clears the current location, charges its rift drive, travels through a modeled jump corridor and approaches the next destination. The existing route, upgrade, pause and skip controls remain, but they are presented as a compact flight-computer HUD over the scene. Combat is frozen throughout transit and normal gameplay chrome is hidden.

Transit has five presentation phases: clearing dock, charging the rift drive, rift transit, destination lock and final approach. Mid-rift uses its own rift-space sky instead of leaving the old sector planet behind the tunnel. Previous and next environment meshes are temporary and are released after arrival. Reduced Motion keeps a short non-moving transition, and WebGL-unavailable systems retain an animated 2D compatibility treatment.

The home hangar now has a separate showcase rendering budget. On a sufficiently large desktop display, Auto may use a true 3840x2160 scene buffer for the static showcase even though Auto gameplay keeps its lower performance budget. This fixes the previous case where a 4K monitor could display a roughly 1080p-class internal menu render. The showcase reports its real render dimensions on screen.

Striker, Ghost and Bastion also receive display-only high-detail models with panel seams, vents, wing detail, emitters and engine rings. Combat continues to use its lighter meshes so the menu improvement does not tax every gameplay frame. The static desktop showcase is rate-limited so it does not pointlessly render at full refresh rate.

Standard gamepads are now supported. Left stick and D-pad steer, A dashes, X activates Overdrive and Menu/Start pauses. Upgrade choices can be selected with A/X/Y. Menus expose focus outlines and controller presence is surfaced in the hangar. Keyboard, mouse and multitouch behavior remain intact.

## What did not change

1.7 does not change enemy balance, scoring, upgrades, procedural run RNG, leaderboard rules, Supabase schema, career progression or save-key names. Standard, Endless and Daily Signal remain separate. There are still no seasons or seasonal resets.

The high-resolution hangar is a presentation path, not a claim that every phone or GPU can sustain 4K gameplay. Phone Auto remains bounded and 4K is never forced onto a phone-sized viewport. The procedural sky and bloom remain separately budgeted intermediate passes.

## UAT

`tests/v17_regression.py` adds 34 release-specific assertions. It validates a real 3840x2160 home scene at 1920x1080 CSS pixels with device scale factor 2, confirms all three display-only ship models are materially denser than their combat counterparts, and verifies showcase rendering does not consume gameplay state or RNG.

The suite forces departure, mid-rift and approach states and verifies they are materially different WebGL frames, contain real geometry, suppress normal top-bar chrome and keep the flight-computer HUD in bounds. A 393x852 touch viewport checks that Auto stays below a 2-million-pixel render workload, transit HUD/actions fit and no horizontal overflow is introduced. A simulated standard gamepad checks movement, dash, Overdrive and pause edges.

All online requests in UAT are mocked. Physical iPhone/iPad testing, thermal/battery profiling and native App Store packaging remain separate release gates.

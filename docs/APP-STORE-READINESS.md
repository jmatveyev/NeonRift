# Neon Rift: App Store readiness plan

Neon Rift is not being declared App Store-ready by the browser release workflow. The browser game can remain the gameplay core, but a competitive iOS release needs native product work and physical-device certification around it.

## Required before an iOS submission candidate

- Build a native iOS/iPadOS container in Xcode with the game bundled locally rather than treated as a remote website. Handle suspend/resume, audio-session changes, memory pressure, safe areas, orientation and offline launch natively.
- Add Game Center authentication, permanent leaderboards and achievements. Map Standard and Endless cleanly; decide how Daily Signal relates to the existing verified backend without duplicate or conflicting identity.
- Add native haptic feedback for dash, damage, Overdrive, boss phase changes and upgrade confirmation. Preserve the browser build as a no-haptics fallback.
- Complete physical-device QA on supported iPhone and iPad generations, including touch latency, 60/120 Hz behavior, memory, thermal throttling, battery drain, background/foreground recovery, headphones/Bluetooth audio and controller input.
- Finish VoiceOver/focus coverage, a Dynamic Type strategy for non-canvas UI, contrast review and reduced-motion behavior. Controller-only navigation must cover the entire shell, not merely combat.
- Publish an in-app and App Store privacy policy describing callsign, anonymous player identity, leaderboard submissions and telemetry. Add appropriate disclosure and controls for the final data model.
- Produce final App Store icon, screenshots/video, age rating, support/privacy URLs, review notes and a stable production versioning scheme.
- Establish crash/performance telemetry suitable for the native build without shipping secret credentials in the client.

## Competitive-quality work after technical submission readiness

A top-chart result cannot be guaranteed by rendering quality or review compliance. For a serious top-10 attempt, the game needs evidence that players come back and recommend it. Measure tutorial completion, first-run deaths, upgrade choices, sector drop-off, win rate, session length and next-day return. Tune the first ten minutes from those cohorts instead of guessing.

The product also needs a deliberate content/retention plan that does not rely on seasons: achievements, ship mastery, challenge goals, additional boss behaviors, more build synergies, unlockable cosmetic rewards, Game Center challenges and meaningful long-term records can provide replay value without seasonal resets.

Do not submit merely because a wrapper compiles. The release candidate should be played start-to-finish repeatedly on real devices by people who did not build it, with blocker and major issues driven to zero before App Review.

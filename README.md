# Containers in Practice — Astro learning studio

An accessible narrated course built with Astro, original MP3s, MarkdyScript, and GSAP. The static build includes 5 modules, 44 lessons plus an opening, 45 independently playable lesson recordings, 14 retained source recordings, diagram source, a glossary, a workstation readiness check, OS-specific installation guides, and a downloadable starting workload.

## Run locally

Use Node.js 22 LTS or newer compatible Node, and pnpm.

```bash
corepack enable
pnpm install
pnpm dev
```

Open the local URL printed by Astro. For a production build, run `pnpm build`; preview with `pnpm preview`.

## Content

- `src/data/course.json`: lesson text, per-lesson audio, source recording offsets, references, and measured waveform peaks.
- `public/audio/`: original recordings and lesson clips. Narration never uses speech synthesis.
- `public/audio/lesson-manifest.json`: clip-to-source mapping, section bounds, and measured durations.
- `scripts/split-audio.mjs`: rebuild the clips with `node scripts/split-audio.mjs` when editing source audio or section boundaries (requires FFmpeg and FFprobe). Normal Astro builds use the committed clips.
- `public/scenes/`: 45 downloadable MarkdyScript files. The diagrams are illustrative; they do not execute labs.
- `src/data/walkthroughs.js`: visible guides for workspace/Git setup, Checkpoint 0, Node/API/PostgreSQL startup, creating the first API image, and service networking.
- `scripts/update-guided-practice.mjs`: regenerates `labs/GUIDED-PRACTICE.md` and `public/practice-starter.zip` from those guides (requires Python 3; excludes dependency and Git directories). Run it after editing guided content.
- `labs/`: a Node.js/PostgreSQL workload scaffold, guided practice companion and observation template. It deliberately leaves image and cluster configuration to the learner.
- `src/components/InstallGuide.astro` and `src/data/installations.js`: shared OS-specific steps and terminal context in Module 0.1. Workstation targets and the readiness assessment are together in Opening (Module −0.1).
- `src/scripts/installations.js`: the six-tool arcade challenge and command reveal.
- `src/scripts/hero-motion.js`: layered GSAP illustration loop, play/pause controls, off-screen suspension and reduced-motion behavior.
- `src/scripts/course.js`: narration navigation, diagram controls, and accessibility preferences.

Lesson prose is adapted reading material, not a verbatim transcript. Each lesson loads a separate MP3 and starts at zero. Clips are cut at the existing source-course section cues without re-encoding; MP3 frame boundaries may differ from the requested cut by a few milliseconds. Source offsets are preserved in the manifest and course data. They have not been independently speech-aligned or audited by listening to all recordings. Diagram phases are proportional walkthrough cues rather than word-level alignment.

Module 0 uses the six supplied Audacity recordings directly: tracks 00–05 map to lessons 0.0–0.5. These files are copied without re-encoding, with their measured durations and waveform peaks. `audioOverride` preserves their filenames and hashes, and the regeneration script skips cutting these supplied recordings. The original full Module 0 recording remains available as a reference.

## Accessibility

Keyboard-operable native dialogs, arrow-key tabs, labeled seek/speed controls, read-only alternatives to diagrams, responsive layout, saved light/dark themes, larger-text and reduced-motion preferences, and no automatic audio start. A read-through path remains available without JavaScript. Toolchain commands appear after a short Tetris-inspired matching game or an explicit skip. The game supports keyboard and button controls, hints, an untimed mode, reduced motion, and a reveal saved on this device. Without JavaScript, all OS installation paths are readable. Local storage can be unavailable; the current-session reveal still works. This is not a formal WCAG certification.

## GitHub Pages

This is a static Astro site. Set `BASE_PATH=/your-repository/` at build time for a project site (or `/` for a root domain). The supplied workflow uses the repository name to derive the base path and uploads `dist/`. Select GitHub Actions as your Pages source. No server, database, or cloud credentials are needed for the course website; the learner API runs separately in the local lab.

The course hero and its controllable illustration animation appear only during Course Opening (Module −0.1). The sizing table and resource assessment are in that same opening.

The sidebar keeps its course identity and current module card above a separate scrollable lesson list. The card follows the selected lesson or audio continuation and links to that module’s first lesson. Resources uses a vibrant orange surface with contrasting dark text in both page themes. Markdy diagrams switch between paper and midnight palettes without replacing the narration player.

## Validation

`pnpm build` builds the site. `node tests/course-contract.mjs` checks recordings, cue order, scene compilation, starter archive, and markup. `node tests/player-dom.mjs` checks navigation, seeking, tabs and motion in a simulated DOM. `node tests/readiness-dom.mjs` checks resource targets and the readiness assessment. `node tests/installations-dom.mjs` checks game retries, keyboard play, reveal/skip/persistence, OS selection, exact copying, and reduced motion. `node tests/walkthroughs.mjs` checks the starter contents, guide prerequisites, Bash syntax and real Git checkpoint/task workflows in an isolated temporary workspace. `node tests/theme-contrast.mjs` checks the theme text palettes, Resources contrast, pinned-header structure and the extended illustration background. The player DOM regression also checks current-module labels, saved theme restoration, theme switching and unchanged narration state. `node tests/hero-motion.mjs` checks illustration controls, visibility suspension, reduced-motion behavior and cleanup. The API tests use an injected datastore and do not validate a running PostgreSQL instance or Kubernetes cluster. Browser rendering and real MP3 playback still require a manual browser pass.

The opening uses the supplied `Module -0.1.mp3`, copied without re-encoding to `public/audio/course-opening.mp3`. It appears before Module 0 and hands off to the baseline check.

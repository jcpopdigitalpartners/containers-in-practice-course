# Containers in Practice — course website

Static Astro course exported from the published source, commit 557e298f3f17fd808e603e6db1b32895fb83eb21 (Site version 37). Includes the opening, 44 investigations, narration, Markdy diagrams, drawers, glossary and accessibility preferences.

The learner lab repository is https://github.com/jcpopdigitalpartners/fussy-stork. This repository hosts the website; the API and database run in the learner's own Linux lab.

## Publish

Follow DEPLOY-GITHUB-PAGES.md. The included GitHub Actions workflow builds Astro and publishes dist. Source files and .github belong at the repository root. Commit pnpm-lock.yaml, src/ and all public/ audio files.

The Astro configuration derives site and base from the GitHub repository used by Actions. Local builds default to https://jcpopdigitalpartners.github.io/containers-in-practice-course/. Use BASE_PATH=/ for a local root-path build or SITE_URL for another origin.

## Local development

Use Node.js 24 and pnpm 11.25.0:

```bash
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL Astro prints, including /containers-in-practice-course/ when that is the configured base. Use pnpm build for dist/ and pnpm preview to inspect a production build. Dependencies and build output are not committed.

## Content and verification

- src/data/course.json: lessons, references, audio mapping and diagram source
- src/data/walkthroughs.js: clone, checkpoint and first-workload guides
- public/audio/: lesson clips and retained original recordings
- public/scenes/: downloadable Markdy source
- scripts/split-audio.mjs: optional audio regeneration with FFmpeg/FFprobe
- tests/: content contracts, simulated browser behavior and real hosted-clone/checkpoint tests

Build with pnpm build and then run node tests/course-contract.mjs. The walkthrough test requires Git/network access. These checks do not replace a browser pass or live lab testing.

GitHub Pages does not carry over private Site access restrictions. Progress and preferences are browser-local and begin separately on the Pages origin. This export has not been deployed to GitHub Pages yet.

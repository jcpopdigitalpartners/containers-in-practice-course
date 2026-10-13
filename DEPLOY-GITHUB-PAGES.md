# Deploy the course to GitHub Pages

1. Create an empty public GitHub repository under jcpopdigitalpartners named containers-in-practice-course. Leave README, .gitignore and license initialization unchecked because the package supplies the project files.
2. Right-click the ZIP and choose Extract All. Set the destination to your Downloads/containers-in-practice-course folder. The ZIP contains the project files directly; its extracted root contains package.json, astro.config.mjs, pnpm-lock.yaml, src/, public/ and .github/workflows/deploy-pages.yml. Do not upload the ZIP or nest the project inside another repository folder.
3. Open Git Bash and run:

```bash
cd ~/Downloads/containers-in-practice-course
git init -b main
git add .
git commit -m "Publish Containers in Practice course"
git remote add origin https://github.com/jcpopdigitalpartners/containers-in-practice-course.git
git push -u origin main
```

These commands apply to the fresh extracted project. If Git asks for identity, set git config --local user.name "Your name" and git config --local user.email "you@example.com", then rerun the commit and push. Authenticate to GitHub when prompted.

4. Open repository Settings > Pages. Under Build and deployment, set Source to GitHub Actions. The initial push may fail before Pages is enabled; this does not require a new commit.
5. Open Actions > Deploy course to GitHub Pages. If it succeeded, continue. Otherwise Run workflow on main, or rerun the initial failed run after enabling Pages. Wait for build and deploy to succeed.
6. Open https://jcpopdigitalpartners.github.io/containers-in-practice-course/. The deployment's page URL is authoritative. Test narration and seeking, lesson navigation, drawers, Larger Text diagram labels and the learner repository link.
7. For later edits, change source, review git diff, commit and push to main. Actions rebuilds and deploys the website.

The workflow, .github folder and subpath configuration are included. All audio is included. Use Git to upload, rather than GitHub's browser uploader. A successful local build is not evidence of a successful GitHub deployment. If Actions fails, open the red job and preserve its first relevant error message.

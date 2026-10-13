# Deploy the course to GitHub Pages

The course repository is `jcpopdigitalpartners/containers-in-practice-course`. The prepared course source is on the local branch `prep/github-pages`, based on the repository's current `main` branch. The included GitHub Actions workflow builds Astro and deploys `dist/` when changes reach `main`.

## Publish the prepared branch

From the deployment checkout, review the changes and push the branch:

```bash
git status --short
git diff --stat origin/main...HEAD
git push -u origin prep/github-pages
```

Open a pull request from `prep/github-pages` into `main` and review the file changes. Merge it when ready. The Pages workflow runs on the updated `main` branch.

If Git asks for your identity, set it for this repository and retry:

```bash
git config --local user.name "Your name"
git config --local user.email "you@example.com"
```

Authenticate to GitHub when prompted. A GitHub account is needed to push the branch and merge the pull request. Public cloning and local course work do not require a GitHub account.

## Enable and verify Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions → Deploy Astro course to Pages** and wait for the build and deployment jobs to succeed.
4. Open <https://jcpopdigitalpartners.github.io/containers-in-practice-course/>.
5. Check narration and seeking, lesson navigation, both drawers, the larger-text preference on diagrams, and the learner-repository link.

The workflow derives the project base path from the GitHub repository name and uploads `dist/`. No server, database, or cloud credentials are needed to host the course website; the learner API runs separately in the local lab.

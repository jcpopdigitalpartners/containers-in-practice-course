# Containers in Practice — local practice starter

This is a starting workload, not a completed lab solution. Use a disposable local environment. All commands below use Bash (Linux, WSL, or a Linux VM).

## Follow the guided sequence

Open [GUIDED-PRACTICE.md](GUIDED-PRACTICE.md) beside your terminal. It provides Module 0.2 workspace transfer and Git initialization, Module 0.5 checkpoints, Module 1.1.1 Node/API/database startup, Module 1.1.2 image creation, and Module 1.2.1 service networking. Each step names the terminal, working directory, command purpose, expected result and recovery action.

The application is the supplied Node.js API. PostgreSQL is a separate service using the upstream database image and your `api/schema.sql`. You create the Containerfile in the image lesson. The course currently distributes this workspace as a ZIP; initialize its local Git history using the guide. No hosted learner clone URL is configured.

## What you need

Prepare the course toolchain. Install Node.js LTS to inspect the source outside a container in Module 1. Git is useful for keeping checkpoints, but a GitHub account is not required.

Extract this archive. In VS Code, open `containers-practice-starter` and start a terminal in that folder. The API lives in `api/`. Record observations in `evidence/`.

## Start a database for the source inspection

This is baseline setup plumbing; it does not solve the image, scaling, or security investigations. Check that port 5432 is available first. The password is a disposable local lab value.

```bash
podman run -d --name cip-baseline-db -p 127.0.0.1:5432:5432 \
  -e POSTGRES_DB=course -e POSTGRES_USER=course \
  -e POSTGRES_PASSWORD=coursepass docker.io/library/postgres:17
```

Wait until the database is ready:

```bash
podman exec cip-baseline-db pg_isready -U course -d course
```

When the check succeeds, initialize the schema from the starter root:

```bash
podman exec -i cip-baseline-db psql -U course -d course < api/schema.sql
```

## Inspect and run the API

```bash
cd api
npm ci
npm test
npm start
```

Keep that terminal running. In a second terminal:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl -X POST http://localhost:3000/records \
  -H 'Content-Type: application/json' -d '{"value":"baseline observation"}'
curl http://localhost:3000/records
```

`/health` proves a running HTTP process. It intentionally does not check the database. `/ready` performs a database query. `/records` performs actual datastore work. These route names are not automatically Kubernetes probes: you must configure and evaluate probes in the relevant investigation.

The source exposes assumptions on purpose. Review identity, configuration, writable state, startup, and shutdown behavior as the course progresses. A successful health request is not a security conclusion.

## Your investigations

- Module 1: write a Containerfile, build an OCI image, externalize configuration, connect separate services, and reconstruct the environment.
- Module 2: add kind with the Podman provider and kubectl. Design a Deployment and Service, inspect eligible endpoints, and measure behavior under controlled demand. Add optional metrics tooling only when needed for its investigation.
- Module 3: test storage lifetime, restore a real backup, evaluate probes, inspect termination, and compare rollout behavior.
- Module 4: establish the actual baseline, constrain identity/filesystem/authority, inspect the artifact, and test admission with positive and negative controls. Trivy and Syft belong to this module; Cosign and Kyverno are optional extensions.

Each investigation asks for commands, outputs, and a bounded explanation. Do not treat a diagram, mock output, or these API unit tests as evidence that a local cluster works.

## Git foothold

Follow the Module 0.2 Git sequence in GUIDED-PRACTICE.md to initialize `main`, configure your repository-local identity, stage the starter and create its first commit. Use `git status`, `git diff`, and `git diff --cached` to inspect each change before committing selected files. Module 0.5 tags your verification commit as `checkpoint-0`. Later guided tasks create a branch, commit evidence and locally merge it into `main`. Keep secrets out of history. These local exercises do not need a GitHub account or a remote repository.

## Finish safely

Stop the API with Ctrl+C. Inspect the disposable database before removal:

```bash
podman ps -a --filter name=cip-baseline-db
```

When you have captured the evidence and no longer need its local data, remove only this lab container:

```bash
podman rm -f cip-baseline-db
```

This baseline database uses its container writable layer. Its records are lost on removal; adding and validating persistent storage is part of the investigation.

# Containers in Practice — guided practice

Use the same Linux environment throughout. Run one block at a time and check its result before continuing. File contents belong in your editor. The application is the supplied Node.js API; PostgreSQL is its separate database.

## Module 0.2 — Get your workspace and start its history

After the six version checks and hello container succeed, download the learner workspace. It contains the API source, database schema, tests and an evidence template. This download becomes your local Git repository; a hosted clone URL has not been configured.

The course page supplies the workspace download. If you are reading this file inside your extracted starter, you already have it.

### 1. Bring the ZIP into your Linux environment

**Terminal:** Choose the transfer path for your workstation

**Working directory:** The browser downloads practice-starter.zip to your host Downloads folder.

The labs, files and Git history belong together inside the Linux environment you prepared in Module 0.1. Download using the button above, then follow one transfer path.

#### Ubuntu / RHEL / Fedora desktop

**Terminal:** Your Linux Bash terminal

If your browser used a different download folder or filename, adjust the source path.

```bash
cp "$HOME/Downloads/practice-starter.zip" /tmp/practice-starter.zip
```

#### macOS with the course-linux Lima guest

**Terminal:** macOS Terminal, then Ubuntu guest Bash

Copy from your Mac into the running guest; then enter that guest. Your Linux terminal is where all remaining steps run.

```bash
limactl copy "$HOME/Downloads/practice-starter.zip" course-linux:/tmp/practice-starter.zip
limactl shell course-linux
```

#### Windows with Ubuntu WSL2

**Terminal:** Ubuntu Bash, then Windows File Explorer

Open /tmp in File Explorer using these commands. Copy the downloaded practice-starter.zip into that window. Return to Ubuntu Bash for the next step.

```bash
cd /tmp
explorer.exe .
```

**Check before continuing:** The file /tmp/practice-starter.zip exists inside Linux. Check with ls -l /tmp/practice-starter.zip.

**If the result differs:** Do not download the private Site URL with an unauthenticated curl request; use your browser’s download button. If you use an existing Ubuntu WSL2 distribution, follow the Windows transfer path.

### 2. Extract and open the project root

**Terminal:** Linux Bash

**Working directory:** Your Linux home directory

unzip extracts the starter; cd changes the current working directory. Keep this folder through the course. If it already contains your earlier work, use that copy instead of extracting over it.

```bash
cd "$HOME"
unzip /tmp/practice-starter.zip
cd ~/containers-practice-starter
pwd
ls -a
```

**Check before continuing:** You see README.md, .gitignore, api/ and evidence/. Your path ends with containers-practice-starter.

**If the result differs:** If unzip is missing, install it using sudo apt-get install -y unzip on Ubuntu or sudo dnf install -y unzip on RHEL/Fedora. If the archive command reports an HTML file or an invalid ZIP, download it again through the course page.

### 3. Initialize Git and set your local identity

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

git init creates local history. The two config commands set the identity used for commits in this repository. Replace the example name and email with your own before running them. A GitHub account is not required.

```bash
git init -b main
git config --local user.name "Your name"
git config --local user.email "you@example.com"
git status
```

**Check before continuing:** Git reports that you are on main, with no commits yet and untracked starter files.

**If the result differs:** If you already initialized this workspace, inspect git status and git branch instead of starting another history. Run Git commands from the project root.

### 4. Record the unchanged starter

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

git add stages the selected files. git diff --cached shows exactly what will be committed. git commit creates the first checkpoint; git log shows it. Read the staged diff before committing.

```bash
git add .gitignore README.md GUIDED-PRACTICE.md api/ evidence/
git diff --cached
```

Review the staged diff before continuing. If it contains only your intended changes, run the next block.

```bash
git commit -m "Start Containers in Practice workspace"
git log --oneline -1
git status
```

**Check before continuing:** One initial commit exists and Git reports a clean working tree. Dependencies and .env files are excluded by .gitignore.

**If the result differs:** If Git says Author identity unknown, finish the previous step. If the staged diff includes a secret or an unrelated file, use git restore --staged <file> to unstage it before committing.

Official references: [Git basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics) · [Git branches](https://git-scm.com/docs/git-switch) · [Lima file transfer](https://lima-vm.io/docs/reference/limactl_copy/) · [Windows / Linux files](https://learn.microsoft.com/en-us/windows/wsl/filesystems)

## Module 0.5 — Make Checkpoint 0 real

Your local learner repository was created in Module 0.2. A checkpoint combines recorded evidence with a named Git commit. Complete these steps before entering Module 1.

### 1. Write the evidence

**Terminal:** Your editor and Linux Bash

**Working directory:** ~/containers-practice-starter

Open evidence/baseline.md. Record your OS and guest resources, the six tool versions, the hello-container result and what remains unproven. Save the file before running Git.

```bash
cd ~/containers-practice-starter
git status
git diff -- evidence/baseline.md
```

**Check before continuing:** The diff shows your own observations in evidence/baseline.md.

**If the result differs:** If the diff is empty, confirm the editor saved the file in this workspace. The template alone is not your verification result.

### 2. Commit and name the verified baseline

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

A commit records the file changes. A tag gives that commit a stable name you can inspect later. Create checkpoint-0 once, after successful verification.

```bash
git add evidence/baseline.md
git diff --cached
```

Review the staged diff before continuing. If it contains only your intended changes, run the next block.

```bash
git commit -m "Verify Module 0 baseline"
git tag checkpoint-0
git show --stat checkpoint-0
git status
```

**Check before continuing:** checkpoint-0 points to your evidence commit and the working tree is clean.

**If the result differs:** If the tag already exists, inspect git show checkpoint-0 instead of moving or replacing it. If a check failed, record the failure and resolve it before calling the baseline verified.

Official references: [Git basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics) · [Git branches](https://git-scm.com/docs/git-switch)

## Module 1.1.1 — Run the app, API and database together

The app in this course is the supplied Node.js HTTP API. PostgreSQL is its separate datastore. First run Node directly in Linux and PostgreSQL in a container; Module 1.1.2 packages the API into its own image. The disposable database credentials below are local lab values.

### 1. Install or verify Node.js 24 and npm

**Terminal:** Linux Bash · terminal A

**Working directory:** Your Linux home directory

The host API needs Node.js and npm in the same Linux environment as your labs. If Node 24 and npm are already available, just verify their versions. Otherwise download and inspect the nvm installer below before running it; press q to leave less.

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh -o /tmp/cip-install-nvm.sh
less /tmp/cip-install-nvm.sh
export NVM_DIR="$HOME/.nvm"
mkdir -p "$NVM_DIR"
bash /tmp/cip-install-nvm.sh
rm -f /tmp/cip-install-nvm.sh
. "$NVM_DIR/nvm.sh"
nvm install 24
nvm use 24
node --version
npm --version
```

**Check before continuing:** node prints a v24 version and npm prints its version. Patch versions can differ.

**If the result differs:** If nvm is not available in a new terminal, source its nvm.sh again. Use the official Node.js instructions if your organization manages runtime installations.

### 2. Start a task branch and inspect the source

**Terminal:** Linux Bash · terminal A

**Working directory:** ~/containers-practice-starter

A branch gives this investigation a named line of work. Inspect api/server.mjs, api/package.json and api/schema.sql in your editor: identify port 3000, the DB_* environment variables, /health, /ready and /records.

```bash
cd ~/containers-practice-starter
git status
git switch -c inspect-workload
git branch --show-current
```

**Check before continuing:** The active branch is inspect-workload. /health checks the HTTP process; /ready queries PostgreSQL; /records reads or writes its table.

**If the result differs:** If the branch already exists from an earlier attempt, use git switch inspect-workload. Keep a clean or deliberately committed working tree before switching.

### 3. Start the baseline PostgreSQL database

**Terminal:** Linux Bash · terminal A

**Working directory:** ~/containers-practice-starter

Use the upstream PostgreSQL image for the database engine. -d runs it in the background, --name gives it a handle and -p publishes port 5432 only on this Linux environment’s loopback interface. The POSTGRES_* values create the lab user and database on first startup.

```bash
podman run -d --name cip-baseline-db \
  -p 127.0.0.1:5432:5432 \
  -e POSTGRES_DB=course \
  -e POSTGRES_USER=course \
  -e POSTGRES_PASSWORD=coursepass \
  docker.io/library/postgres:17
podman ps --filter name=cip-baseline-db
```

**Check before continuing:** Podman prints a container ID and lists cip-baseline-db as running.

**If the result differs:** If the name is already in use, inspect podman ps -a --filter name=cip-baseline-db; start your existing lab container with podman start cip-baseline-db if appropriate. If port 5432 is occupied, identify the existing process or container before retrying.

### 4. Wait for the database, then create the table

**Terminal:** Linux Bash · terminal A

**Working directory:** ~/containers-practice-starter

pg_isready checks whether PostgreSQL accepts connections. Repeat that first command until it succeeds, then run the schema command. The < operator supplies your schema file as standard input to psql inside the container.

```bash
podman exec cip-baseline-db pg_isready -U course -d course
```

Repeat the readiness check until it reports accepting connections. Only then initialize the schema with this next block.

```bash
podman exec -i cip-baseline-db psql -U course -d course < api/schema.sql
```

**Check before continuing:** The first command reports accepting connections. The second reports CREATE TABLE; a notice that the table already exists is safe on a repeat run.

**If the result differs:** If the database is still starting, inspect podman logs cip-baseline-db and wait for readiness. If the schema file cannot be found, return to the project root before running the second command.

### 5. Install dependencies, test and start the API

**Terminal:** Linux Bash · terminal A

**Working directory:** ~/containers-practice-starter/api

npm ci installs the dependency versions in package-lock.json. npm test checks API behavior with a simulated datastore. npm start keeps the HTTP server running in this terminal; the DB_* values connect it to your baseline database.

```bash
cd ~/containers-practice-starter/api
npm ci
npm test
DB_HOST=127.0.0.1 \
DB_PORT=5432 \
DB_NAME=course \
DB_USER=course \
DB_PASSWORD=coursepass \
PORT=3000 npm start
```

**Check before continuing:** The tests pass, then the terminal prints Practice API listening on port 3000. Leave terminal A running.

**If the result differs:** If npm is missing, complete the Node step. If port 3000 is occupied, identify the existing API before starting another. Unit tests do not prove your live database connection.

### 6. Test process, readiness and real data

**Terminal:** Linux Bash · terminal B

**Working directory:** A second terminal in the same Linux environment

Keep terminal A running. These HTTP requests prove progressively more: an HTTP process, database access, then a stored record. -i displays the HTTP status and response together.

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/ready
curl -i -X POST http://127.0.0.1:3000/records \
  -H "Content-Type: application/json" \
  -d '{"value":"baseline observation"}'
curl -i http://127.0.0.1:3000/records
```

**Check before continuing:** Health and readiness return 200; POST returns 201 with an id and value; GET returns 200 and includes baseline observation.

**If the result differs:** If /health succeeds while /ready returns 503, inspect the database readiness, address, credentials and API error in terminal A. If records fail, verify the schema step ran.

### 7. Save evidence and finish the Git task

**Terminal:** Linux Bash · terminal B

**Working directory:** ~/containers-practice-starter

Add the request results and dependency observations to evidence/baseline.md in your editor. Review and commit the change on your task branch, then merge it into main locally. --ff-only refuses an unexpected divergent history.

```bash
cd ~/containers-practice-starter
git status
git diff
git add evidence/baseline.md
git diff --cached
```

Review the staged diff before continuing. If it contains only your intended changes, run the next block.

```bash
git commit -m "Inspect API and verify database requests"
git switch main
git merge --ff-only inspect-workload
git status
```

**Check before continuing:** main includes the evidence commit and the working tree is clean. Stop the API in terminal A with Ctrl+C before the next image exercise.

**If the result differs:** If Git reports nothing to commit, save your evidence file first. If the fast-forward merge fails, inspect git log --oneline --graph --all and preserve your work before resolving the divergence.

Official references: [Node.js installation](https://nodejs.org/en/download) · [nvm installation](https://github.com/nvm-sh/nvm) · [Podman run](https://docs.podman.io/en/stable/markdown/podman-run.1.html) · [PostgreSQL image](https://github.com/docker-library/docs/blob/master/postgres/README.md) · [Git basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics) · [Git branches](https://git-scm.com/docs/git-switch)

## Module 1.1.2 — Create, build and test your first API image

The image contains Node.js, the API source and its dependencies. The database and its records stay separate. This first image proves packaging and process execution; later lessons investigate configuration, networking and hardening.

### 1. Stop the host API and start an image branch

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

Press Ctrl+C in the terminal running npm start to free port 3000. Return to the project root. Begin a new Git task after completing the previous local merge.

```bash
cd ~/containers-practice-starter
git status
git switch -c build-api-image
```

**Check before continuing:** The working tree is clean and build-api-image is your active branch.

**If the result differs:** If the branch already exists, use git switch build-api-image. If you have uncommitted source changes, review and preserve them before changing branches.

### 2. Write api/Containerfile

**Terminal:** Your editor

**Working directory:** ~/containers-practice-starter/api/Containerfile

Create this file in your editor using the example below. FROM selects the Node runtime; WORKDIR sets /app; COPY adds the lockfile and API source; RUN installs dependencies during the build; EXPOSE documents the port; CMD starts the API when a container runs. EXPOSE alone does not publish a host port.

```text
FROM docker.io/library/node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs ./
EXPOSE 3000
CMD ["node", "server.mjs"]
```

**Check before continuing:** The file is named Containerfile with a capital C and has no added .txt extension.

**If the result differs:** This is file content, not a Bash command. Save it in api/, next to package.json. This intentionally simple baseline is refined in the security lessons.

### 3. Write api/.containerignore

**Terminal:** Your editor

**Working directory:** ~/containers-practice-starter/api/.containerignore

Exclude local dependencies, environment files and key material from the build context. The build will install dependencies inside the image.

```text
node_modules/
.env
*.pem
*.key
```

**Check before continuing:** The hidden file .containerignore exists in api/.

**If the result differs:** Confirm your editor saved the leading dot and that the file is not named .containerignore.txt.

### 4. Build and inspect the OCI image

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

buildah bud reads api/Containerfile and uses api/ as its build context. -t gives the image a local name. Skopeo inspects the stored image without running it. The Node image tag can receive patch updates; later reproducibility work evaluates digest pinning.

```bash
buildah bud --format oci \
  -f api/Containerfile \
  -t localhost/course-api:v1 api
skopeo inspect containers-storage:localhost/course-api:v1
```

**Check before continuing:** The build completes and Skopeo prints image metadata including its digest and layers.

**If the result differs:** If COPY cannot find a package file, check the api/ build context and filenames. If the runtime image cannot be pulled, preserve the registry or network error. Use the same rootless Linux user for Buildah, Skopeo and Podman.

### 5. Run the image and prove the HTTP process

**Terminal:** Linux Bash · terminal A, then terminal B

**Working directory:** Both terminals in the same Linux environment

Run this in terminal A. -p connects Linux loopback port 3000 to container port 3000. Keep that terminal running, then run the curl command in terminal B. This exercise checks /health; database connectivity is added in Module 1.2.1.

```bash
podman run --rm --name course-api-image \
  -p 127.0.0.1:3000:3000 localhost/course-api:v1
```

**Check before continuing:** Terminal A prints the API startup message. In terminal B, curl -i http://127.0.0.1:3000/health returns 200. /ready returns 503 until database networking is configured.

**If the result differs:** If the host port is busy, stop the earlier API first. For connection failures, inspect the startup output and port mapping. Keep the server binding to 0.0.0.0 inside the container.

### 6. Test the packaged API from a second terminal

**Terminal:** Linux Bash · terminal B

**Working directory:** The same Linux environment as terminal A

Leave the image running in terminal A. Compare the process endpoint with the database endpoint. This image exercise intentionally has no database connection yet.

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/ready
```

**Check before continuing:** Health returns HTTP 200. Readiness returns HTTP 503 because database networking has not been configured. Save both observations; Module 1.2.1 makes the database path succeed.

**If the result differs:** If health fails, inspect the running API, port mapping and startup output. If readiness unexpectedly succeeds, identify which API and database you are actually testing.

### 7. Record the image and finish the Git task

**Terminal:** Linux Bash · terminal B

**Working directory:** ~/containers-practice-starter

Write the image identifier, build command and /health result in evidence/baseline.md. Commit the two files you authored and that evidence, then merge your task into main. When finished, Ctrl+C in terminal A stops and removes this --rm container.

```bash
cd ~/containers-practice-starter
git status
git diff
git add api/Containerfile api/.containerignore evidence/baseline.md
git diff --cached
```

Review the staged diff before continuing. If it contains only your intended changes, run the next block.

```bash
git commit -m "Build and test the first API image"
git switch main
git merge --ff-only build-api-image
git status
```

**Check before continuing:** main contains your image recipe, context exclusions and evidence. Git reports a clean working tree.

**If the result differs:** If Git cannot find Containerfile or .containerignore, check that both were saved in api/. Do not add node_modules or credentials.

Official references: [Buildah build reference](https://github.com/containers/buildah/blob/main/docs/buildah-build.1.md) · [Node.js container image](https://github.com/nodejs/docker-node/blob/main/README.md) · [Git basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics) · [Git branches](https://git-scm.com/docs/git-switch)

## Module 1.2.1 — Connect the packaged API to its database

Use your locally built course-api:v1 image. The API addresses PostgreSQL by its container name on a shared network. Only the API port is published to your Linux workstation. This first network exercise uses disposable database storage; persistence is a later investigation.

### 1. Prepare the workspace and network

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

Stop any API still using port 3000 with Ctrl+C in its terminal. Start a new Git task and create one named network. Run the create command once; use the existing course-net on a repeat attempt.

```bash
cd ~/containers-practice-starter
git status
git switch -c connect-services
podman network create course-net
```

**Check before continuing:** connect-services is active and course-net exists.

**If the result differs:** If the branch exists, switch to it. If the network exists, inspect podman network inspect course-net. Use podman ps -a to identify existing course-db and course-api containers before trying duplicate names.

### 2. Start PostgreSQL on the shared network

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

The database runs in the background on course-net. It does not need a published host port: the API will reach course-db:5432 inside the network. The POSTGRES_* variables initialize its user and database on first startup.

```bash
podman run -d --name course-db --network course-net \
  -e POSTGRES_DB=course \
  -e POSTGRES_USER=course \
  -e POSTGRES_PASSWORD=coursepass \
  docker.io/library/postgres:17
```

**Check before continuing:** course-db is running on course-net.

**If the result differs:** If the container name is already in use, inspect the existing lab container rather than deleting it blindly. Existing initialized storage keeps its original credentials.

### 3. Wait for readiness and initialize the schema

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

Repeat pg_isready until PostgreSQL accepts connections, then run the schema. Starting the database image alone does not create the application’s records table.

```bash
podman exec course-db pg_isready -U course -d course
```

Repeat the readiness check until it reports accepting connections. Only then initialize the schema with this next block.

```bash
podman exec -i course-db psql -U course -d course < api/schema.sql
```

**Check before continuing:** PostgreSQL accepts connections and the records table exists.

**If the result differs:** Inspect podman logs course-db if readiness never succeeds. Check api/schema.sql relative to your project root.

### 4. Start the API with runtime database settings

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

DB_HOST=course-db uses network name resolution. localhost inside the API container would refer to the API container itself. -d runs the API in the background; its local port is published on 127.0.0.1.

```bash
podman run -d --name course-api --network course-net \
  -p 127.0.0.1:3000:3000 \
  -e DB_HOST=course-db \
  -e DB_PORT=5432 \
  -e DB_NAME=course \
  -e DB_USER=course \
  -e DB_PASSWORD=coursepass \
  localhost/course-api:v1
podman logs course-api
```

**Check before continuing:** The API startup message appears, and both containers belong to course-net.

**If the result differs:** If the image is missing, complete Module 1.1.2. If port 3000 is busy, identify the API still using it. For a connection failure, inspect names, network membership and credentials.

### 5. Prove the complete data path

**Terminal:** Linux Bash

**Working directory:** ~/containers-practice-starter

A health request alone is insufficient. Check readiness, create a record through the API, read it back, then query PostgreSQL directly to confirm where it lives.

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/ready
curl -i -X POST http://127.0.0.1:3000/records \
  -H "Content-Type: application/json" \
  -d '{"value":"network observation"}'
curl -i http://127.0.0.1:3000/records
podman exec course-db psql -U course -d course \
  -c "SELECT id, value FROM records ORDER BY id;"
```

**Check before continuing:** Readiness returns 200, POST returns 201, and both GET and the SQL query show network observation.

**If the result differs:** 503 readiness indicates a database access problem. A records failure after readiness succeeds usually calls for inspecting the table/schema and the API logs.

### 6. Record and commit the network investigation

**Terminal:** Your editor, then Linux Bash

**Working directory:** ~/containers-practice-starter

Create evidence/module-1-network.md with your network inspection, the exact run commands and the HTTP/SQL results. The commands and output explain the environment you created; the following Git task preserves that record.

```bash
cd ~/containers-practice-starter
git status
git diff
git add evidence/module-1-network.md
git diff --cached
```

Review the staged diff before continuing. If it contains only your intended changes, run the next block.

```bash
git commit -m "Verify API to PostgreSQL network path"
git switch main
git merge --ff-only connect-services
git status
```

**Check before continuing:** main contains your network evidence and Git reports a clean working tree. Keep the lab containers for the following storage investigation.

**If the result differs:** If the evidence file is missing or unchanged, save your observations before committing. This checkpoint records the experiment; later infrastructure work turns setup into declarations.

Official references: [Podman run and networks](https://docs.podman.io/en/stable/markdown/podman-run.1.html) · [PostgreSQL image](https://github.com/docker-library/docs/blob/master/postgres/README.md) · [Git basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics) · [Git branches](https://git-scm.com/docs/git-switch)

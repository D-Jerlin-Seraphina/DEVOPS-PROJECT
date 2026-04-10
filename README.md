# Orbit Chat

React chatbot app using Google AI Studio API from the frontend.

## Local run

1. Install dependencies:

```bash
npm install
```

2. Add your Google API key in [src/App.tsx](src/App.tsx).

3. Start dev server:

```bash
npm run dev
```

## Docker build locally

```bash
docker build -t your-dockerhub-username/devops-project:latest .
docker run -p 8080:80 your-dockerhub-username/devops-project:latest
```

App will be available at http://localhost:8080

## GitHub Actions: Build and Push to Docker Hub

Workflow file: [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml)

This workflow runs on every push to main and on manual trigger.

### Required repository secrets

1. DOCKERHUB_USERNAME
2. DOCKERHUB_TOKEN

Create DOCKERHUB_TOKEN from Docker Hub account settings as an access token.

### Optional repository variable

1. DOCKERHUB_REPOSITORY

If set, this exact value is used as the image name (example: your-dockerhub-username/devops-project).
If not set, the workflow defaults to:

DOCKERHUB_USERNAME/github-repository-name

### Published tags

1. latest
2. sha-<commit>

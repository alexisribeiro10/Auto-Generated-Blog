# Auto-Generated Blog – Deployment Architecture

## 1. Overview

This project is a full-stack blog application with React frontend and Node.js backend, both packaged as Docker containers. The deployment uses AWS services and a CI/CD pipeline that goes from GitHub → CodeBuild → ECR → EC2, so every commit can trigger a fresh build and deployment of the app.

Key AWS components:
- **EC2** – hosts Docker containers for frontend and backend.
- **ECR** – stores Docker images.
- **CodeBuild** – builds Docker images from GitHub commits and pushes them to ECR.
- The deployment flow ensures each commit can trigger a rebuild and redeploy of the application.

## 2. Folder Structure
.
├── backend/
│ ├── src/
│ │ ├── index.js
│ │ ├── routes/
│ │ ├── services/
│ │ │ ├── aiClient.js
│ │ │ └── articleJob.js
│ │ └── models/
│ ├── package.json
│ ├── Dockerfile
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── api/
│ │ │ └── client.js
│ │ └── App.jsx
│ ├── package.json
│ ├── Dockerfile
│
├── infra/
│ ├── buildspec.yml
│ ├── docker-compose.yml
│ └── scripts/
│ ├── deploy.sh
│ └── init-ec2.sh
│
├── docs/
│ └── ARCHITECTURE.md
│
└── README.md


- `backend/`: Node.js API with article listing, retrieval, and AI-powered article generation.
- `frontend/`: React SPA that lists blog posts and shows full content on click.
- `infra/`: CI/CD and runtime infrastructure configuration (CodeBuild, Docker Compose, EC2 bootstrap scripts).

## 3. Deployment Flow

### 3.1 GitHub Commit

- Developer pushes code to the public GitHub repository.

### 3.2 AWS CodeBuild

CodeBuild is triggered via webhook and executes the CI/CD steps:
- Install needed CLI tools (for example `ssh`, `jq`).
- Retrieve the EC2 SSH private key from AWS Secrets Manager.
- Authenticate to ECR.
- Build backend and frontend Docker images.
- Tag images for ECR.
- Push images to ECR.

### 3.3 EC2 Deployment

On successful build, CodeBuild connects to EC2 over SSH and updates the running stack:
- EC2 pulls the latest images from ECR.
- Docker Compose orchestrates the containers:
  docker-compose -f ~/Auto-Generated-Blog/infra/docker-compose.yml down
  docker-compose -f ~/Auto-Generated-Blog/infra/docker-compose.yml up -d

- The application becomes available via the EC2 public IP (or attached domain).

## 4. AWS Infrastructure

| Component        | Purpose               | Notes                                              |
|-----------------|-----------------------|----------------------------------------------------|
| EC2             | Runs Docker containers| Ubuntu 24.04, Docker + Docker Compose installed   |
| ECR             | Stores Docker images  | Separate repositories for frontend and backend    |
| CodeBuild       | CI/CD                 | Pulls code, builds images, pushes to ECR, deploys |
| Secrets Manager | Stores EC2 SSH key    | Accessed by CodeBuild to connect securely         |
| Security Groups | Control access        | SSH temporarily open; HTTP/HTTPS for application  |

## 5. Security Considerations

- EC2 SSH key is stored securely in Secrets Manager and never hard-coded in the repo.
- CodeBuild service role includes permissions such as `SecretsManagerReadWrite`, `AmazonEC2ContainerRegistryPowerUser`, and `CloudWatchLogsFullAccess` to enable CI/CD while centralizing logs.
- Security groups should restrict SSH to known IP ranges; broader access can be used temporarily during setup but should be tightened later.
- Docker images remain private in ECR, and only the CI/CD role and EC2 instance have pull permissions.

## 6. BuildSpec Overview

The `infra/buildspec.yml` file defines the CI/CD pipeline:

version: 0.2

phases:
install:
commands:
- apt-get update -y
- apt-get install -y ssh jq
pre_build:
commands:
- aws secretsmanager get-secret-value --secret-id $SSH_KEY_SECRET_NAME --query SecretString --output text > ec2_keys.pem
- chmod 400 ec2_keys.pem
- aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
build:
commands:
- docker build -t $ECR_REPOSITORY_BACKEND ./backend
- docker build -t $ECR_REPOSITORY_FRONTEND ./frontend
post_build:
commands:
- docker tag $ECR_REPOSITORY_BACKEND ...
- docker push $ECR_REPOSITORY_BACKEND ...
- ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "docker-compose -f ~/Auto-Generated-Blog/infra/docker-compose.yml up -d"


Environment variables (like `AWS_ACCOUNT_ID`, `ECR_REPOSITORY_BACKEND`, `EC2_HOST`) are configured in the CodeBuild project.

## 7. Future Improvements

- Use Terraform (or another IaC tool) to provision EC2, ECR, CodeBuild, and Secrets Manager automatically.
- Tighten SSH access in security groups and consider using SSM Session Manager instead of direct SSH.
- Add HTTPS termination with NGINX + Certbot or an Application Load Balancer with ACM-managed certificates.
- Introduce blue/green or rolling deployments for safer, zero-downtime releases.
- Enable CloudWatch alarms and dashboards for health checks, error rates, and resource usage.

## 8. Notes

- Manual deployment from a local machine uses the same `docker-compose` commands as the automated CodeBuild deployment.
- The application is fully dockerized, so it can run locally with Docker Compose as well as on EC2.
- The CI/CD pipeline ensures each GitHub commit flows through build → push → deploy with minimal manual steps.
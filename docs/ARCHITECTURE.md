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

- Install needed CLI tools.
- Retrieve the EC2 SSH private key from AWS Secrets Manager.
- Authenticate to ECR.
- Build backend and frontend Docker images.
- Tag images for ECR.
- Push images to ECR.

### 3.3 EC2 Deployment

On successful build, CodeBuild connects to EC2 via AWS Systems Manager (SSM) and updates the running stack:

- EC2 pulls the latest images from ECR.
- Docker Compose orchestrates the containers using SSM commands:

  aws ssm send-command \
  --targets "Key=InstanceIds,Values=<EC2_INSTANCE_ID>" \
  --document-name "AWS-RunShellScript" \
  --comment "Updating Docker containers" \
  --parameters 'commands=[
  "cd ~/Auto-Generated-Blog/infra",
  "docker-compose down",
  "docker-compose up -d"
  ]' \
  --region <REGION>

- The application becomes available via the EC2 public IP (or attached domain).

## 4. AWS Infrastructure

| Component       | Purpose                | Notes                                                                      |
| --------------- | ---------------------- | -------------------------------------------------------------------------- |
| EC2             | Runs Docker containers | Ubuntu 24.04, Docker + Docker Compose installed, managed via **SSM**       |
| ECR             | Stores Docker images   | Separate repositories for frontend and backend                             |
| CodeBuild       | CI/CD                  | Pulls code, builds images, pushes to ECR, deploys via **SSM**              |
| Secrets Manager | Stores sensitive data  | Can store environment variables or other secrets; SSH key no longer needed |
| Security Groups | Control access         | HTTP/HTTPS open for application; SSH can remain closed since SSM is used   |

## 5. Security Considerations

- EC2 is managed via **AWS Systems Manager (SSM)**; no SSH keys are required, reducing exposure.
- CodeBuild service role includes permissions such as `AmazonSSMFullAccess`, `AmazonEC2ContainerRegistryPowerUser`, and `CloudWatchLogsFullAccess` to enable CI/CD while centralizing logs.
- Security groups should allow HTTP/HTTPS for the application; SSH can remain closed since SSM is used.
- Docker images remain private in ECR, and only the CI/CD role and EC2 instance have pull permissions.

## 6. BuildSpec Overview

The `infra/buildspec.yml` file defines the CI/CD pipeline:

version: 0.2

env:
variables:
AWS_DEFAULT_REGION: eu-west-3
ECR_REPOSITORY_BACKEND: tech-backend
ECR_REPOSITORY_FRONTEND: tech-frontend
EC2_INSTANCE_ID: i-0348c30d1346185d8
EC2_HOME: /home/ubuntu

phases:
install:
commands: - echo "Installing dependencies..." - apt-get update -y - apt-get install -y jq awscli

pre_build:
commands: - echo "Logging into ECR..." - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin 572692059120.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com

build:
commands: - echo "Building backend image..." - docker build -t $ECR_REPOSITORY_BACKEND ./backend - echo "Building frontend image..." - docker build -t $ECR_REPOSITORY_FRONTEND ./frontend

post_build:
commands: - echo "Tagging images..." - docker tag $ECR_REPOSITORY_BACKEND:latest 572692059120.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY_BACKEND:latest
      - docker tag $ECR_REPOSITORY_FRONTEND:latest 572692059120.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY_FRONTEND:latest

      - echo "Pushing to ECR..."
      - docker push 572692059120.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY_BACKEND:latest
      - docker push 572692059120.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY_FRONTEND:latest

      - echo "Deploying via SSM on EC2..."
      - |
        aws ssm send-command \
          --instance-ids "$EC2_INSTANCE_ID" \
          --document-name "AWS-RunShellScript" \
          --comment "Deploy Blog App" \
          --parameters 'commands=[
            "echo Logging into ECR...",
            "/usr/bin/aws ecr get-login-password --region $AWS_DEFAULT_REGION | sudo /usr/bin/docker login --username AWS --password-stdin 572692059120.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com",
            "echo Pulling latest images...",
            "sudo /usr/bin/docker pull 572692059120.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY_BACKEND:latest",
            "sudo /usr/bin/docker pull 572692059120.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY_FRONTEND:latest",
            "echo Restarting containers...",
            "cd /home/ubuntu/Auto-Generated-Blog/infra",
            "sudo /usr/bin/docker compose down || true",
            "sudo /usr/bin/docker compose up -d",
            "echo Deploy complete!"
          ]' \
          --timeout-seconds 900

artifacts:
files: - "\*_/_"

Environment variables (like `AWS_ACCOUNT_ID`, `ECR_REPOSITORY_BACKEND`, `EC2_HOST`) are configured in the CodeBuild project.

## 7. Future Improvements

- Use Terraform (or another IaC tool) to provision EC2, ECR, CodeBuild, and Secrets Manager automatically.
- Add HTTPS termination with NGINX + Certbot or an Application Load Balancer with ACM-managed certificates.
- Introduce blue/green or rolling deployments for safer, zero-downtime releases.
- Enable CloudWatch alarms and dashboards for health checks, error rates, and resource usage.

## 8. Notes

- Manual deployment from a local machine uses the same `docker-compose` commands as the automated CodeBuild deployment.
- The application is fully dockerized, so it can run locally with Docker Compose as well as on EC2.
- The CI/CD pipeline ensures each GitHub commit flows through build → push → deploy with minimal manual steps.

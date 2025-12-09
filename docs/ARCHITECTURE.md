ARCHITECTURE.md
Auto-Generated Blog – Deployment Architecture

1. Overview
This project is a full-stack blog application with a frontend and backend, both dockerized. The deployment uses AWS services and follows a CI/CD pipeline via GitHub → CodeBuild → ECR → EC2.

    Key AWS components:
        EC2 – hosts Docker containers for frontend and backend.
        ECR – stores Docker images.
        CodeBuild – builds Docker images from GitHub commits and pushes them to ECR.
        The deployment flow ensures that each commit triggers a rebuild and deploy of the application.

2. Folder Structure
.
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── aiClient.js
│   │   │   └── articleJob.js
│   │   └── models/
│   ├── package.json
│   ├── Dockerfile
│   
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   │   └── client.js
│   │   └── App.jsx
│   ├── package.json
│   ├── Dockerfile
│   
│
├── infra/
│   ├── buildspec.yml
│   ├── docker-compose.yml
│   └── scripts/
│       ├── deploy.sh
│       └── init-ec2.sh
│
├── docs/
│   └── ARCHITECTURE.md
│
└── README.md

3. Deployment Flow
    3.1 GitHub Commit
        Developer pushes code to the GitHub repository.

    3.2 AWS CodeBuild
        CodeBuild is triggered (via webhook).
        Build Steps:
            Install dependencies (ssh, jq, etc.)
            Retrieve EC2 SSH private key from AWS Secrets Manager.
            Authenticate with ECR.
            Build backend and frontend Docker images.
            Tag images for ECR.
            Push images to ECR.

    3.3 EC2 Deployment
        EC2 instance pulls the latest images from ECR.
        Docker Compose handles container orchestration:
        docker-compose -f ~/Auto-Generated-Blog/infra/docker-compose.yml down
        docker-compose -f ~/Auto-Generated-Blog/infra/docker-compose.yml up -d
        The application is available on the EC2 public IP.

4. AWS Infrastructure
Component	Purpose	Notes
EC2	Runs Docker containers	Ubuntu 24.04, Docker + Docker Compose installed
ECR	Stores Docker images	Separate repositories for frontend & backend
CodeBuild	CI/CD	Pulls code, builds images, pushes to ECR, triggers deploy via SSH
Secrets Manager	Stores EC2 SSH key	Used by CodeBuild to access EC2 securely
Security Groups	Control access	SSH temporarily open for deployment (recommend restricting later)
5. Security Considerations

EC2 SSH key stored in Secrets Manager.

CodeBuild role has SecretsManagerReadWrite, AmazonEC2ContainerRegistryPowerUser and CloudWatchLogsFullAccess.

Security groups should ideally restrict SSH access to your IP, though a wider range may be temporarily required during CI/CD deployment.

Docker images are stored privately in ECR.

6. BuildSpec Overview

The buildspec.yml in infra/ handles the CI/CD workflow:

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

7. Future Improvements

Use Terraform to provision EC2, ECR, CodeBuild and Secrets Manager automatically.

Restrict SSH access more strictly using security groups.

Enable HTTPS with NGINX + Certbot for production.

Implement blue/green deployment or rolling updates for safer deployments.

Enable CloudWatch alarms for monitoring.

8. Notes

Manual deploy works exactly the same as CodeBuild automated deploy.

Application is fully dockerized and portable.

CI/CD pipeline ensures any GitHub commit triggers build → push → deploy automatically..
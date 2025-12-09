#!/bin/bash
# Install updates and Docker
sudo apt update -y
sudo apt upgrade -y
sudo apt install docker.io git -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker
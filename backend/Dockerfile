# Use official Node.js 20 image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install 

# Copy all source code
COPY . .

# Expose the backend port
EXPOSE 3001

# Run Node directly (avoids npm wrapper)
CMD ["node", "src/index.js"]
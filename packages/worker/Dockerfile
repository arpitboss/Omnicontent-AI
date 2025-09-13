# packages/worker/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Install system dependencies required for video processing
# RUN is a Docker command to execute commands in the container
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp using pip
RUN pip3 install yt-dlp

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build TypeScript code
RUN npm install -g typescript
RUN tsc

# Your app binds to port 8080 so you'd use this syntax
# For a worker, we don't need to expose a port, we just run the command.

# Define the command to run your app
CMD [ "node", "dist/index.js" ]
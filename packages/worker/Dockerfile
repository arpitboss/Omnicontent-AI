FROM node:18-bookworm-slim

# Install system dependencies required for video processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp using pip (break-system-packages required in Bookworm)
RUN pip3 install yt-dlp --break-system-packages

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Start the worker
CMD [ "npm", "start" ]
FROM node:18-bookworm-slim

# Install system dependencies required for video processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp and its mandatory bypass scripts (curl_cffi, brotli, websockets) for n-sig challenges
RUN pip3 install -U "yt-dlp[default]" --break-system-packages

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Start the worker
CMD [ "npm", "start" ]
FROM node:20-bookworm-slim

# Install system dependencies required for video processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp with the [default] extras which includes the yt-dlp-ejs challenge solver scripts.
# The ejs scripts are REQUIRED to solve YouTube's n-sig JS challenge.
RUN pip3 install -U "yt-dlp[default]" --break-system-packages

# Verify yt-dlp and ejs scripts are installed correctly
RUN yt-dlp --version && python3 -c "import yt_dlp_ejs; print('yt-dlp-ejs installed:', yt_dlp_ejs.__version__)" || echo "yt-dlp-ejs package check done"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Start the worker
CMD [ "npm", "start" ]
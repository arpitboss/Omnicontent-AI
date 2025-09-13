#  OmniContent AI ✨

<p align="center">
  <img src="https://img.shields.io/badge/status-in%20development-orange" alt="Status" />
  <img src="https://img.shields.io/badge/React-Next.js-blue?logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/Backend-Node.js-green?logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-purple?logo=google" alt="Google Gemini" />
</p>

**OmniContent AI** is a powerful, AI-driven SaaS platform that automates the entire content repurposing workflow. Upload a single long-form video or audio file, and instantly generate a complete suite of ready-to-publish assets tailored for blogs, LinkedIn, Twitter, and short-form video platforms like Instagram and YouTube Shorts.

**Upload Once, Publish Everywhere.**

---

## 🎥 Demo

*[Uploading soon...]*

---

## 🔥 Key Features

* **🤖 AI-Powered Content Generation:** Leverages the Google Gemini API to generate high-quality summaries, articles, transcripts, and social media posts.
* **🎬 Automated Video Clipping:** Intelligently identifies "viral moments" and programmatically generates short-form video clips.
* **✍️ Stylized Captions:** Automatically burns in word-level, animated captions onto video clips for maximum engagement.
* **🖼️ On-Demand Aspect Ratios:** Reformat video clips to portrait (9:16), square (1:1), or other formats on the fly.
* **🌐 Multi-Language Translation:** Translate any generated text into a different language with a single click.
* **📁 Direct File & URL Upload:** Supports both direct video/audio file uploads and YouTube URLs.
* **⚡ Real-Time Experience:** Features a live "typewriter" text effect and real-time notifications for completed jobs using WebSockets.
* **🔒 Secure Authentication:** User accounts and authentication are managed by Clerk.
* **📤 One-Click Publishing:** Directly publish to respective social media platforms with one-click publish.
* **✨ Tiered Features:** Built with a Free vs. Premium plan structure, including watermarks and feature limits.

---

## 🛠️ Tech Stack

| Category      | Technology                                                                                                  |
| :------------ | :---------------------------------------------------------------------------------------------------------- |
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, Shadcn/UI, SWR, Socket.IO Client                                   |
| **Backend** | Node.js, Express.js, TypeScript, Clerk, Mongoose, Socket.IO, RabbitMQ, Multer, Archiver                      |
| **AI** | Google Gemini API (1.5 Pro & Flash), Vercel AI SDK                                                          |
| **Database** | MongoDB                                                                                                     |
| **Tooling** | FFmpeg, yt-dlp, Docker                                                                  |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* **Node.js** (v18 or later)
* **Docker** and **Docker Compose** (for running MongoDB and RabbitMQ)

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/arpitboss/Omnicontent-ai.git](https://github.com/arpitboss/Omnicontent-ai.git)
    cd omnicontent-ai
    ```

2.  **Install dependencies:**
    Install all dependencies from the respective directories.
    ```bash
    npm install
    ```

3.  **Set up services with Docker:**
    Make sure Docker is running, then start the required services.
    ```bash
    docker run -d --name my-mongo -p 27017:27017 mongo
    docker run -d --name my-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management
    ```

4.  **Configure Environment Variables:**
    You will need to create `.env` files for the `frontend`, `backend`, and `worker` packages. Copy the contents of the `.env.example` files (if provided) and fill in your own keys.

    * **`packages/frontend/.env.local`:**
        ```
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
        CLERK_SECRET_KEY=sk_test_...
        ```

    * **`packages/backend/.env`:**
        ```
        MONGO_URI=mongodb://localhost:27017/omnicontent
        CLERK_SECRET_KEY=sk_test_...
        GEMINI_API_KEY=your_google_ai_api_key
        ```

    * **`packages/worker/.env`:**
        ```
        MONGO_URI=mongodb://localhost:27017/omnicontent
        CLERK_SECRET_KEY=sk_test_...
        GEMINI_API_KEY=your_google_ai_api_key
        ```

5.  **Run the Application:**
    You will need to run each service in a separate terminal.

    * **Terminal 1: Start the Frontend**
        ```bash
        npm run dev --workspace=frontend
        ```
        (App will be available at `http://localhost:3000`)

    * **Terminal 2: Start the Backend**
        ```bash
        npm run dev --workspace=backend
        ```
        (API will be available at `http://localhost:8080`)

    * **Terminal 3: Start the Worker**
        ```bash
        npm run dev --workspace=worker
        ```
        (The worker will connect and listen for jobs)

---

## 📜 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

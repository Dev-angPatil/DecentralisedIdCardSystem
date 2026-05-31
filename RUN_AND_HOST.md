# ChainCampus — Local Execution & Cloud Hosting Guide

This guide provides instructions on how to run ChainCampus locally and deploy/host the application in a cloud environment.

---

## 💻 1. Local Execution (How to Run)

ChainCampus can be executed locally in two different modes depending on your workflow.

### Option A: Fully Persistent SQLite Server (Recommended for Demos)
This mode compiles the React assets into highly optimized static production bundles and uses the multi-threaded Python backend (`server.py`) to serve the UI and persist all user accounts, transactions, and courses.

1. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```
2. **Build the Production Bundle**:
   ```bash
   npm run build
   ```
3. **Run the SQLite Database Backend & Web Server**:
   ```bash
   cd ..
   python server.py
   ```
   *Note: If python dependencies are missing, run `pip install -r requirements.txt` first.*
4. **Access the Application**:
   Open [http://localhost:8000](http://localhost:8000) in your browser.

---

### Option B: Frontend Hot-Reload Development Mode (For Visual Tweaks)
If you are only editing UI components, styles, or page margins, Vite’s hot-reload server provides immediate live updates.

1. **Launch the Vite Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```
2. **Access the Development Workspace**:
   Open the port shown in your terminal (typically `http://localhost:5173`).
3. **Note on API Requests**:
   In this mode, backend database calls (like registration or database updates) require the python server (`python server.py`) to be running simultaneously in a separate terminal. Vite automatically proxies `/api/*` endpoints to port `8000`.

---

## 🌐 2. Cloud Deployment (How to Host)

Because the project includes both a **Python API Backend** and a **React Frontend**, it requires a hosting service that can compile React assets and execute a persistent Python process.

### Option A: Host on Render (Recommended & Pre-configured)
Render is the ideal choice for this architecture, and the codebase already includes a dynamic `render.yaml` configuration file ready for zero-config deployments.

#### Method 1: Blueprint Deployment (Fastest)
1. Push your updated code to your GitHub repository.
2. Sign in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top right and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically read the `render.yaml` file from your repo and provision:
   - A **Web Service** running Python.
   - Build routines (`pip install -r requirements.txt && cd frontend && npm install && npm run build`).
   - The startup command (`python server.py`).
6. Click **Approve** to build and launch your application instantly.

#### Method 2: Manual Web Service Setup
If you prefer configuring it manually on Render:
1. Click **New +** on the Render Dashboard and choose **Web Service**.
2. Connect your GitHub repository.
3. Configure the following parameters:
   - **Name**: `chaincampus`
   - **Language**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && cd frontend && npm install && npm run build`
   - **Start Command**: `python server.py`
4. Under **Advanced Settings**, add the following Environment Variable:
   - **PORT**: `8000` (or leave blank; Render will auto-assign a port).
5. Click **Create Web Service**.

---

### Option B: Deploying on VPS (Ubuntu/Debian Server)
For self-hosting on virtual private servers (AWS EC2, DigitalOcean, Linode):

1. **Clone the Repository**:
   ```bash
   git clone <your-repo-url> /var/www/chaincampus
   cd /var/www/chaincampus
   ```
2. **Install Node.js, NPM, and Python**:
   ```bash
   sudo apt update
   sudo apt install nodejs npm python3 python3-pip python3-venv -y
   ```
3. **Setup and Build Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
4. **Setup Python Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
5. **Configure Systemd Service**:
   Create a daemon service file so the app runs in the background and restarts on crashes:
   ```bash
   sudo nano /etc/systemd/system/chaincampus.service
   ```
   Add the following configuration:
   ```ini
   [Unit]
   Description=ChainCampus Python sqlite API backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/chaincampus
   ExecStart=/var/www/chaincampus/venv/bin/python server.py
   Restart=always
   Environment=PORT=8000

   [Install]
   WantedBy=multi-user.target
   ```
   Start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable chaincampus
   sudo systemctl start chaincampus
   ```
6. **Expose Ports with Nginx Reverse Proxy**:
   Configure Nginx to map standard web port `80` to port `8000`:
   ```bash
   sudo apt install nginx -y
   sudo nano /etc/nginx/sites-available/default
   ```
   Modify the configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
   Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

---

## 🗄️ 3. Database State & Persistence in the Cloud

### The SQLite Ephemeral Disk Limitation (Render Free Tier)
Render's free tier Web Services utilize **ephemeral disks**. This means every time the web service restarts or goes idle (which happens on the free tier after 15 minutes of inactivity), the local SQLite database file `data/chaincampus.db` will be wiped and seeded back to defaults.

#### Solution A: Attach a Persistent Disk
If using Render's Paid Tier, you can attach a **Persistent Disk** (size `1GB` is more than enough) and point the DB directory to it.
In your Render Dashboard:
1. Go to the Web Service settings -> **Disks** -> **Add Disk**.
2. Mount Path: `/var/data`
3. Add the following Environment Variable to your service:
   - **DB_DIR**: `/var/data`

#### Solution B: Scale up to a PostgreSQL Database (Recommended for Production)
The backend `server.py` is pre-engineered to automatically scale from SQLite to PostgreSQL if it detects a PostgreSQL URI!

1. Create a **PostgreSQL Database** on Render (Render offers a free tier Postgres service).
2. Copy the **External Database URL** (which looks like `postgresql://user:pass@host/db`).
3. Add the database URL as an environment variable to your ChainCampus Web Service:
   - **DATABASE_URL**: `postgresql://...`
4. **Zero-Configuration Migration**: When the python server boots, it will automatically connect to PostgreSQL, create all relational schemas, migrate SQLite schemas, seed initial admin profiles and default courses, and maintain permanent persistence that never wipes on idle timeouts!

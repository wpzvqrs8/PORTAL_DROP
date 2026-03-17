# Deployment Guide

This project is now fully configured to be deployed as a unified Full-Stack application. The backend (Express) is set up to automatically serve the built frontend (React/Vite).

## Recommended Hosting: Render.com (Free Tier Available)

Follow these simple steps to deploy your application to Render:

### 1. Push to GitHub
If you haven't already, push your code to a GitHub, GitLab, or Bitbucket repository.

### 2. Set Up a New Web Service on Render
1. Create an account on [Render.com](https://render.com) and click **"New +" -> "Web Service"**.
2. Connect your GitHub repository.
3. Configure the service with the following settings:
   - **Name**: `portal-drop` (or any name you prefer)
   - **Region**: Select the region closest to your users
   - **Branch**: `main`
   - **Root Directory**: `.` (leave empty or just keep the project root)
   - **Environment**: `Node`
   - **Build Command**: `cd client && npm install && npm run build && cd ../server && npm install`
   - **Start Command**: `cd server && npm start`

### 3. Setup Environment Variables
Scroll down to the **Environment Variables** section on Render and add your Supabase credentials:
- **`SUPABASE_URL`**: `your_supabase_project_url` (from Supabase Dashboard -> Settings -> API)
- **`SUPABASE_KEY`**: `your_supabase_service_role_or_anon_key` (from Supabase Dashboard -> Settings -> API)

### 4. Deploy
Click **"Create Web Service"**. Render will automatically:
1. Install client dependencies.
2. Build the production React App into `client/dist`.
3. Install backend dependencies.
4. Start the Express server which serves both your API and the React frontend on the same port.

## How it works now
1. **Frontend**: Vite proxies and hardcoded localhost values have been replaced. It now intelligently connects to `window.location.origin` in production!
2. **Backend**: Express handles static files from `../client/dist`. Any unknown routes fall back to serving `index.html` allowing React Router to handle page routes flawlessly!

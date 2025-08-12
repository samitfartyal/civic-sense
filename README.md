# Civic Sense - Render Deployment Guide

## Overview
This is a Node.js Express server for the Civic Sense application with features including:
- User management
- Posts and reels management
- Reports with image uploads
- AI-powered news summarization
- JWT authentication

## Environment Variables Required
Set these in your Render dashboard:

- `OPENAI_API_KEY`: Your OpenAI API key
- `NEWS_API_KEY`: Your NewsAPI.org key
- `JWT_SECRET`: A secure JWT secret key
- `NODE_ENV`: Set to "production"

## Deployment Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit for Civic Sense deployment"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy to Render
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Name**: civic-sense
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free (or paid for better performance)

### 3. Configure Environment Variables
In Render dashboard, go to your service settings and add:
- OPENAI_API_KEY
- NEWS_API_KEY
- JWT_SECRET
- NODE_ENV=production

### 4. Deploy
Click "Deploy" and wait for deployment to complete. Your app will be available at `https://civic-sense.onrender.com`.

## Local Development
```bash
npm install
npm start
```

## API Endpoints
- GET `/posts` - Get all posts
- POST `/posts` - Create a new post
- GET `/reels` - Get all reels
- POST `/reels` - Create a new reel
- POST `/reports` - Submit a report
- GET `/api/news` - Get AI-summarized news
- POST `/submit-form` - User registration

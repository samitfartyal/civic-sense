# Civic Sense - Civic Issues Platform

A modern web application for reporting and tracking civic issues in your community.

## Features

- **Dashboard** - Hero section, impact stats, issues feed, map preview
- **Report Issues** - Report potholes, garbage, broken lights, etc.
- **Posts** - Share community updates with images
- **Media** - Upload videos and photos
- **News** - AI-powered news with search functionality
- **Dark Mode** - Toggle between light and dark themes

## Pages

| Page | URL |
|------|-----|
| Dashboard | `/dashboard.html` |
| Report Issue | `/report.html` |
| Posts | `/posts.html` |
| Media | `/reels.html` |
| News | `/news.html` |

## Deployment Options

### Option 1: Deploy to Render (Recommended - Free)

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `samitfartyal/civic-sense`
4. Configure:
   - **Name**: civic-sense
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

5. Add Environment Variables:
   ```
   OPENAI_API_KEY=your_openai_key
   NEWS_API_KEY=your_news_api_key
   JWT_SECRET=any_random_string_here
   NODE_ENV=production
   ```

6. Click "Deploy" → Your app will be at `https://civic-sense.onrender.com`

### Option 2: Deploy to Railway (Free tier available)

1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub"
3. Select your repository
4. Add environment variables (same as above)
5. Deploy automatically

### Option 3: Deploy to Vercel (Free)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables
4. Deploy

## Local Development

```bash
# Clone the repository
git clone https://github.com/samitfartyal/civic-sense.git
cd civic-sense

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Start the server
npm start
```

Open http://localhost:3000/dashboard.html

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `NEWS_API_KEY` | NewsAPI.org key for news | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | Get all posts |
| POST | `/posts` | Create new post |
| GET | `/reels` | Get all media |
| POST | `/reels` | Upload media |
| POST | `/reports` | Submit report |
| GET | `/api/news` | Get news articles |
| GET | `/api/news/trending` | Get trending news |
| GET | `/api/search?q=` | Search news |
| POST | `/api/chat` | AI chatbot |

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript
- **APIs**: NewsAPI, OpenAI
- **Storage**: JSON files (can be upgraded to database)

## License

MIT

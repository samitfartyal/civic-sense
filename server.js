const dotenv = require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
  
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;


//  Setup Uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Multer for /reports: max 10 files, 5MB each, only images
const reportsUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//  Serve static files and uploaded images
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadDir));

// Explicit routes to serve posts.html and reel.html
app.get('/posts.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'posts.html'));
});

app.get('/reels.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'reels.html'));
});

/* ==================== USER FORM HANDLING ==================== */
const dataFilePath = path.join(__dirname, 'users.json');

function readUserData() {
  try {
    if (!fs.existsSync(dataFilePath)) fs.writeFileSync(dataFilePath, JSON.stringify([]));
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading user data:', err);
    return [];
  }
}
function writeUserData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing user data:', err);
  }
}

app.post('/submit-form', (req, res) => {
  const { name, email, pincode, phone, gender } = req.body;
  if (!name || !email || !pincode || !phone || !gender) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const users = readUserData();
  const user = { name, email, pincode, phone, gender, submittedAt: new Date() };
  users.push(user);
  writeUserData(users);
  console.log('User data received and stored:', user);
  res.json({ message: 'Form submitted successfully', user });
});

/* ==================== POSTS HANDLING ==================== */
const postsFilePath = path.join(__dirname, 'posts.json');

function readPostsData() {
  try {
    if (!fs.existsSync(postsFilePath)) fs.writeFileSync(postsFilePath, JSON.stringify([]));
    const data = fs.readFileSync(postsFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading posts data:', err);
    return [];
  }
}

function writePostsData(data) {
  try {
    fs.writeFileSync(postsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing posts data:', err);
  }
}

app.get('/posts', (req, res) => {
  const posts = readPostsData();
  res.json(posts);
});

app.post('/posts', upload.single('image'), (req, res) => {
  const { title, excerpt, author, date } = req.body;
  if (!title || !excerpt || !author || !date) {
    return res.status(400).json({ error: 'All post fields are required' });
  }
  const posts = readPostsData();
  const newPost = { 
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,    title, 
    excerpt, 
    author, 
    date,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    likes: 0,
    likedBy: []
  };
  posts.push(newPost);
  writePostsData(posts);
  console.log('New post added:', newPost);
  res.json({ message: 'Post added successfully', post: newPost });
});


// --- JWT Authentication and Rate Limiting Middleware ---
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Set it securely in production.');
  process.exit(1);
}

// Validate other critical environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'NEWS_API_KEY'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`WARNING: ${envVar} environment variable is not set. Some features may not work.`);
  }
});

// Rate limiting middleware (100 requests per 15 min per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// JWT authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Sanitize userId (allow only alphanumeric, email, or phone)
    let userId = payload.userId;
    if (typeof userId !== 'string' || !/^[\w@.\-+]+$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid userId in token' });
    }
    req.userId = userId;
    // Optionally, attach session info if using sessions
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Validate userId exists in users.json
function validateUserId(userId) {
  try {
    const users = readUserData();
    return users.some(u => u.email === userId || u.phone === userId || u.name === userId);
  } catch {
    return false;
  }
}

// Simple file lock using a lock file (not perfect, but helps for local dev)
function acquireLock(lockPath, timeout = 5000, staleMs = 10000) {
  const start = Date.now();
  while (true) {
    try {
      // Try to create the lock file exclusively
      const fd = fs.openSync(lockPath, 'wx');
      fs.writeSync(fd, String(Date.now()));
      fs.closeSync(fd);
      return;
    } catch (err) {
      // If file exists, check if it's stale
      if (err.code === 'EEXIST') {
        try {
          const stat = fs.statSync(lockPath);
          const mtime = stat.mtimeMs;
          if (Date.now() - mtime > staleMs) {
            // Stale lock, remove it
            fs.unlinkSync(lockPath);
            continue;
          }
        } catch (e) {
          // Ignore stat errors, just retry
        }
        if (Date.now() - start > timeout) throw new Error('Lock timeout');
        // Wait 100ms before retrying
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
      } else {
        throw err;
      }
    }
  }
}
function releaseLock(lockPath) {
  try {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  } catch (e) {
    // Ignore errors
  }
}

app.put('/posts/:id/like', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  // Validate userId
  if (!validateUserId(userId)) {
    return res.status(403).json({ error: 'Invalid or unauthorized userId' });
  }

  const lockPath = path.join(__dirname, 'posts.json.lock');
  let locked = false;
  try {
    acquireLock(lockPath);
    locked = true;
    const posts = readPostsData();
    const postIndex = posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const post = posts[postIndex];
    if (!post.likedBy) post.likedBy = [];
    const userLikedIndex = post.likedBy.indexOf(userId);
    if (userLikedIndex === -1) {
      post.likes += 1;
      post.likedBy.push(userId);
    } else {
      post.likes -= 1;
      post.likedBy.splice(userLikedIndex, 1);
    }
    writePostsData(posts);
    res.json({
      message: userLikedIndex === -1 ? 'Post liked' : 'Post unliked',
      likes: post.likes,
      liked: userLikedIndex === -1
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not process like/unlike. Try again.' });
  } finally {
    if (locked) releaseLock(lockPath);
  }
});

// Get like status for a post
app.get('/posts/:id/like-status', (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  
  const posts = readPostsData();
  const post = posts.find(post => post.id === id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const liked = post.likedBy && post.likedBy.includes(userId);
  
  res.json({ likes: post.likes || 0, liked });
});

/* ==================== REELS HANDLING ==================== */
const reelsFilePath = path.join(__dirname, 'reels.json');

function readReelsData() {
  try {
    if (!fs.existsSync(reelsFilePath)) fs.writeFileSync(reelsFilePath, JSON.stringify([]));
    const data = fs.readFileSync(reelsFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading reels data:', err);
    return [];
  }
}

function writeReelsData(data) {
  try {
    fs.writeFileSync(reelsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing reels data:', err);
  }
}

app.get('/reels', (req, res) => {
  const reels = readReelsData();
  res.json(reels);
});

app.post('/reels', upload.single('video'), (req, res) => {
  const { title, author, date, description } = req.body;
  if (!title || !author || !date || !description) {
    return res.status(400).json({ error: 'All reel fields are required' });
  }
  const reels = readReelsData();
  const newReel = { 
    title, 
    author, 
    date, 
    description,
    videoUrl: req.file ? `/uploads/${req.file.filename}` : null
  };
  reels.push(newReel);
  writeReelsData(reels);
  console.log('New reel added:', newReel);
  res.json({ message: 'Reel added successfully', reel: newReel });
});

/* ==================== REPORT HANDLING WITH PHOTOS ==================== */
const reportsFilePath = path.join(__dirname, 'reports.json');

function readReportsData() {
  try {
    if (!fs.existsSync(reportsFilePath)) fs.writeFileSync(reportsFilePath, JSON.stringify([]));
    const data = fs.readFileSync(reportsFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading reports data:', err);
    return [];
  }
}

function writeReportsData(data) {
  try {
    fs.writeFileSync(reportsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing reports data:', err);
  }
}

const commentsFilePath = path.join(__dirname, 'comments.json');

async function readCommentsData() {
  try {
    if (!fs.existsSync(commentsFilePath)) {
      await fs.promises.writeFile(commentsFilePath, JSON.stringify([]));
    }
    const data = await fs.promises.readFile(commentsFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading comments data:', err);
    return [];
  }
}

async function writeCommentsData(data) {
  try {
    await fs.promises.writeFile(commentsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing comments data:', err);
  }
}

app.post('/reports', reportsUpload.array('photos', 10), (req, res) => {
  const { title, description, contactName, contactEmail } = req.body;
  if (!title || !description || !contactName || !contactEmail) {
    return res.status(400).json({ error: 'All report fields are required' });
  }

  const reports = readReportsData();
  const newReport = {
    id: Date.now().toString(),
    title,
    description,
    contactName,
    contactEmail,
    photos: req.files ? req.files.map(file => `/uploads/${file.filename}`) : [],
    submittedAt: new Date()
  };

  reports.push(newReport);
  writeReportsData(reports);

  console.log('New report received:', newReport);
  res.json({ message: 'Report submitted successfully', report: newReport });
});

const sharesFilePath = path.join(__dirname, 'shares.json');

function readSharesData() {
  try {
    if (!fs.existsSync(sharesFilePath)) fs.writeFileSync(sharesFilePath, JSON.stringify([]));
    const data = fs.readFileSync(sharesFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading shares data:', err);
    return [];
  }
}

function writeSharesData(data) {
  try {
    fs.writeFileSync(sharesFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing shares data:', err);
  }
}

// Get share count for a specific post/reel
app.get('/shares/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const shares = readSharesData();
  const filteredShares = shares.filter(share => 
    share.contentType === type && share.contentId === id
  );
  res.json({ count: filteredShares.length, shares: filteredShares });
});

// Record a new share
app.post('/shares', (req, res) => {
  const { userId, contentType, contentId, platform } = req.body;
  
  if (!userId || !contentType || !contentId || !platform) {
    return res.status(400).json({ error: 'All share fields are required' });
  }

  const shares = readSharesData();
  const newShare = {
    id: Date.now().toString(),
    userId,
    contentType,
    contentId,
    platform,
    timestamp: new Date()
  };

  shares.push(newShare);
  writeSharesData(shares);

  console.log('New share recorded:', newShare);
  res.json({ message: 'Share recorded successfully', share: newShare });
});

/* ==================== NEWS API HANDLING ==================== */
const newsFilePath = path.join(__dirname, 'news.json');

function readNewsData() {
  try {
    if (!fs.existsSync(newsFilePath)) fs.writeFileSync(newsFilePath, JSON.stringify([]));
    const data = fs.readFileSync(newsFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading news data:', err);
    return [];
  }
}

function writeNewsData(data) {
  try {
    fs.writeFileSync(newsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing news data:', err);
  }
}


// News endpoints with filtering support
app.get('/api/news', async (req, res) => {
  try {
    // Set cache control headers to prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { scope, category, sort, page, interests } = req.query;
    
    let news = await fetchNewsFromAPI();
    
    // Filter by category
    if (category && category !== 'all') {
      news = news.filter(article => {
        const text = (article.title + ' ' + article.description).toLowerCase();
        const categoryKeywords = {
          technology: ['tech', 'ai', 'software', 'app', 'digital', 'cyber', 'data', 'startup', 'google', 'apple', 'microsoft'],
          politics: ['government', 'election', 'minister', 'policy', 'parliament', 'political', 'bjp', 'congress'],
          business: ['market', 'economy', 'stock', 'company', 'trade', 'finance', 'investment', 'rupee', 'gdp'],
          sports: ['match', 'game', 'team', 'player', 'league', 'championship', 'score', 'cricket', 'ipl', 'football'],
          entertainment: ['movie', 'music', 'celebrity', 'film', 'actor', 'show', 'concert', 'bollywood'],
          science: ['research', 'study', 'discovery', 'scientist', 'space', 'climate', 'health', 'isro']
        };
        const keywords = categoryKeywords[category] || [];
        return keywords.some(kw => text.includes(kw));
      });
    }
    
    // Filter by scope (local = India specific, national = India, global = worldwide)
    if (scope === 'local') {
      news = news.filter(article => {
        const text = (article.title + ' ' + article.description).toLowerCase();
        return text.includes('india') || text.includes('mumbai') || text.includes('delhi') || 
               text.includes('bangalore') || text.includes('chennai') || text.includes('kolkata');
      });
    }
    
    // Sort articles
    if (sort === 'popular') {
      news.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'relevant' && interests) {
      const interestList = interests.split(',');
      news.sort((a, b) => {
        const aText = (a.title + ' ' + a.description).toLowerCase();
        const bText = (b.title + ' ' + b.description).toLowerCase();
        const aScore = interestList.reduce((score, interest) => 
          score + (aText.includes(interest.toLowerCase()) ? 1 : 0), 0);
        const bScore = interestList.reduce((score, interest) => 
          score + (bText.includes(interest.toLowerCase()) ? 1 : 0), 0);
        return bScore - aScore;
      });
    } else {
      // Latest first
      news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    
    // Add random engagement metrics
    news = news.map(article => ({
      ...article,
      likes: article.likes || Math.floor(Math.random() * 500),
      comments: article.comments || Math.floor(Math.random() * 100),
      views: article.views || Math.floor(Math.random() * 10000),
      category: detectArticleCategory(article)
    }));
    
    // Paginate
    const pageSize = 12;
    const pageNum = parseInt(page) || 1;
    const start = (pageNum - 1) * pageSize;
    const paginatedNews = news.slice(start, start + pageSize);
    
    res.json(paginatedNews);
  } catch (error) {
    console.error('Error serving news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Trending news endpoint
app.get('/api/news/trending', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    let news = await fetchNewsFromAPI();
    
    // Sort by engagement (views, likes)
    news = news.map(article => ({
      ...article,
      likes: article.likes || Math.floor(Math.random() * 500),
      views: article.views || Math.floor(Math.random() * 10000)
    }));
    
    news.sort((a, b) => (b.views + b.likes * 10) - (a.views + a.likes * 10));
    
    res.json(news.slice(0, 10));
  } catch (error) {
    console.error('Error serving trending news:', error);
    res.status(500).json({ error: 'Failed to fetch trending news' });
  }
});

// Breaking news endpoint
app.get('/api/news/breaking', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    let news = await fetchNewsFromAPI();
    
    // Get most recent news (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const breaking = news.filter(article => {
      const pubDate = new Date(article.publishedAt);
      return pubDate > twoHoursAgo;
    }).slice(0, 3);
    
    res.json(breaking.length > 0 ? breaking : news.slice(0, 1));
  } catch (error) {
    console.error('Error serving breaking news:', error);
    res.status(500).json({ error: 'Failed to fetch breaking news' });
  }
});

// Search suggestions endpoint - fetch live from News API
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const query = q.toLowerCase();
    const suggestions = [];
    
    // Fetch live suggestions from News API
    const apiKey = process.env.NEWS_API_KEY;
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=relevancy&pageSize=10&apiKey=${apiKey}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.articles) {
        // Extract unique topics from titles
        const topics = new Set();
        data.articles.forEach(article => {
          const words = article.title.split(/\s+/);
          words.forEach(word => {
            const cleanWord = word.replace(/[^a-zA-Z]/g, '');
            if (cleanWord.toLowerCase().includes(query) && cleanWord.length > 3) {
              topics.add(cleanWord);
            }
          });
        });
        Array.from(topics).slice(0, 4).forEach(topic => {
          suggestions.push({ text: topic, type: 'topic' });
        });
        
        // Extract unique sources
        const sources = new Set();
        data.articles.forEach(article => {
          if (article.source?.name) {
            sources.add(article.source.name);
          }
        });
        Array.from(sources).slice(0, 2).forEach(source => {
          suggestions.push({ text: source, type: 'source' });
        });
      }
    }
    
    // Add location suggestions
    const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 
                      'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'India', 'USA', 'UK', 'China'];
    locations.filter(loc => loc.toLowerCase().includes(query))
      .slice(0, 2)
      .forEach(loc => {
        suggestions.push({ text: loc, type: 'location' });
      });
    
    // Add category suggestions
    const categories = ['Technology', 'Politics', 'Business', 'Sports', 'Entertainment', 'Science'];
    categories.filter(cat => cat.toLowerCase().includes(query))
      .slice(0, 2)
      .forEach(cat => {
        suggestions.push({ text: cat, type: 'category' });
      });
    
    res.json(suggestions.slice(0, 8));
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.json([]);
  }
});

// Search endpoint - fetch live results from News API
app.get('/api/search', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    
    const apiKey = process.env.NEWS_API_KEY;
    
    // Search News API directly with the query
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from News API');
    }
    
    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      return res.json([]);
    }
    
    // Format and return results
    const results = data.articles.map(article => ({
      ...article,
      description: article.description || article.content || article.title,
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 100),
      views: Math.floor(Math.random() * 10000),
      category: detectArticleCategory(article)
    }));
    
    res.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get current news context
    const news = await fetchNewsFromAPI();
    const newsContext = news.slice(0, 5).map(a => `- ${a.title}: ${a.description}`).join('\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: `You are a helpful news assistant for Civic Sense. You can summarize news, answer questions about current events, and help users find relevant news.

Current news context:
${newsContext}

Provide helpful, concise responses. If asked to summarize an article, provide key points in bullet form.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 500
    });
    
    res.json({ response: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ response: "I'm sorry, I'm having trouble processing your request right now. Please try again later." });
  }
});

// Helper function to detect article category
function detectArticleCategory(article) {
  const text = (article.title + ' ' + article.description).toLowerCase();
  const categories = {
    technology: ['tech', 'ai', 'software', 'app', 'digital', 'cyber', 'data', 'startup', 'google', 'apple', 'microsoft'],
    politics: ['government', 'election', 'minister', 'policy', 'parliament', 'political', 'bjp', 'congress'],
    business: ['market', 'economy', 'stock', 'company', 'trade', 'finance', 'investment', 'rupee', 'gdp'],
    sports: ['match', 'game', 'team', 'player', 'league', 'championship', 'score', 'cricket', 'ipl', 'football'],
    entertainment: ['movie', 'music', 'celebrity', 'film', 'actor', 'show', 'concert', 'bollywood'],
    science: ['research', 'study', 'discovery', 'scientist', 'space', 'climate', 'health', 'isro']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => text.includes(kw))) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  return 'General';
}

app.post('/api/news/local', (req, res) => {
  const { title, description, url, imageUrl } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const news = readNewsData();
  const newArticle = {
    id: Date.now(),
    title,
    description,
    url: url || "#",
    urlToImage: imageUrl || "https://via.placeholder.com/300x200?text=News",
    publishedAt: new Date().toISOString(),
    source: { name: "Local Contributor" }
  };

  news.unshift(newArticle);
  writeNewsData(news);
  res.json({ message: 'News added successfully', article: newArticle });
});


// === AI-Powered News Handling ===
async function summarizeWithAI(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a news summarizer.' },
        { role: 'user', content: `Summarize this news article:\n\n${text}` },
      ],
      max_tokens: 200,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('Error summarizing with AI:', err);
    return text;
  }
}

async function fetchNewsFromAPI() {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    
    // Try NewsAPI.org with everything endpoint for better India coverage
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=India&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`
    );

    if (!response.ok) throw new Error('Failed to fetch external news');

    const data = await response.json();
    
    // If no articles returned from API, fall back to local news
    if (!data.articles || data.articles.length === 0) {
      console.log('No articles from News API, using local news');
      return readNewsData();
    }
    
    // Return articles directly without AI summarization for faster loading
    return data.articles.slice(0, 15).map(article => ({
      ...article,
      description: article.description || article.content || article.title,
    }));
  } catch (error) {
    console.error('Using fallback local news:', error);
    return readNewsData();
  }
}

// Fetch area-specific news
async function fetchAreaSpecificNews(area) {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    
    // Search for news specific to the area
    const response = await fetch(
      `https://newsapi.org/v2/everything?q="${area}" India&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
    );

    if (!response.ok) throw new Error('Failed to fetch area-specific news');

    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      console.log(`No articles found for area: ${area}`);
      return [];
    }
    
    return data.articles.map(article => ({
      ...article,
      description: article.description || article.content || article.title,
    }));
  } catch (error) {
    console.error('Error fetching area-specific news:', error);
    return [];
  }
}

// AI News API endpoint
app.get('/api/news/ai', async (req, res) => {
  try {
    const news = await fetchNewsFromAPI();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI-powered news' });
  }
});

/* ==================== START SERVER ==================== */
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
const express = require('express');
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

// --- Authentication and Locking for Like/Unlike a post ---
// Dummy authentication middleware (replace with real one as needed)
function authenticate(req, res, next) {
  // Example: userId is sent in req.header('x-user-id')
  const userId = req.header('x-user-id');
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId;
  next();
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
function acquireLock(lockPath, timeout = 5000) {
  const start = Date.now();
  while (fs.existsSync(lockPath)) {
    if (Date.now() - start > timeout) throw new Error('Lock timeout');
  }
  fs.writeFileSync(lockPath, 'locked');
}
function releaseLock(lockPath) {
  if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
}

app.put('/posts/:id/like', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  // Validate userId
  if (!validateUserId(userId)) {
    return res.status(403).json({ error: 'Invalid or unauthorized userId' });
  }

  const lockPath = path.join(__dirname, 'posts.json.lock');
  try {
    acquireLock(lockPath);
    const posts = readPostsData();
    const postIndex = posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
      releaseLock(lockPath);
      return res.status(404).json({ error: 'Post not found' });
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
    releaseLock(lockPath);
    res.json({
      message: userLikedIndex === -1 ? 'Post liked' : 'Post unliked',
      likes: post.likes,
      liked: userLikedIndex === -1
    });
  } catch (err) {
    releaseLock(lockPath);
    res.status(500).json({ error: 'Could not process like/unlike. Try again.' });
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

app.post('/reports', upload.array('photos', 10), (req, res) => {
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

/* ==================== START SERVER ==================== */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});



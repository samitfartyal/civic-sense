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
    title, 
    excerpt, 
    author, 
    date,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null
  };
  posts.push(newPost);
  writePostsData(posts);
  console.log('New post added:', newPost);
  res.json({ message: 'Post added successfully', post: newPost });
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

//  Endpoint for reports with photos
app.post('/upload-report', upload.array('photos'), (req, res) => {
  const { reportType, description, contactName, contactEmail } = req.body;

  if (!reportType || !description || !contactName || !contactEmail) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const reports = readReportsData();
  const newReport = {
    reportType,
    description,
    contactName,
    contactEmail,
    photos: req.files.map(file => `/uploads/${file.filename}`),
    submittedAt: new Date()
  };

  reports.push(newReport);
  writeReportsData(reports);

  console.log('New report received:', newReport);
  res.json({ message: 'Report submitted successfully', report: newReport });
});

/* ==================== COMMENTS HANDLING ==================== */
const commentsFilePath = path.join(__dirname, 'comments.json');

function readCommentsData() {
  try {
    if (!fs.existsSync(commentsFilePath)) fs.writeFileSync(commentsFilePath, JSON.stringify([]));
    const data = fs.readFileSync(commentsFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading comments data:', err);
    return [];
  }
}

function writeCommentsData(data) {
  try {
    fs.writeFileSync(commentsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing comments data:', err);
  }
}

// Get comments for a specific post/reel
app.get('/comments/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const comments = readCommentsData();
  const filteredComments = comments.filter(comment => 
    comment.contentType === type && comment.contentId === id
  );
  res.json(filteredComments);
});

// Add a new comment
app.post('/comments', (req, res) => {
  const { content, author, contentType, contentId } = req.body;
  
  if (!content || !author || !contentType || !contentId) {
    return res.status(400).json({ error: 'All comment fields are required' });
  }

  const comments = readCommentsData();
  const newComment = {
    id: Date.now().toString(),
    content,
    author,
    contentType,
    contentId,
    likes: 0,
    timestamp: new Date()
  };

  comments.push(newComment);
  writeCommentsData(comments);

  console.log('New comment added:', newComment);
  res.json({ message: 'Comment added successfully', comment: newComment });
});

// Like a comment
app.put('/comments/:id/like', (req, res) => {
  const { id } = req.params;
  const comments = readCommentsData();
  const commentIndex = comments.findIndex(comment => comment.id === id);
  
  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  comments[commentIndex].likes += 1;
  writeCommentsData(comments);
  
  res.json({ message: 'Comment liked', likes: comments[commentIndex].likes });
});

/* ==================== SHARES HANDLING ==================== */
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


});


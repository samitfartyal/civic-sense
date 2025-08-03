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

/* ==================== START SERVER ==================== */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


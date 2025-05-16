import express from 'express'; //server
import bodyParser from 'body-parser'; //Middleware - parsing (optional, you use express.json())
import mysql from 'mysql2'; // database
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // jwt token
import rateLimit from 'express-rate-limit'; //rate limit
import dotenv from 'dotenv' // secret key

dotenv.config()

const secret_key = process.env.secret_key;
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start server
app.listen(port, () => {
  console.log('Running on port ' + port);
  console.log('Server is running on http://localhost:' + port);
});

// rate limiter
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2mins
  max: 100, //100 reqs
  message: { message: "Too many requests from this IP, please try again later." }
});
app.use(limiter);

const SECRET_KEY = 'your_secret_key_here'; // Use env var in production!

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'blog_db'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL!');
});


// Register new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing username or password');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(sql, [username, hashedPassword], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).send('Username already taken');
        return res.status(500).send(err);
      }
      res.status(201).send('User registered');
    });
  } catch {
    res.status(500).send('Server error');
  }
});

// Login user
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing username or password');

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(400).send('Invalid credentials');

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid credentials');

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Middleware to protect routes with JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; // Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
}


// Retrieve all blog posts (protected)
app.get('/posts', authenticateToken, (req, res) => {
  db.query('SELECT * FROM posts', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Retrieve specific blog post (protected)
app.get('/posts/:id', authenticateToken, (req, res) => {
  db.query('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send({ message: 'Post not found' });
    res.json(results[0]);
  });
});

// Create new blog post (protected)
app.post('/posts', authenticateToken, (req, res) => {
  const { title, content, author } = req.body;
  const sql = 'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)';
  db.query(sql, [title, content, author], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).json({ id: result.insertId, title, content, author });
  });
});

// Update blog post (protected)
app.put('/posts/:id', authenticateToken, (req, res) => {
  const { title, content, author } = req.body;
  const sql = 'UPDATE posts SET title = ?, content = ?, author = ? WHERE id = ?';
  db.query(sql, [title, content, author, req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ id: req.params.id, title, content, author });
  });
});

// Delete blog post (protected)
app.delete('/posts/:id', authenticateToken, (req, res) => {
  db.query('DELETE FROM posts WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Post deleted', id: req.params.id });
  });
});


  
let posts = [
    {
        title: "How to Start a Tech Blog in 2025",
        content: "Learn how to launch a tech blog by picking a niche and writing consistently.",
        author: "Jane Martinez"
        },
      {
        title: "Top 10 VS Code Extensions for Developers",
        content: "Boost your coding workflow with popular VS Code extensions like Prettier and GitLens.",
        author: "Daniel Park"
      },
      {
        title: "The Future of Web Development: Trends to Watch",
        content: "Explore new trends like serverless, WebAssembly, and Svelte shaping web development.",
        author: "Fatima Noor"
      },
      {
        title: "Writing Clean Code: Best Practices",
        content: "Use clear names, small functions, and avoid repeated code to write clean code.",
        author: "Liam Chen"
      },
      {
        title: "Deploying Your Blog with Netlify and GitHub",
        content: "Host your blog for free by connecting your GitHub repo to Netlify.",
        author: "Amira Johnson"
      }
 
]



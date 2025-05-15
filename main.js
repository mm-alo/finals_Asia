import express from 'express'; //server
import bodyParser from 'body-parser'; //Middleware - parsing
import mysql from 'mysql2' // database


const app = express()
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//localserver
app.listen(port,()=>{
    console.log('Running on port ' + port)
    console.log('Server is running on http://localhost:3000')
}) 

//database connection
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

  //retrive all blog posts
  app.get('/posts', (req, res) => {
    db.query('SELECT * FROM posts', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });

  //retrieve specific blog posts
  app.get('/posts/:id', (req, res) => {
    db.query('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) return res.status(404).send({ message: 'Post not found' });
      res.json(results[0]);
    });
  });

  //create new blog posts
  app.post('/posts', (req, res) => {
    const { title, content, author } = req.body;
    const sql = 'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)';
    db.query(sql, [title, content, author], (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).json({ id: result.insertId, title, content, author });
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



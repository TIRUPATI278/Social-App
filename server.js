const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());

const db = {
  users: [
    { id: 1, username: 'alice', name: 'Alice', bio: 'Loves travel.' },
    { id: 2, username: 'bob', name: 'Bob', bio: 'Coffee enthusiast.' }
  ],
  posts: [
    { id: 1, userId: 1, content: 'Hello world!', likes: 2, createdAt: new Date().toISOString() },
    { id: 2, userId: 2, content: 'Nice to meet you here.', likes: 1, createdAt: new Date().toISOString() }
  ],
  comments: [
    { id: 1, postId: 1, userId: 2, content: 'Welcome, Alice!' }
  ],
  follows: [
    { followerId: 2, followingId: 1 }
  ]
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/users', (req, res) => res.json(db.users));
app.get('/api/users/:username', (req, res) => {
  const user = db.users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const posts = db.posts.filter(p => p.userId === user.id);
  const followers = db.follows.filter(f => f.followingId === user.id).length;
  const following = db.follows.filter(f => f.followerId === user.id).length;
  res.json({ ...user, posts, followers, following });
});
app.get('/api/posts', (req, res) => res.json(db.posts.map(post => ({
  ...post,
  user: db.users.find(u => u.id === post.userId)
}))));
app.get('/api/posts/:id/comments', (req, res) => res.json(db.comments.filter(c => c.postId === Number(req.params.id))));
app.post('/api/posts', (req, res) => {
  const { userId, content } = req.body;
  if (!userId || !content) return res.status(400).json({ error: 'Missing fields' });
  const post = { id: db.posts.length + 1, userId, content, likes: 0, createdAt: new Date().toISOString() };
  db.posts.push(post);
  res.status(201).json(post);
});
app.post('/api/posts/:id/comments', (req, res) => {
  const { userId, content } = req.body;
  const postId = Number(req.params.id);
  if (!userId || !content) return res.status(400).json({ error: 'Missing fields' });
  const comment = { id: db.comments.length + 1, postId, userId, content };
  db.comments.push(comment);
  res.status(201).json(comment);
});
app.post('/api/posts/:id/like', (req, res) => {
  const post = db.posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Not found' });
  post.likes += 1;
  res.json(post);
});
app.post('/api/users/:username/follow', (req, res) => {
  const user = db.users.find(u => u.username === req.params.username);
  const { followerId } = req.body;
  if (!user || !followerId) return res.status(400).json({ error: 'Missing fields' });
  if (!db.follows.some(f => f.followerId === followerId && f.followingId === user.id)) {
    db.follows.push({ followerId, followingId: user.id });
  }
  res.json({ success: true });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Social app listening on http://localhost:${port}`));

const express = require('express');
const mongoose = require('mongoose');
const Todo = require('./models/Todo');

const app = express();
app.use(express.json());

// Serverless functions (Vercel) start cold and can be reused across requests.
// Keep one connection promise and reuse it instead of reconnecting every time.
let connectPromise = null;
function connectDB() {
  if (!connectPromise) {
    if (!process.env.MONGODB_URI) {
      return Promise.reject(new Error('MONGODB_URI is not set'));
    }
    connectPromise = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      connectPromise = null; // allow a retry on the next request
      throw err;
    });
  }
  return connectPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const todo = await Todo.create({ title });
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', async (req, res) => {
  const updates = {};
  if (typeof req.body.title === 'string') updates.title = req.body.title;
  if (typeof req.body.completed === 'boolean') updates.completed = req.body.completed;

  const todo = await Todo.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

app.delete('/api/todos/:id', async (req, res) => {
  const todo = await Todo.findByIdAndDelete(req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json({ ok: true });
});

// Express runs this for any error passed to next(err) or thrown in an async
// handler that Express 4 forwards. Bad ids become 400s; everything else 500.
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  res.status(500).json({ error: err.message || 'Server error' });
});

module.exports = app;

// Run a local server only when started directly (`npm run dev`).
// On Vercel, the platform imports this file and calls the exported app itself.
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

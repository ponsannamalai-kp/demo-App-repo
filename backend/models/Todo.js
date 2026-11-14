const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// The guard stops Mongoose from registering the model twice when a
// dev server reloads the file.
module.exports = mongoose.models.Todo || mongoose.model('Todo', todoSchema);

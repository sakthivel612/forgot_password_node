const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  // Add more fields as needed (e.g., name, role, etc.)
});

const User = mongoose.model('User', userSchema);

module.exports = User;

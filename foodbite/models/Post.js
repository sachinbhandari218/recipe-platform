const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaPath: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  caption: {
    type: String,
    default: '',
    maxlength: 280
  },
  duration: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
});

postSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Post', postSchema);

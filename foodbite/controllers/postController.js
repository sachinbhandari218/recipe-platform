const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const { calculateActiveStreak, processUploadStreak, getHoursRemainingInStreak } = require('../services/streakService');

exports.createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    const userId = req.body.userId;
    const caption = req.body.caption || '';
    const duration = parseFloat(req.body.duration) || 0;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const isVideo = req.file.mimetype.startsWith('video');
    if (isVideo && duration > 10) {
      return res.status(400).json({ error: 'Video duration must not exceed 10 seconds' });
    }

    const newStreak = processUploadStreak(user);
    await user.save();

    const mediaUrl = '/uploads/' + req.file.filename;
    const post = new Post({
      userId: user._id,
      username: user.username,
      userAvatar: user.avatarUrl,
      mediaUrl: mediaUrl,
      mediaPath: req.file.path,
      mediaType: isVideo ? 'video' : 'image',
      caption: caption.trim(),
      duration: duration
    });

    await post.save();

    return res.status(201).json({
      success: true,
      post: post,
      currentStreak: newStreak,
      hoursRemaining: 24
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getActiveFeed = async (req, res) => {
  try {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const posts = await Post.find({
      createdAt: { $gte: threshold }
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts: posts
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activeStreak = calculateActiveStreak(user);
    const hoursRemaining = getHoursRemainingInStreak(user.lastUploadAt);

    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activePosts = await Post.find({
      userId: user._id,
      createdAt: { $gte: threshold }
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        streak: activeStreak,
        lastUploadAt: user.lastUploadAt,
        hoursRemaining: hoursRemaining
      },
      activePosts: activePosts
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

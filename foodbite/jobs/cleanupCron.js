const cron = require('node-cron');
const fs = require('fs');
const Post = require('../models/Post');

function initCleanupJob() {
  cron.schedule('0,15,30,45 * * * *', async () => {
    try {
      const expirationThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredPosts = await Post.find({
        createdAt: { $lt: expirationThreshold }
      });

      for (const post of expiredPosts) {
        if (post.mediaPath && fs.existsSync(post.mediaPath)) {
          try {
            fs.unlinkSync(post.mediaPath);
          } catch (unlinkError) {
            console.error('File cleanup error:', unlinkError.message);
          }
        }
      }

      if (expiredPosts.length > 0) {
        const ids = expiredPosts.map((p) => p._id);
        await Post.deleteMany({ _id: { $in: ids } });
      }
    } catch (error) {
      console.error('Cron job error:', error.message);
    }
  });
}

module.exports = initCleanupJob;

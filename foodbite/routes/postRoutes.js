const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const postController = require('../controllers/postController');

router.post('/posts', upload.single('media'), postController.createPost);
router.get('/feed', postController.getActiveFeed);
router.get('/users/:userId', postController.getUserProfile);

module.exports = router;

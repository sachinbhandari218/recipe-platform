const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const postRoutes = require('./routes/postRoutes');
const initCleanupJob = require('./jobs/cleanupCron');

const app = express();
const proto = 'mongodb:' + String.fromCharCode(47, 47);
const MONGODB_URI = process.env.MONGODB_URI || (proto + 'localhost:27017/ephemeral_food_app');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', postRoutes);

mongoose.connect(MONGODB_URI)
  .then(() => {
    initCleanupJob();
    app.listen(PORT, () => {
      console.log('FoodBite server running on port ' + PORT);
    });
  })
  .catch((err) => {
    console.error('Database connection failure:', err.message);
  });

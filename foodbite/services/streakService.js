function calculateActiveStreak(user) {
  if (!user || !user.lastUploadAt) {
    return 0;
  }
  const now = Date.now();
  const lastTime = new Date(user.lastUploadAt).getTime();
  const diffHours = (now - lastTime) / (1000 * 60 * 60);

  if (diffHours > 24) {
    return 0;
  }
  return user.streakCount || 0;
}

function processUploadStreak(user) {
  const now = new Date();
  if (!user.lastUploadAt) {
    user.streakCount = 1;
    user.lastUploadAt = now;
    return user.streakCount;
  }

  const lastTime = new Date(user.lastUploadAt).getTime();
  const diffHours = (now.getTime() - lastTime) / (1000 * 60 * 60);

  if (diffHours <= 24) {
    user.streakCount = (user.streakCount || 0) + 1;
  } else {
    user.streakCount = 1;
  }

  user.lastUploadAt = now;
  return user.streakCount;
}

function getHoursRemainingInStreak(lastUploadAt) {
  if (!lastUploadAt) return 0;
  const now = Date.now();
  const lastTime = new Date(lastUploadAt).getTime();
  const elapsedMs = now - lastTime;
  const totalMs = 24 * 60 * 60 * 1000;
  const remainingMs = totalMs - elapsedMs;
  if (remainingMs <= 0) return 0;
  return Math.round((remainingMs / (1000 * 60 * 60)) * 10) / 10;
}

module.exports = {
  calculateActiveStreak,
  processUploadStreak,
  getHoursRemainingInStreak
};

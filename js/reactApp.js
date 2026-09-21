const { useState, useEffect, useRef, useMemo } = React;

function escapeStr(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\x22/g, "&quot;")
    .replace(/\x27/g, "&#039;");
}

function decodeUnicode(str) {
  if (!str) return "";
  try {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  } catch (e) {
    return str;
  }
}

function formatHoursLeft(expiresAt) {
  const remainingMs = Number(expiresAt) - Date.now();
  if (remainingMs <= 0) return "Expiring";
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  return hours + "h " + mins + "m left";
}

function formatTimeAgo(timestamp) {
  const diffMs = Date.now() - Number(timestamp);
  if (diffMs < 60000) return "Just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  return days + "d ago";
}

function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed top-5 inset-x-4 max-w-sm mx-auto z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        let bgClass = "bg-white/95 border-stone-200 text-stone-900 shadow-stone-900/10";
        let icon = "ℹ️";
        if (toast.type === "success") {
          bgClass = "bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-900/10";
          icon = "✅";
        } else if (toast.type === "error") {
          bgClass = "bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-900/10";
          icon = "⚠️";
        } else if (toast.type === "warning") {
          bgClass = "bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-900/10";
          icon = "⚡";
        }
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-pop-in ${bgClass}`}
          >
            <div className="flex items-center space-x-2.5 mr-3">
              <span className="text-base">{icon}</span>
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AuthScreen({ onAuthSuccess, showToast }) {
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!cleanUsername || cleanUsername.length < 2) {
      setErrorMessage("Please enter a username (at least 2 characters)");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Failed to continue with username");
      }
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setErrorMessage(err.message || "Could not access with this username");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-orange-50/70 via-stone-50 to-amber-50/40 text-stone-900 selection:bg-orange-600 selection:text-white">
      <div className="w-full max-w-sm sm:max-w-md bg-white/95 border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-stone-900/5 space-y-6">
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-600 flex items-center justify-center text-3xl shadow-lg shadow-orange-600/30 animate-pulse">
              🔥
            </div>
            <div className="absolute -inset-1 rounded-3xl border border-orange-500/20 -z-10"></div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-stone-900 font-serif">FoodBite</h1>
          <p className="text-xs text-stone-500">
            Ephemeral food stories and daily culinary sharing
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center animate-fade-in">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Enter Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs select-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sachin_chef"
                autoFocus
                maxLength={25}
                className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1.5 ml-1">
              Enter your username to instantly access your food feed.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !cleanUsername}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? "Entering FoodBite..." : "Continue"}</span>
            <span>→</span>
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-stone-400 border-t border-stone-100">
          Instant username access • 24-hour daily stories
        </div>
      </div>
    </div>
  );
}

function UploadStoryModal({ isOpen, onClose, currentUser, onStoryUploaded, showToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {}
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setIsVideo(false);
    setDuration(0);
    setCaption("");
    setErrorMessage("");
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose && onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("File size exceeds 50MB limit");
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    setErrorMessage("");
    const isVid = file.type.startsWith("video");
    setIsVideo(isVid);

    if (isVid) {
      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      const objectUrl = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        if (videoElement.duration > 10.05) {
          setErrorMessage("Video duration must be 10 seconds or less. Selected: " + videoElement.duration.toFixed(1) + "s");
          setSelectedFile(null);
          setPreviewUrl("");
          return;
        }
        setDuration(videoElement.duration);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      };
      videoElement.src = objectUrl;
    } else {
      setDuration(0);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please capture or select a photo or video under 10 seconds");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let uploadedUrl = "";
      let uploadedPath = "";

      if (isVideo) {
        const resp = await fetch("/api/upload?type=video", {
          method: "POST",
          headers: { "Content-Type": selectedFile.type || "video/mp4" },
          body: selectedFile
        });
        if (!resp.ok) throw new Error("Video upload failed");
        const data = await resp.json();
        uploadedUrl = data.url;
        uploadedPath = "uploads/" + data.filename;
      } else {
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        const resp = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 })
        });
        if (!resp.ok) throw new Error("Photo upload failed");
        const data = await resp.json();
        uploadedUrl = data.url;
        uploadedPath = "uploads/" + data.filename;
      }

      const uid = currentUser ? (currentUser.id || currentUser.uid) : "usr-1";
      const uname = currentUser ? (currentUser.username || currentUser.name) : "Sachin Bhandari";
      const uavatar = currentUser ? (currentUser.avatar || currentUser.avatarUrl) : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

      const postResp = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          username: uname,
          userAvatar: uavatar,
          mediaUrl: uploadedUrl,
          mediaPath: uploadedPath,
          mediaType: isVideo ? "video" : "image",
          caption: caption.trim(),
          duration: duration
        })
      });

      if (!postResp.ok) throw new Error("Failed to save story record");
      const postData = await postResp.json();

      showToast("🔥 Story posted! Active streak: " + postData.currentStreak + " days!", "success");
      resetForm();
      onStoryUploaded && onStoryUploaded(postData);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to post story");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-stone-200 p-6 text-stone-900 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-4 text-center">
          <span className="inline-block px-3 py-1 mb-2 text-[10px] font-black uppercase tracking-wider rounded-full bg-orange-50 text-orange-600 border border-orange-200">
            24H Ephemeral Story
          </span>
          <h3 className="text-xl font-black text-stone-900 tracking-tight">Share Food Story</h3>
          <p className="text-xs text-stone-500 mt-1">Direct camera capture or short video (max 10s)</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 p-4 text-center hover:border-orange-500 transition-colors">
            {previewUrl ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-stone-100">
                {isVideo ? (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/75 text-[10px] font-mono text-orange-400">
                  {isVideo ? duration.toFixed(1) + "s / 10s" : "Photo"}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white text-[11px] font-bold border border-white/20 shadow-lg cursor-pointer"
                >
                  ✕ Change
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-stone-800">Open Camera / Select Media</span>
                <span className="text-[10px] text-stone-500 mt-1">Photo or video under 10 seconds</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={["image", "*"].join("/") + "," + ["video", "*"].join("/")}
                  capture="environment"
                  onChange={handleFileChange}
                  onClick={(e) => { e.target.value = null; }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Food Story Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What are you cooking or tasting?"
              maxLength={280}
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedFile}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Posting..." : "🔥 Share Food Story"}
          </button>
        </form>
      </div>
    </div>
  );
}

function StoryViewerModal({ isOpen, story, stories, onClose, onDeletePost, currentUser }) {
  if (!isOpen || !story) return null;

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!stories || stories.length === 0) return 0;
    const idx = stories.findIndex((s) => s.id === story.id);
    return idx >= 0 ? idx : 0;
  });
  const [progress, setProgress] = useState(0);

  const activeStory = (stories && stories[currentIndex]) || story;
  const isOwner = currentUser && (
    (currentUser.id && currentUser.id === activeStory.userId) ||
    (currentUser.uid && currentUser.uid === activeStory.userId)
  );

  useEffect(() => {
    setProgress(0);
    const duration = 10000;
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (stories && currentIndex < stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return Math.min(100, prev + step);
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [currentIndex, stories]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (stories && currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-0 select-none animate-fade-in">
      <div className="relative w-full max-w-md h-full flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 inset-x-0 z-30 p-4 space-y-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 to-orange-600">
                <img
                  src={activeStory.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                  alt={activeStory.username}
                  className="w-8 h-8 rounded-full object-cover border border-black"
                />
              </div>
              <div>
                <p className="text-xs font-black tracking-tight text-white">{activeStory.username}</p>
                <p className="text-[10px] text-orange-300 font-semibold">
                  ⏳ {formatHoursLeft(activeStory.expiresAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isOwner && onDeletePost && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Delete this food story?")) {
                      onDeletePost(activeStory.id);
                      onClose();
                    }
                  }}
                  className="p-1.5 rounded-full bg-black/50 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 text-xs transition-colors cursor-pointer"
                  title="Delete Story"
                >
                  🗑️
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
          {activeStory.mediaType === "video" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={activeStory.mediaUrl}
                autoPlay
                loop
                playsInline
                className="relative z-10 max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <div
                className="absolute inset-0 bg-cover bg-center scale-125 blur-3xl opacity-40 pointer-events-none"
                style={{ backgroundImage: `url(${activeStory.mediaUrl})` }}
              />
              <img
                src={activeStory.mediaUrl}
                alt={activeStory.caption || "Food story"}
                className="relative z-10 max-h-full max-w-full object-contain"
              />
            </div>
          )}

          <div
            className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
            onClick={handleNext}
          />
        </div>

        {activeStory.caption && (
          <div className="absolute bottom-0 inset-x-0 z-30 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white">
            <p className="text-xs text-stone-200 leading-relaxed drop-shadow">
              <strong className="text-white font-bold mr-2">{activeStory.username}</strong>
              {decodeUnicode(activeStory.caption)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InstagramHomeFeed({
  stories,
  currentUser,
  followingList,
  onToggleFollow,
  onTriggerUpload,
  onTriggerInstall,
  onViewStory,
  onDeletePost,
  showToast
}) {
  const [likes, setLikes] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [heartBursts, setHeartBursts] = useState({});
  const [openComments, setOpenComments] = useState({});

  const lastTapRef = useRef({});
  const currentUserId = currentUser ? (currentUser.id || currentUser.uid) : "usr-1";

  const distinctCreators = useMemo(() => {
    if (!stories || stories.length === 0) return [];
    const map = new Map();
    stories.forEach((s) => {
      if (!map.has(s.userId)) {
        map.set(s.userId, s);
      }
    });
    return Array.from(map.values());
  }, [stories]);

  const toggleLike = (postId) => {
    const isLiked = !!likes[postId];
    const curCount = likeCounts[postId] !== undefined ? likeCounts[postId] : 12;
    setLikes((prev) => ({ ...prev, [postId]: !isLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: isLiked ? Math.max(0, curCount - 1) : curCount + 1
    }));
  };

  const handleDoubleTap = (post) => {
    const postId = post.id;
    if (navigator.vibrate) {
      try {
        navigator.vibrate([50]);
      } catch (e) {}
    }
    setHeartBursts((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setHeartBursts((prev) => ({ ...prev, [postId]: false }));
    }, 800);

    if (!likes[postId]) {
      const curCount = likeCounts[postId] !== undefined ? likeCounts[postId] : 12;
      setLikes((prev) => ({ ...prev, [postId]: true }));
      setLikeCounts((prev) => ({ ...prev, [postId]: curCount + 1 }));
    }
  };

  const handleTouchEnd = (post) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[post.id] || 0;
    if (now - lastTap < 300) {
      handleDoubleTap(post);
    }
    lastTapRef.current[post.id] = now;
  };

  const handleAddComment = (postId) => {
    const input = (commentInputs[postId] || "").trim();
    if (!input) return;
    const author = currentUser ? (currentUser.username || currentUser.name || "foodie") : "foodie";
    const newComment = { id: Date.now(), author, text: input };
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    showToast("Comment posted! 💬", "success");
  };

  const handleSharePost = (post) => {
    if (navigator.share) {
      navigator.share({
        title: "FoodBite Story by " + post.username,
        text: post.caption,
        url: window.location.href
      }).catch(() => {});
    } else {
      try {
        navigator.clipboard.writeText(window.location.href);
        showToast("Story link copied to clipboard! 🔗", "info");
      } catch (e) {
        showToast("Link: " + window.location.href, "info");
      }
    }
  };

  const toggleSave = (postId) => {
    const nextSaved = !savedPosts[postId];
    setSavedPosts((prev) => ({ ...prev, [postId]: nextSaved }));
    showToast(nextSaved ? "Saved to your collection! 🔖" : "Removed from saved posts", "info");
  };

  return (
    <div className="w-full flex flex-col animate-fade-in">
      <div className="w-full bg-white border-b border-stone-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-md mx-auto flex items-center space-x-4 overflow-x-auto p-3.5 scrollbar-none">
          <div
            className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group"
            onClick={onTriggerUpload}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full p-[2px] border-2 border-dashed border-orange-500 flex items-center justify-center bg-stone-50 group-hover:scale-105 transition-transform">
                <img
                  src={currentUser && (currentUser.avatar || currentUser.avatarUrl) ? (currentUser.avatar || currentUser.avatarUrl) : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                  alt="Your Story"
                  className="w-14 h-14 rounded-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-tr from-orange-600 to-amber-600 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-white">
                +
              </div>
            </div>
            <span className="text-[11px] font-bold text-stone-700">Your Story</span>
          </div>

          {distinctCreators && distinctCreators.map((creatorStory, idx) => (
            <div
              key={creatorStory.id || idx}
              onClick={() => onViewStory(creatorStory)}
              className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 shadow-xs group-hover:scale-105 transition-transform">
                <div className="p-[2px] bg-white rounded-full">
                  <img
                    src={creatorStory.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                    alt={creatorStory.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[11px] font-medium text-stone-700 max-w-[68px] truncate text-center">
                {creatorStory.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!stories || stories.length === 0 ? (
        <div className="max-w-md mx-auto my-12 p-8 text-center bg-white border border-stone-200 rounded-3xl shadow-sm space-y-4 mx-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 text-3xl flex items-center justify-center mx-auto shadow-xs">
            🍽️
          </div>
          <h3 className="text-lg font-black text-stone-900 tracking-tight">Your Feed is Ready</h3>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            FoodBite stories and creations purge after 24 hours to keep everything fresh. Be the first to share today&apos;s kitchen creation!
          </p>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-600/25 active:scale-95 transition-all cursor-pointer inline-flex items-center space-x-2"
          >
            <span>🔥</span>
            <span>Share First Story</span>
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto w-full px-3 sm:px-0 py-4 space-y-6 pb-28">
          {stories.map((post, idx) => {
            const isLiked = !!likes[post.id];
            const count = likeCounts[post.id] !== undefined ? likeCounts[post.id] : 12;
            const postComments = comments[post.id] || [];
            const isSaved = !!savedPosts[post.id];
            const isOwner = post.userId === currentUserId;
            const isFollowing = followingList && followingList.includes(post.userId);
            const showCommentsSection = !!openComments[post.id];

            return (
              <article
                key={post.id || idx}
                className="bg-white border border-stone-200 rounded-3xl shadow-xs overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="p-3.5 flex items-center justify-between border-b border-stone-100">
                  <div
                    className="flex items-center space-x-3 cursor-pointer group"
                    onClick={() => onViewStory(post)}
                  >
                    <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 to-orange-600">
                      <img
                        src={post.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                        alt={post.username}
                        className="w-9 h-9 rounded-full object-cover border border-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-black text-stone-900 group-hover:text-orange-600 transition-colors">
                          {post.username}
                        </h4>
                        {!isOwner && onToggleFollow && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFollow(post.userId, post.username);
                            }}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                              isFollowing
                                ? "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                            }`}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 block font-medium">
                        Food Creator • {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-orange-600 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 shadow-2xs">
                      ⏳ {formatHoursLeft(post.expiresAt)}
                    </span>

                    {isOwner && onDeletePost && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Delete this food story?")) {
                            onDeletePost(post.id);
                          }
                        }}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Story"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="relative w-full aspect-square sm:aspect-[4/5] bg-stone-100 overflow-hidden select-none cursor-pointer flex items-center justify-center"
                  onDoubleClick={() => handleDoubleTap(post)}
                  onTouchEnd={() => handleTouchEnd(post)}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center scale-125 blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundImage: `url(${post.mediaUrl})` }}
                  />

                  {post.mediaType === "video" ? (
                    <video
                      src={post.mediaUrl}
                      loop
                      muted
                      playsInline
                      autoPlay
                      className="relative z-10 w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || "Food story"}
                      className="relative z-10 w-full h-full object-contain"
                      loading="lazy"
                    />
                  )}

                  {heartBursts[post.id] && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-heart-burst">
                      <span className="text-7xl filter drop-shadow-2xl">❤️</span>
                    </div>
                  )}
                </div>

                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => toggleLike(post.id)}
                      className={`text-xl transition-transform active:scale-125 cursor-pointer ${
                        isLiked ? "text-rose-600 scale-110" : "text-stone-700 hover:text-stone-900"
                      }`}
                      title={isLiked ? "Unlike" : "Like"}
                    >
                      {isLiked ? "❤️" : "🤍"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="text-xl text-stone-700 hover:text-stone-900 transition-transform active:scale-110 cursor-pointer flex items-center space-x-1"
                      title="Comments"
                    >
                      <span>💬</span>
                      {postComments.length > 0 && (
                        <span className="text-xs font-bold text-stone-600">{postComments.length}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSharePost(post)}
                      className="text-xl text-stone-700 hover:text-stone-900 transition-transform active:scale-110 cursor-pointer"
                      title="Share Story"
                    >
                      🔗
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSave(post.id)}
                    className={`text-xl transition-transform active:scale-110 cursor-pointer ${
                      isSaved ? "text-amber-500" : "text-stone-400 hover:text-stone-700"
                    }`}
                    title={isSaved ? "Saved" : "Save Story"}
                  >
                    {isSaved ? "🔖" : "🏷️"}
                  </button>
                </div>

                <div className="px-4 py-1 text-xs font-black text-stone-900">
                  {count} {count === 1 ? "like" : "likes"}
                </div>

                {post.caption && (
                  <div className="px-4 py-1 text-xs text-stone-800 leading-relaxed">
                    <strong className="font-bold text-stone-900 mr-2">{post.username}</strong>
                    <span>{decodeUnicode(post.caption)}</span>
                  </div>
                )}

                {postComments.length > 0 && !showCommentsSection && (
                  <button
                    type="button"
                    onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: true }))}
                    className="px-4 py-0.5 text-xs text-stone-400 hover:text-stone-600 block text-left font-medium cursor-pointer"
                  >
                    View all {postComments.length} comments
                  </button>
                )}

                {showCommentsSection && postComments.length > 0 && (
                  <div className="px-4 pt-1 pb-2 space-y-1 max-h-36 overflow-y-auto">
                    {postComments.map((c) => (
                      <div key={c.id} className="text-xs text-stone-700 leading-tight">
                        <strong className="font-bold text-stone-900 mr-1.5">@{c.author}</strong>
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-4 pt-2 pb-3 border-t border-stone-100 flex items-center space-x-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCommentInputs((prev) => ({ ...prev, [post.id]: val }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment(post.id);
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 px-3.5 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    disabled={!(commentInputs[post.id] || "").trim()}
                    onClick={() => handleAddComment(post.id)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 disabled:opacity-30 transition-colors px-2 py-1 cursor-pointer"
                  >
                    Post
                  </button>
                </div>

                <div className="px-4 pb-3 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                  {formatTimeAgo(post.createdAt)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivityView({ currentUser, userProfile, notifications, onRefreshNotifs }) {
  return (
    <div className="w-full max-w-sm mx-auto p-4 pb-28 text-stone-900 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-black tracking-tight text-stone-900">Activity &amp; Alerts</h2>
          <p className="text-[11px] text-stone-500">Updates from creators you follow</p>
        </div>
        <button
          type="button"
          onClick={onRefreshNotifs}
          className="px-3 py-1 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer shadow-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {userProfile && userProfile.user && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-orange-50 to-amber-50/60 border border-orange-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl">
              🔥
            </div>
            <div>
              <p className="text-xs font-black text-stone-900">Daily Streak Active</p>
              <p className="text-[11px] text-stone-600">
                {userProfile.user.streak > 0
                  ? userProfile.user.streak + "-day culinary streak in progress!"
                  : "Post today's food story to ignite your streak."}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-black text-orange-600">
            {userProfile.user.streak}d
          </span>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 px-1">
          Notification Inbox
        </h3>

        {!notifications || notifications.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-2xl mx-auto">
              📬
            </div>
            <p className="text-xs font-bold text-stone-900">No New Notifications</p>
            <p className="text-[11px] text-stone-500 max-w-xs mx-auto leading-relaxed">
              When food creators you follow publish new daily food stories, alerts will show up right here in real time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 rounded-3xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 flex items-center space-x-3 hover:bg-stone-50 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={notif.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                    alt={notif.senderName}
                    className="w-11 h-11 rounded-full border-2 border-orange-500 object-cover shadow-sm"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-600 border-2 border-white flex items-center justify-center text-[10px] text-white">
                    🔥
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-700 leading-snug">
                    <strong className="text-stone-900 font-black mr-1">{notif.senderName}</strong>
                    just posted a new daily food story.
                  </p>
                  <span className="text-[10px] text-orange-600 font-mono font-medium block mt-1">
                    {formatTimeAgo(notif.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserProfileView({ userProfile, currentUser, followingList, onTriggerUpload, onTriggerInstall, onDeletePost, onLogout }) {
  if (!userProfile || !userProfile.user) return null;
  const { user, activePosts } = userProfile;

  return (
    <div className="max-w-sm w-full mx-auto pb-28 text-stone-900 p-4 space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4 pt-2">
        <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 shadow-xl">
          <img
            src={user.avatarUrl || user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
            alt={user.username}
            className="w-20 h-20 rounded-full border-2 border-white object-cover"
          />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-stone-900 tracking-tight">{user.name || user.username}</h2>
          <p className="text-xs text-orange-600 font-mono font-bold">@{user.username}</p>
          <p className="text-[11px] text-stone-500">{user.email}</p>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-[11px] text-stone-700 font-medium shadow-sm">
            Following <strong className="text-stone-900 ml-1 font-bold">{(followingList || []).length}</strong>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-orange-50/40 to-amber-50/50 border border-orange-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
              Daily Culinary Streak
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-black text-stone-900">{user.streak}</span>
              <span className="text-xs font-bold text-stone-500">Days Active</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-3xl animate-bounce">
            🔥
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-orange-100 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            {user.streak > 0 ? "Streak window:" : "Streak reset:"}
          </span>
          <span className={`font-mono font-bold ${user.streak > 0 ? "text-amber-600" : "text-stone-400"}`}>
            {user.streak > 0 ? user.hoursRemaining + "h left" : "Post to start"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onTriggerUpload}
          className="py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <span>🔥</span>
          <span>Post Story</span>
        </button>

        <button
          type="button"
          onClick={onTriggerInstall}
          className="py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <span>📱</span>
          <span>Install App</span>
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-500">
            My 24H Stories ({activePosts ? activePosts.length : 0})
          </h3>
          <span className="text-[10px] text-stone-400">Auto-purges after 24h</span>
        </div>

        {!activePosts || activePosts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm text-center">
            <p className="text-xs text-stone-500">No active stories in the 24-hour window.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {activePosts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm group"
              >
                {post.mediaType === "video" ? (
                  <video src={post.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={post.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this food story?")) {
                      onDeletePost && onDeletePost(post.id);
                    }
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-rose-600 hover:text-white text-stone-700 flex items-center justify-center text-xs shadow-lg transition-colors z-20 cursor-pointer"
                  title="Delete Story"
                >
                  🗑️
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                  <span className="text-[10px] font-bold text-orange-400">
                    {post.mediaType === "video" ? "🎬 Video" : "📷 Photo"}
                  </span>
                  {post.caption && (
                    <span className="text-[10px] text-white line-clamp-1">{post.caption}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="w-full py-3.5 rounded-2xl bg-white hover:bg-rose-50 border border-stone-200 text-stone-600 hover:text-rose-600 hover:border-rose-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
      >
        Sign Out of FoodBite
      </button>

      <div className="text-center pt-2">
        <p className="text-[10px] text-stone-400">
          &copy; 2026 Online Recipe Sharing Platform. Built &amp; Engineered by Sachin Bhandari.
        </p>
      </div>
    </div>
  );
}

function FloatingGlassNavBar({ activeTab, setActiveTab, onTriggerUpload, unreadCount }) {
  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 rounded-3xl bg-white/90 backdrop-blur-xl border border-stone-200/90 shadow-2xl shadow-stone-400/25 flex items-center justify-around px-4 z-40">
      <button
        type="button"
        onClick={() => setActiveTab("home")}
        className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
          activeTab === "home" ? "text-orange-600 font-bold scale-105" : "text-stone-400 hover:text-stone-700"
        }`}
      >
        <span className="text-xl">🏠</span>
        <span className="text-[10px]">Feed</span>
      </button>

      <button
        type="button"
        onClick={onTriggerUpload}
        className="w-12 h-12 -mt-4 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-orange-600/35 active:scale-95 transition-transform cursor-pointer"
        title="Post Food Story"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("activity")}
        className={`relative flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
          activeTab === "activity" ? "text-orange-600 font-bold scale-105" : "text-stone-400 hover:text-stone-700"
        }`}
      >
        <span className="text-xl">❤️</span>
        <span className="text-[10px]">Activity</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black border-2 border-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("profile")}
        className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
          activeTab === "profile" ? "text-orange-600 font-bold scale-105" : "text-stone-400 hover:text-stone-700"
        }`}
      >
        <span className="text-xl">👤</span>
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
}

function InstallAppModal({ isOpen, onClose, deferredPrompt, onInstalled }) {
  if (!isOpen) return null;
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === "accepted") {
        onInstalled && onInstalled();
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-stone-200 p-6 text-stone-900 shadow-2xl space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-600 text-white flex items-center justify-center text-3xl shadow-xl shadow-orange-600/30 mx-auto">
            🔥
          </div>
          <h3 className="text-xl font-black tracking-tight text-stone-900">Install FoodBite App</h3>
          <p className="text-xs text-stone-500">
            Install FoodBite directly on your device for the full standalone app experience.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5 text-xs text-stone-700">
          <div className="flex items-center space-x-2">
            <span>✨</span>
            <span className="font-semibold">Full-screen immersive experience</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🚀</span>
            <span className="font-semibold">Instant launch from home screen</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📸</span>
            <span className="font-semibold">Native camera &amp; upload speed</span>
          </div>
        </div>

        {isIos ? (
          <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900 space-y-1.5">
            <p className="font-bold flex items-center space-x-1">
              <span>📱</span>
              <span>For iPhone / iPad (Safari):</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              1. Tap the <strong>Share</strong> button (📤) in Safari.<br />
              2. Scroll down and tap <strong>"Add to Home Screen"</strong> (➕).<br />
              3. Tap <strong>Add</strong> to install.
            </p>
          </div>
        ) : deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 active:scale-95 transition-all cursor-pointer"
          >
            📱 Install App Now
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-stone-100 text-center text-xs text-stone-600">
            Tap browser menu (⋮ or Share) and select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer text-center"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const testUid = urlParams.get("testUserId");
      if (testUid) {
        return {
          id: testUid,
          name: "Sachin Chef",
          username: "sachin_b",
          email: "feed_test@foodbite.com",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
          streak: 0
        };
      }
      const saved = localStorage.getItem("foodbite_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.user) return parsed.user;
      }
    } catch (e) {}
    return null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      return (new URLSearchParams(window.location.search)).get("tab") || "home";
    } catch (e) {
      return "home";
    }
  });
  const [stories, setStories] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      if (data && data.success) {
        setStories(data.posts || []);
      }
    } catch (err) {}
  };

  const fetchProfile = async (uid) => {
    const targetUid = uid || (currentUser ? (currentUser.id || currentUser.uid) : "usr-1");
    try {
      const res = await fetch("/api/profile?userId=" + encodeURIComponent(targetUid));
      const data = await res.json();
      if (data && data.success) {
        setUserProfile(data);
      }
    } catch (err) {}
  };

  const fetchFollows = async (uid) => {
    const targetUid = uid || (currentUser ? (currentUser.id || currentUser.uid) : "usr-1");
    try {
      const res = await fetch("/api/follow?userId=" + encodeURIComponent(targetUid));
      const data = await res.json();
      if (data && data.success) {
        setFollowingList(data.following || []);
      }
    } catch (err) {}
  };

  const fetchNotifications = async (uid) => {
    const targetUid = uid || (currentUser ? (currentUser.id || currentUser.uid) : "usr-1");
    try {
      const res = await fetch("/api/notifications?userId=" + encodeURIComponent(targetUid));
      const data = await res.json();
      if (data && data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    window.showToast = showToast;
    if (currentUser) {
      const uid = currentUser.id || currentUser.uid;
      fetchStories();
      fetchProfile(uid);
      fetchFollows(uid);
      fetchNotifications(uid);
    }
  }, [currentUser]);

  const handleToggleFollow = async (targetUserId, targetUsername) => {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.uid;
    if (uid === targetUserId) return;

    const isCurrentlyFollowing = followingList.includes(targetUserId);
    const nextFollowing = isCurrentlyFollowing
      ? followingList.filter((id) => id !== targetUserId)
      : [...followingList, targetUserId];

    setFollowingList(nextFollowing);
    showToast(
      isCurrentlyFollowing
        ? "Unfollowed @" + (targetUsername || "user")
        : "Now following @" + (targetUsername || "user") + "! 🔥",
      "success"
    );

    try {
      const resp = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: uid,
          followingId: targetUserId,
          action: "toggle"
        })
      });
      const data = await resp.json();
      if (data && typeof data.isFollowing === "boolean") {
        setFollowingList((prev) => {
          const has = prev.includes(targetUserId);
          if (data.isFollowing && !has) return [...prev, targetUserId];
          if (!data.isFollowing && has) return prev.filter((id) => id !== targetUserId);
          return prev;
        });
      }
    } catch (err) {}
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.uid;
    try {
      const resp = await fetch("/api/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: uid })
      });
      const data = await resp.json();
      if (data && data.success) {
        setStories((prev) => prev.filter((p) => p.id !== postId));
        showToast("Food story deleted", "info");
        fetchProfile(uid);
      } else {
        showToast((data && data.error) ? data.error : "Could not delete story", "error");
      }
    } catch (err) {
      showToast("Failed to delete story", "error");
    }
  };

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("foodbite_session");
    setCurrentUser(null);
    showToast("Signed out successfully", "info");
  };

  if (!currentUser) {
    return (
      <div className="h-full w-full bg-stone-50 text-stone-900 overflow-y-auto">
        <AuthScreen
          onAuthSuccess={(user, token) => {
            localStorage.setItem("foodbite_session", JSON.stringify({ user, token }));
            setCurrentUser(user);
            showToast("Welcome to FoodBite, " + (user.name || user.username) + "! 🔥", "success");
            const uid = user.id || user.uid;
            fetchProfile(uid);
            fetchStories();
            fetchFollows(uid);
            fetchNotifications(uid);
          }}
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-stone-50 text-stone-900 selection:bg-orange-600 selection:text-white overflow-hidden relative">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between max-w-md w-full mx-auto shadow-2xs">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab("home")}>
          <span className="text-2xl animate-pulse">🔥</span>
          <div>
            <h1 className="text-lg font-black tracking-tight text-stone-900 font-serif leading-none">FoodBite</h1>
            <span className="text-[10px] text-orange-600 font-bold uppercase tracking-widest block mt-0.5">
              Food Stories
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {userProfile && userProfile.user && (
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-black text-orange-700 shadow-2xs transition-colors cursor-pointer"
              title="Daily Active Streak"
            >
              <span>🔥</span>
              <span>{userProfile.user.streak || 0}d</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-[11px] font-bold text-stone-700 transition-colors cursor-pointer"
            title="Install FoodBite as App"
          >
            📱 App
          </button>

          <button
            type="button"
            onClick={() => setStoryModalOpen(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-600/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            title="Share Food Story"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full">
        {activeTab === "home" && (
          <InstagramHomeFeed
            stories={stories}
            currentUser={currentUser}
            followingList={followingList}
            onToggleFollow={handleToggleFollow}
            onTriggerUpload={() => setStoryModalOpen(true)}
            onTriggerInstall={() => setShowInstallModal(true)}
            onViewStory={(story) => setViewingStory(story)}
            onDeletePost={handleDeletePost}
            showToast={showToast}
          />
        )}
        {activeTab === "activity" && (
          <div className="h-full w-full overflow-y-auto">
            <ActivityView
              currentUser={currentUser}
              userProfile={userProfile}
              notifications={notifications}
              onRefreshNotifs={() => fetchNotifications()}
            />
          </div>
        )}
        {activeTab === "profile" && (
          <div className="h-full w-full overflow-y-auto">
            <UserProfileView
              userProfile={userProfile}
              currentUser={currentUser}
              followingList={followingList}
              onTriggerUpload={() => setStoryModalOpen(true)}
              onTriggerInstall={() => setShowInstallModal(true)}
              onDeletePost={handleDeletePost}
              onLogout={handleLogout}
            />
          </div>
        )}
      </main>

      <FloatingGlassNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerUpload={() => setStoryModalOpen(true)}
        unreadCount={notifications.length}
      />

      <UploadStoryModal
        isOpen={storyModalOpen}
        onClose={() => setStoryModalOpen(false)}
        currentUser={currentUser}
        onStoryUploaded={() => {
          fetchStories();
          fetchProfile();
          fetchNotifications();
          setActiveTab("home");
        }}
        showToast={showToast}
      />

      <StoryViewerModal
        isOpen={!!viewingStory}
        story={viewingStory}
        stories={stories}
        onClose={() => setViewingStory(null)}
        onDeletePost={handleDeletePost}
        currentUser={currentUser}
      />

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => {
          setDeferredPrompt(null);
          showToast("FoodBite installed successfully! 📱", "success");
        }}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App boundary error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6 text-center text-stone-900">
          <div className="max-w-sm w-full bg-white border border-stone-200 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-base font-black text-stone-900">App Notice</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {String(this.state.error && (this.state.error.message || this.state.error))}
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("foodbite_session");
                window.location.reload();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-orange-600/25 active:scale-95 transition-all"
            >
              🔄 Refresh FoodBite
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (rootElement && window.ReactDOM) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

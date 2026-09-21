const { useState, useEffect, useRef } = React;

function escapeStr(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\x22/g, "&quot;")
    .replace(/\x27/g, "&#039;");
}

function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex flex-col space-y-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let bgClass = "bg-stone-900 border-stone-700 text-stone-100";
        let icon = "ℹ️";
        if (toast.type === "success") {
          bgClass = "bg-emerald-950/95 border-emerald-500 text-emerald-100 shadow-emerald-900/30";
          icon = "✅";
        } else if (toast.type === "error") {
          bgClass = "bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-900/30";
          icon = "⚠️";
        } else if (toast.type === "warning") {
          bgClass = "bg-amber-950/95 border-amber-500 text-amber-100 shadow-amber-900/30";
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
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
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
  const [mode, setMode] = useState("login");
  const [signupStep, setSignupStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());
  const isPasswordValid = password.length >= 6;
  const isNameValid = fullName.trim().length >= 2;
  const isUsernameValid = /^[a-z0-9_]{3,20}$/.test(username.trim().toLowerCase());

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password");
      }
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setErrorMessage(err.message || "Login failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextSignupStep = (e) => {
    e.preventDefault();
    setTouched((prev) => ({ ...prev, email: true, password: true }));
    if (!isEmailValid || !isPasswordValid) return;
    setErrorMessage("");
    setSignupStep(2);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setTouched((prev) => ({ ...prev, fullName: true, username: true }));
    if (!isNameValid || !isUsernameValid) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const resp = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
          username: username.trim().toLowerCase()
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
      }
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black text-white selection:bg-orange-600 selection:text-white">
      <div className="w-full max-w-sm sm:max-w-md bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-orange-950/20 space-y-6">
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-600 flex items-center justify-center text-3xl shadow-lg shadow-orange-600/30 animate-pulse">
              🔥
            </div>
            <div className="absolute -inset-1 rounded-3xl border border-orange-500/20 -z-10"></div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-serif">FoodBite</h1>
          <p className="text-xs text-zinc-400">
            Ephemeral food stories and daily culinary sharing
          </p>
        </div>

        <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage("");
              setTouched({});
            }}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              mode === "login"
                ? "bg-zinc-800 text-white shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setSignupStep(1);
              setErrorMessage("");
              setTouched({});
            }}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Create Profile
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs text-center font-medium animate-pop-in">
            {errorMessage}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                placeholder="chef@foodbite.com"
                className={`w-full px-4 py-3 rounded-2xl bg-zinc-900 border text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                  touched.email && !isEmailValid
                    ? "border-rose-500 focus:ring-rose-500/30"
                    : touched.email && isEmailValid
                    ? "border-emerald-500 focus:ring-emerald-500/30"
                    : "border-zinc-800 focus:ring-orange-500/30 focus:border-orange-500"
                }`}
              />
              {touched.email && !isEmailValid && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">Please enter a valid email address</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  placeholder="Your secure password"
                  className={`w-full px-4 py-3 pr-10 rounded-2xl bg-zinc-900 border text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                    touched.password && !isPasswordValid
                      ? "border-rose-500 focus:ring-rose-500/30"
                      : "border-zinc-800 focus:ring-orange-500/30 focus:border-orange-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {touched.password && !isPasswordValid && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">Password must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Logging in..." : "Log In to FoodBite"}
            </button>
          </form>
        ) : (
          <form onSubmit={signupStep === 1 ? handleNextSignupStep : handleSignupSubmit} className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-2">
              <span className="text-orange-400">Step {signupStep} of 2</span>
              <span>{signupStep === 1 ? "Credentials" : "Profile Details"}</span>
            </div>
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 ${
                  signupStep === 1 ? "w-1/2" : "w-full"
                }`}
              />
            </div>

            {signupStep === 1 ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    placeholder="you@domain.com"
                    className={`w-full px-4 py-3 rounded-2xl bg-zinc-900 border text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                      touched.email && !isEmailValid
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : touched.email && isEmailValid
                        ? "border-emerald-500 focus:ring-emerald-500/30"
                        : "border-zinc-800 focus:ring-orange-500/30 focus:border-orange-500"
                    }`}
                  />
                  {touched.email && !isEmailValid && (
                    <p className="text-[11px] text-rose-400 mt-1 font-medium">Valid email address required</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-4 py-3 pr-10 rounded-2xl bg-zinc-900 border text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                        touched.password && !isPasswordValid
                          ? "border-rose-500 focus:ring-rose-500/30"
                          : touched.password && isPasswordValid
                          ? "border-emerald-500 focus:ring-emerald-500/30"
                          : "border-zinc-800 focus:ring-orange-500/30 focus:border-orange-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {touched.password && !isPasswordValid && (
                    <p className="text-[11px] text-rose-400 mt-1 font-medium">Must be at least 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isEmailValid || !isPasswordValid}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Continue: Profile Info →
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                    placeholder="Sachin Bhandari"
                    className={`w-full px-4 py-3 rounded-2xl bg-zinc-900 border text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                      touched.fullName && !isNameValid
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : touched.fullName && isNameValid
                        ? "border-emerald-500 focus:ring-emerald-500/30"
                        : "border-zinc-800 focus:ring-orange-500/30 focus:border-orange-500"
                    }`}
                  />
                  {touched.fullName && !isNameValid && (
                    <p className="text-[11px] text-rose-400 mt-1 font-medium">Please enter your name</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Choose Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                      placeholder="sachin_chef"
                      className={`w-full pl-8 pr-4 py-3 rounded-2xl bg-zinc-900 border text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                        touched.username && !isUsernameValid
                          ? "border-rose-500 focus:ring-rose-500/30"
                          : touched.username && isUsernameValid
                          ? "border-emerald-500 focus:ring-emerald-500/30"
                          : "border-zinc-800 focus:ring-orange-500/30 focus:border-orange-500"
                      }`}
                    />
                  </div>
                  {touched.username && !isUsernameValid && (
                    <p className="text-[11px] text-rose-400 mt-1 font-medium">3-20 lowercase characters, numbers or underscores</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="w-1/3 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !isNameValid || !isUsernameValid}
                    className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? "Creating..." : "Create Profile 🔥"}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        <div className="text-center pt-2">
          {mode === "login" ? (
            <p className="text-xs text-zinc-500">
              New to FoodBite?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setSignupStep(1);
                  setErrorMessage("");
                }}
                className="font-bold text-orange-400 hover:underline"
              >
                Create new profile
              </button>
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                }}
                className="font-bold text-orange-400 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StoryViewerModal({ story, isOpen, onClose }) {
  if (!isOpen || !story) return null;

  const formatHoursLeft = (expiresAt) => {
    const remainingMs = Number(expiresAt) - Date.now();
    if (remainingMs <= 0) return "Expiring";
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours + "h " + mins + "m left";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm h-full max-h-[92vh] sm:max-h-[800px] sm:rounded-3xl overflow-hidden bg-zinc-950 flex flex-col justify-between">
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img
              src={story.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
              alt={story.username}
              className="w-9 h-9 rounded-full border border-orange-500 object-cover"
            />
            <div>
              <h4 className="text-xs font-black text-white">{story.username}</h4>
              <span className="text-[10px] text-orange-400 font-bold">
                ⏳ {formatHoursLeft(story.expiresAt)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 border border-zinc-700 text-white flex items-center justify-center hover:bg-black"
          >
            ✕
          </button>
        </div>

        <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
          {story.mediaType === "video" ? (
            <video
              src={story.mediaUrl}
              autoPlay
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={story.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {story.caption && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent z-30">
            <p className="text-xs text-white font-medium">{story.caption}</p>
          </div>
        )}
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

  if (!isOpen) return null;

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
      onStoryUploaded && onStoryUploaded(postData);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to post story");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 text-zinc-100 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white"
        >
          ✕
        </button>

        <div className="mb-4 text-center">
          <span className="inline-block px-3 py-1 mb-2 text-[10px] font-black uppercase tracking-wider rounded-full bg-orange-950 text-orange-400 border border-orange-800/40">
            24H Ephemeral Story
          </span>
          <h3 className="text-xl font-black text-white tracking-tight">Share Food Story</h3>
          <p className="text-xs text-zinc-400 mt-1">Direct camera capture or short video (max 10s)</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs text-center font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-4 text-center hover:border-orange-500 transition-colors">
            {previewUrl ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black">
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
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-orange-400">
                  {isVideo ? duration.toFixed(1) + "s / 10s" : "Photo"}
                </span>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-zinc-200">Open Camera / Select Media</span>
                <span className="text-[10px] text-zinc-500 mt-1">Photo or video under 10 seconds</span>
                <input
                  type="file"
                  accept={["image", "*"].join("/") + "," + ["video", "*"].join("/")}
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Food Story Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What are you cooking or tasting?"
              maxLength={280}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
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

function InstagramHomeFeed({ stories, currentUser, onTriggerUpload, onViewStory, showToast }) {
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});

  const formatHoursLeft = (expiresAt) => {
    const remainingMs = Number(expiresAt) - Date.now();
    if (remainingMs <= 0) return "Expiring";
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours + "h " + mins + "m left";
  };

  const toggleLike = (id) => {
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (id) => {
    const text = (newComments[id] || "").trim();
    if (!text) return;
    const author = currentUser ? (currentUser.username || currentUser.name) : "foodie";
    setComments((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), { id: Date.now(), author, text }]
    }));
    setNewComments((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="w-full max-w-md mx-auto pb-24 text-white">
      <div className="border-b border-zinc-900 bg-black/60 backdrop-blur-md sticky top-0 z-20">
        <div className="flex space-x-3.5 overflow-x-auto p-3.5 scrollbar-none items-center">
          <div className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer" onClick={onTriggerUpload}>
            <div className="relative">
              <div className="w-16 h-16 rounded-full p-[2px] border-2 border-dashed border-orange-500 flex items-center justify-center bg-zinc-900">
                <img
                  src={currentUser && currentUser.avatar ? currentUser.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                  alt="Your Story"
                  className="w-14 h-14 rounded-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-black">
                +
              </div>
            </div>
            <span className="text-[11px] font-bold text-zinc-300">Your Story</span>
          </div>

          {stories && stories.map((story, idx) => (
            <div
              key={story.id || idx}
              onClick={() => onViewStory(story)}
              className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer"
            >
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 shadow-md">
                <div className="p-[2px] bg-black rounded-full">
                  <img
                    src={story.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                    alt={story.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[11px] font-medium text-zinc-300 max-w-[64px] truncate">
                {story.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!stories || stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center my-8">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl mb-4 shadow-xl">
            🌮
          </div>
          <h3 className="text-lg font-black text-white">No Stories Right Now</h3>
          <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
            All food stories purge after 24 hours. Be the first to share today's kitchen creation!
          </p>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-600/30 hover:from-orange-500 hover:to-amber-500 active:scale-95 transition-all cursor-pointer"
          >
            🔥 Post Story
          </button>
        </div>
      ) : (
        <div className="divide-y divide-zinc-900">
          {stories.map((post, idx) => {
            const isLiked = likes[post.id];
            const postComments = comments[post.id] || [];

            return (
              <article key={post.id || idx} className="py-4 space-y-3">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onViewStory(post)}>
                    <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-500 to-orange-600">
                      <img
                        src={post.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                        alt={post.username}
                        className="w-9 h-9 rounded-full object-cover border border-black"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{post.username}</h4>
                      <span className="text-[10px] text-zinc-500 block">Food Creator</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-orange-400 px-2.5 py-1 rounded-full bg-orange-950/60 border border-orange-800/40">
                    ⏳ {formatHoursLeft(post.expiresAt)}
                  </span>
                </div>

                <div className="relative w-full aspect-square sm:aspect-[4/5] bg-zinc-950 overflow-hidden select-none">
                  {post.mediaType === "video" ? (
                    <video
                      src={post.mediaUrl}
                      playsInline
                      loop
                      autoPlay
                      muted
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || "Food story"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="px-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id)}
                        className={`transition-transform active:scale-125 cursor-pointer ${
                          isLiked ? "text-rose-500" : "text-white hover:text-rose-400"
                        }`}
                      >
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const inputEl = document.getElementById("comment-input-" + post.id);
                          if (inputEl) inputEl.focus();
                        }}
                        className="text-white hover:text-zinc-300 cursor-pointer"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: "FoodBite Story", text: post.caption, url: window.location.href }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            showToast("Link copied to clipboard!", "success");
                          }
                        }}
                        className="text-white hover:text-orange-400 cursor-pointer"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>

                    <span className="text-[11px] font-mono font-bold text-zinc-400">
                      {isLiked ? "❤️ Liked" : "Tap to like"}
                    </span>
                  </div>

                  {post.caption && (
                    <div className="text-xs text-zinc-200 leading-relaxed pt-1">
                      <span className="font-black text-white mr-2">{post.username}</span>
                      <span>{post.caption}</span>
                    </div>
                  )}

                  {postComments.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {postComments.map((c) => (
                        <p key={c.id} className="text-xs text-zinc-300">
                          <span className="font-bold text-white mr-1.5">{c.author}</span>
                          {c.text}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2 border-t border-zinc-900">
                    <input
                      id={"comment-input-" + post.id}
                      type="text"
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!(newComments[post.id] || "").trim()}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 disabled:opacity-30 cursor-pointer"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExploreView({ stories, onViewStory }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = (stories || []).filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (s.username && s.username.toLowerCase().includes(q)) || (s.caption && s.caption.toLowerCase().includes(q));
  });

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-24 text-white space-y-4">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search food stories or creators..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filtered.map((story, idx) => (
          <div
            key={story.id || idx}
            onClick={() => onViewStory(story)}
            className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-850 cursor-pointer group"
          >
            {story.mediaType === "video" ? (
              <video src={story.mediaUrl} className="w-full h-full object-cover" />
            ) : (
              <img src={story.mediaUrl} alt="Explore" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold">{story.mediaType === "video" ? "🎬" : "📷"}</span>
            </div>
            {story.mediaType === "video" && (
              <span className="absolute top-1.5 right-1.5 text-[10px]">🎬</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityView({ currentUser, userProfile }) {
  return (
    <div className="w-full max-w-md mx-auto p-4 pb-24 text-white space-y-4">
      <h3 className="text-base font-black tracking-tight">Activity & Alerts</h3>
      <div className="space-y-2.5">
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-lg">
            🔥
          </div>
          <div>
            <p className="text-xs font-bold text-white">Daily Streak Active</p>
            <p className="text-[11px] text-zinc-400">
              {userProfile && userProfile.user && userProfile.user.streak > 0
                ? "You are on a " + userProfile.user.streak + "-day culinary streak!"
                : "Post today's food story to start your daily streak."}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-lg">
            ⏳
          </div>
          <div>
            <p className="text-xs font-bold text-white">24-Hour Ephemeral Timer</p>
            <p className="text-[11px] text-zinc-400">Stories automatically delete 24 hours after upload.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-lg">
            ❤️
          </div>
          <div>
            <p className="text-xs font-bold text-white">FoodBite Community</p>
            <p className="text-[11px] text-zinc-400">Discover and react to trending dishes in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserProfileView({ userProfile, onTriggerUpload, onLogout }) {
  if (!userProfile || !userProfile.user) return null;
  const { user, activePosts } = userProfile;

  return (
    <div className="max-w-md w-full mx-auto pb-24 text-zinc-100 p-5 space-y-6">
      <div className="flex items-center space-x-4 pt-2">
        <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600">
          <img
            src={user.avatarUrl || user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
            alt={user.username}
            className="w-20 h-20 rounded-full border-2 border-black object-cover"
          />
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">{user.name || user.username}</h2>
          <p className="text-xs text-orange-400 font-mono font-bold">@{user.username}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950/40 border border-orange-500/30 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
              Daily Culinary Streak
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-black text-white">{user.streak}</span>
              <span className="text-xs font-bold text-zinc-400">Days Active</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-3xl animate-bounce">
            🔥
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            {user.streak > 0 ? "Streak window:" : "Streak reset:"}
          </span>
          <span className={`font-mono font-bold ${user.streak > 0 ? "text-amber-400" : "text-zinc-500"}`}>
            {user.streak > 0 ? user.hoursRemaining + "h left" : "Post to start"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onTriggerUpload}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer"
      >
        <span>🔥 Post Food Story</span>
      </button>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            My 24H Stories ({activePosts ? activePosts.length : 0})
          </h3>
          <span className="text-[10px] text-zinc-500">Auto-purges after 24h</span>
        </div>

        {!activePosts || activePosts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-900 text-center">
            <p className="text-xs text-zinc-500">No active stories in the 24-hour window.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {activePosts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800"
              >
                {post.mediaType === "video" ? (
                  <video src={post.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={post.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
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
        className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/40 text-xs font-bold transition-all cursor-pointer"
      >
        Sign Out of FoodBite
      </button>

      <div className="text-center pt-2">
        <p className="text-[10px] text-zinc-600">
          &copy; 2026 Online Recipe Sharing Platform. Built &amp; Engineered by Sachin Bhandari.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("foodbite_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.user) return parsed.user;
      }
    } catch (e) {}
    return null;
  });

  const [activeTab, setActiveTab] = useState("home");
  const [stories, setStories] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
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

  useEffect(() => {
    window.showToast = showToast;
    if (currentUser) {
      fetchStories();
      fetchProfile(currentUser.id || currentUser.uid);
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("foodbite_session");
    setCurrentUser(null);
    showToast("Signed out successfully", "info");
  };

  if (!currentUser) {
    return (
      <div className="h-full w-full bg-black text-white overflow-y-auto">
        <AuthScreen
          onAuthSuccess={(user, token) => {
            localStorage.setItem("foodbite_session", JSON.stringify({ user, token }));
            setCurrentUser(user);
            showToast("Welcome to FoodBite, " + (user.name || user.username) + "! 🔥", "success");
            fetchProfile(user.id);
            fetchStories();
          }}
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-black text-white selection:bg-orange-600 selection:text-white overflow-hidden">
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex items-center justify-between max-w-md w-full mx-auto">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab("home")}>
          <span className="text-2xl animate-pulse">🔥</span>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white font-serif">FoodBite</h1>
            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block -mt-1">
              Stories
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {userProfile && userProfile.user && (
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-orange-500/40 text-xs font-black text-orange-400 shadow-sm"
              title="Daily Active Streak"
            >
              <span>🔥</span>
              <span>{userProfile.user.streak}d</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setStoryModalOpen(true)}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center hover:text-orange-400"
            title="Post Story"
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
            onTriggerUpload={() => setStoryModalOpen(true)}
            onViewStory={(story) => setViewingStory(story)}
            showToast={showToast}
          />
        )}
        {activeTab === "explore" && (
          <ExploreView
            stories={stories}
            onViewStory={(story) => setViewingStory(story)}
          />
        )}
        {activeTab === "activity" && (
          <ActivityView
            currentUser={currentUser}
            userProfile={userProfile}
          />
        )}
        {activeTab === "profile" && (
          <UserProfileView
            userProfile={userProfile}
            onTriggerUpload={() => setStoryModalOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 h-16 bg-black/95 border-t border-zinc-900 flex items-center justify-around px-4 backdrop-blur-lg max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer ${
            activeTab === "home" ? "text-orange-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("explore")}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer ${
            activeTab === "explore" ? "text-orange-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span className="text-xl">🔍</span>
          <span className="text-[10px]">Explore</span>
        </button>

        <button
          type="button"
          onClick={() => setStoryModalOpen(true)}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-orange-600/40 active:scale-95 transition-transform cursor-pointer"
          title="Capture Story"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer ${
            activeTab === "activity" ? "text-orange-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span className="text-xl">❤️</span>
          <span className="text-[10px]">Activity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer ${
            activeTab === "profile" ? "text-orange-500 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span className="text-xl">👤</span>
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      <UploadStoryModal
        isOpen={storyModalOpen}
        onClose={() => setStoryModalOpen(false)}
        currentUser={currentUser}
        onStoryUploaded={() => {
          fetchStories();
          fetchProfile();
          setActiveTab("home");
        }}
        showToast={showToast}
      />

      <StoryViewerModal
        isOpen={!!viewingStory}
        story={viewingStory}
        onClose={() => setViewingStory(null)}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement && window.ReactDOM) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

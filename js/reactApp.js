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

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium text-center animate-fade-in">
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
                <p className="text-[11px] text-rose-400 mt-1 font-medium">Password must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isEmailValid || !isPasswordValid}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Signing in..." : "Sign In 🔥"}
            </button>
          </form>
        ) : (
          <form onSubmit={signupStep === 1 ? handleNextSignupStep : handleSignupSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900 text-xs font-bold">
              <span className={signupStep === 1 ? "text-orange-400" : "text-zinc-500"}>Step 1: Security</span>
              <span className="text-zinc-600">→</span>
              <span className={signupStep === 2 ? "text-orange-400" : "text-zinc-500"}>Step 2: Profile Info</span>
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
                    placeholder="name@domain.com"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
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

function HomeFeed({ posts, currentUser, followingList, onToggleFollow, onTriggerUpload, showToast }) {
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  const currentUserId = currentUser ? (currentUser.id || currentUser.uid) : "usr-1";

  const toggleLike = (postId) => {
    setLikes((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleSendComment = (postId) => {
    const text = commentInput.trim();
    if (!text) return;
    const author = currentUser ? (currentUser.username || currentUser.name) : "foodie";
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { id: Date.now(), author, text }]
    }));
    setCommentInput("");
    showToast("Comment posted!", "success");
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({
        title: "FoodBite Post by " + post.username,
        text: post.caption || "Check out this food post on FoodBite!",
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    }
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-black select-none">
        <div className="relative w-20 h-20 mb-4">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl shadow-2xl animate-pulse">
            🌮
          </div>
          <div className="absolute -inset-1 rounded-3xl border border-orange-500/20 animate-spin"></div>
        </div>
        <h3 className="text-xl font-black text-white">No Posts Yet</h3>
        <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
          The feed is empty. Be the first to share a food post!
        </p>
        <button
          type="button"
          onClick={onTriggerUpload}
          className="mt-6 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-orange-600/30 active:scale-95 transition-all cursor-pointer"
        >
          🔥 Create Post
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-none bg-black select-none">
      <div className="sticky top-0 z-30 w-full max-w-lg mx-auto bg-black/80 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔥</span>
            <span className="font-serif font-black text-lg text-white tracking-tight">FoodBite</span>
          </div>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
            title="New Post"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-28">
        {posts.map((post) => {
          const isLiked = likes[post.id];
          const isFollowing = followingList && followingList.includes(post.userId);
          const isAuthorSelf = post.userId === currentUserId;
          const postComments = comments[post.id] || [];

          return (
            <article
              key={post.id}
              className="border-b border-zinc-800/70"
            >
              <div className="px-4 pt-3 pb-2.5">
                <div className="flex items-start space-x-3">
                  <img
                    src={post.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                    alt={post.username}
                    className="w-10 h-10 rounded-full border border-zinc-700 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="text-sm font-bold text-white truncate">
                          {post.name || post.username}
                        </span>
                        <span className="text-sm text-zinc-500 truncate">
                          @{post.username}
                        </span>
                        <span className="text-zinc-600 text-xs flex-shrink-0">·</span>
                        <span className="text-xs text-zinc-500 flex-shrink-0">
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        {!isAuthorSelf && (
                          <button
                            type="button"
                            onClick={() => onToggleFollow(post.userId, post.username)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                              isFollowing
                                ? "bg-transparent border border-zinc-600 text-zinc-300 hover:border-rose-900 hover:text-rose-400"
                                : "bg-white text-black hover:bg-zinc-200"
                            }`}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>
                    </div>

                    {post.caption && (
                      <p className="text-sm text-zinc-100 leading-relaxed mt-1.5 whitespace-pre-wrap break-words">
                        {decodeUnicode(post.caption)}
                      </p>
                    )}

                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-orange-950/50 border border-orange-500/30 text-[10px] font-bold text-orange-400 mt-2">
                      <span>⏳</span>
                      <span>{formatHoursLeft(post.expiresAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {post.mediaUrl && (
                <div className="px-4 pb-2">
                  <div className="ml-[52px]">
                    {post.mediaType === "video" ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full rounded-2xl border border-zinc-800 object-cover max-h-[480px]"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.caption || "Food post"}
                        className="w-full rounded-2xl border border-zinc-800 object-cover max-h-[480px]"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="px-4 pb-3">
                <div className="ml-[52px] flex items-center justify-between max-w-[320px]">
                  <button
                    type="button"
                    onClick={() => setActiveCommentPostId(post.id)}
                    className="group flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-sky-500/10 transition-colors">
                      <svg className="w-[18px] h-[18px] text-zinc-500 group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className={`text-xs ${postComments.length > 0 ? "text-zinc-400" : "text-zinc-600"} group-hover:text-sky-400 transition-colors`}>
                      {postComments.length > 0 ? postComments.length : ""}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleLike(post.id)}
                    className="group flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-rose-500/10 transition-colors">
                      {isLiked ? (
                        <svg className="w-[18px] h-[18px] text-rose-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      ) : (
                        <svg className="w-[18px] h-[18px] text-zinc-500 group-hover:text-rose-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs ${isLiked ? "text-rose-500" : "text-zinc-600"} group-hover:text-rose-400 transition-colors`}>
                      {isLiked ? "1" : ""}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className="group flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                      <svg className="w-[18px] h-[18px] text-zinc-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="group flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                      <svg className="w-[18px] h-[18px] text-zinc-500 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {activeCommentPostId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg mx-auto bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-4 space-y-3 shadow-2xl max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <span className="text-xs font-black uppercase tracking-wider text-white">Comments</span>
              <button
                type="button"
                onClick={() => setActiveCommentPostId(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 py-2">
              {(comments[activeCommentPostId] || []).length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">No comments yet. Be the first to reply!</p>
              ) : (
                (comments[activeCommentPostId] || []).map((c) => (
                  <div key={c.id} className="flex items-start space-x-2.5 py-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-orange-400 font-bold flex-shrink-0">
                      {c.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white mr-1.5">@{c.author}</span>
                      <span className="text-xs text-zinc-300">{c.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-zinc-900">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendComment(activeCommentPostId);
                }}
                placeholder="Post your reply..."
                className="flex-1 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => handleSendComment(activeCommentPostId)}
                disabled={!commentInput.trim()}
                className="px-4 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold disabled:opacity-30 cursor-pointer transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityView({ currentUser, userProfile, notifications, onRefreshNotifs }) {
  return (
    <div className="w-full max-w-sm mx-auto p-4 pb-28 text-white space-y-4 animate-fade-in">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">Activity &amp; Alerts</h2>
          <p className="text-[11px] text-zinc-400">Updates from creators you follow</p>
        </div>
        <button
          type="button"
          onClick={onRefreshNotifs}
          className="px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      {userProfile && userProfile.user && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-orange-950/60 to-amber-950/40 border border-orange-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl">
              🔥
            </div>
            <div>
              <p className="text-xs font-black text-white">Daily Streak Active</p>
              <p className="text-[11px] text-zinc-300">
                {userProfile.user.streak > 0
                  ? userProfile.user.streak + "-day culinary streak in progress!"
                  : "Post today's food story to ignite your streak."}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-black text-orange-400">
            {userProfile.user.streak}d
          </span>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 px-1">
          Notification Inbox
        </h3>

        {!notifications || notifications.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl mx-auto">
              📬
            </div>
            <p className="text-xs font-bold text-white">No New Notifications</p>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
              When food creators you follow publish new daily food stories, alerts will show up right here in real time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900 rounded-3xl bg-zinc-950 border border-zinc-900 overflow-hidden">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 flex items-center space-x-3 hover:bg-zinc-900/40 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={notif.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                    alt={notif.senderName}
                    className="w-11 h-11 rounded-full border border-orange-500 object-cover"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-600 border-2 border-black flex items-center justify-center text-[10px]">
                    🔥
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-200 leading-snug">
                    <strong className="text-white font-black mr-1">{notif.senderName}</strong>
                    just posted a new daily food story.
                  </p>
                  <span className="text-[10px] text-orange-400 font-mono font-medium block mt-1">
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

function UserProfileView({ userProfile, currentUser, followingList, onTriggerUpload, onLogout }) {
  if (!userProfile || !userProfile.user) return null;
  const { user, activePosts } = userProfile;

  return (
    <div className="max-w-sm w-full mx-auto pb-28 text-zinc-100 p-4 space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4 pt-2">
        <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 shadow-xl">
          <img
            src={user.avatarUrl || user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
            alt={user.username}
            className="w-20 h-20 rounded-full border-2 border-black object-cover"
          />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white tracking-tight">{user.name || user.username}</h2>
          <p className="text-xs text-orange-400 font-mono font-bold">@{user.username}</p>
          <p className="text-[11px] text-zinc-400">{user.email}</p>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-medium">
            Following <strong className="text-white ml-1 font-bold">{(followingList || []).length}</strong>
          </div>
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

function FloatingGlassNavBar({ activeTab, setActiveTab, onTriggerUpload, unreadCount }) {
  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 rounded-3xl bg-zinc-950/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/90 flex items-center justify-around px-4 z-40">
      <button
        type="button"
        onClick={() => setActiveTab("home")}
        className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
          activeTab === "home" ? "text-orange-500 font-bold scale-105" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <span className="text-xl">🏠</span>
        <span className="text-[10px]">Feed</span>
      </button>

      <button
        type="button"
        onClick={onTriggerUpload}
        className="w-12 h-12 -mt-4 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-orange-600/40 active:scale-95 transition-transform cursor-pointer"
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
          activeTab === "activity" ? "text-orange-500 font-bold scale-105" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <span className="text-xl">❤️</span>
        <span className="text-[10px]">Activity</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black border border-black animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("profile")}
        className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
          activeTab === "profile" ? "text-orange-500 font-bold scale-105" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <span className="text-xl">👤</span>
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
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
          streak: 5
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
    <div className="h-full w-full flex flex-col bg-black text-white selection:bg-orange-600 selection:text-white overflow-hidden relative">
      <main className="flex-1 h-full w-full overflow-hidden">
        {activeTab === "home" && (
          <HomeFeed
            posts={stories}
            currentUser={currentUser}
            followingList={followingList}
            onToggleFollow={handleToggleFollow}
            onTriggerUpload={() => setStoryModalOpen(true)}
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

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement && window.ReactDOM) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

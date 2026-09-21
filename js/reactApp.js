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

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                placeholder="chef@foodbite.com"
                className={`w-full px-4 py-3 rounded-2xl bg-stone-50 border text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  touched.email && !isEmailValid
                    ? "border-rose-500 focus:ring-rose-500/30"
                    : touched.email && isEmailValid
                    ? "border-emerald-500 focus:ring-emerald-500/30"
                    : "border-stone-200 focus:ring-orange-500/30 focus:border-orange-500"
                }`}
              />
              {touched.email && !isEmailValid && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">Please enter a valid email address</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  placeholder="Your secure password"
                  className={`w-full px-4 py-3 pr-10 rounded-2xl bg-stone-50 border text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    touched.password && !isPasswordValid
                      ? "border-rose-500 focus:ring-rose-500/30"
                      : touched.password && isPasswordValid
                      ? "border-emerald-500 focus:ring-emerald-500/30"
                      : "border-stone-200 focus:ring-orange-500/30 focus:border-orange-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {touched.password && !isPasswordValid && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">Password must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isEmailValid || !isPasswordValid}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Signing in..." : "Sign In 🔥"}
            </button>
          </form>
        ) : (
          <form onSubmit={signupStep === 1 ? handleNextSignupStep : handleSignupSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-xs font-bold">
              <span className={signupStep === 1 ? "text-orange-600" : "text-stone-400"}>Step 1: Security</span>
              <span className="text-stone-300">→</span>
              <span className={signupStep === 2 ? "text-orange-600" : "text-stone-400"}>Step 2: Profile Info</span>
            </div>

            {signupStep === 1 ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    placeholder="name@domain.com"
                    className={`w-full px-4 py-3 rounded-2xl bg-stone-50 border text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      touched.email && !isEmailValid
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : touched.email && isEmailValid
                        ? "border-emerald-500 focus:ring-emerald-500/30"
                        : "border-stone-200 focus:ring-orange-500/30 focus:border-orange-500"
                    }`}
                  />
                  {touched.email && !isEmailValid && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">Valid email address required</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-4 py-3 pr-10 rounded-2xl bg-stone-50 border text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        touched.password && !isPasswordValid
                          ? "border-rose-500 focus:ring-rose-500/30"
                          : touched.password && isPasswordValid
                          ? "border-emerald-500 focus:ring-emerald-500/30"
                          : "border-stone-200 focus:ring-orange-500/30 focus:border-orange-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {touched.password && !isPasswordValid && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">Must be at least 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isEmailValid || !isPasswordValid}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Continue: Profile Info →
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                    placeholder="Sachin Bhandari"
                    className={`w-full px-4 py-3 rounded-2xl bg-stone-50 border text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      touched.fullName && !isNameValid
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : touched.fullName && isNameValid
                        ? "border-emerald-500 focus:ring-emerald-500/30"
                        : "border-stone-200 focus:ring-orange-500/30 focus:border-orange-500"
                    }`}
                  />
                  {touched.fullName && !isNameValid && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">Please enter your name</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Choose Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                      placeholder="sachin_chef"
                      className={`w-full pl-8 pr-4 py-3 rounded-2xl bg-stone-50 border text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        touched.username && !isUsernameValid
                          ? "border-rose-500 focus:ring-rose-500/30"
                          : touched.username && isUsernameValid
                          ? "border-emerald-500 focus:ring-emerald-500/30"
                          : "border-stone-200 focus:ring-orange-500/30 focus:border-orange-500"
                      }`}
                    />
                  </div>
                  {touched.username && !isUsernameValid && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">3-20 lowercase characters, numbers or underscores</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="w-1/3 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !isNameValid || !isUsernameValid}
                    className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
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
            <p className="text-xs text-stone-500">
              New to FoodBite?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setSignupStep(1);
                  setErrorMessage("");
                }}
                className="font-bold text-orange-600 hover:underline cursor-pointer"
              >
                Create new profile
              </button>
            </p>
          ) : (
            <p className="text-xs text-stone-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                }}
                className="font-bold text-orange-600 hover:underline cursor-pointer"
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

function ImmersiveFeed({ posts, currentUser, followingList, onToggleFollow, onTriggerUpload, onTriggerInstall, onDeletePost, showToast }) {
  const [likes, setLikes] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [comments, setComments] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [heartBursts, setHeartBursts] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef(null);
  const postRefs = useRef({});
  const lastTapRef = useRef({});

  const currentUserId = currentUser ? (currentUser.id || currentUser.uid) : "usr-1";

  useEffect(() => {
    if (!posts || posts.length === 0) return;
    setProgress(0);
    const duration = 10000;
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (activeIndex < posts.length - 1) {
            const nextIdx = activeIndex + 1;
            const targetEl = postRefs.current[nextIdx];
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "smooth" });
            }
          }
          return 100;
        }
        return Math.min(100, prev + step);
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [activeIndex, posts ? posts.length : 0]);

  const handleScroll = () => {
    if (!containerRef.current || !posts || posts.length === 0) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    if (height <= 0) return;
    const idx = Math.round(scrollTop / height);
    if (idx !== activeIndex && idx >= 0 && idx < posts.length) {
      setActiveIndex(idx);
    }
  };

  const handleDoubleTap = (postId) => {
    setLikes((prev) => ({ ...prev, [postId]: true }));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (likes[postId] ? 0 : 1)
    }));

    if (navigator.vibrate) {
      try {
        navigator.vibrate([50]);
      } catch (e) {}
    }

    setHeartBursts((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setHeartBursts((prev) => ({ ...prev, [postId]: false }));
    }, 800);
  };

  const handleTouchEnd = (postId) => {
    const now = Date.now();
    const last = lastTapRef.current[postId] || 0;
    if (now - last < 300) {
      handleDoubleTap(postId);
      lastTapRef.current[postId] = 0;
    } else {
      lastTapRef.current[postId] = now;
    }
  };

  const toggleLike = (postId) => {
    const nextState = !likes[postId];
    setLikes((prev) => ({ ...prev, [postId]: nextState }));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) + (nextState ? 1 : -1))
    }));
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
        title: "FoodBite Story by " + post.username,
        text: post.caption || "Check out this food story on FoodBite!",
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    }
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-stone-50 select-none">
        <div className="relative w-20 h-20 mb-4">
          <div className="w-20 h-20 rounded-3xl bg-white border border-stone-200 flex items-center justify-center text-4xl shadow-xl animate-pulse">
            🌮
          </div>
          <div className="absolute -inset-1 rounded-3xl border border-orange-500/30 animate-spin"></div>
        </div>
        <h3 className="text-xl font-black text-stone-900">No Stories in Feed</h3>
        <p className="text-xs text-stone-500 mt-2 max-w-xs leading-relaxed">
          Daily stories expire after 24 hours. Be the first to share today's culinary creation!
        </p>
        <button
          type="button"
          onClick={onTriggerUpload}
          className="mt-6 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-orange-600/25 active:scale-95 transition-all cursor-pointer"
        >
          🔥 Post Food Story
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none bg-stone-950 relative select-none"
    >
      <div className="fixed top-0 inset-x-0 h-[2px] z-50 pointer-events-none bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 transition-[width] duration-100 ease-linear"
          style={{ width: progress + "%" }}
        />
      </div>

      <div className="fixed top-3 inset-x-4 z-30 flex items-center justify-between p-2 px-3.5 pointer-events-none max-w-sm mx-auto bg-white/85 backdrop-blur-xl border border-white/70 rounded-full shadow-lg shadow-stone-900/10">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <span className="text-lg">🔥</span>
          <span className="font-serif font-black text-sm text-stone-900 tracking-tight">FoodBite</span>
        </div>
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            type="button"
            onClick={onTriggerInstall}
            className="px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-[11px] font-bold flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
            title="Install FoodBite as App"
          >
            <span>📱</span>
            <span>App</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 flex items-center justify-center text-xs shadow-sm transition-colors cursor-pointer"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {posts.map((post, idx) => {
        const isLiked = !!likes[post.id];
        const likeCount = (likeCounts[post.id] || 0) + (isLiked && likeCounts[post.id] === undefined ? 1 : 0);
        const isFollowing = followingList && followingList.includes(post.userId);
        const isAuthorSelf = post.userId === currentUserId;
        const postComments = comments[post.id] || [];

        return (
          <div
            key={post.id}
            ref={(el) => { postRefs.current[idx] = el; }}
            className="relative w-full h-full min-w-0 snap-start snap-always overflow-hidden bg-stone-950 flex-shrink-0 flex items-center justify-center"
          >
            <div
              className="absolute inset-0 w-full h-full overflow-hidden cursor-pointer"
              onDoubleClick={() => handleDoubleTap(post.id)}
              onTouchEnd={() => handleTouchEnd(post.id)}
            >
              {post.mediaType === "video" ? (
                <>
                  <video
                    src={post.mediaUrl}
                    playsInline
                    loop
                    autoPlay
                    muted
                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-50 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl pointer-events-none" />
                  <video
                    src={post.mediaUrl}
                    playsInline
                    loop
                    autoPlay
                    muted={isMuted}
                    className="relative z-10 w-full h-full object-contain pointer-events-auto"
                  />
                </>
              ) : (
                <>
                  <img
                    src={post.mediaUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-50 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl pointer-events-none" />
                  <img
                    src={post.mediaUrl}
                    alt={post.caption || "Food story"}
                    className="relative z-10 w-full h-full object-contain pointer-events-auto"
                  />
                </>
              )}
            </div>

            <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-24 z-10 bg-gradient-to-b from-stone-900/40 to-transparent pointer-events-none" />

            {heartBursts[post.id] && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-heart-burst">
                <svg className="w-24 h-24 text-rose-500 fill-current drop-shadow-[0_0_24px_rgba(244,63,94,0.85)]" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            )}

            <div className="absolute bottom-24 left-3.5 right-20 z-20 pointer-events-none">
              <div className="p-3.5 rounded-3xl bg-white/85 border border-white/80 backdrop-blur-xl shadow-2xl shadow-stone-950/15 space-y-2 pointer-events-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={post.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                      alt={post.username}
                      className="w-9 h-9 rounded-full border-2 border-orange-500 object-cover shadow-sm flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-black text-stone-900 truncate block">
                        @{post.username}
                      </span>
                      <div className="inline-flex items-center space-x-1 px-2 py-0.2 rounded-full bg-orange-100/90 border border-orange-200 text-[10px] font-bold text-orange-800">
                        <span>⏳</span>
                        <span>{formatHoursLeft(post.expiresAt)}</span>
                      </div>
                    </div>
                  </div>

                  {!isAuthorSelf ? (
                    <button
                      type="button"
                      onClick={() => onToggleFollow(post.userId, post.username)}
                      className={`ml-2 px-3 py-1 rounded-full text-[11px] font-black tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer flex-shrink-0 ${
                        isFollowing
                          ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300"
                          : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-orange-500/20"
                      }`}
                    >
                      {isFollowing ? "✓ Following" : "+ Follow"}
                    </button>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-stone-100 text-[10px] text-stone-500 font-bold border border-stone-200 flex-shrink-0">
                      You
                    </span>
                  )}
                </div>

                {post.caption && (
                  <p className="text-xs text-stone-800 leading-relaxed font-medium line-clamp-3 pr-1">
                    {decodeUnicode(post.caption)}
                  </p>
                )}
              </div>
            </div>

            <div className="absolute right-3.5 bottom-24 z-20 flex flex-col items-center space-y-3.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => toggleLike(post.id)}
                className="flex flex-col items-center space-y-1 transition-transform active:scale-125 cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-xl ${
                  isLiked
                    ? "bg-rose-500 border-rose-400 text-white shadow-rose-500/30"
                    : "bg-white/90 border-stone-200/90 text-stone-700 hover:text-rose-500"
                }`}>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  {likeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCommentPostId(post.id)}
                className="flex flex-col items-center space-y-1 transition-transform active:scale-110 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-white/90 border border-stone-200/90 backdrop-blur-xl text-stone-700 flex items-center justify-center shadow-xl hover:text-orange-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  {postComments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleShare(post)}
                className="flex flex-col items-center space-y-1 transition-transform active:scale-110 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-white/90 border border-stone-200/90 backdrop-blur-xl text-stone-700 flex items-center justify-center shadow-xl hover:text-orange-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Share</span>
              </button>

              {isAuthorSelf && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this food story?")) {
                      onDeletePost && onDeletePost(post.id);
                    }
                  }}
                  className="flex flex-col items-center space-y-1 transition-transform active:scale-110 cursor-pointer group"
                  title="Delete Story"
                >
                  <div className="w-11 h-11 rounded-full bg-white/90 border border-stone-200/90 backdrop-blur-xl text-stone-500 group-hover:text-rose-600 flex items-center justify-center shadow-xl transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-white group-hover:text-rose-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Delete</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {activeCommentPostId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm mx-auto bg-white border-t border-stone-200 rounded-t-3xl p-4 space-y-3 shadow-2xl max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-xs font-black uppercase tracking-wider text-stone-900">Comments</span>
              <button
                type="button"
                onClick={() => setActiveCommentPostId(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 py-2">
              {(comments[activeCommentPostId] || []).length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-6">No comments yet. Say something nice!</p>
              ) : (
                (comments[activeCommentPostId] || []).map((c) => (
                  <div key={c.id} className="p-2.5 rounded-2xl bg-stone-100 text-xs">
                    <span className="font-bold text-orange-600 mr-2">@{c.author}</span>
                    <span className="text-stone-800">{c.text}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-stone-200">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendComment(activeCommentPostId);
                }}
                placeholder="Add a culinary comment..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => handleSendComment(activeCommentPostId)}
                disabled={!commentInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
              >
                Post
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
      <main className="flex-1 h-full w-full overflow-hidden">
        {activeTab === "home" && (
          <ImmersiveFeed
            posts={stories}
            currentUser={currentUser}
            followingList={followingList}
            onToggleFollow={handleToggleFollow}
            onTriggerUpload={() => setStoryModalOpen(true)}
            onTriggerInstall={() => setShowInstallModal(true)}
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

const rootElement = document.getElementById("root");
if (rootElement && window.ReactDOM) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

const {
  useState,
  useEffect,
  useRef,
  useMemo
} = React;
function escapeStr(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\x22/g, "&quot;").replace(/\x27/g, "&#039;");
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
  if (remainingMs <= 0) return "Expiring soon";
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const mins = Math.floor(remainingMs % (1000 * 60 * 60) / (1000 * 60));
  if (hours <= 0) return mins + "m left";
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
function compressImageFile(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }
    const fileType = file.type || "";
    if (fileType.indexOf("image/") !== 0) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Unable to read image file"));
      reader.readAsDataURL(file);
      return;
    }
    if (fileType === "image/gif" || fileType === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Unable to read image file"));
      reader.readAsDataURL(file);
      return;
    }
    const processBlob = (srcUrl, isBlobUrl) => {
      const img = new Image();
      img.onload = () => {
        if (isBlobUrl) {
          try {
            URL.revokeObjectURL(srcUrl);
          } catch (e) {}
        }
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round(height * maxWidth / width);
              width = maxWidth;
            } else {
              width = Math.round(width * maxWidth / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(srcUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch (err) {
          resolve(srcUrl);
        }
      };
      img.onerror = () => {
        if (isBlobUrl) {
          try {
            URL.revokeObjectURL(srcUrl);
          } catch (e) {}
        }
        const fallbackReader = new FileReader();
        fallbackReader.onload = () => resolve(fallbackReader.result);
        fallbackReader.onerror = () => reject(new Error("Failed to load image file"));
        fallbackReader.readAsDataURL(file);
      };
      img.src = srcUrl;
    };
    let objUrl = "";
    try {
      objUrl = URL.createObjectURL(file);
    } catch (e) {
      objUrl = "";
    }
    if (objUrl) {
      processBlob(objUrl, true);
    } else {
      const reader = new FileReader();
      reader.onload = ev => processBlob(ev.target.result, false);
      reader.onerror = () => reject(new Error("Unable to read image file"));
      reader.readAsDataURL(file);
    }
  });
}
const CATEGORIES = [{
  id: "all",
  label: "All Recipes",
  icon: "✨",
  color: "#F43F5E",
  gradient: "from-rose-500 via-amber-500 to-emerald-500",
  badgeClass: "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs",
  chipActive: "bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 text-white shadow-md shadow-rose-500/30 scale-[1.03]"
}, {
  id: "breakfast",
  label: "Breakfast",
  icon: "🍳",
  color: "#F59E0B",
  gradient: "from-amber-400 to-orange-500",
  badgeClass: "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700",
  chipActive: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-[1.03]"
}, {
  id: "lunch",
  label: "Lunch",
  icon: "🥪",
  color: "#10B981",
  gradient: "from-emerald-500 to-teal-500",
  badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700",
  chipActive: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 scale-[1.03]"
}, {
  id: "dinner",
  label: "Dinner",
  icon: "🍝",
  color: "#F43F5E",
  gradient: "from-rose-500 to-red-600",
  badgeClass: "bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700",
  chipActive: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30 scale-[1.03]"
}, {
  id: "desserts",
  label: "Desserts",
  icon: "🍰",
  color: "#EC4899",
  gradient: "from-pink-500 to-rose-400",
  badgeClass: "bg-pink-100 text-pink-900 border border-pink-300 dark:bg-pink-950/70 dark:text-pink-300 dark:border-pink-700",
  chipActive: "bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md shadow-pink-500/30 scale-[1.03]"
}, {
  id: "quick",
  label: "Quick Meals",
  icon: "⚡",
  color: "#8B5CF6",
  gradient: "from-violet-600 to-indigo-500",
  badgeClass: "bg-violet-100 text-violet-900 border border-violet-300 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-700",
  chipActive: "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/30 scale-[1.03]"
}, {
  id: "vegetarian",
  label: "Vegetarian",
  icon: "🌱",
  color: "#84CC16",
  gradient: "from-lime-500 to-emerald-600",
  badgeClass: "bg-lime-100 text-lime-900 border border-lime-300 dark:bg-lime-950/70 dark:text-lime-300 dark:border-lime-700",
  chipActive: "bg-gradient-to-r from-lime-500 to-emerald-600 text-white shadow-md shadow-lime-500/30 scale-[1.03]"
}, {
  id: "healthy",
  label: "Healthy",
  icon: "🥗",
  color: "#14B8A6",
  gradient: "from-teal-500 to-cyan-600",
  badgeClass: "bg-teal-100 text-teal-900 border border-teal-300 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-700",
  chipActive: "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/30 scale-[1.03]"
}, {
  id: "snacks",
  label: "Snacks",
  icon: "🌮",
  color: "#F97316",
  gradient: "from-orange-500 to-amber-500",
  badgeClass: "bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-700",
  chipActive: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 scale-[1.03]"
}, {
  id: "drinks",
  label: "Drinks",
  icon: "☕",
  color: "#06B6D4",
  gradient: "from-cyan-500 to-blue-600",
  badgeClass: "bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-700",
  chipActive: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 scale-[1.03]"
}];
function getCategoryMeta(catId) {
  const norm = (catId || "general").toLowerCase();
  const match = CATEGORIES.find(c => c.id === norm || norm.includes(c.id));
  if (match) return match;
  return {
    id: norm,
    label: (catId || "Recipe").charAt(0).toUpperCase() + (catId || "Recipe").slice(1),
    icon: "🍽️",
    color: "#F43F5E",
    gradient: "from-rose-500 to-amber-500",
    badgeClass: "bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700",
    chipActive: "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/30"
  };
}
function ThemeToggle({
  theme,
  onToggleTheme
}) {
  const isDark = theme === "dark";
  return React.createElement("button", {
    type: "button",
    onClick: onToggleTheme,
    className: "p-2 rounded-full border border-[#E5E7EB] dark:border-[#2F2F2F] bg-white dark:bg-[#1C1C1C] hover:border-[#F97316] text-[#1F2937] dark:text-[#F9FAFB] transition-all cursor-pointer shadow-xs flex items-center justify-center w-9 h-9",
    title: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
    "aria-label": "Toggle theme"
  }, React.createElement("span", {
    className: "text-base leading-none transition-transform duration-200"
  }, isDark ? "☀️" : "🌙"));
}
function ToastContainer({
  toasts,
  removeToast
}) {
  return React.createElement("div", {
    className: "fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4"
  }, toasts.map(toast => React.createElement("div", {
    key: toast.id,
    className: `pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl shadow-lg border text-xs font-semibold tracking-wide animate-pop-in ${toast.type === "success" ? "bg-[#F0FDF4] dark:bg-[#052E16] text-[#15803D] dark:text-[#4ADE80] border-[#BBF7D0] dark:border-[#166534]" : toast.type === "error" ? "bg-[#FEF2F2] dark:bg-[#450A0A] text-[#B91C1C] dark:text-[#FCA5A5] border-[#FECACA] dark:border-[#991B1B]" : "bg-white dark:bg-[#1C1C1C] text-[#1F2937] dark:text-[#F9FAFB] border-[#E5E7EB] dark:border-[#2F2F2F]"}`
  }, React.createElement("span", {
    className: "flex-1 mr-2"
  }, toast.message), React.createElement("button", {
    type: "button",
    onClick: () => removeToast(toast.id),
    className: "text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] transition-colors cursor-pointer text-sm font-bold"
  }, "\u2715"))));
}
function LikesModal({
  isOpen,
  onClose,
  likes,
  currentUser,
  onToggleFollow,
  followingList
}) {
  if (!isOpen) return null;
  const currentUid = currentUser ? currentUser.id || currentUser.uid : "";
  const currentUname = currentUser ? (currentUser.username || currentUser.name || "").toLowerCase() : "";
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-3xl shadow-xl overflow-hidden animate-pop-in text-left",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-5 py-4 border-b border-[#E5E7EB] dark:border-[#2F2F2F] flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-base text-[#F97316]"
  }, "\u2764\uFE0F"), React.createElement("h3", {
    className: "text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading"
  }, "Liked by ", likes ? likes.length : 0, " ", likes && likes.length === 1 ? "Foodie" : "Foodies")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-7 h-7 rounded-full bg-[#F3F4F6] dark:bg-[#242424] text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] flex items-center justify-center text-xs font-bold cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]/60 dark:divide-[#2F2F2F]/60 p-2"
  }, !likes || likes.length === 0 ? React.createElement("div", {
    className: "p-8 text-center text-xs text-[#6B7280] dark:text-[#A1A1AA]"
  }, "No likes on this recipe yet. Be the first to crave it!") : likes.map((likeItem, idx) => {
    const uId = likeItem.userId || "usr-liker-" + idx;
    const uName = likeItem.username || "foodie";
    const isSelf = currentUid && currentUid === uId || currentUname && currentUname === uName.toLowerCase();
    const isFollowed = (followingList || []).includes(uId);
    return React.createElement("div", {
      key: idx,
      className: "p-3 flex items-center justify-between space-x-3 hover:bg-[#FFF9F3] dark:hover:bg-[#242424] rounded-2xl transition-colors"
    }, React.createElement("div", {
      className: "flex items-center space-x-3 min-w-0"
    }, React.createElement("img", {
      src: likeItem.userAvatar || "/uploads/avatars/" + uName + ".svg",
      alt: uName,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      className: "w-10 h-10 rounded-full object-cover border border-[#E5E7EB] dark:border-[#2F2F2F]"
    }), React.createElement("div", {
      className: "min-w-0"
    }, React.createElement("div", {
      className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] truncate"
    }, "@", uName), React.createElement("div", {
      className: "text-[10px] text-[#6B7280] dark:text-[#A1A1AA]"
    }, formatTimeAgo(likeItem.likedAt || Date.now())))), !isSelf && onToggleFollow && React.createElement("button", {
      type: "button",
      onClick: () => onToggleFollow(uId, uName),
      className: `px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${isFollowed ? "bg-[#F3F4F6] dark:bg-[#242424] text-[#6B7280] dark:text-[#A1A1AA]" : "bg-[#F97316] text-white hover:bg-[#EA580C]"}`
    }, isFollowed ? "Following" : "+ Follow"));
  }))));
}
function FoodCardSkeleton() {
  return React.createElement("div", {
    className: "recipe-card p-4 space-y-3.5 text-left"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("div", {
    className: "w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0"
  }), React.createElement("div", {
    className: "space-y-1.5 flex-1"
  }, React.createElement("div", {
    className: "h-3.5 w-24 rounded-md skeleton-shimmer"
  }), React.createElement("div", {
    className: "h-2.5 w-16 rounded-md skeleton-shimmer"
  }))), React.createElement("div", {
    className: "w-full aspect-[4/3] rounded-2xl skeleton-shimmer"
  }), React.createElement("div", {
    className: "space-y-2"
  }, React.createElement("div", {
    className: "h-4 w-3/4 rounded-md skeleton-shimmer"
  }), React.createElement("div", {
    className: "h-3 w-full rounded-md skeleton-shimmer"
  })), React.createElement("div", {
    className: "pt-2 border-t border-[#E5E7EB] dark:border-[#2F2F2F] flex justify-between"
  }, React.createElement("div", {
    className: "h-4 w-20 rounded-md skeleton-shimmer"
  }), React.createElement("div", {
    className: "h-4 w-8 rounded-md skeleton-shimmer"
  })));
}
function EmptyState({
  title,
  message,
  actionLabel,
  onAction
}) {
  return React.createElement("div", {
    className: "w-full py-16 px-6 text-center space-y-4 bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-3xl shadow-xs"
  }, React.createElement("div", {
    className: "w-16 h-16 mx-auto rounded-2xl bg-[#FFF9F3] dark:bg-[#242424] flex items-center justify-center text-3xl"
  }, "\uD83C\uDF72"), React.createElement("div", {
    className: "space-y-1 max-w-sm mx-auto"
  }, React.createElement("h4", {
    className: "text-base font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading"
  }, title || "No recipes found"), React.createElement("p", {
    className: "text-xs text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed"
  }, message || "Try adjusting your filters or share your first delicious kitchen creation.")), actionLabel && onAction && React.createElement("button", {
    type: "button",
    onClick: onAction,
    className: "px-5 py-2.5 btn-primary text-xs font-bold cursor-pointer"
  }, actionLabel));
}
function ErrorState({
  message,
  onRetry
}) {
  return React.createElement("div", {
    className: "p-8 text-center space-y-3 bg-[#FEF2F2] dark:bg-[#450A0A]/30 border border-[#FECACA] dark:border-[#991B1B]/40 rounded-3xl"
  }, React.createElement("span", {
    className: "text-3xl block"
  }, "\u26A0\uFE0F"), React.createElement("h4", {
    className: "text-sm font-bold text-[#B91C1C] dark:text-[#FCA5A5]"
  }, message || "Unable to load recipes right now."), onRetry && React.createElement("button", {
    type: "button",
    onClick: onRetry,
    className: "px-4 py-2 rounded-full bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold cursor-pointer"
  }, "Try Again"));
}
function AuthScreen({
  onAuthSuccess,
  showToast
}) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const handleContinue = e => {
    e.preventDefault();
    if (!cleanUsername) {
      if (showToast) showToast("Please choose a username to continue", "error");
      return;
    }
    setIsLoading(true);
    const mockUser = {
      id: "usr-" + cleanUsername,
      username: cleanUsername,
      name: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
      email: cleanUsername + "@foodbite.app",
      avatar: "/uploads/avatars/" + cleanUsername + ".svg",
      role: cleanUsername === "sachin" ? "admin" : "foodie",
      streak: 1
    };
    setTimeout(() => {
      setIsLoading(false);
      onAuthSuccess(mockUser, "auth-token-" + Date.now());
    }, 300);
  };
  return React.createElement("div", {
    className: "min-h-screen flex items-center justify-center p-4 bg-[#FFF9F3] dark:bg-[#111111] transition-colors"
  }, React.createElement("div", {
    className: "w-full max-w-md bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-3xl p-8 sm:p-10 shadow-sm space-y-6 text-center animate-pop-in"
  }, React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#F97316] to-[#FB923C] text-white flex items-center justify-center text-3xl shadow-lg shadow-[#F97316]/25"
  }, "\uD83C\uDF72"), React.createElement("div", null, React.createElement("h1", {
    className: "text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-[#F9FAFB] tracking-tight font-heading"
  }, "Welcome to FoodBite"), React.createElement("p", {
    className: "text-xs sm:text-sm text-[#6B7280] dark:text-[#A1A1AA] pt-1"
  }, "Discover, share, and crave delicious community recipes."))), React.createElement("form", {
    onSubmit: handleContinue,
    className: "space-y-4 text-left"
  }, React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Choose your foodie handle"), React.createElement("div", {
    className: "relative"
  }, React.createElement("span", {
    className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#F97316] font-bold"
  }, "@"), React.createElement("input", {
    type: "text",
    autoFocus: true,
    required: true,
    value: username,
    onChange: e => setUsername(e.target.value),
    placeholder: "chef_sachin",
    maxLength: 30,
    className: "w-full pl-8 pr-4 py-3 bg-[#FFF9F3] dark:bg-[#242424] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-2xl text-sm font-semibold text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280]/60 dark:placeholder:text-[#A1A1AA]/60 focus:outline-none focus:border-[#F97316] focus:bg-white dark:focus:bg-[#1C1C1C] transition-all"
  })), React.createElement("p", {
    className: "text-[11px] text-[#6B7280] dark:text-[#A1A1AA]"
  }, "Instant sign-in. No password required.")), React.createElement("button", {
    type: "submit",
    disabled: isLoading || !cleanUsername,
    className: "w-full py-3.5 btn-primary text-xs font-bold tracking-wide cursor-pointer disabled:opacity-50"
  }, isLoading ? "Signing in..." : "Start Exploring Recipes →")), React.createElement("div", {
    className: "pt-4 border-t border-[#E5E7EB] dark:border-[#2F2F2F] text-center"
  }, React.createElement("p", {
    className: "text-[10px] text-[#6B7280] dark:text-[#A1A1AA]"
  }, "\xA9 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari."))));
}
function ModernHeroSection({
  currentUser,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  onTriggerUpload
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = currentUser ? currentUser.name || currentUser.username : "Foodie";
  return React.createElement("section", {
    className: "w-full hero-mesh-light border-b border-[#E5E7EB] dark:border-[#2F2F2F] pt-8 pb-8 px-4 sm:px-6 lg:px-8 text-left transition-colors relative overflow-hidden"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto space-y-6 relative z-10"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center justify-between gap-4"
  }, React.createElement("div", {
    className: "space-y-2"
  }, React.createElement("span", {
    className: "inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-md border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wide shadow-xs"
  }, React.createElement("span", {
    className: "text-sm"
  }, "\uD83D\uDD25"), React.createElement("span", null, "Daily Social Food Discovery")), React.createElement("h1", {
    className: "text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F2937] dark:text-[#F9FAFB] tracking-tight font-heading leading-tight"
  }, greeting, ",", " ", React.createElement("span", {
    className: "text-gradient-rainbow"
  }, displayName, "!")), React.createElement("p", {
    className: "text-sm sm:text-base text-[#6B7280] dark:text-[#A1A1AA] max-w-2xl font-normal leading-relaxed"
  }, "Explore authentic home-cooked recipes, culinary experiments, and vibrant neighborhood cravings shared by food lovers.")), React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "px-5 py-3 btn-colorful text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/25 cursor-pointer flex items-center space-x-2 select-none"
  }, React.createElement("span", null, "\u2728"), React.createElement("span", null, "Share a Recipe")))), React.createElement("div", {
    className: "space-y-4 pt-1"
  }, React.createElement("div", {
    className: "relative w-full max-w-2xl"
  }, React.createElement("span", {
    className: "absolute left-4 top-1/2 -translate-y-1/2 text-base text-rose-500"
  }, "\uD83D\uDD0D"), React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    placeholder: "Search recipes, ingredients, chefs, cravings...",
    className: "w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/90 dark:bg-[#1C1C1C]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs sm:text-sm text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280]/70 dark:placeholder:text-[#A1A1AA]/60 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 shadow-xs hover:border-rose-300 transition-all"
  }), searchQuery && React.createElement("button", {
    type: "button",
    onClick: () => setSearchQuery(""),
    className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] p-1 rounded-full cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "flex items-center space-x-2.5 overflow-x-auto scrollbar-none pb-1 pt-1"
  }, CATEGORIES.map(cat => {
    const isActive = activeCategory === cat.id;
    return React.createElement("button", {
      key: cat.id,
      type: "button",
      onClick: () => setActiveCategory(cat.id),
      className: `flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? cat.chipActive : "bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xs text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#2F2F2F] hover:border-rose-300"}`
    }, React.createElement("span", {
      className: "text-sm leading-none"
    }, cat.icon), React.createElement("span", null, cat.label));
  })))));
}
const STORY_RINGS = ["from-rose-500 via-pink-500 to-amber-400", "from-violet-600 via-purple-500 to-pink-500", "from-emerald-400 via-teal-500 to-cyan-500", "from-amber-400 via-orange-500 to-rose-500", "from-cyan-400 via-blue-500 to-indigo-600", "from-fuchsia-500 via-rose-500 to-amber-400", "from-lime-400 via-emerald-500 to-teal-500"];
function StoriesTray({
  stories,
  currentUser,
  onTriggerUpload,
  onViewStory
}) {
  const currentUid = currentUser ? currentUser.id || currentUser.uid : "";
  const myStory = useMemo(() => {
    if (!stories || !currentUser) return null;
    const uid = currentUser.id || currentUser.uid;
    const uname = (currentUser.username || currentUser.name || "").toLowerCase();
    return stories.find(s => s.userId && s.userId === uid || s.username && s.username.toLowerCase() === uname);
  }, [stories, currentUser]);
  const uniqueUsers = useMemo(() => {
    if (!stories) return [];
    const map = new Map();
    stories.forEach(s => {
      if (currentUid && s.userId === currentUid) return;
      if (!map.has(s.userId)) {
        map.set(s.userId, s);
      }
    });
    return Array.from(map.values());
  }, [stories, currentUid]);
  return React.createElement("section", {
    className: "w-full bg-white dark:bg-[#1C1C1C] border-b border-[#E5E7EB] dark:border-[#2F2F2F] py-5 px-4 sm:px-6 lg:px-8 text-left transition-colors"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto space-y-3"
  }, React.createElement("div", {
    className: "flex items-center justify-between px-1"
  }, React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, React.createElement("h2", {
    className: "text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight flex items-center space-x-1.5"
  }, React.createElement("span", null, "24h Food Stories"), React.createElement("span", {
    className: "text-sm"
  }, "\uD83C\uDF69")), React.createElement("span", {
    className: "px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-bold shadow-xs"
  }, "Fresh Today")), React.createElement("span", {
    className: "text-xs text-[#6B7280] dark:text-[#A1A1AA]"
  }, stories ? stories.length : 0, " active bites")), React.createElement("div", {
    className: "flex items-center space-x-4 overflow-x-auto scrollbar-none pb-1 pt-1"
  }, React.createElement("div", {
    onClick: myStory ? () => onViewStory(myStory) : onTriggerUpload,
    className: "flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
  }, React.createElement("div", {
    className: `story-ring-box relative rounded-full p-[2.5px] ${myStory ? "bg-gradient-to-tr from-rose-500 to-amber-500" : "border-2 border-dashed border-rose-400 group-hover:border-rose-600 bg-rose-50 dark:bg-rose-950/30"} transition-all flex items-center justify-center`
  }, React.createElement("div", {
    className: "w-full h-full rounded-full p-[1.5px] bg-white dark:bg-[#1C1C1C] overflow-hidden flex items-center justify-center"
  }, myStory && myStory.mediaType === "video" ? React.createElement("video", {
    src: myStory.mediaUrl,
    muted: true,
    playsInline: true,
    autoPlay: true,
    loop: true,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    className: "w-full h-full rounded-full object-cover pointer-events-none"
  }) : React.createElement("img", {
    src: myStory && myStory.mediaUrl || currentUser && (currentUser.avatar || currentUser.avatarUrl) || "/uploads/dish_1790010828136_7926.jpg",
    alt: "Your story",
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    className: "w-full h-full rounded-full object-cover"
  })), React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onTriggerUpload();
    },
    className: "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:scale-110 transition-transform",
    title: "Share new story"
  }, "+")), React.createElement("span", {
    className: "text-[11px] font-semibold text-[#1F2937] dark:text-[#F9FAFB] max-w-[68px] truncate text-center"
  }, "Your Story")), uniqueUsers.map((story, idx) => {
    const isCurrentUser = story.userId === currentUid;
    const ringGradient = STORY_RINGS[idx % STORY_RINGS.length];
    return React.createElement("div", {
      key: story.userId,
      onClick: () => onViewStory(story),
      className: "flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
    }, React.createElement("div", {
      className: `story-ring-box relative rounded-full p-[2.5px] bg-gradient-to-tr ${ringGradient} group-hover:scale-108 transition-transform duration-200 shadow-sm`
    }, React.createElement("div", {
      className: "w-full h-full rounded-full p-[1.5px] bg-white dark:bg-[#1C1C1C] overflow-hidden flex items-center justify-center"
    }, story.mediaType === "video" ? React.createElement("video", {
      src: story.mediaUrl,
      muted: true,
      playsInline: true,
      autoPlay: true,
      loop: true,
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      },
      className: "w-full h-full rounded-full object-cover pointer-events-none"
    }) : React.createElement("img", {
      src: story.mediaUrl || "/uploads/dish_1790010828136_7926.jpg",
      alt: story.caption || story.username,
      onError: e => {
        e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
      },
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      },
      className: "w-full h-full rounded-full object-cover"
    }))), React.createElement("span", {
      className: "text-[11px] font-medium text-[#6B7280] dark:text-[#A1A1AA] group-hover:text-rose-500 max-w-[68px] truncate transition-colors text-center"
    }, isCurrentUser ? "You" : story.username));
  }))));
}
function FeaturedRecipesShelf({
  stories,
  onOpenRecipe,
  onLike,
  likes
}) {
  if (!stories || stories.length === 0) return null;
  const picks = stories.slice(0, 3);
  return React.createElement("section", {
    className: "w-full py-2 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-4 px-1"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight flex items-center space-x-1.5"
  }, React.createElement("span", null, "Featured Chef Creations"), React.createElement("span", {
    className: "text-base"
  }, "\u2728")), React.createElement("p", {
    className: "text-xs text-[#6B7280] dark:text-[#A1A1AA]"
  }, "Curated daily recommendations loved by the FoodBite community"))), React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
  }, picks.map((recipe, idx) => {
    const catMeta = getCategoryMeta(recipe.category);
    const badgeGradient = idx === 0 ? "from-rose-500 via-pink-500 to-amber-500" : idx === 1 ? "from-violet-600 via-purple-500 to-indigo-500" : "from-emerald-500 via-teal-500 to-cyan-500";
    return React.createElement("div", {
      key: recipe.id,
      onClick: () => onOpenRecipe(recipe),
      className: "recipe-card overflow-hidden group cursor-pointer flex flex-col justify-between"
    }, React.createElement("div", null, React.createElement("div", {
      className: "relative aspect-[16/10] overflow-hidden bg-rose-50 dark:bg-[#242424]"
    }, React.createElement("img", {
      src: recipe.mediaUrl,
      alt: recipe.caption,
      onError: e => {
        e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
      },
      className: "w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
    }), React.createElement("span", {
      className: `absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r ${badgeGradient} text-white text-[10px] font-bold shadow-sm`
    }, "\u2605 Featured Choice"), React.createElement("span", {
      className: "absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold"
    }, "\u23F3 ", formatHoursLeft(recipe.expiresAt))), React.createElement("div", {
      className: "p-4 space-y-2"
    }, React.createElement("span", {
      className: `text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${catMeta.badgeClass}`
    }, catMeta.icon, " ", catMeta.label), React.createElement("h3", {
      className: "text-sm sm:text-base font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading leading-snug line-clamp-1 group-hover:text-rose-500 transition-colors"
    }, decodeUnicode(recipe.caption) || "Delicious Food Creation"))), React.createElement("div", {
      className: "px-4 py-3 border-t border-[#E5E7EB] dark:border-[#2F2F2F] flex items-center justify-between text-xs text-[#6B7280] dark:text-[#A1A1AA]"
    }, React.createElement("div", {
      className: "flex items-center space-x-2"
    }, React.createElement("img", {
      src: recipe.userAvatar || "/uploads/avatars/" + (recipe.username || "sachin") + ".svg",
      alt: recipe.username,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      className: "w-5 h-5 rounded-full object-cover ring-1 ring-rose-400"
    }), React.createElement("span", {
      className: "font-semibold text-[#1F2937] dark:text-[#F9FAFB]"
    }, "@", recipe.username)), React.createElement("button", {
      type: "button",
      onClick: e => {
        e.stopPropagation();
        onLike(recipe.id);
      },
      className: "p-1 text-sm cursor-pointer hover:scale-120 transition-transform",
      title: likes[recipe.id] ? "Unlike" : "Like"
    }, likes[recipe.id] ? "❤️" : "🤍")));
  })));
}
function TrendingNowShelf({
  stories,
  onOpenRecipe
}) {
  if (!stories || stories.length === 0) return null;
  const topBites = stories.slice(0, 6);
  const RANK_COLORS = ["from-rose-500 to-red-600", "from-amber-400 to-orange-500", "from-emerald-400 to-teal-600", "from-violet-500 to-purple-600", "from-cyan-400 to-blue-600", "from-pink-500 to-rose-500"];
  return React.createElement("section", {
    className: "w-full py-2 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-4 px-1"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight flex items-center space-x-1.5"
  }, React.createElement("span", null, "Trending Right Now"), React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDD25")), React.createElement("p", {
    className: "text-xs text-[#6B7280] dark:text-[#A1A1AA]"
  }, "Most craved recipes in the community today"))), React.createElement("div", {
    className: "flex items-center space-x-4 overflow-x-auto scrollbar-none pb-2 pt-1"
  }, topBites.map((recipe, idx) => {
    const catMeta = getCategoryMeta(recipe.category);
    const rankGradient = RANK_COLORS[idx % RANK_COLORS.length];
    return React.createElement("div", {
      key: recipe.id,
      onClick: () => onOpenRecipe(recipe),
      className: "flex-shrink-0 w-52 recipe-card overflow-hidden group cursor-pointer text-left"
    }, React.createElement("div", {
      className: "relative aspect-[4/3] bg-rose-50 dark:bg-[#242424] overflow-hidden"
    }, React.createElement("img", {
      src: recipe.mediaUrl,
      alt: recipe.caption,
      onError: e => {
        e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
      },
      className: "w-full h-full object-cover group-hover:scale-106 transition-transform duration-300"
    }), React.createElement("span", {
      className: `absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-gradient-to-tr ${rankGradient} text-white flex items-center justify-center text-[10px] font-extrabold shadow-md`
    }, "#", idx + 1), React.createElement("span", {
      className: "absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-semibold"
    }, "\u23F3 ", formatHoursLeft(recipe.expiresAt))), React.createElement("div", {
      className: "p-3.5 space-y-1"
    }, React.createElement("span", {
      className: `text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-block ${catMeta.badgeClass}`
    }, catMeta.label), React.createElement("h4", {
      className: "text-xs sm:text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] truncate leading-tight group-hover:text-rose-500 transition-colors"
    }, decodeUnicode(recipe.caption) || "Daily Creation"), React.createElement("div", {
      className: "flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#A1A1AA] pt-1"
    }, React.createElement("span", null, "@", recipe.username), React.createElement("span", {
      className: "font-semibold text-rose-500"
    }, "\u2764\uFE0F ", recipe.likeCount || (recipe.likes ? recipe.likes.length : 0)))));
  })));
}
function PopularNearYouShelf() {
  const localCategories = [{
    title: "Local Street Heroes",
    distance: "0.5 km away",
    icon: "🌮",
    tag: "Street Food",
    color: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300",
    iconBg: "bg-gradient-to-tr from-amber-400 to-orange-500 text-white"
  }, {
    title: "Woodfired Slices",
    distance: "1.2 km away",
    icon: "🍕",
    tag: "Pizza & Oven",
    color: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300",
    iconBg: "bg-gradient-to-tr from-rose-500 to-red-600 text-white"
  }, {
    title: "Artisan Brews",
    distance: "0.8 km away",
    icon: "☕",
    tag: "Specialty Drinks",
    color: "bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300",
    iconBg: "bg-gradient-to-tr from-cyan-400 to-blue-600 text-white"
  }, {
    title: "Sweet Confections",
    distance: "1.5 km away",
    icon: "🍰",
    tag: "Desserts & Bakery",
    color: "bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/60 dark:text-pink-300",
    iconBg: "bg-gradient-to-tr from-pink-500 to-rose-500 text-white"
  }];
  return React.createElement("section", {
    className: "w-full py-2 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-4 px-1"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight flex items-center space-x-1.5"
  }, React.createElement("span", null, "Popular Near You"), React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDCCD")), React.createElement("p", {
    className: "text-xs text-[#6B7280] dark:text-[#A1A1AA]"
  }, "Neighborhood cravings and local culinary inspiration"))), React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-4"
  }, localCategories.map((item, idx) => React.createElement("div", {
    key: idx,
    className: "p-4 recipe-card text-left space-y-2.5 group cursor-pointer"
  }, React.createElement("div", {
    className: `w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`
  }, item.icon), React.createElement("h4", {
    className: "text-xs sm:text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] leading-snug group-hover:text-rose-500 transition-colors truncate"
  }, item.title), React.createElement("div", {
    className: "flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#A1A1AA]"
  }, React.createElement("span", {
    className: `px-1.5 py-0.5 rounded text-[10px] font-semibold border ${item.color}`
  }, item.tag), React.createElement("span", {
    className: "font-semibold text-rose-500"
  }, item.distance))))));
}
function RecipeCard({
  post,
  currentUserId,
  currentUser,
  isFollowing,
  onToggleFollow,
  onLike,
  isLiked,
  likeCount,
  postLikes,
  onShowLikes,
  onDoubleTap,
  heartBurst,
  comments,
  onAddComment,
  onShare,
  onSave,
  isSaved,
  onViewStory,
  onOpenRecipe,
  onDeletePost
}) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const isOwner = post.userId === currentUserId;
  const rawCaption = decodeUnicode(post.caption || "");
  let dishTitle = "";
  let dishDescription = rawCaption;
  if (rawCaption.includes(" • ")) {
    const parts = rawCaption.split(" • ");
    dishTitle = parts[0].trim();
    dishDescription = parts.slice(1).join(" • ").trim();
  } else if (rawCaption.length > 0 && rawCaption.length <= 50) {
    dishTitle = rawCaption;
    dishDescription = "";
  } else if (rawCaption.length > 50) {
    dishTitle = rawCaption.slice(0, 45).trim() + "...";
    dishDescription = rawCaption;
  }
  const catMeta = getCategoryMeta(post.category);
  const cookTime = post.cookTime || post.cookingTime || (post.category === "breakfast" ? "15 mins" : post.category === "quick" ? "15 mins" : post.category === "desserts" ? "35 mins" : "25 mins");
  const handleCardClick = e => {
    if (onOpenRecipe) {
      onOpenRecipe(post);
    } else if (onViewStory) {
      onViewStory(post);
    }
  };
  const handleCommentSubmit = e => {
    e.preventDefault();
    const clean = commentText.trim();
    if (!clean) return;
    onAddComment(post.id, clean);
    setCommentText("");
    setShowComments(true);
  };
  return React.createElement("article", {
    className: "recipe-card overflow-hidden flex flex-col justify-between group text-left transition-all duration-300"
  }, React.createElement("div", null, React.createElement("div", {
    className: "p-3.5 sm:p-4 border-b border-[#E5E7EB] dark:border-[#2F2F2F] flex items-center justify-between bg-white dark:bg-[#1C1C1C]"
  }, React.createElement("div", {
    onClick: e => {
      e.stopPropagation();
      onViewStory && onViewStory(post);
    },
    className: "flex items-center space-x-3 cursor-pointer group/user"
  }, React.createElement("div", {
    className: "w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-rose-400/40 overflow-hidden flex-shrink-0 bg-rose-50 dark:bg-rose-950/30"
  }, React.createElement("img", {
    src: post.userAvatar || "/uploads/avatars/" + (post.username || "sachin") + ".svg",
    alt: post.username,
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-full h-full object-cover"
  })), React.createElement("div", null, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("h4", {
    className: "text-xs sm:text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] group-hover/user:text-rose-500 transition-colors leading-tight"
  }, "@", post.username), !isOwner && onToggleFollow && React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onToggleFollow(post.userId, post.username);
    },
    className: `text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${isFollowing ? "bg-gray-100 dark:bg-[#2A2A2A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-200" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-500 hover:text-white hover:border-rose-500"}`
  }, isFollowing ? "Following" : "+ Follow")), React.createElement("span", {
    className: "text-[11px] text-[#6B7280] dark:text-[#A1A1AA] block pt-0.5"
  }, formatTimeAgo(post.createdAt)))), React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 px-2 py-0.5 rounded-full"
  }, "\u23F3 ", formatHoursLeft(post.expiresAt)), isOwner && onDeletePost && React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to remove this recipe?")) {
        onDeletePost(post.id);
      }
    },
    className: "text-[11px] text-[#6B7280] dark:text-[#A1A1AA] hover:text-rose-500 p-1 rounded-full cursor-pointer transition-colors",
    title: "Delete Recipe"
  }, "\u2715"))), React.createElement("div", {
    onClick: handleCardClick,
    onDoubleClick: e => {
      e.stopPropagation();
      onDoubleTap && onDoubleTap(post);
    },
    className: "relative w-full aspect-[4/3] bg-rose-50 dark:bg-[#242424] overflow-hidden cursor-pointer select-none flex items-center justify-center group/img"
  }, post.mediaType === "video" ? React.createElement("video", {
    src: post.mediaUrl,
    loop: true,
    muted: true,
    playsInline: true,
    autoPlay: true,
    className: "relative z-10 w-full h-full object-cover"
  }) : React.createElement("img", {
    src: post.mediaUrl,
    alt: post.caption || "Recipe photograph",
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "relative z-10 w-full h-full object-cover object-center group-hover/img:scale-104 transition-transform duration-500",
    loading: "lazy"
  }), heartBurst && React.createElement("div", {
    className: "absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-heart-burst"
  }, React.createElement("span", {
    className: "text-6xl text-white drop-shadow-xl select-none"
  }, "\u2764\uFE0F")), React.createElement("div", {
    className: "absolute top-3 left-3 z-20 flex items-center space-x-1.5"
  }, React.createElement("span", {
    className: "px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center space-x-1 shadow-sm"
  }, React.createElement("span", null, "\u23F1\uFE0F"), React.createElement("span", null, cookTime)), React.createElement("span", {
    className: `px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${catMeta.badgeClass}`
  }, catMeta.icon, " ", catMeta.label)), React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onSave && onSave(post.id);
    },
    className: `absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-md ${isSaved ? "bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-rose-500/30" : "bg-black/50 hover:bg-black/70 text-white"}`,
    title: isSaved ? "Saved to Bookmarks" : "Save Recipe"
  }, React.createElement("span", {
    className: "text-sm leading-none block"
  }, isSaved ? "🔖" : "📑"))), React.createElement("div", {
    onClick: handleCardClick,
    className: "p-4 space-y-1.5 cursor-pointer"
  }, dishTitle && React.createElement("h3", {
    className: "text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading leading-snug line-clamp-1 group-hover:text-rose-500 transition-colors"
  }, dishTitle), dishDescription && React.createElement("p", {
    className: "text-xs sm:text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed line-clamp-2"
  }, dishDescription))), React.createElement("div", null, React.createElement("div", {
    className: "px-4 py-3 border-t border-[#E5E7EB] dark:border-[#2F2F2F] flex items-center justify-between text-xs bg-white dark:bg-[#1C1C1C]"
  }, React.createElement("div", {
    className: "flex items-center space-x-4"
  }, React.createElement("button", {
    type: "button",
    onClick: () => onLike(post.id),
    className: `flex items-center space-x-1.5 transition-transform active:scale-95 cursor-pointer font-semibold ${isLiked ? "text-rose-500" : "text-[#6B7280] dark:text-[#A1A1AA] hover:text-rose-500"}`
  }, React.createElement("span", {
    className: "text-base leading-none"
  }, isLiked ? "❤️" : "🤍"), React.createElement("span", {
    onClick: e => {
      if (likeCount > 0 && onShowLikes) {
        e.stopPropagation();
        onShowLikes(post.id, postLikes);
      }
    },
    className: likeCount > 0 ? "hover:underline cursor-pointer" : ""
  }, likeCount)), React.createElement("button", {
    type: "button",
    onClick: () => setShowComments(prev => !prev),
    className: "flex items-center space-x-1.5 text-[#6B7280] dark:text-[#A1A1AA] hover:text-violet-500 transition-colors cursor-pointer font-semibold"
  }, React.createElement("span", {
    className: "text-base leading-none"
  }, "\uD83D\uDCAC"), React.createElement("span", null, (comments || []).length)), React.createElement("button", {
    type: "button",
    onClick: () => onShare && onShare(post),
    className: "text-[#6B7280] dark:text-[#A1A1AA] hover:text-cyan-500 transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold",
    title: "Share Recipe"
  }, React.createElement("span", null, "\uD83D\uDD17"), React.createElement("span", {
    className: "hidden sm:inline"
  }, "Share"))), React.createElement("button", {
    type: "button",
    onClick: handleCardClick,
    className: "text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center space-x-1"
  }, React.createElement("span", null, "View Recipe"), React.createElement("span", null, "\u2192"))), postLikes && postLikes.length > 0 && React.createElement("div", {
    onClick: () => onShowLikes && onShowLikes(post.id, postLikes),
    className: "px-4 py-2 border-t border-[#E5E7EB] dark:border-[#2F2F2F] text-[11px] text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] cursor-pointer transition-colors bg-rose-50/40 dark:bg-[#161616] select-none flex items-center space-x-1"
  }, React.createElement("span", null, "Liked by"), React.createElement("strong", {
    className: "text-rose-600 dark:text-rose-400"
  }, "@", postLikes[0].username), postLikes.length > 1 && React.createElement("span", null, "and ", postLikes.length - 1, " other", postLikes.length > 2 ? "s" : "")), showComments && React.createElement("div", {
    className: "p-4 border-t border-[#E5E7EB] dark:border-[#2F2F2F] bg-[#FDFBF7] dark:bg-[#161616] space-y-3"
  }, comments && comments.length > 0 && React.createElement("div", {
    className: "space-y-2 max-h-44 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#2F2F2F] pr-1 text-xs"
  }, comments.map((c, i) => React.createElement("div", {
    key: c.id || i,
    className: "pt-2 leading-relaxed"
  }, React.createElement("strong", {
    className: "text-[#1F2937] dark:text-[#F9FAFB] mr-2"
  }, "@", c.author || c.username), React.createElement("span", {
    className: "text-[#4B5563] dark:text-[#D1D5DB]"
  }, c.text)))), React.createElement("form", {
    onSubmit: handleCommentSubmit,
    className: "pt-2 flex items-center space-x-2"
  }, React.createElement("input", {
    type: "text",
    value: commentText,
    onChange: e => setCommentText(e.target.value),
    placeholder: "Add a recipe comment...",
    className: "flex-1 px-3.5 py-2 bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-xl text-xs text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-rose-400"
  }), React.createElement("button", {
    type: "submit",
    disabled: !commentText.trim(),
    className: "px-4 py-2 btn-colorful text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
  }, "Post")))));
}
const FoodCard = RecipeCard;
function FloatingCreateButton({
  onTriggerUpload
}) {
  return React.createElement("div", {
    className: "fixed bottom-8 right-6 z-40 hidden md:block"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "flex items-center space-x-2 px-5 py-3 btn-colorful rounded-full font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/30 cursor-pointer select-none hover:scale-105 transition-transform",
    title: "Share your authentic recipe"
  }, React.createElement("span", {
    className: "text-base leading-none"
  }, "\u2728"), React.createElement("span", null, "Share Recipe")));
}
function DesktopNavBar({
  activeTab,
  setActiveTab,
  onTriggerUpload,
  userProfile,
  currentUser,
  onRefreshFeed,
  onTriggerBroadcast,
  announcement,
  onTriggerInstall,
  theme,
  onToggleTheme
}) {
  const streak = userProfile && userProfile.user ? userProfile.user.streak || 0 : 0;
  const avatarUrl = currentUser && (currentUser.avatar || currentUser.avatarUrl) || "/uploads/avatars/sachin.svg";
  const NAV_ITEMS = [{
    id: "home",
    label: "Home",
    icon: "🏠",
    activeClass: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800"
  }, {
    id: "explore",
    label: "Explore",
    icon: "🔍",
    activeClass: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800"
  }, {
    id: "saved",
    label: "Saved",
    icon: "📑",
    activeClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800"
  }, {
    id: "profile",
    label: "Profile",
    icon: "👤",
    activeClass: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800"
  }];
  return React.createElement("header", {
    className: "hidden md:block sticky top-0 z-40 bg-white/95 dark:bg-[#1C1C1C]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2F2F2F] transition-colors"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-8"
  }, React.createElement("div", {
    onClick: () => {
      setActiveTab("home");
      onRefreshFeed && onRefreshFeed();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: "flex items-center space-x-3 cursor-pointer select-none group"
  }, React.createElement("div", {
    className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500 text-white flex items-center justify-center text-xl shadow-md shadow-rose-500/25 group-hover:scale-108 transition-transform"
  }, "\uD83D\uDD25"), React.createElement("div", null, React.createElement("div", {
    className: "flex items-center space-x-1"
  }, React.createElement("span", {
    className: "text-xl font-extrabold text-[#1F2937] dark:text-[#F9FAFB] tracking-tight font-heading leading-tight"
  }, "Food", React.createElement("span", {
    className: "text-gradient-rainbow"
  }, "Bite"))), React.createElement("span", {
    className: "text-[10px] font-bold text-rose-500/80 tracking-wider uppercase block"
  }, "Discover. Share. Crave."))), React.createElement("nav", {
    className: "flex items-center space-x-1.5"
  }, NAV_ITEMS.map(tab => {
    const isActive = activeTab === tab.id;
    return React.createElement("button", {
      key: tab.id,
      type: "button",
      onClick: () => {
        setActiveTab(tab.id);
        if (tab.id === "home" && onRefreshFeed) onRefreshFeed();
      },
      className: `px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? tab.activeClass + " shadow-xs scale-[1.02]" : "text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] hover:bg-gray-50 dark:hover:bg-[#242424]"}`
    }, React.createElement("span", {
      className: "text-base leading-none"
    }, tab.icon), React.createElement("span", null, tab.label));
  }))), React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("div", {
    className: "flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white text-xs font-bold shadow-xs"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "d Streak")), React.createElement(ThemeToggle, {
    theme: theme,
    onToggleTheme: onToggleTheme
  }), onTriggerInstall && React.createElement("button", {
    type: "button",
    onClick: onTriggerInstall,
    className: "p-2 rounded-full border border-[#E5E7EB] dark:border-[#2F2F2F] bg-white dark:bg-[#1C1C1C] hover:border-cyan-400 text-[#6B7280] dark:text-[#A1A1AA] hover:text-cyan-500 transition-colors cursor-pointer w-9 h-9 flex items-center justify-center text-sm",
    title: "Install App"
  }, "\uD83D\uDCF1"), currentUser && (currentUser.role === "admin" || currentUser.username === "sachin" || currentUser.id === "usr-1") && React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: `px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs ${announcement && announcement.enabled ? "bg-gradient-to-r from-rose-500 to-red-600 text-white animate-pulse" : "bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] text-[#6B7280] dark:text-[#A1A1AA] hover:text-rose-500 hover:border-rose-400"}`,
    title: "Broadcast & Maintenance Settings"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "Broadcast")), React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "px-4 py-2 btn-colorful rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-md shadow-rose-500/25 cursor-pointer hover:scale-103 transition-transform"
  }, React.createElement("span", null, "+"), React.createElement("span", null, "Share Recipe")), React.createElement("div", {
    onClick: () => setActiveTab("profile"),
    className: "w-10 h-10 rounded-full ring-2 ring-rose-400/50 hover:ring-rose-500 overflow-hidden cursor-pointer transition-all flex-shrink-0 bg-rose-50 dark:bg-rose-950/40",
    title: "Your Profile"
  }, React.createElement("img", {
    src: avatarUrl,
    alt: "Avatar",
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-full h-full object-cover"
  })))));
}
function MobileTopBar({
  streak,
  onTriggerInstall,
  onLogoClick,
  onTriggerBroadcast,
  announcement,
  currentUser,
  theme,
  onToggleTheme
}) {
  return React.createElement("header", {
    className: "md:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#1C1C1C]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2F2F2F] px-4 py-3 flex items-center justify-between text-left transition-colors"
  }, React.createElement("div", {
    onClick: onLogoClick,
    className: "flex items-center space-x-2.5 cursor-pointer select-none"
  }, React.createElement("div", {
    className: "w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500 text-white flex items-center justify-center text-base shadow-sm"
  }, "\uD83D\uDD25"), React.createElement("div", null, React.createElement("span", {
    className: "text-base font-extrabold text-[#1F2937] dark:text-[#F9FAFB] font-heading leading-tight block"
  }, "Food", React.createElement("span", {
    className: "text-gradient-rainbow"
  }, "Bite")), React.createElement("span", {
    className: "text-[9px] font-semibold text-rose-500/80 uppercase block leading-none"
  }, "Discover. Share. Crave."))), React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("div", {
    className: "flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white text-[11px] font-bold shadow-xs"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "d")), React.createElement(ThemeToggle, {
    theme: theme,
    onToggleTheme: onToggleTheme
  }), currentUser && (currentUser.role === "admin" || currentUser.username === "sachin" || currentUser.id === "usr-1") && React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: `p-1.5 rounded-full border text-xs cursor-pointer ${announcement && announcement.enabled ? "bg-rose-500 text-white border-rose-500" : "border-[#E5E7EB] dark:border-[#2F2F2F] bg-white dark:bg-[#1C1C1C] text-[#6B7280] dark:text-[#A1A1AA]"}`,
    title: "Admin Broadcast"
  }, "\uD83D\uDCE2")));
}
function MobileBottomNav({
  activeTab,
  setActiveTab,
  onTriggerUpload,
  onRefreshFeed
}) {
  return React.createElement("nav", {
    className: "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1C1C1C]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#2F2F2F] px-3 py-2 flex items-center justify-around shadow-2xl transition-colors"
  }, React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("home");
      onRefreshFeed && onRefreshFeed();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-2 text-[10px] font-bold transition-colors cursor-pointer ${activeTab === "home" ? "text-rose-500" : "text-[#6B7280] dark:text-[#A1A1AA]"}`
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83C\uDFE0"), React.createElement("span", null, "Home")), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("explore");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-2 text-[10px] font-bold transition-colors cursor-pointer ${activeTab === "explore" ? "text-cyan-500" : "text-[#6B7280] dark:text-[#A1A1AA]"}`
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDD0D"), React.createElement("span", null, "Explore")), React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "w-12 h-12 rounded-full btn-colorful text-white font-bold flex items-center justify-center text-2xl shadow-lg shadow-rose-500/40 active:scale-95 cursor-pointer -mt-5 transition-transform",
    title: "Share Recipe"
  }, "+"), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("saved");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-2 text-[10px] font-bold transition-colors cursor-pointer ${activeTab === "saved" ? "text-emerald-500" : "text-[#6B7280] dark:text-[#A1A1AA]"}`
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCD1"), React.createElement("span", null, "Saved")), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("profile");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-2 text-[10px] font-bold transition-colors cursor-pointer ${activeTab === "profile" ? "text-violet-500" : "text-[#6B7280] dark:text-[#A1A1AA]"}`
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDC64"), React.createElement("span", null, "Profile")));
}
function ExploreView({
  stories,
  onOpenRecipe,
  onTriggerUpload,
  onToggleFollow,
  followingList,
  currentUser,
  likes,
  savedPosts,
  onLike,
  onSave,
  onShare,
  onAddComment,
  onShowLikes,
  onDeletePost
}) {
  const [exploreSearch, setExploreSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const CHEF_SPECIALTIES = ["⭐ Master Chef", "🌶️ Spice King", "🥖 Artisan Baker", "🥗 Green Guru", "🥩 Grill Master", "🍰 Pastry Prodigy", "🍜 Noodle Artisan"];
  const creators = useMemo(() => {
    if (!stories) return [];
    const map = new Map();
    stories.forEach(s => {
      if (!map.has(s.userId)) {
        map.set(s.userId, {
          userId: s.userId,
          username: s.username,
          avatar: s.userAvatar || "/uploads/avatars/" + (s.username || "sachin") + ".svg",
          recipeCount: stories.filter(x => x.userId === s.userId).length
        });
      }
    });
    return Array.from(map.values());
  }, [stories]);
  const moodCollections = [{
    title: "Weekend Comforts",
    desc: "Warm stews, rich curries & crusty sourdough",
    icon: "🍲",
    tag: "dinner",
    gradient: "from-amber-500/15 via-orange-500/10 to-rose-500/10",
    borderColor: "border-amber-300 dark:border-amber-700/60",
    badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300"
  }, {
    title: "Under 20 Minutes",
    desc: "Fast, high-flavor meals for busy foodies",
    icon: "⚡",
    tag: "quick",
    gradient: "from-violet-500/15 via-purple-500/10 to-indigo-500/10",
    borderColor: "border-violet-300 dark:border-violet-700/60",
    badgeColor: "bg-violet-100 text-violet-900 dark:bg-violet-950/70 dark:text-violet-300"
  }, {
    title: "Sweet Delights",
    desc: "Decadent cakes, warm cookies & pastries",
    icon: "🍰",
    tag: "desserts",
    gradient: "from-pink-500/15 via-rose-500/10 to-red-500/10",
    borderColor: "border-pink-300 dark:border-pink-700/60",
    badgeColor: "bg-pink-100 text-pink-900 dark:bg-pink-950/70 dark:text-pink-300"
  }, {
    title: "Plant Powered",
    desc: "Fresh garden bowls, crispy tofu & herbs",
    icon: "🌱",
    tag: "vegetarian",
    gradient: "from-emerald-500/15 via-teal-500/10 to-lime-500/10",
    borderColor: "border-emerald-300 dark:border-emerald-700/60",
    badgeColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300"
  }];
  const filtered = useMemo(() => {
    if (!stories) return [];
    let list = [...stories];
    if (exploreSearch.trim()) {
      const q = exploreSearch.trim().toLowerCase();
      list = list.filter(s => {
        const text = ((s.caption || "") + " " + (s.username || "") + " " + (s.category || "")).toLowerCase();
        return text.includes(q);
      });
    }
    if (selectedCategory !== "all") {
      const needle = selectedCategory.toLowerCase();
      list = list.filter(s => {
        const cat = (s.category || "").toLowerCase();
        const cap = (s.caption || "").toLowerCase();
        return cat.includes(needle) || cap.includes(needle);
      });
    }
    return list;
  }, [stories, exploreSearch, selectedCategory]);
  return React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16 space-y-8 text-left animate-fade-in"
  }, React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("span", {
    className: "px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold tracking-wide inline-block mb-1.5 shadow-xs"
  }, "\uD83D\uDD0D Explore Recipes & Creators"), React.createElement("h1", {
    className: "text-3xl sm:text-4xl font-extrabold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight leading-tight"
  }, "Find Your Next ", React.createElement("span", {
    className: "text-gradient-rainbow"
  }, "Culinary Craving")), React.createElement("p", {
    className: "text-sm text-[#6B7280] dark:text-[#A1A1AA] pt-1"
  }, "Search hundreds of community recipes, follow top home chefs, and explore curated seasonal mood collections.")), React.createElement("div", {
    className: "relative w-full max-w-2xl"
  }, React.createElement("span", {
    className: "absolute left-4 top-1/2 -translate-y-1/2 text-base text-cyan-500"
  }, "\uD83D\uDD0D"), React.createElement("input", {
    type: "text",
    value: exploreSearch,
    onChange: e => setExploreSearch(e.target.value),
    placeholder: "Search by recipe title, ingredient, chef, or craving...",
    className: "w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs sm:text-sm text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280]/70 dark:placeholder:text-[#A1A1AA]/60 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-xs hover:border-cyan-300 transition-all"
  }), exploreSearch && React.createElement("button", {
    type: "button",
    onClick: () => setExploreSearch(""),
    className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] p-1 rounded-full cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "flex items-center space-x-2.5 overflow-x-auto scrollbar-none pb-1 pt-1"
  }, CATEGORIES.map(cat => {
    const isActive = selectedCategory === cat.id;
    return React.createElement("button", {
      key: cat.id,
      type: "button",
      onClick: () => setSelectedCategory(cat.id),
      className: `flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? cat.chipActive : "bg-white dark:bg-[#1C1C1C] text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#2F2F2F] hover:border-cyan-300"}`
    }, React.createElement("span", null, cat.icon), React.createElement("span", null, cat.label));
  }))), creators.length > 0 && React.createElement("section", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("h2", {
    className: "text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight flex items-center space-x-2"
  }, React.createElement("span", null, "Top Food Creators & Chefs"), React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDC68\u200D\uD83C\uDF73"))), React.createElement("div", {
    className: "flex items-center space-x-4 overflow-x-auto scrollbar-none pb-2 pt-1"
  }, creators.map((c, idx) => {
    const isFollowing = followingList && followingList.includes(c.userId);
    const isSelf = currentUser && (currentUser.id || currentUser.uid) === c.userId;
    const ringGrad = STORY_RINGS[idx % STORY_RINGS.length];
    const specialty = CHEF_SPECIALTIES[idx % CHEF_SPECIALTIES.length];
    return React.createElement("div", {
      key: c.userId,
      className: "flex-shrink-0 w-48 p-4 recipe-card flex flex-col items-center text-center space-y-2.5 group hover:border-cyan-400"
    }, React.createElement("div", {
      className: `story-ring-box relative rounded-full p-[2.5px] bg-gradient-to-tr ${ringGrad} shadow-sm group-hover:scale-108 transition-transform`
    }, React.createElement("div", {
      className: "w-full h-full rounded-full p-[1.5px] bg-white dark:bg-[#1C1C1C] overflow-hidden"
    }, React.createElement("img", {
      src: c.avatar,
      alt: c.username,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      },
      className: "w-full h-full rounded-full object-cover"
    }))), React.createElement("div", null, React.createElement("h4", {
      className: "text-xs sm:text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] truncate"
    }, "@", c.username), React.createElement("span", {
      className: "text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold block pt-0.5"
    }, specialty), React.createElement("span", {
      className: "text-[11px] text-[#6B7280] dark:text-[#A1A1AA]"
    }, c.recipeCount, " ", c.recipeCount === 1 ? "recipe" : "recipes")), !isSelf && onToggleFollow && React.createElement("button", {
      type: "button",
      onClick: () => onToggleFollow(c.userId, c.username),
      className: `w-full py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${isFollowing ? "bg-gray-100 dark:bg-[#2A2A2A] text-[#6B7280] dark:text-[#A1A1AA] hover:bg-gray-200" : "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-500 hover:text-white"}`
    }, isFollowing ? "Following" : "+ Follow"));
  }))), React.createElement("section", {
    className: "space-y-3"
  }, React.createElement("h2", {
    className: "text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight flex items-center space-x-2"
  }, React.createElement("span", null, "Curated Meal Moods"), React.createElement("span", {
    className: "text-base"
  }, "\u2728")), React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, moodCollections.map((m, idx) => React.createElement("div", {
    key: idx,
    onClick: () => setSelectedCategory(m.tag),
    className: `p-4 recipe-card bg-gradient-to-br ${m.gradient} border ${m.borderColor} text-left space-y-2 cursor-pointer group hover:scale-[1.02] transition-transform`
  }, React.createElement("div", {
    className: "w-10 h-10 rounded-2xl bg-white/80 dark:bg-[#1C1C1C]/80 text-xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform"
  }, m.icon), React.createElement("h3", {
    className: "text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] group-hover:text-rose-500 transition-colors leading-tight"
  }, m.title), React.createElement("p", {
    className: "text-xs text-[#6B7280] dark:text-[#A1A1AA] line-clamp-2"
  }, m.desc), React.createElement("span", {
    className: `px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${m.badgeColor}`
  }, m.tag))))), React.createElement("section", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("h2", {
    className: "text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight"
  }, "Matching Recipes (", filtered.length, ")")), filtered.length === 0 ? React.createElement(EmptyState, {
    title: "No Recipes Found",
    message: "We couldn't find any dishes matching your search query or filters. Try searching for other ingredients or categories.",
    actionLabel: "Reset Filters",
    onAction: () => {
      setExploreSearch("");
      setSelectedCategory("all");
    }
  }) : React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
  }, filtered.map(dish => React.createElement(RecipeCard, {
    key: dish.id,
    post: dish,
    currentUserId: currentUser ? currentUser.id || currentUser.uid : "",
    currentUser: currentUser,
    isFollowing: followingList && followingList.includes(dish.userId),
    onToggleFollow: onToggleFollow,
    onLike: onLike,
    isLiked: likes && !likes[dish.id],
    likeCount: dish.likeCount || (dish.likes ? dish.likes.length : 0),
    postLikes: dish.likes,
    onShowLikes: onShowLikes,
    comments: dish.comments,
    onAddComment: onAddComment,
    onShare: onShare,
    onSave: onSave,
    isSaved: savedPosts && !savedPosts[dish.id],
    onOpenRecipe: onOpenRecipe,
    onDeletePost: onDeletePost
  })))));
}
function SavedView({
  stories,
  savedPosts,
  onOpenRecipe,
  onLike,
  onSave,
  onShare,
  onAddComment,
  likes,
  currentUser,
  followingList,
  onToggleFollow,
  setActiveTab
}) {
  const savedStories = useMemo(() => {
    if (!stories || !savedPosts) return [];
    return stories.filter(s => savedPosts[s.id]);
  }, [stories, savedPosts]);
  return React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16 space-y-6 text-left animate-fade-in"
  }, React.createElement("div", null, React.createElement("span", {
    className: "px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold tracking-wide inline-block mb-1.5 shadow-xs"
  }, "\uD83D\uDCD1 Your Recipe Bookmarks"), React.createElement("h1", {
    className: "text-3xl sm:text-4xl font-extrabold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight leading-tight"
  }, "Saved Recipes (", React.createElement("span", {
    className: "text-emerald-500"
  }, savedStories.length), ")"), React.createElement("p", {
    className: "text-sm text-[#6B7280] dark:text-[#A1A1AA] pt-1"
  }, "Your personal cookbook of recipes and food bites saved for your next kitchen session.")), savedStories.length === 0 ? React.createElement(EmptyState, {
    title: "No Saved Recipes Yet",
    message: "Browse through Home or Explore and tap the bookmark icon on any recipe to save it here for quick access.",
    actionLabel: "Explore Recipes",
    onAction: () => setActiveTab && setActiveTab("explore")
  }) : React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
  }, savedStories.map(dish => React.createElement(RecipeCard, {
    key: dish.id,
    post: dish,
    currentUserId: currentUser ? currentUser.id || currentUser.uid : "",
    currentUser: currentUser,
    isFollowing: followingList && followingList.includes(dish.userId),
    onToggleFollow: onToggleFollow,
    onLike: onLike,
    isLiked: likes && !likes[dish.id],
    likeCount: dish.likeCount || (dish.likes ? dish.likes.length : 0),
    postLikes: dish.likes,
    comments: dish.comments,
    onAddComment: onAddComment,
    onShare: onShare,
    onSave: onSave,
    isSaved: true,
    onOpenRecipe: onOpenRecipe
  }))));
}
function ProfileView({
  currentUser,
  userProfile,
  stories,
  onLogout,
  onTriggerUpload,
  onTriggerBroadcast,
  announcement,
  savedPosts,
  likes,
  onOpenRecipe,
  onLike,
  onSave,
  onShare,
  onAddComment,
  followingList,
  onToggleFollow
}) {
  const [activeProfileTab, setActiveProfileTab] = useState("recipes");
  const user = userProfile && userProfile.user || currentUser || {};
  const streak = user.streak || 0;
  const currentUid = user.id || user.uid;
  const userStories = (stories || []).filter(s => s.userId === currentUid);
  const savedStories = (stories || []).filter(s => savedPosts && savedPosts[s.id]);
  const likedStories = (stories || []).filter(s => likes && likes[s.id]);
  return React.createElement("div", {
    className: "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16 space-y-8 text-left animate-fade-in"
  }, React.createElement("div", {
    className: "recipe-card p-6 sm:p-8 space-y-6"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#2F2F2F] pb-4"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-base text-rose-500"
  }, "\uD83D\uDC64"), React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1AA]"
  }, "Chef Profile & Cookbook")), React.createElement("button", {
    type: "button",
    onClick: onLogout,
    className: "px-4 py-1.5 rounded-full border border-[#E5E7EB] dark:border-[#2F2F2F] hover:border-rose-500 hover:text-rose-500 text-xs font-semibold text-[#6B7280] dark:text-[#A1A1AA] transition-colors cursor-pointer"
  }, "Sign Out \u2192")), React.createElement("div", {
    className: "flex flex-col sm:flex-row items-center sm:items-start gap-6"
  }, React.createElement("div", {
    className: "relative flex-shrink-0"
  }, React.createElement("div", {
    className: "w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-rose-400/40 p-1 bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500 overflow-hidden shadow-lg"
  }, React.createElement("img", {
    src: user.avatar || user.avatarUrl || "/uploads/avatars/sachin.svg",
    alt: user.username || "Profile",
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-full h-full object-cover rounded-full bg-white dark:bg-[#1C1C1C]"
  })), React.createElement("span", {
    className: "absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white text-[11px] font-bold tracking-wide shadow-xs flex items-center space-x-1"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "d"))), React.createElement("div", {
    className: "space-y-3 text-center sm:text-left flex-1"
  }, React.createElement("div", null, React.createElement("h1", {
    className: "text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-[#F9FAFB] font-heading tracking-tight leading-tight"
  }, user.name || user.username || "Chef"), React.createElement("span", {
    className: "text-xs sm:text-sm font-bold text-rose-500 block pt-0.5"
  }, "@", user.username || "chef")), React.createElement("p", {
    className: "text-xs sm:text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed max-w-xl"
  }, "Home cook & food explorer sharing authentic recipes, kitchen experiments, and food stories on FoodBite."), React.createElement("div", {
    className: "grid grid-cols-3 gap-3 pt-3 border-t border-[#E5E7EB] dark:border-[#2F2F2F] text-center"
  }, React.createElement("div", {
    className: "p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40"
  }, React.createElement("div", {
    className: "text-lg font-extrabold text-rose-600 dark:text-rose-400"
  }, userStories.length), React.createElement("div", {
    className: "text-[11px] font-bold text-rose-700/70 dark:text-rose-300/70"
  }, "Recipes")), React.createElement("div", {
    className: "p-3 rounded-2xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/40"
  }, React.createElement("div", {
    className: "text-lg font-extrabold text-violet-600 dark:text-violet-400"
  }, userProfile && userProfile.followersCount || 0), React.createElement("div", {
    className: "text-[11px] font-bold text-violet-700/70 dark:text-violet-300/70"
  }, "Followers")), React.createElement("div", {
    className: "p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40"
  }, React.createElement("div", {
    className: "text-lg font-extrabold text-emerald-600 dark:text-emerald-400"
  }, userProfile && userProfile.followingCount || 0), React.createElement("div", {
    className: "text-[11px] font-bold text-emerald-700/70 dark:text-emerald-300/70"
  }, "Following"))), (user.role === "admin" || user.username === "sachin" || user.id === "usr-1") && React.createElement("div", {
    className: "pt-2"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: "w-full py-2.5 px-4 rounded-xl border border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer hover:bg-rose-500 hover:text-white transition-colors"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "Manage Maintenance & Visitor Broadcast Popup"), announcement && announcement.enabled && React.createElement("span", {
    className: "px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold"
  }, "Active")))))), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "flex items-center border-b border-[#E5E7EB] dark:border-[#2F2F2F] space-x-4"
  }, [{
    id: "recipes",
    label: "Recipes",
    count: userStories.length,
    activeBadge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    activeLine: "border-rose-500 text-rose-500"
  }, {
    id: "saved",
    label: "Saved",
    count: savedStories.length,
    activeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    activeLine: "border-emerald-500 text-emerald-500"
  }, {
    id: "liked",
    label: "Liked",
    count: likedStories.length,
    activeBadge: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    activeLine: "border-pink-500 text-pink-500"
  }].map(t => {
    const isActive = activeProfileTab === t.id;
    return React.createElement("button", {
      key: t.id,
      type: "button",
      onClick: () => setActiveProfileTab(t.id),
      className: `pb-3 px-2 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? `border-b-2 ${t.activeLine}` : "text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] border-b-2 border-transparent"}`
    }, React.createElement("span", null, t.label), React.createElement("span", {
      className: `text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? t.activeBadge : "bg-gray-100 dark:bg-[#242424] text-[#6B7280] dark:text-[#A1A1AA]"}`
    }, t.count));
  })), activeProfileTab === "recipes" && (userStories.length === 0 ? React.createElement(EmptyState, {
    title: "No Recipes Shared Yet",
    message: "You haven't posted any food recipes yet. Share your favorite creation with the FoodBite community.",
    actionLabel: "+ Share First Recipe",
    onAction: onTriggerUpload
  }) : React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
  }, userStories.map(dish => React.createElement(RecipeCard, {
    key: dish.id,
    post: dish,
    currentUserId: currentUid,
    currentUser: currentUser,
    onLike: onLike,
    isLiked: likes && !likes[dish.id],
    likeCount: dish.likeCount || (dish.likes ? dish.likes.length : 0),
    postLikes: dish.likes,
    comments: dish.comments,
    onAddComment: onAddComment,
    onShare: onShare,
    onSave: onSave,
    isSaved: savedPosts && !savedPosts[dish.id],
    onOpenRecipe: onOpenRecipe
  })))), activeProfileTab === "saved" && (savedStories.length === 0 ? React.createElement(EmptyState, {
    title: "No Saved Recipes",
    message: "Bookmark recipes while browsing to save them to your personal collection here."
  }) : React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
  }, savedStories.map(dish => React.createElement(RecipeCard, {
    key: dish.id,
    post: dish,
    currentUserId: currentUid,
    currentUser: currentUser,
    onLike: onLike,
    isLiked: likes && !likes[dish.id],
    likeCount: dish.likeCount || (dish.likes ? dish.likes.length : 0),
    postLikes: dish.likes,
    comments: dish.comments,
    onAddComment: onAddComment,
    onShare: onShare,
    onSave: onSave,
    isSaved: true,
    onOpenRecipe: onOpenRecipe
  })))), activeProfileTab === "liked" && (likedStories.length === 0 ? React.createElement(EmptyState, {
    title: "No Liked Recipes Yet",
    message: "Like dishes from fellow chefs to curate your favorite cravings here."
  }) : React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
  }, likedStories.map(dish => React.createElement(RecipeCard, {
    key: dish.id,
    post: dish,
    currentUserId: currentUid,
    currentUser: currentUser,
    onLike: onLike,
    isLiked: true,
    likeCount: dish.likeCount || (dish.likes ? dish.likes.length : 0),
    postLikes: dish.likes,
    comments: dish.comments,
    onAddComment: onAddComment,
    onShare: onShare,
    onSave: onSave,
    isSaved: savedPosts && !savedPosts[dish.id],
    onOpenRecipe: onOpenRecipe
  }))))));
}
function RecipeDetailModal({
  recipe,
  isOpen,
  onClose,
  currentUser,
  isLiked,
  likeCount,
  onLike,
  isSaved,
  onSave,
  onShare,
  isFollowing,
  onToggleFollow,
  comments,
  onAddComment,
  onShowLikes,
  postLikes,
  onViewStory
}) {
  if (!isOpen || !recipe) return null;
  const [commentText, setCommentText] = useState("");
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const rawCaption = decodeUnicode(recipe.caption || "");
  let dishTitle = "Delicious Creation";
  let dishDescription = rawCaption;
  if (rawCaption.includes(" • ")) {
    const parts = rawCaption.split(" • ");
    dishTitle = parts[0].trim();
    dishDescription = parts.slice(1).join(" • ").trim();
  } else if (rawCaption.length > 0 && rawCaption.length <= 50) {
    dishTitle = rawCaption;
    dishDescription = "";
  } else if (rawCaption.length > 50) {
    dishTitle = rawCaption.slice(0, 45).trim() + "...";
    dishDescription = rawCaption;
  }
  const catMeta = getCategoryMeta(recipe.category);
  const cookTime = recipe.cookTime || recipe.cookingTime || (recipe.category === "breakfast" ? "15 mins" : recipe.category === "quick" ? "15 mins" : recipe.category === "desserts" ? "35 mins" : "25 mins");
  const prepTime = recipe.prepTime || "15 mins";
  const servings = recipe.servings || "2-4 Servings";
  const difficulty = recipe.difficulty || (recipe.category === "quick" ? "Easy" : recipe.category === "desserts" ? "Medium" : "Easy");
  const defaultIngredients = useMemo(() => {
    if (recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      return recipe.ingredients;
    }
    const cat = (recipe.category || "").toLowerCase();
    if (cat.includes("breakfast")) {
      return ["2 Free-range farm eggs", "2 Slices artisan sourdough or brioche", "1 tbsp Grass-fed butter or virgin olive oil", "Pinch of smoked sea salt & fresh cracked black pepper", "Handful of fresh microgreens or chives"];
    }
    if (cat.includes("dessert")) {
      return ["200g High-grade dark chocolate (70%)", "150g Unsalted butter, softened", "3 Large eggs, room temperature", "80g Organic cane sugar", "1 tsp Pure Madagascar vanilla bean paste"];
    }
    if (cat.includes("quick") || cat.includes("snack")) {
      return ["Fresh seasonal ingredients & aromatic herbs", "1 tbsp Extra virgin olive oil", "2 Cloves freshly minced garlic", "Crushed chili flakes & sea salt to taste", "Fresh lemon zest or lime juice"];
    }
    return ["500g Fresh core ingredients (protein / organic veggies)", "2 tbsp Extra virgin cold-pressed olive oil", "3 Cloves garlic, crushed and minced", "1 tsp Smoked paprika & ground cumin", "Fresh coriander, basil or parsley for garnish", "Sea salt & freshly ground black pepper to taste"];
  }, [recipe]);
  const defaultInstructions = useMemo(() => {
    if (recipe.instructions && Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
      return recipe.instructions;
    }
    return ["Prepare all fresh ingredients, ensuring produce is washed and aromatics finely diced.", "Heat a heavy-bottomed skillet or pan over medium-high heat with olive oil until shimmering.", "Sauté aromatics until fragrant, then incorporate primary ingredients with balanced seasonings.", "Simmer gently to allow flavors to meld completely, adjusting salt and spices to taste.", "Garnish with fresh garden herbs and serve hot for the ultimate flavor experience."];
  }, [recipe]);
  const STEP_GRADIENTS = ["from-rose-500 to-amber-500", "from-amber-500 to-emerald-500", "from-emerald-500 to-teal-500", "from-cyan-500 to-blue-500", "from-violet-500 to-purple-500"];
  const handleToggleIngredient = idx => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };
  const handleToggleStep = idx => {
    setCompletedSteps(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };
  const handleCommentSubmit = e => {
    e.preventDefault();
    const clean = commentText.trim();
    if (!clean) return;
    onAddComment(recipe.id, clean);
    setCommentText("");
  };
  const isOwner = currentUser && recipe.userId === (currentUser.id || currentUser.uid);
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 modal-backdrop animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-3xl shadow-2xl overflow-hidden animate-pop-in flex flex-col text-left transition-colors",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#2F2F2F] flex items-center justify-between bg-white dark:bg-[#1C1C1C] flex-shrink-0"
  }, React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, React.createElement("span", {
    className: `px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${catMeta.badgeClass}`
  }, catMeta.icon, " ", catMeta.label), React.createElement("span", {
    className: "text-xs text-rose-500 font-semibold hidden sm:inline"
  }, "\u23F3 ", formatHoursLeft(recipe.expiresAt))), React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1.5 rounded-full text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] hover:bg-gray-100 dark:hover:bg-[#242424] transition-colors cursor-pointer text-sm font-bold"
  }, "\u2715"))), React.createElement("div", {
    className: "overflow-y-auto flex-1 p-4 sm:p-6 md:grid md:grid-cols-12 md:gap-6 space-y-6 md:space-y-0"
  }, React.createElement("div", {
    className: "md:col-span-6 space-y-5"
  }, React.createElement("div", {
    className: "relative aspect-[4/3] rounded-2xl overflow-hidden bg-rose-50 dark:bg-[#242424] shadow-sm"
  }, React.createElement("img", {
    src: recipe.mediaUrl,
    alt: dishTitle,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover"
  }), React.createElement("span", {
    className: "absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold"
  }, "\u23F1\uFE0F ", cookTime)), React.createElement("div", {
    className: "grid grid-cols-4 gap-2 text-center"
  }, React.createElement("div", {
    className: "p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
  }, React.createElement("span", {
    className: "text-sm block"
  }, "\u23F1\uFE0F"), React.createElement("span", {
    className: "text-[10px] text-amber-700/80 dark:text-amber-400 block font-semibold"
  }, "Cook"), React.createElement("span", {
    className: "text-xs font-bold text-amber-900 dark:text-amber-200 truncate block"
  }, cookTime)), React.createElement("div", {
    className: "p-2.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800"
  }, React.createElement("span", {
    className: "text-sm block"
  }, "\uD83D\uDD2A"), React.createElement("span", {
    className: "text-[10px] text-cyan-700/80 dark:text-cyan-400 block font-semibold"
  }, "Prep"), React.createElement("span", {
    className: "text-xs font-bold text-cyan-900 dark:text-cyan-200 truncate block"
  }, prepTime)), React.createElement("div", {
    className: "p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
  }, React.createElement("span", {
    className: "text-sm block"
  }, "\uD83C\uDF7D\uFE0F"), React.createElement("span", {
    className: "text-[10px] text-emerald-700/80 dark:text-emerald-400 block font-semibold"
  }, "Yield"), React.createElement("span", {
    className: "text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate block"
  }, servings)), React.createElement("div", {
    className: "p-2.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800"
  }, React.createElement("span", {
    className: "text-sm block"
  }, "\uD83D\uDCCA"), React.createElement("span", {
    className: "text-[10px] text-violet-700/80 dark:text-violet-400 block font-semibold"
  }, "Skill"), React.createElement("span", {
    className: "text-xs font-bold text-violet-900 dark:text-violet-200 truncate block"
  }, difficulty))), React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-white dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] flex items-center justify-between shadow-xs"
  }, React.createElement("div", {
    onClick: () => onViewStory && onViewStory(recipe),
    className: "flex items-center space-x-3 cursor-pointer group"
  }, React.createElement("div", {
    className: "w-10 h-10 rounded-full ring-2 ring-rose-400/40 overflow-hidden flex-shrink-0 bg-rose-50 dark:bg-rose-950/30"
  }, React.createElement("img", {
    src: recipe.userAvatar || "/uploads/avatars/" + (recipe.username || "sachin") + ".svg",
    alt: recipe.username,
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-full h-full object-cover"
  })), React.createElement("div", null, React.createElement("h4", {
    className: "text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] group-hover:text-rose-500 transition-colors leading-tight"
  }, "@", recipe.username), React.createElement("span", {
    className: "text-[11px] text-[#6B7280] dark:text-[#A1A1AA]"
  }, "Posted ", formatTimeAgo(recipe.createdAt)))), !isOwner && onToggleFollow && React.createElement("button", {
    type: "button",
    onClick: () => onToggleFollow(recipe.userId, recipe.username),
    className: `text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${isFollowing ? "bg-gray-100 dark:bg-[#2A2A2A] text-[#6B7280] dark:text-[#A1A1AA]" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-500 hover:text-white"}`
  }, isFollowing ? "Following" : "+ Follow")), React.createElement("div", {
    className: "flex items-center space-x-2.5 pt-1"
  }, React.createElement("button", {
    type: "button",
    onClick: () => onLike(recipe.id),
    className: `flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${isLiked ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25" : "bg-white dark:bg-[#1C1C1C] border-[#E5E7EB] dark:border-[#2F2F2F] text-[#1F2937] dark:text-[#F9FAFB] hover:border-rose-400"}`
  }, React.createElement("span", null, isLiked ? "❤️" : "🤍"), React.createElement("span", null, likeCount, " ", likeCount === 1 ? "Like" : "Likes")), React.createElement("button", {
    type: "button",
    onClick: () => onSave && onSave(recipe.id),
    className: `flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${isSaved ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25" : "bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] text-[#1F2937] dark:text-[#F9FAFB] hover:border-emerald-400"}`
  }, React.createElement("span", null, isSaved ? "🔖" : "📑"), React.createElement("span", null, isSaved ? "Saved" : "Save Recipe")), React.createElement("button", {
    type: "button",
    onClick: () => onShare && onShare(recipe),
    className: "py-2.5 px-3.5 rounded-2xl font-bold text-xs bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] text-cyan-600 dark:text-cyan-400 hover:border-cyan-400 transition-colors cursor-pointer",
    title: "Share Recipe"
  }, "\uD83D\uDD17"))), React.createElement("div", {
    className: "md:col-span-6 space-y-6"
  }, React.createElement("div", {
    className: "space-y-2"
  }, React.createElement("h2", {
    className: "text-xl sm:text-2xl font-extrabold text-[#1F2937] dark:text-[#F9FAFB] font-heading leading-snug"
  }, dishTitle), dishDescription && React.createElement("p", {
    className: "text-xs sm:text-sm text-[#6B7280] dark:text-[#A1A1AA] leading-relaxed"
  }, dishDescription)), React.createElement("div", {
    className: "space-y-2.5"
  }, React.createElement("h3", {
    className: "text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] flex items-center space-x-1.5"
  }, React.createElement("span", null, "\uD83E\uDD55"), React.createElement("span", null, "Ingredients Checklist")), React.createElement("div", {
    className: "space-y-1.5"
  }, defaultIngredients.map((item, idx) => {
    const isChecked = Boolean(checkedIngredients[idx]);
    return React.createElement("div", {
      key: idx,
      onClick: () => handleToggleIngredient(idx),
      className: `flex items-start space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${isChecked ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 line-through" : "bg-white dark:bg-[#1C1C1C] border-[#E5E7EB] dark:border-[#2F2F2F] text-[#1F2937] dark:text-[#F9FAFB] hover:border-emerald-300"}`
    }, React.createElement("input", {
      type: "checkbox",
      checked: isChecked,
      readOnly: true,
      className: "mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 pointer-events-none"
    }), React.createElement("span", {
      className: "flex-1"
    }, item));
  }))), React.createElement("div", {
    className: "space-y-2.5"
  }, React.createElement("h3", {
    className: "text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] flex items-center space-x-1.5"
  }, React.createElement("span", null, "\uD83D\uDC69\u200D\uD83C\uDF73"), React.createElement("span", null, "Step-by-Step Instructions")), React.createElement("div", {
    className: "space-y-2"
  }, defaultInstructions.map((step, idx) => {
    const isDone = Boolean(completedSteps[idx]);
    const grad = STEP_GRADIENTS[idx % STEP_GRADIENTS.length];
    return React.createElement("div", {
      key: idx,
      onClick: () => handleToggleStep(idx),
      className: `p-3 rounded-2xl border text-xs cursor-pointer select-none transition-all ${isDone ? "bg-[#F9FAFB] dark:bg-[#181818] border-[#E5E7EB] dark:border-[#2F2F2F] opacity-70" : "bg-white dark:bg-[#1C1C1C] border-[#E5E7EB] dark:border-[#2F2F2F] hover:border-rose-300"}`
    }, React.createElement("div", {
      className: "flex items-center space-x-2 mb-1 font-bold"
    }, React.createElement("span", {
      className: `px-2 py-0.5 rounded-full text-white text-[10px] bg-gradient-to-r ${grad}`
    }, "Step ", idx + 1), isDone && React.createElement("span", {
      className: "text-xs text-emerald-500 font-bold"
    }, "\u2713 Completed")), React.createElement("p", {
      className: `text-[#1F2937] dark:text-[#F9FAFB] leading-relaxed ${isDone ? "line-through text-[#6B7280] dark:text-[#A1A1AA]" : ""}`
    }, step));
  }))), React.createElement("div", {
    className: "space-y-3 pt-2 border-t border-[#E5E7EB] dark:border-[#2F2F2F]"
  }, React.createElement("h3", {
    className: "text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] flex items-center space-x-1.5"
  }, React.createElement("span", null, "\uD83D\uDCAC"), React.createElement("span", null, "Community Notes (", (comments || []).length, ")")), React.createElement("div", {
    className: "space-y-2 max-h-48 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#2F2F2F] pr-1"
  }, (comments || []).map((c, i) => React.createElement("div", {
    key: c.id || i,
    className: "pt-2 text-xs leading-relaxed"
  }, React.createElement("strong", {
    className: "text-rose-600 dark:text-rose-400 mr-2"
  }, "@", c.author || c.username), React.createElement("span", {
    className: "text-[#4B5563] dark:text-[#D1D5DB]"
  }, c.text)))), React.createElement("form", {
    onSubmit: handleCommentSubmit,
    className: "pt-1 flex items-center space-x-2"
  }, React.createElement("input", {
    type: "text",
    value: commentText,
    onChange: e => setCommentText(e.target.value),
    placeholder: "Add a recipe tip or review...",
    className: "flex-1 px-3.5 py-2.5 bg-rose-50/40 dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-xl text-xs text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-rose-400"
  }), React.createElement("button", {
    type: "submit",
    disabled: !commentText.trim(),
    className: "px-4 py-2.5 btn-colorful text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
  }, "Post")))))));
}
function CreateRecipeModal({
  isOpen,
  onClose,
  currentUser,
  onStoryUploaded,
  showToast
}) {
  if (!isOpen) return null;
  const [dishTitle, setDishTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("dinner");
  const [cookTime, setCookTime] = useState("25 mins");
  const [prepTime, setPrepTime] = useState("15 mins");
  const [servings, setServings] = useState("4 servings");
  const [difficulty, setDifficulty] = useState("Medium");
  const [locationTag, setLocationTag] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const handleFileSelect = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 1600, 0.85);
      setImagePreview(compressedDataUrl);
      setImageFile(file);
    } catch (err) {
      if (showToast) showToast("Could not process image file", "error");
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!imagePreview) {
      if (showToast) showToast("Please attach a food photograph", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const fullCaption = dishTitle.trim() ? `${dishTitle.trim()}${caption.trim() ? " • " + caption.trim() : ""}${locationTag.trim() ? " 📍 " + locationTag.trim() : ""}` : caption.trim() || "Daily Food Creation";
      const uid = currentUser ? currentUser.id || currentUser.uid : "usr-1";
      const uname = currentUser ? currentUser.username || currentUser.name || "chef" : "chef";
      const uavatar = currentUser ? currentUser.avatar || currentUser.avatarUrl || "/uploads/avatars/sachin.svg" : "/uploads/avatars/sachin.svg";
      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: uid,
          username: uname,
          userAvatar: uavatar,
          caption: fullCaption,
          category: category,
          mediaBase64: imagePreview,
          mediaType: "image",
          expiresInHours: 24
        })
      });
      const resData = await resp.json();
      if (resp.ok && resData && resData.success) {
        if (showToast) showToast("Recipe published successfully! Live for 24 hours ✨", "success");
        onStoryUploaded && onStoryUploaded();
        onClose();
      } else {
        if (showToast) showToast(resData && resData.error || "Failed to publish recipe", "error");
      }
    } catch (err) {
      if (showToast) showToast("Network error publishing recipe", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 modal-backdrop animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-lg bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-3xl shadow-2xl overflow-hidden animate-pop-in text-left max-h-[92vh] flex flex-col transition-colors",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2F2F2F] flex items-center justify-between bg-white dark:bg-[#1C1C1C]"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83C\uDF73"), React.createElement("h3", {
    className: "text-base font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading"
  }, "Share a Recipe")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] p-1.5 rounded-full cursor-pointer text-sm font-bold"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSubmit,
    className: "p-6 space-y-4 overflow-y-auto flex-1"
  }, React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Recipe Photograph (Required)"), React.createElement("div", {
    onClick: () => fileInputRef.current && fileInputRef.current.click(),
    className: "relative w-full aspect-[16/10] border-2 border-dashed border-rose-200 dark:border-rose-900/60 hover:border-rose-400 rounded-2xl bg-rose-50/50 dark:bg-[#161616] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group"
  }, imagePreview ? React.createElement(React.Fragment, null, React.createElement("img", {
    src: imagePreview,
    alt: "Preview",
    className: "w-full h-full object-cover"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white uppercase tracking-wide"
  }, "Tap to change photograph")) : React.createElement("div", {
    className: "text-center p-4 space-y-2"
  }, React.createElement("span", {
    className: "text-3xl block"
  }, "\uD83D\uDCF8"), React.createElement("div", {
    className: "text-xs sm:text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB]"
  }, "Click or drag food photo here"), React.createElement("p", {
    className: "text-[11px] text-[#6B7280] dark:text-[#A1A1AA]"
  }, "JPG, PNG, WebP \u2022 Auto-compressed on device")), React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif",
    capture: "environment",
    onChange: handleFileSelect,
    className: "hidden"
  }))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Recipe Title"), React.createElement("input", {
    type: "text",
    required: true,
    value: dishTitle,
    onChange: e => setDishTitle(e.target.value),
    placeholder: "E.g. Creamy Tuscan Garlic Pasta, Truffle Smash Burger...",
    className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs sm:text-sm text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-rose-400 transition-all"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Description / Culinary Story"), React.createElement("textarea", {
    rows: 3,
    value: caption,
    onChange: e => setCaption(e.target.value),
    placeholder: "Flavors, secrets, cooking tips, wine pairings...",
    className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs sm:text-sm text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-rose-400 transition-all resize-none"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Category"), React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-2"
  }, CATEGORIES.filter(c => c.id !== "all").map(cat => React.createElement("button", {
    key: cat.id,
    type: "button",
    onClick: () => setCategory(cat.id),
    className: `px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer truncate ${category === cat.id ? cat.chipActive : "bg-white dark:bg-[#161616] text-[#6B7280] dark:text-[#A1A1AA] border border-[#E5E7EB] dark:border-[#2F2F2F] hover:border-rose-300"}`
  }, cat.icon, " ", cat.label)))), React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Cook Time"), React.createElement("input", {
    type: "text",
    value: cookTime,
    onChange: e => setCookTime(e.target.value),
    placeholder: "25 mins",
    className: "w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs text-[#1F2937] dark:text-[#F9FAFB] focus:outline-none focus:border-rose-400"
  })), React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Prep Time"), React.createElement("input", {
    type: "text",
    value: prepTime,
    onChange: e => setPrepTime(e.target.value),
    placeholder: "15 mins",
    className: "w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs text-[#1F2937] dark:text-[#F9FAFB] focus:outline-none focus:border-rose-400"
  }))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Location or Restaurant (Optional)"), React.createElement("input", {
    type: "text",
    value: locationTag,
    onChange: e => setLocationTag(e.target.value),
    placeholder: "E.g. Home Kitchen, Mumbai, Paris...",
    className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs sm:text-sm text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-rose-400 transition-all"
  })), React.createElement("div", {
    className: "pt-3"
  }, React.createElement("button", {
    type: "submit",
    disabled: isSubmitting || !imagePreview,
    className: "w-full py-3.5 btn-colorful rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/25 cursor-pointer disabled:opacity-40"
  }, isSubmitting ? "Publishing to Platform..." : "Publish Recipe (24h Live) ✨")))));
}
const ShareFoodModal = CreateRecipeModal;
function StoryViewerModal({
  story,
  onClose
}) {
  if (!story) return null;
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "relative w-full max-w-sm overflow-hidden bg-[#111111] rounded-3xl aspect-[9/16] shadow-2xl flex flex-col justify-between",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "relative z-20 p-4 space-y-3 bg-gradient-to-b from-black via-black/80 to-transparent"
  }, React.createElement("div", {
    className: "w-full h-1 bg-white/20 rounded-full overflow-hidden"
  }, React.createElement("div", {
    className: "w-full h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 animate-pulse"
  })), React.createElement("div", {
    className: "flex items-center justify-between text-white"
  }, React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, React.createElement("img", {
    src: story.userAvatar || "/uploads/avatars/" + (story.username || "sachin") + ".svg",
    alt: story.username,
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-8 h-8 rounded-full object-cover ring-2 ring-rose-400"
  }), React.createElement("div", null, React.createElement("h4", {
    className: "text-xs font-bold"
  }, "@", story.username), React.createElement("span", {
    className: "text-[10px] text-gray-300"
  }, formatTimeAgo(story.createdAt)))), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-gray-300 hover:text-white text-sm font-bold p-1 cursor-pointer"
  }, "\u2715"))), React.createElement("div", {
    className: "absolute inset-0 flex items-center justify-center bg-black"
  }, story.mediaType === "video" ? React.createElement("video", {
    src: story.mediaUrl,
    autoPlay: true,
    loop: true,
    playsInline: true,
    className: "w-full h-full object-cover"
  }) : React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-center"
  })), React.createElement("div", {
    className: "relative z-20 p-4 bg-gradient-to-t from-black via-black/80 to-transparent text-white space-y-2 text-left"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "px-2 py-0.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-bold rounded-full"
  }, story.category || "Recipe"), React.createElement("span", {
    className: "text-[11px] text-gray-300"
  }, "\u23F3 ", formatHoursLeft(story.expiresAt))), React.createElement("p", {
    className: "text-xs leading-relaxed text-gray-100"
  }, decodeUnicode(story.caption)))));
}
function AnnouncementModal({
  announcement,
  isOpen,
  onClose
}) {
  if (!isOpen || !announcement || !announcement.enabled) return null;
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-md bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-3xl shadow-2xl overflow-hidden animate-pop-in text-left transition-colors",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDCE2"), React.createElement("h3", {
    className: "text-sm font-bold"
  }, announcement.title || "Community Announcement")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-white/80 hover:text-white text-sm font-bold cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "p-6 space-y-4"
  }, React.createElement("p", {
    className: "text-xs sm:text-sm text-[#1F2937] dark:text-[#F9FAFB] leading-relaxed whitespace-pre-line"
  }, announcement.message || "Welcome to FoodBite!"), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-full py-3 btn-colorful rounded-xl text-xs font-bold cursor-pointer"
  }, "Acknowledge & Continue"))));
}
function AdminBroadcastModal({
  isOpen,
  onClose,
  announcement,
  onSaveAnnouncement,
  showToast
}) {
  if (!isOpen) return null;
  const [enabled, setEnabled] = useState(announcement ? !!announcement.enabled : false);
  const [title, setTitle] = useState(announcement ? announcement.title || "" : "");
  const [message, setMessage] = useState(announcement ? announcement.message || "" : "");
  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async e => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const resp = await fetch("/api/announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          enabled,
          title: title.trim(),
          message: message.trim()
        })
      });
      const data = await resp.json();
      if (resp.ok && data && data.success) {
        if (showToast) showToast("Broadcast settings saved successfully", "success");
        onSaveAnnouncement && onSaveAnnouncement(data.announcement || {
          enabled,
          title,
          message
        });
        onClose();
      } else {
        if (showToast) showToast("Failed to save broadcast settings", "error");
      }
    } catch (err) {
      if (showToast) showToast("Error connecting to server", "error");
    } finally {
      setIsSaving(false);
    }
  };
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-lg bg-white dark:bg-[#1C1C1C] border border-[#E5E7EB] dark:border-[#2F2F2F] rounded-3xl shadow-2xl overflow-hidden animate-pop-in text-left max-h-[90vh] flex flex-col transition-colors",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 border-b border-[#E5E7EB] dark:border-[#2F2F2F] flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-base text-rose-500"
  }, "\uD83D\uDCE2"), React.createElement("h3", {
    className: "text-sm font-bold text-[#1F2937] dark:text-[#F9FAFB] font-heading"
  }, "Admin Broadcast & Maintenance Popup")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1 text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#1F2937] dark:hover:text-[#F9FAFB] cursor-pointer text-xs font-bold"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSave,
    className: "p-6 space-y-4 overflow-y-auto flex-1"
  }, React.createElement("div", {
    className: "flex items-center justify-between p-3.5 bg-rose-50/50 dark:bg-[#161616] rounded-2xl border border-rose-200 dark:border-rose-900/40"
  }, React.createElement("div", null, React.createElement("h4", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB]"
  }, "Enable Visitor Popup"), React.createElement("p", {
    className: "text-[11px] text-[#6B7280] dark:text-[#A1A1AA]"
  }, "Show maintenance or announcement notice to all visitors")), React.createElement("label", {
    className: "relative inline-flex items-center cursor-pointer"
  }, React.createElement("input", {
    type: "checkbox",
    checked: enabled,
    onChange: e => setEnabled(e.target.checked),
    className: "sr-only peer"
  }), React.createElement("div", {
    className: "w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"
  }))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Popup Title"), React.createElement("input", {
    type: "text",
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "E.g. Scheduled System Maintenance",
    className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs sm:text-sm text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-rose-400"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] block"
  }, "Popup Message"), React.createElement("textarea", {
    rows: 4,
    value: message,
    onChange: e => setMessage(e.target.value),
    placeholder: "Enter message for website visitors...",
    className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#2F2F2F] text-xs sm:text-sm text-[#1F2937] dark:text-[#F9FAFB] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-rose-400 resize-none"
  })), React.createElement("div", {
    className: "pt-2"
  }, React.createElement("button", {
    type: "submit",
    disabled: isSaving,
    className: "w-full py-3.5 btn-colorful rounded-2xl text-xs font-bold cursor-pointer"
  }, isSaving ? "Saving..." : "Save & Broadcast to Visitors")))));
}
function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("foodbite_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    } catch (e) {}
    return "light";
  });
  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("foodbite_theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {}
  };
  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {}
  }, [theme]);
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
          avatar: "/uploads/avatars/sachin.svg",
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
      return new URLSearchParams(window.location.search).get("tab") || "home";
    } catch (e) {
      return "home";
    }
  });
  const [stories, setStories] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [followingList, setFollowingList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [likes, setLikes] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [postLikes, setPostLikes] = useState({});
  const [likesModalData, setLikesModalData] = useState(null);
  const [comments, setComments] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [heartBursts, setHeartBursts] = useState({});
  const [announcement, setAnnouncement] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(() => {
    try {
      return Boolean(typeof window !== "undefined" && window.sessionStorage && window.sessionStorage.getItem("dismissed_announcement_ts"));
    } catch (e) {
      return false;
    }
  });
  const showToast = (message, type = "info") => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };
  const removeToast = id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  const fetchStories = async (silent = false) => {
    if (!silent) setIsLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await fetch("/api/feed?_t=" + Date.now(), {
        cache: "no-store"
      });
      const data = await res.json();
      if (data && data.success) {
        const posts = data.posts || [];
        setStories(posts);
        const newLikes = {};
        const newCounts = {};
        const newPostLikes = {};
        const newComments = {};
        const currentUid = currentUser ? currentUser.id || currentUser.uid : "";
        const currentUname = currentUser ? (currentUser.username || currentUser.name || "").toLowerCase() : "";
        posts.forEach(p => {
          const pLikes = Array.isArray(p.likes) ? p.likes : [];
          newPostLikes[p.id] = pLikes;
          newCounts[p.id] = typeof p.likeCount === "number" ? p.likeCount : pLikes.length;
          newLikes[p.id] = pLikes.some(u => u.userId && u.userId === currentUid || u.username && u.username.toLowerCase() === currentUname);
          if (Array.isArray(p.comments)) {
            newComments[p.id] = p.comments.map(c => ({
              id: c.id,
              author: c.username || c.author || "foodie",
              text: c.text,
              createdAt: c.createdAt
            }));
          }
        });
        setLikeCounts(newCounts);
        setLikes(newLikes);
        setPostLikes(newPostLikes);
        setComments(prev => ({
          ...newComments,
          ...prev
        }));
        if (data.announcement) {
          setAnnouncement(data.announcement);
          if (data.announcement.enabled) {
            setShowAnnouncementModal(true);
          }
        }
      } else {
        if (!silent) setFeedError("Failed to retrieve recipes.");
      }
    } catch (err) {
      if (!silent) setFeedError("Network interface disruption.");
    } finally {
      if (!silent) setIsLoadingFeed(false);
    }
  };
  const fetchProfile = async uid => {
    const targetUid = uid || (currentUser ? currentUser.id || currentUser.uid : "usr-1");
    try {
      const res = await fetch("/api/profile?userId=" + encodeURIComponent(targetUid) + "&_t=" + Date.now(), {
        cache: "no-store"
      });
      const data = await res.json();
      if (data && data.success) {
        setUserProfile(data);
      }
    } catch (err) {}
  };
  const fetchFollows = async uid => {
    const targetUid = uid || (currentUser ? currentUser.id || currentUser.uid : "usr-1");
    try {
      const res = await fetch("/api/follow?userId=" + encodeURIComponent(targetUid) + "&_t=" + Date.now(), {
        cache: "no-store"
      });
      const data = await res.json();
      if (data && data.success) {
        setFollowingList(data.following || []);
      }
    } catch (err) {}
  };
  const fetchNotifications = async uid => {
    const targetUid = uid || (currentUser ? currentUser.id || currentUser.uid : "usr-1");
    try {
      const res = await fetch("/api/notifications?userId=" + encodeURIComponent(targetUid) + "&_t=" + Date.now(), {
        cache: "no-store"
      });
      const data = await res.json();
      if (data && data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {}
  };
  useEffect(() => {
    window.showToast = showToast;
    const fetchAnn = async () => {
      try {
        const aRes = await fetch("/api/announcement?_t=" + Date.now(), {
          cache: "no-store"
        });
        const aData = await aRes.json();
        if (aData && aData.success && aData.announcement) {
          setAnnouncement(aData.announcement);
        }
      } catch (e) {}
    };
    fetchAnn();
    const handleOpenStoryEvent = e => {
      if (e && e.detail) setViewingStory(e.detail);
    };
    window.addEventListener("openStory", handleOpenStoryEvent);
    return () => window.removeEventListener("openStory", handleOpenStoryEvent);
  }, []);
  useEffect(() => {
    if (currentUser) {
      const uid = currentUser.id || currentUser.uid;
      fetchStories();
      fetchProfile(uid);
      fetchFollows(uid);
      fetchNotifications(uid);
      const pollInterval = setInterval(() => {
        fetchStories(true);
        fetchNotifications(uid);
      }, 7000);
      const handleSync = () => {
        if (document.visibilityState === "visible") {
          fetchStories(true);
          fetchNotifications(uid);
        }
      };
      document.addEventListener("visibilitychange", handleSync);
      window.addEventListener("focus", handleSync);
      return () => {
        clearInterval(pollInterval);
        document.removeEventListener("visibilitychange", handleSync);
        window.removeEventListener("focus", handleSync);
      };
    }
  }, [currentUser]);
  const handleToggleFollow = async (targetUserId, targetUsername) => {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.uid;
    if (uid === targetUserId) return;
    const isCurrentlyFollowing = followingList.includes(targetUserId);
    const nextFollowing = isCurrentlyFollowing ? followingList.filter(id => id !== targetUserId) : [...followingList, targetUserId];
    setFollowingList(nextFollowing);
    showToast(isCurrentlyFollowing ? "Unfollowed @" + (targetUsername || "user") : "Following @" + (targetUsername || "user") + " ✨", "success");
    try {
      const resp = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          followerId: uid,
          followingId: targetUserId,
          action: "toggle"
        })
      });
      const data = await resp.json();
      if (data && typeof data.isFollowing === "boolean") {
        setFollowingList(prev => {
          const has = prev.includes(targetUserId);
          if (data.isFollowing && !has) return [...prev, targetUserId];
          if (!data.isFollowing && has) return prev.filter(id => id !== targetUserId);
          return prev;
        });
      }
    } catch (err) {}
  };
  const handleDeletePost = async postId => {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.uid;
    try {
      const resp = await fetch("/api/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId,
          userId: uid
        })
      });
      const data = await resp.json();
      if (data && data.success) {
        setStories(prev => prev.filter(p => p.id !== postId));
        showToast("Recipe removed successfully", "info");
        fetchProfile(uid);
      } else {
        showToast(data && data.error ? data.error : "Could not remove recipe", "error");
      }
    } catch (err) {
      showToast("Failed to delete recipe", "error");
    }
  };
  const toggleLike = async postId => {
    if (!currentUser) {
      showToast("Please log in to like recipes", "info");
      return;
    }
    const uid = currentUser.id || currentUser.uid;
    const uname = currentUser.username || currentUser.name || "foodie";
    const uavatar = currentUser.avatar || currentUser.avatarUrl || "/uploads/avatars/sachin.svg";
    const isLiked = !likes[postId];
    const curCount = likeCounts[postId] || 0;
    const nextCount = isLiked ? curCount + 1 : Math.max(0, curCount - 1);
    setLikes(prev => ({
      ...prev,
      [postId]: isLiked
    }));
    setLikeCounts(prev => ({
      ...prev,
      [postId]: nextCount
    }));
    setPostLikes(prev => {
      const list = prev[postId] || [];
      if (isLiked) {
        return {
          ...prev,
          [postId]: [...list, {
            userId: uid,
            username: uname,
            userAvatar: uavatar,
            likedAt: Date.now()
          }]
        };
      } else {
        return {
          ...prev,
          [postId]: list.filter(u => u.userId !== uid && (u.username || "").toLowerCase() !== uname.toLowerCase())
        };
      }
    });
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId,
          userId: uid,
          username: uname,
          userAvatar: uavatar
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setLikeCounts(prev => ({
          ...prev,
          [postId]: data.likeCount
        }));
        setLikes(prev => ({
          ...prev,
          [postId]: data.isLiked
        }));
        if (Array.isArray(data.likes)) {
          setPostLikes(prev => ({
            ...prev,
            [postId]: data.likes
          }));
        }
      }
    } catch (e) {}
  };
  const handleDoubleTap = post => {
    const postId = post.id;
    if (navigator.vibrate) {
      try {
        navigator.vibrate([50]);
      } catch (e) {}
    }
    setHeartBursts(prev => ({
      ...prev,
      [postId]: true
    }));
    setTimeout(() => {
      setHeartBursts(prev => ({
        ...prev,
        [postId]: false
      }));
    }, 750);
    if (!likes[postId]) {
      toggleLike(postId);
    }
  };
  const handleAddComment = async (postId, commentText) => {
    if (!commentText.trim()) return;
    const author = currentUser ? currentUser.username || currentUser.name || "foodie" : "foodie";
    const uid = currentUser ? currentUser.id || currentUser.uid || "usr-1" : "usr-1";
    const uavatar = currentUser ? currentUser.avatar || currentUser.avatarUrl || "" : "";
    const cleanText = commentText.trim();
    const tempId = "cmt_" + Date.now();
    const newComment = {
      id: tempId,
      author,
      username: author,
      userId: uid,
      userAvatar: uavatar,
      text: cleanText,
      createdAt: Date.now()
    };
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));
    showToast("Comment posted 💬", "success");
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId,
          userId: uid,
          username: author,
          userAvatar: uavatar,
          text: cleanText
        })
      });
    } catch (e) {}
  };
  const handleSharePost = post => {
    if (navigator.share) {
      navigator.share({
        title: "FoodBite: " + post.username,
        text: post.caption,
        url: window.location.href
      }).catch(() => {});
    } else {
      try {
        navigator.clipboard.writeText(window.location.href);
        showToast("Recipe link copied 🔗", "info");
      } catch (e) {
        showToast("Link: " + window.location.href, "info");
      }
    }
  };
  const toggleSave = postId => {
    const isSaved = !savedPosts[postId];
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !isSaved
    }));
    showToast(isSaved ? "Removed from saved recipes" : "Recipe saved to bookmarks 🔖", "info");
  };
  const handleLogout = () => {
    localStorage.removeItem("foodbite_session");
    setCurrentUser(null);
    showToast("Signed out successfully", "info");
  };
  const filteredStories = useMemo(() => {
    if (!stories) return [];
    let list = [...stories];
    if (activeCategory === "trending") {
      list.sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0));
    } else if (activeCategory !== "all") {
      const catObj = CATEGORIES.find(c => c.id === activeCategory);
      if (catObj) {
        const needle = catObj.label.toLowerCase();
        list = list.filter(s => {
          const text = ((s.caption || "") + " " + (s.username || "") + " " + (s.category || "")).toLowerCase();
          return text.includes(catObj.id) || text.includes(needle);
        });
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const text = ((s.caption || "") + " " + (s.username || "")).toLowerCase();
        return text.includes(q);
      });
    }
    return list;
  }, [stories, activeCategory, searchQuery, likeCounts]);
  if (!currentUser) {
    return React.createElement("div", {
      className: "min-h-screen w-full bg-[#FFF9F3] dark:bg-[#111111] text-[#1F2937] dark:text-[#F9FAFB] transition-colors"
    }, React.createElement(AuthScreen, {
      onAuthSuccess: (user, token) => {
        localStorage.setItem("foodbite_session", JSON.stringify({
          user,
          token
        }));
        setCurrentUser(user);
        showToast("Welcome back, @" + (user.username || user.name) + "! ✨", "success");
        const uid = user.id || user.uid;
        fetchProfile(uid);
        fetchStories();
        fetchFollows(uid);
        fetchNotifications(uid);
      },
      showToast: showToast
    }), React.createElement(AnnouncementModal, {
      announcement: announcement,
      isOpen: Boolean(announcement && announcement.enabled && !dismissedAnnouncement),
      onClose: () => {
        setDismissedAnnouncement(true);
        try {
          if (typeof window !== "undefined" && window.sessionStorage && announcement && announcement.updatedAt) {
            window.sessionStorage.setItem("dismissed_announcement_ts", String(announcement.updatedAt));
          }
        } catch (e) {}
      }
    }), React.createElement(AdminBroadcastModal, {
      isOpen: showBroadcastModal,
      onClose: () => setShowBroadcastModal(false),
      announcement: announcement,
      onSaveAnnouncement: updated => {
        setAnnouncement(updated);
        if (updated && updated.enabled) {
          try {
            if (typeof window !== "undefined" && window.sessionStorage) {
              window.sessionStorage.removeItem("dismissed_announcement_ts");
            }
          } catch (e) {}
          setDismissedAnnouncement(false);
          setShowAnnouncementModal(true);
        }
      },
      showToast: showToast
    }), React.createElement(ToastContainer, {
      toasts: toasts,
      removeToast: removeToast
    }));
  }
  const currentUserId = currentUser.id || currentUser.uid;
  const streakCount = userProfile && userProfile.user ? userProfile.user.streak || 0 : 0;
  return React.createElement("div", {
    className: "min-h-screen w-full flex flex-col bg-[#FFF9F3] dark:bg-[#111111] text-[#1F2937] dark:text-[#F9FAFB] transition-colors antialiased"
  }, React.createElement(DesktopNavBar, {
    activeTab: activeTab,
    setActiveTab: setActiveTab,
    onTriggerUpload: () => setStoryModalOpen(true),
    userProfile: userProfile,
    currentUser: currentUser,
    onRefreshFeed: () => fetchStories(true),
    onTriggerBroadcast: () => setShowBroadcastModal(true),
    announcement: announcement,
    theme: theme,
    onToggleTheme: handleToggleTheme
  }), React.createElement(MobileTopBar, {
    streak: streakCount,
    onLogoClick: () => {
      setActiveTab("home");
      fetchStories(true);
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    onTriggerBroadcast: () => setShowBroadcastModal(true),
    announcement: announcement,
    currentUser: currentUser,
    theme: theme,
    onToggleTheme: handleToggleTheme
  }), React.createElement("main", {
    className: "flex-1 w-full"
  }, activeTab === "home" && React.createElement("div", {
    className: "w-full"
  }, React.createElement(ModernHeroSection, {
    currentUser: currentUser,
    searchQuery: searchQuery,
    setSearchQuery: setSearchQuery,
    activeCategory: activeCategory,
    setActiveCategory: setActiveCategory,
    onTriggerUpload: () => setStoryModalOpen(true)
  }), React.createElement(StoriesTray, {
    stories: stories,
    currentUser: currentUser,
    onTriggerUpload: () => setStoryModalOpen(true),
    onViewStory: s => setViewingStory(s)
  }), React.createElement("div", {
    id: "food-feed-section",
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16 space-y-8"
  }, React.createElement(FeaturedRecipesShelf, {
    stories: stories,
    onOpenRecipe: r => setSelectedRecipe(r),
    onLike: toggleLike,
    likes: likes
  }), React.createElement(TrendingNowShelf, {
    stories: stories,
    onOpenRecipe: r => setSelectedRecipe(r)
  }), React.createElement(PopularNearYouShelf, null), React.createElement("div", {
    className: "pt-4 text-left border-b border-[#E5E7EB] dark:border-[#2F2F2F] pb-4 flex flex-wrap items-center justify-between gap-3"
  }, React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-rose-500"
  }, "Community Recipe Feed"), React.createElement("h2", {
    className: "text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-[#F9FAFB] tracking-tight font-heading leading-tight"
  }, searchQuery ? `Dishes matching "${searchQuery}"` : activeCategory !== "all" ? `${activeCategory.toUpperCase()} RECIPES` : "Fresh Daily Recipes")), React.createElement("span", {
    className: "text-xs text-[#6B7280] dark:text-[#A1A1AA]"
  }, filteredStories.length, " ", filteredStories.length === 1 ? "recipe available" : "recipes available")), feedError && React.createElement(ErrorState, {
    message: feedError,
    onRetry: fetchStories
  }), isLoadingFeed ? React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, React.createElement(FoodCardSkeleton, null), React.createElement(FoodCardSkeleton, null), React.createElement(FoodCardSkeleton, null)) : filteredStories.length === 0 ? React.createElement(EmptyState, {
    title: searchQuery ? "No Dishes Matched Search" : "No Recipes Found",
    message: searchQuery ? "Try searching for pasta, breakfast, spicy curries, or tacos." : "Be the first chef to share a delicious recipe today!",
    actionLabel: searchQuery ? "Clear Search" : "+ Share First Recipe",
    onAction: () => {
      if (searchQuery) setSearchQuery("");else setStoryModalOpen(true);
    }
  }) : React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, filteredStories.map(post => React.createElement(RecipeCard, {
    key: post.id,
    post: post,
    currentUserId: currentUserId,
    currentUser: currentUser,
    isFollowing: followingList.includes(post.userId),
    onToggleFollow: handleToggleFollow,
    onLike: toggleLike,
    isLiked: !likes[post.id],
    likeCount: likeCounts[post.id] !== undefined ? likeCounts[post.id] : post.likeCount || 0,
    postLikes: postLikes[post.id] || post.likes || [],
    onShowLikes: (pId, lks) => setLikesModalData({
      postId: pId,
      likes: lks
    }),
    onDoubleTap: handleDoubleTap,
    heartBurst: !heartBursts[post.id],
    comments: comments[post.id] || post.comments || [],
    onAddComment: handleAddComment,
    onShare: handleSharePost,
    onSave: toggleSave,
    isSaved: !savedPosts[post.id],
    onViewStory: s => setViewingStory(s),
    onOpenRecipe: r => setSelectedRecipe(r),
    onDeletePost: handleDeletePost
  }))))), activeTab === "explore" && React.createElement(ExploreView, {
    stories: stories,
    onOpenRecipe: r => setSelectedRecipe(r),
    onTriggerUpload: () => setStoryModalOpen(true),
    onToggleFollow: handleToggleFollow,
    followingList: followingList,
    currentUser: currentUser,
    likes: likes,
    savedPosts: savedPosts,
    onLike: toggleLike,
    onSave: toggleSave,
    onShare: handleSharePost,
    onAddComment: handleAddComment,
    onShowLikes: (pId, lks) => setLikesModalData({
      postId: pId,
      likes: lks
    }),
    onDeletePost: handleDeletePost
  }), activeTab === "saved" && React.createElement(SavedView, {
    stories: stories,
    savedPosts: savedPosts,
    onOpenRecipe: r => setSelectedRecipe(r),
    onLike: toggleLike,
    onSave: toggleSave,
    onShare: handleSharePost,
    onAddComment: handleAddComment,
    likes: likes,
    currentUser: currentUser,
    followingList: followingList,
    onToggleFollow: handleToggleFollow,
    setActiveTab: setActiveTab
  }), activeTab === "profile" && React.createElement(ProfileView, {
    currentUser: currentUser,
    userProfile: userProfile,
    stories: stories,
    onLogout: handleLogout,
    onTriggerUpload: () => setStoryModalOpen(true),
    onTriggerBroadcast: () => setShowBroadcastModal(true),
    announcement: announcement,
    savedPosts: savedPosts,
    likes: likes,
    onOpenRecipe: r => setSelectedRecipe(r),
    onLike: toggleLike,
    onSave: toggleSave,
    onShare: handleSharePost,
    onAddComment: handleAddComment,
    followingList: followingList,
    onToggleFollow: handleToggleFollow
  })), React.createElement(FloatingCreateButton, {
    onTriggerUpload: () => setStoryModalOpen(true)
  }), React.createElement("footer", {
    className: "w-full py-10 border-t border-[#E5E7EB] dark:border-[#2F2F2F] bg-white dark:bg-[#1C1C1C] text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-auto hidden md:block text-left transition-colors"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto px-6 space-y-6"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#2F2F2F] pb-6"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("div", {
    className: "w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500 text-white flex items-center justify-center text-lg shadow-sm"
  }, "\uD83D\uDD25"), React.createElement("div", null, React.createElement("span", {
    className: "text-lg font-extrabold text-[#1F2937] dark:text-[#F9FAFB] tracking-tight font-heading block leading-tight"
  }, "Food", React.createElement("span", {
    className: "text-gradient-rainbow"
  }, "Bite")), React.createElement("span", {
    className: "text-[10px] font-bold text-rose-500/80 uppercase tracking-wide block"
  }, "Discover. Share. Crave."))), React.createElement("div", {
    className: "flex items-center space-x-6 text-xs text-[#6B7280] dark:text-[#A1A1AA]"
  }, React.createElement("span", null, "Curated Recipes"), React.createElement("span", null, "\u2022"), React.createElement("span", null, "Daily 24h Stories"), React.createElement("span", null, "\u2022"), React.createElement("span", {
    className: "text-rose-500 font-bold"
  }, "Social Food Discovery"))), React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4 text-xs"
  }, React.createElement("p", {
    className: "text-[#6B7280] dark:text-[#A1A1AA]"
  }, "\xA9 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari."), React.createElement("div", {
    className: "flex items-center space-x-4 text-[#6B7280] dark:text-[#A1A1AA]"
  }, React.createElement("span", {
    className: "hover:text-rose-500 cursor-pointer"
  }, "Terms"), React.createElement("span", null, "\u2022"), React.createElement("span", {
    className: "hover:text-rose-500 cursor-pointer"
  }, "Privacy"), React.createElement("span", null, "\u2022"), React.createElement("span", {
    className: "hover:text-rose-500 cursor-pointer"
  }, "Recipe Guidelines"))))), React.createElement(MobileBottomNav, {
    activeTab: activeTab,
    setActiveTab: setActiveTab,
    onTriggerUpload: () => setStoryModalOpen(true),
    onRefreshFeed: () => fetchStories(true)
  }), React.createElement(RecipeDetailModal, {
    recipe: selectedRecipe,
    isOpen: Boolean(selectedRecipe),
    onClose: () => setSelectedRecipe(null),
    currentUser: currentUser,
    isLiked: selectedRecipe ? !likes[selectedRecipe.id] : false,
    likeCount: selectedRecipe ? likeCounts[selectedRecipe.id] || (selectedRecipe.likes ? selectedRecipe.likes.length : 0) : 0,
    onLike: toggleLike,
    isSaved: selectedRecipe ? !savedPosts[selectedRecipe.id] : false,
    onSave: toggleSave,
    onShare: handleSharePost,
    isFollowing: selectedRecipe ? followingList.includes(selectedRecipe.userId) : false,
    onToggleFollow: handleToggleFollow,
    comments: selectedRecipe ? comments[selectedRecipe.id] || selectedRecipe.comments || [] : [],
    onAddComment: handleAddComment,
    onShowLikes: (pId, lks) => setLikesModalData({
      postId: pId,
      likes: lks
    }),
    postLikes: selectedRecipe ? postLikes[selectedRecipe.id] || selectedRecipe.likes || [] : [],
    onViewStory: s => setViewingStory(s)
  }), React.createElement(CreateRecipeModal, {
    isOpen: storyModalOpen,
    onClose: () => setStoryModalOpen(false),
    currentUser: currentUser,
    onStoryUploaded: () => {
      fetchStories();
      fetchProfile();
      fetchNotifications();
      setActiveTab("home");
    },
    showToast: showToast
  }), React.createElement(StoryViewerModal, {
    story: viewingStory,
    onClose: () => setViewingStory(null)
  }), React.createElement(AnnouncementModal, {
    announcement: announcement,
    isOpen: Boolean(announcement && announcement.enabled && !dismissedAnnouncement),
    onClose: () => {
      setDismissedAnnouncement(true);
      try {
        if (typeof window !== "undefined" && window.sessionStorage && announcement && announcement.updatedAt) {
          window.sessionStorage.setItem("dismissed_announcement_ts", String(announcement.updatedAt));
        }
      } catch (e) {}
    }
  }), React.createElement(AdminBroadcastModal, {
    isOpen: showBroadcastModal,
    onClose: () => setShowBroadcastModal(false),
    announcement: announcement,
    onSaveAnnouncement: updated => {
      setAnnouncement(updated);
      if (updated && updated.enabled) {
        try {
          if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.removeItem("dismissed_announcement_ts");
          }
        } catch (e) {}
        setDismissedAnnouncement(false);
        setShowAnnouncementModal(true);
      }
    },
    showToast: showToast
  }), React.createElement(LikesModal, {
    isOpen: Boolean(likesModalData),
    onClose: () => setLikesModalData(null),
    likes: likesModalData ? likesModalData.likes : [],
    currentUser: currentUser,
    onToggleFollow: handleToggleFollow,
    followingList: followingList
  }), React.createElement(ToastContainer, {
    toasts: toasts,
    removeToast: removeToast
  }));
}
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(App, null));
}

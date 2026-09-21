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
  if (remainingMs <= 0) return "Expiring";
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const mins = Math.floor(remainingMs % (1000 * 60 * 60) / (1000 * 60));
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
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          if (!width || !height) {
            resolve(srcUrl);
            return;
          }
          if (width > maxWidth || height > maxWidth) {
            if (width >= height) {
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
  label: "All Bites",
  icon: "✨"
}, {
  id: "trending",
  label: "Trending",
  icon: "🔥"
}, {
  id: "street",
  label: "Street Food",
  icon: "🌮"
}, {
  id: "pizza",
  label: "Pizza & Pasta",
  icon: "🍕"
}, {
  id: "healthy",
  label: "Healthy Bowls",
  icon: "🥗"
}, {
  id: "desserts",
  label: "Desserts & Bakery",
  icon: "🍰"
}, {
  id: "drinks",
  label: "Coffee & Drinks",
  icon: "☕"
}];
function ToastContainer({
  toasts,
  removeToast
}) {
  return React.createElement("div", {
    className: "fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4"
  }, toasts.map(toast => React.createElement("div", {
    key: toast.id,
    className: `pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-xs font-medium animate-pop-in ${toast.type === "success" ? "bg-[#121214] text-white border-black/10" : toast.type === "error" ? "bg-rose-900 text-white border-rose-800" : "bg-white text-[#121214] border-[#e8e4dc]"}`
  }, React.createElement("span", {
    className: "flex-1 mr-2"
  }, toast.message), React.createElement("button", {
    type: "button",
    onClick: () => removeToast(toast.id),
    className: "text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-bold"
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
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-white rounded-2xl border border-[#e8e4dc] shadow-xl overflow-hidden animate-pop-in text-left",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-5 py-3.5 border-b border-[#f0ece4] flex items-center justify-between bg-white"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-sm"
  }, "\u2764\uFE0F"), React.createElement("h3", {
    className: "text-sm font-bold text-[#121214]"
  }, "Likes (", (likes || []).length, ")")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1 rounded-lg text-[#736f68] hover:text-[#121214] hover:bg-[#f5f2eb] transition-colors cursor-pointer text-xs font-bold"
  }, "\u2715")), React.createElement("div", {
    className: "p-4 max-h-80 overflow-y-auto space-y-3 divide-y divide-[#f5f2eb]"
  }, !likes || likes.length === 0 ? React.createElement("p", {
    className: "text-center text-xs text-[#a6a198] py-8"
  }, "No likes yet. Be the first to crave this bite!") : likes.map((u, i) => {
    const uid = u.userId || u.uid || "";
    const uname = (u.username || "foodie").toLowerCase();
    const isMe = uid && uid === currentUid || uname && uname === currentUname;
    const isFollowing = followingList && followingList.includes(uid);
    return React.createElement("div", {
      key: (uid || uname) + "_" + i,
      className: "pt-3 first:pt-0 flex items-center justify-between"
    }, React.createElement("div", {
      className: "flex items-center space-x-2.5"
    }, React.createElement("img", {
      src: u.userAvatar || u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      alt: u.username,
      className: "w-8 h-8 rounded-full object-cover border border-[#e8e4dc]"
    }), React.createElement("div", null, React.createElement("span", {
      className: "text-xs font-bold text-[#121214] block"
    }, "@", u.username || "foodie"), u.likedAt && React.createElement("span", {
      className: "text-[10px] text-[#a6a198] block"
    }, formatTimeAgo(u.likedAt)))), !isMe && onToggleFollow && uid && React.createElement("button", {
      type: "button",
      onClick: () => onToggleFollow(uid, u.username),
      className: `text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${isFollowing ? "bg-[#f5f2eb] text-[#736f68] hover:bg-[#e8e4dc]" : "bg-[#fff5f0] text-[#f05a28] hover:bg-[#ffe8de]"}`
    }, isFollowing ? "Following" : "Follow"));
  }))));
}
function FoodCardSkeleton() {
  return React.createElement("div", {
    className: "food-card p-4 space-y-3 animate-pulse"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("div", {
    className: "w-8 h-8 rounded-full bg-[#e8e4dc]"
  }), React.createElement("div", {
    className: "space-y-1.5 flex-1"
  }, React.createElement("div", {
    className: "h-3 bg-[#e8e4dc] rounded w-28"
  }), React.createElement("div", {
    className: "h-2 bg-[#e8e4dc] rounded w-16"
  }))), React.createElement("div", {
    className: "w-full aspect-[4/3] rounded-xl bg-[#e8e4dc]"
  }), React.createElement("div", {
    className: "space-y-2 pt-1"
  }, React.createElement("div", {
    className: "h-3.5 bg-[#e8e4dc] rounded w-3/4"
  }), React.createElement("div", {
    className: "h-3 bg-[#e8e4dc] rounded w-1/2"
  })));
}
function EmptyState({
  title,
  message,
  actionLabel,
  onAction
}) {
  return React.createElement("div", {
    className: "w-full py-16 px-4 flex flex-col items-center justify-center text-center space-y-3"
  }, React.createElement("div", {
    className: "w-16 h-16 rounded-2xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] flex items-center justify-center text-3xl shadow-xs"
  }, "\uD83C\uDF7D\uFE0F"), React.createElement("h3", {
    className: "text-base font-bold text-[#121214] tracking-tight"
  }, title), React.createElement("p", {
    className: "text-xs text-[#736f68] max-w-sm leading-relaxed"
  }, message), actionLabel && onAction && React.createElement("button", {
    type: "button",
    onClick: onAction,
    className: "mt-2 px-4 py-2 rounded-xl bg-[#121214] hover:bg-black text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
  }, actionLabel));
}
function ErrorState({
  message,
  onRetry
}) {
  return React.createElement("div", {
    className: "w-full py-12 px-4 flex flex-col items-center justify-center text-center space-y-3"
  }, React.createElement("div", {
    className: "w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-2xl"
  }, "\u26A0\uFE0F"), React.createElement("h3", {
    className: "text-sm font-bold text-[#121214]"
  }, "Could not load feed"), React.createElement("p", {
    className: "text-xs text-[#736f68] max-w-xs"
  }, message || "Connection issue. Please try again."), onRetry && React.createElement("button", {
    type: "button",
    onClick: onRetry,
    className: "px-3.5 py-1.5 rounded-lg bg-[#121214] hover:bg-black text-white text-xs font-medium shadow-sm cursor-pointer"
  }, "Retry"));
}
function AuthScreen({
  onAuthSuccess,
  showToast
}) {
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const handleContinue = async e => {
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: cleanUsername
        })
      });
      const data = await resp.json();
      if (resp.ok && data && data.success) {
        onAuthSuccess(data.user, data.token);
      } else {
        setErrorMessage(data && data.message ? data.message : "Could not sign in with this username");
      }
    } catch (err) {
      setErrorMessage("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return React.createElement("div", {
    className: "min-h-screen flex items-center justify-center p-4 bg-[#fbf9f6]"
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-white border border-[#e8e4dc] rounded-2xl p-7 shadow-lg shadow-black/5 text-[#1a1917] space-y-5 animate-pop-in"
  }, React.createElement("div", {
    className: "text-center space-y-2"
  }, React.createElement("div", {
    className: "w-12 h-12 rounded-2xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] flex items-center justify-center text-2xl mx-auto shadow-2xs"
  }, "\uD83D\uDD25"), React.createElement("h2", {
    className: "text-xl font-bold text-[#121214] tracking-tight"
  }, "FoodBite"), React.createElement("p", {
    className: "text-[11px] uppercase tracking-widest text-[#f05a28] font-semibold"
  }, "Discover. Share. Crave."), React.createElement("p", {
    className: "text-xs text-[#736f68] leading-relaxed max-w-xs mx-auto pt-1"
  }, "Enter your username to explore fresh daily food stories and share your cravings. No password required.")), errorMessage && React.createElement("div", {
    className: "p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center animate-fade-in"
  }, errorMessage), React.createElement("form", {
    onSubmit: handleContinue,
    className: "space-y-4"
  }, React.createElement("div", {
    className: "space-y-1.5 text-left"
  }, React.createElement("label", {
    className: "text-xs font-semibold text-[#121214] block"
  }, "Username"), React.createElement("div", {
    className: "relative"
  }, React.createElement("span", {
    className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#a6a198] font-mono"
  }, "@"), React.createElement("input", {
    type: "text",
    autoFocus: true,
    required: true,
    value: username,
    onChange: e => setUsername(e.target.value),
    placeholder: "chef_sachin",
    maxLength: 30,
    className: "w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs font-medium text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white focus:ring-2 focus:ring-[#f05a28]/10 transition-all"
  })), React.createElement("p", {
    className: "text-[10px] text-[#736f68]"
  }, "Existing profiles resume immediately; new usernames create a profile instantly.")), React.createElement("button", {
    type: "submit",
    disabled: isLoading || !cleanUsername,
    className: "w-full py-3 rounded-xl bg-[#121214] hover:bg-black text-white text-xs font-semibold tracking-wide disabled:opacity-40 shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
  }, isLoading ? React.createElement("span", null, "Entering...") : React.createElement(React.Fragment, null, React.createElement("span", null, "Continue to FoodBite"), React.createElement("span", null, "\u2192")))), React.createElement("div", {
    className: "pt-2 text-center border-t border-[#f0ece4]"
  }, React.createElement("p", {
    className: "text-[10px] text-[#a6a198]"
  }, "\xA9 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari."))));
}
function HomeHeroSection({
  onExplore,
  onShareFood
}) {
  return React.createElement("section", {
    className: "w-full bg-white border-b border-[#e8e4dc] py-6 sm:py-8 px-4 sm:px-6"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
  }, React.createElement("div", {
    className: "max-w-xl space-y-3 text-left"
  }, React.createElement("div", {
    className: "inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] text-[11px] font-semibold"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, "24-Hour Ephemeral Food Feed")), React.createElement("h1", {
    className: "text-2xl sm:text-3xl font-bold tracking-tight text-[#121214] leading-tight font-heading"
  }, "Discover food. Share your cravings."), React.createElement("p", {
    className: "text-xs sm:text-sm text-[#736f68] leading-relaxed"
  }, "FoodBite is a social discovery platform where everyday food lovers and home chefs share their daily food creations. Every post stays fresh for 24 hours to keep the community vibrant."), React.createElement("div", {
    className: "pt-2 flex items-center space-x-3"
  }, React.createElement("button", {
    type: "button",
    onClick: onExplore,
    className: "px-4 py-2 rounded-xl bg-[#121214] hover:bg-black text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
  }, "Explore Food"), React.createElement("button", {
    type: "button",
    onClick: onShareFood,
    className: "px-4 py-2 rounded-xl bg-[#fff5f0] hover:bg-[#ffe8de] text-[#f05a28] border border-[#ffe8de] text-xs font-semibold tracking-wide shadow-2xs hover:shadow active:scale-95 transition-all cursor-pointer"
  }, "+ Share a Bite"))), React.createElement("div", {
    className: "hidden lg:flex items-center space-x-4"
  }, React.createElement("div", {
    className: "w-48 rounded-2xl overflow-hidden shadow-md border border-[#e8e4dc] bg-white -rotate-2 hover:rotate-0 transition-transform duration-300"
  }, React.createElement("img", {
    src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
    alt: "Fresh bowl",
    className: "w-full h-36 object-cover"
  }), React.createElement("div", {
    className: "p-2.5 text-left"
  }, React.createElement("span", {
    className: "text-[10px] text-[#f05a28] font-bold block"
  }, "SALAD BOWL"), React.createElement("span", {
    className: "text-xs font-semibold text-[#121214] truncate block"
  }, "Avocado Green Crunch"))), React.createElement("div", {
    className: "w-48 rounded-2xl overflow-hidden shadow-md border border-[#e8e4dc] bg-white rotate-3 hover:rotate-0 transition-transform duration-300 mt-6"
  }, React.createElement("img", {
    src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
    alt: "Pizza",
    className: "w-full h-36 object-cover"
  }), React.createElement("div", {
    className: "p-2.5 text-left"
  }, React.createElement("span", {
    className: "text-[10px] text-[#f05a28] font-bold block"
  }, "PIZZA"), React.createElement("span", {
    className: "text-xs font-semibold text-[#121214] truncate block"
  }, "Sourdough Margherita"))))));
}
function StoriesTray({
  stories,
  currentUser,
  onTriggerUpload,
  onViewStory
}) {
  const currentUid = currentUser ? currentUser.id || currentUser.uid : "";
  const uniqueUsers = useMemo(() => {
    if (!stories) return [];
    const map = new Map();
    stories.forEach(s => {
      if (!map.has(s.userId)) {
        map.set(s.userId, s);
      }
    });
    return Array.from(map.values());
  }, [stories]);
  return React.createElement("div", {
    className: "w-full bg-white border-b border-[#e8e4dc] py-3.5 px-4 sm:px-6"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto flex items-center space-x-4 overflow-x-auto scrollbar-none"
  }, React.createElement("div", {
    onClick: onTriggerUpload,
    className: "flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
  }, React.createElement("div", {
    className: "relative w-14 h-14 rounded-full p-[2px] border-2 border-dashed border-[#f05a28] group-hover:border-[#121214] transition-colors flex items-center justify-center bg-[#fff5f0]"
  }, React.createElement("img", {
    src: currentUser && (currentUser.avatar || currentUser.avatarUrl) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    alt: "Your story",
    className: "w-full h-full rounded-full object-cover"
  }), React.createElement("span", {
    className: "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#f05a28] text-white flex items-center justify-center text-xs font-bold shadow-xs"
  }, "+")), React.createElement("span", {
    className: "text-[10px] font-semibold text-[#121214] max-w-[64px] truncate"
  }, "Your Bite")), uniqueUsers.map(story => {
    const isCurrentUser = story.userId === currentUid;
    return React.createElement("div", {
      key: story.userId,
      onClick: () => onViewStory(story),
      className: "flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
    }, React.createElement("div", {
      className: "w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#f05a28] via-amber-500 to-rose-500 group-hover:scale-105 transition-transform duration-200"
    }, React.createElement("div", {
      className: "w-full h-full rounded-full p-[1.5px] bg-white"
    }, React.createElement("img", {
      src: story.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      alt: story.username,
      className: "w-full h-full rounded-full object-cover"
    }))), React.createElement("span", {
      className: "text-[10px] font-medium text-[#736f68] group-hover:text-[#121214] max-w-[64px] truncate transition-colors"
    }, isCurrentUser ? "You" : story.username));
  })));
}
function TrendingNowShelf({
  stories,
  onViewStory
}) {
  if (!stories || stories.length === 0) return null;
  const topBites = useMemo(() => {
    return stories.slice(0, 6);
  }, [stories]);
  return React.createElement("div", {
    className: "w-full py-4 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-3 px-1"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-sm font-bold text-[#121214] tracking-tight flex items-center space-x-1.5"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, "Trending Bites")), React.createElement("p", {
    className: "text-[11px] text-[#736f68]"
  }, "Popular dishes right now"))), React.createElement("div", {
    className: "flex items-center space-x-3.5 overflow-x-auto scrollbar-none pb-2"
  }, topBites.map(story => React.createElement("div", {
    key: story.id,
    onClick: () => onViewStory(story),
    className: "flex-shrink-0 w-44 rounded-xl bg-white border border-[#e8e4dc] overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group text-left"
  }, React.createElement("div", {
    className: "relative aspect-[4/3] bg-[#f5f2eb] overflow-hidden"
  }, story.mediaType === "video" ? React.createElement("video", {
    src: story.mediaUrl,
    className: "w-full h-full object-cover"
  }) : React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption || "Food item",
    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
  }), React.createElement("span", {
    className: "absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium"
  }, "\u23F3 ", formatHoursLeft(story.expiresAt))), React.createElement("div", {
    className: "p-2.5 space-y-1"
  }, React.createElement("p", {
    className: "text-xs font-semibold text-[#121214] truncate"
  }, decodeUnicode(story.caption) || "Daily Food Creation"), React.createElement("div", {
    className: "flex items-center space-x-1.5 text-[10px] text-[#736f68]"
  }, React.createElement("span", null, "@", story.username)))))));
}
function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory
}) {
  return React.createElement("div", {
    className: "w-full space-y-3"
  }, React.createElement("div", {
    className: "relative w-full"
  }, React.createElement("span", {
    className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#a6a198]"
  }, "\uD83D\uDD0D"), React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    placeholder: "Search food, dishes, or cravings...",
    className: "w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] shadow-2xs transition-all"
  }), searchQuery && React.createElement("button", {
    type: "button",
    onClick: () => setSearchQuery(""),
    className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a6a198] hover:text-[#121214] cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1"
  }, CATEGORIES.map(cat => {
    const isActive = activeCategory === cat.id;
    return React.createElement("button", {
      key: cat.id,
      type: "button",
      onClick: () => setActiveCategory(cat.id),
      className: `flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? "bg-[#121214] text-white shadow-xs" : "bg-white text-[#736f68] hover:text-[#121214] border border-[#e8e4dc] hover:bg-[#fbf9f6]"}`
    }, React.createElement("span", null, cat.icon), React.createElement("span", null, cat.label));
  })));
}
function FoodCard({
  post,
  currentUserId,
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
  } else if (rawCaption.length > 0 && rawCaption.length <= 40) {
    dishTitle = rawCaption;
    dishDescription = "";
  }
  const handleCommentSubmit = e => {
    e.preventDefault();
    const clean = commentText.trim();
    if (!clean) return;
    onAddComment(post.id, clean);
    setCommentText("");
    setShowComments(true);
  };
  return React.createElement("article", {
    className: "food-card p-4 space-y-3 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", {
    onClick: () => onViewStory(post),
    className: "flex items-center space-x-2.5 cursor-pointer group"
  }, React.createElement("div", {
    className: "p-[1.5px] rounded-full bg-gradient-to-tr from-[#f05a28] to-amber-500"
  }, React.createElement("img", {
    src: post.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    alt: post.username,
    className: "w-8 h-8 rounded-full object-cover border border-white"
  })), React.createElement("div", null, React.createElement("div", {
    className: "flex items-center space-x-1.5"
  }, React.createElement("h4", {
    className: "text-xs font-bold text-[#121214] group-hover:text-[#f05a28] transition-colors"
  }, post.username), !isOwner && onToggleFollow && React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onToggleFollow(post.userId, post.username);
    },
    className: `text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${isFollowing ? "bg-[#f5f2eb] text-[#736f68] hover:bg-[#e8e4dc]" : "bg-[#fff5f0] text-[#f05a28] hover:bg-[#ffe8de]"}`
  }, isFollowing ? "Following" : "Follow")), React.createElement("span", {
    className: "text-[10px] text-[#a6a198] block"
  }, formatTimeAgo(post.createdAt)))), React.createElement("div", {
    className: "flex items-center space-x-1.5"
  }, React.createElement("span", {
    className: "text-[10px] font-medium text-[#f05a28] px-2 py-0.5 rounded-full bg-[#fff5f0] border border-[#ffe8de]"
  }, "\u23F3 ", formatHoursLeft(post.expiresAt)), isOwner && onDeletePost && React.createElement("button", {
    type: "button",
    onClick: () => {
      if (window.confirm("Delete this food story?")) {
        onDeletePost(post.id);
      }
    },
    className: "p-1 rounded-lg text-[#a6a198] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer",
    title: "Delete Story"
  }, "\uD83D\uDDD1\uFE0F"))), React.createElement("div", {
    onDoubleClick: () => onDoubleTap(post),
    className: "relative w-full aspect-[4/3] bg-[#f5f2eb] rounded-xl overflow-hidden cursor-pointer select-none flex items-center justify-center group"
  }, React.createElement("div", {
    className: "absolute inset-0 bg-cover bg-center scale-125 blur-2xl opacity-20 pointer-events-none",
    style: {
      backgroundImage: `url(${post.mediaUrl})`
    }
  }), post.mediaType === "video" ? React.createElement("video", {
    src: post.mediaUrl,
    loop: true,
    muted: true,
    playsInline: true,
    autoPlay: true,
    className: "relative z-10 w-full h-full object-cover"
  }) : React.createElement("img", {
    src: post.mediaUrl,
    alt: post.caption || "Food photo",
    className: "relative z-10 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300",
    loading: "lazy"
  }), heartBurst && React.createElement("div", {
    className: "absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-heart-burst"
  }, React.createElement("span", {
    className: "text-6xl filter drop-shadow-lg"
  }, "\u2764\uFE0F"))), React.createElement("div", {
    className: "space-y-1.5"
  }, dishTitle && React.createElement("h3", {
    className: "text-sm font-bold text-[#121214] tracking-tight"
  }, dishTitle), dishDescription && React.createElement("p", {
    className: "text-xs text-[#736f68] leading-relaxed line-clamp-2"
  }, dishDescription)), React.createElement("div", {
    className: "pt-2 border-t border-[#f0ece4] flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-3.5"
  }, React.createElement("button", {
    type: "button",
    onClick: () => onLike(post.id),
    className: "flex items-center space-x-1 text-xs font-semibold text-[#121214] hover:text-[#f05a28] transition-colors cursor-pointer",
    title: isLiked ? "Unlike" : "Like"
  }, React.createElement("span", {
    className: isLiked ? "text-[#f05a28] scale-110" : "text-[#736f68]"
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
    className: "flex items-center space-x-1 text-xs font-semibold text-[#736f68] hover:text-[#121214] transition-colors cursor-pointer",
    title: "Comments"
  }, React.createElement("span", null, "\uD83D\uDCAC"), React.createElement("span", null, (comments || []).length)), React.createElement("button", {
    type: "button",
    onClick: () => onShare(post),
    className: "text-xs text-[#736f68] hover:text-[#121214] transition-colors cursor-pointer",
    title: "Share Food"
  }, "\u2197\uFE0F")), React.createElement("button", {
    type: "button",
    onClick: () => onSave(post.id),
    className: `text-xs transition-colors cursor-pointer ${isSaved ? "text-[#f05a28]" : "text-[#a6a198] hover:text-[#121214]"}`,
    title: isSaved ? "Saved" : "Save"
  }, isSaved ? "🔖" : "🏷️")), postLikes && postLikes.length > 0 && React.createElement("div", {
    onClick: () => onShowLikes && onShowLikes(post.id, postLikes),
    className: "pt-0.5 text-[11px] text-[#736f68] hover:text-[#121214] cursor-pointer transition-colors flex items-center space-x-1 select-none"
  }, React.createElement("span", null, "Liked by"), React.createElement("strong", {
    className: "text-[#121214]"
  }, "@", postLikes[0].username), postLikes.length > 1 && React.createElement("span", null, " and ", postLikes.length - 1, " other", postLikes.length > 2 ? "s" : "")), showComments && comments && comments.length > 0 && React.createElement("div", {
    className: "pt-2 space-y-1.5 max-h-32 overflow-y-auto"
  }, comments.map((c, i) => React.createElement("div", {
    key: c.id || i,
    className: "text-xs text-[#736f68] leading-tight"
  }, React.createElement("strong", {
    className: "text-[#121214] mr-1.5"
  }, "@", c.author || c.username), React.createElement("span", null, c.text)))), React.createElement("form", {
    onSubmit: handleCommentSubmit,
    className: "pt-1 flex items-center space-x-2"
  }, React.createElement("input", {
    type: "text",
    value: commentText,
    onChange: e => setCommentText(e.target.value),
    placeholder: "Add a comment...",
    className: "flex-1 px-3 py-1.5 rounded-lg bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white transition-colors"
  }), React.createElement("button", {
    type: "submit",
    disabled: !commentText.trim(),
    className: "px-2.5 py-1.5 rounded-lg bg-[#121214] hover:bg-black disabled:opacity-30 text-white text-[11px] font-semibold transition-colors cursor-pointer"
  }, "Post")));
}
function AnnouncementModal({
  announcement,
  isOpen,
  onClose
}) {
  if (!isOpen || !announcement || !announcement.enabled) return null;
  const isMaintenance = announcement.type === "maintenance" || announcement.title && announcement.title.toLowerCase().includes("maintain");
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn"
  }, React.createElement("div", {
    className: "relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#f0ece1] text-center overflow-hidden"
  }, React.createElement("div", {
    className: `absolute top-0 left-0 right-0 h-2.5 ${isMaintenance ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'}`
  }), React.createElement("div", {
    className: "mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-3xl mb-4 shadow-inner"
  }, isMaintenance ? '🛠️' : '📢'), React.createElement("div", {
    className: "inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider mb-2"
  }, isMaintenance ? 'Site Maintenance Notice' : 'Official Notice'), React.createElement("h3", {
    className: "text-xl font-bold text-[#121214] font-heading tracking-tight mb-2"
  }, announcement.title || 'Platform Notice'), React.createElement("div", {
    className: "bg-[#faf8f5] rounded-2xl p-4 border border-[#eee8dc] text-sm text-[#45423d] leading-relaxed mb-6 font-medium whitespace-pre-line text-left sm:text-center"
  }, announcement.message || 'Sorry, our site is currently undergoing scheduled maintenance. Please check back shortly.'), React.createElement("div", {
    className: "flex flex-col sm:flex-row items-center justify-center gap-2.5"
  }, React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl bg-[#f05a28] hover:bg-[#e04818] text-white text-xs font-bold tracking-wide shadow hover:shadow-md active:scale-95 transition-all cursor-pointer"
  }, "I Understand & Continue"), React.createElement("button", {
    type: "button",
    onClick: () => window.location.reload(),
    className: "w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#d6d0c4] bg-white hover:bg-[#fbf9f6] text-[#524e48] text-xs font-semibold transition-colors cursor-pointer"
  }, "\uD83D\uDD04 Refresh")), React.createElement("div", {
    className: "mt-4 pt-3 border-t border-[#f2ede4] text-[10px] text-[#8e8a83]"
  }, "Broadcasted by ", announcement.updatedBy || 'Platform Admin', " \u2022 FoodBite System")));
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
  const [title, setTitle] = useState(announcement ? announcement.title || "" : "Site Maintenance Notice");
  const [message, setMessage] = useState(announcement ? announcement.message || "" : "Sorry, our site is currently undergoing scheduled maintenance and updates. All features will be fully available shortly. Thank you for your patience!");
  const [type, setType] = useState(announcement ? announcement.type || "maintenance" : "maintenance");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        enabled,
        title: title.trim() || "Notice",
        message: message.trim(),
        type
      };
      const res = await fetch("/api/announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        onSaveAnnouncement && onSaveAnnouncement(data.announcement);
        showToast && showToast("Announcement popup updated successfully!", "success");
        onClose();
      } else {
        showToast && showToast(data && data.error ? data.error : "Failed to update announcement", "error");
      }
    } catch (err) {
      showToast && showToast("Error connecting to server", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleQuickMaintenance = () => {
    setEnabled(true);
    setTitle("Site Maintenance Notice");
    setMessage("Sorry, our site is currently undergoing scheduled maintenance and updates. All features will be fully available shortly. Thank you for your patience!");
    setType("maintenance");
  };
  const handleQuickWelcome = () => {
    setEnabled(true);
    setTitle("Welcome to FoodBite!");
    setMessage("Explore authentic food creations, share your own tasty bites, and connect with fellow foodies!");
    setType("info");
  };
  const handleTurnOff = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        enabled: false,
        title,
        message,
        type
      };
      const res = await fetch("/api/announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        setEnabled(false);
        onSaveAnnouncement && onSaveAnnouncement(data.announcement);
        showToast && showToast("Popup disabled for all visitors", "info");
        onClose();
      }
    } catch (err) {
      showToast && showToast("Failed to disable popup", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
  }, React.createElement("div", {
    className: "relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#ece7dc] max-h-[90vh] overflow-y-auto"
  }, React.createElement("div", {
    className: "flex items-center justify-between pb-4 border-b border-[#f0ece1]"
  }, React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCE2"), React.createElement("div", null, React.createElement("h3", {
    className: "text-base font-bold text-[#121214]"
  }, "Broadcast & Maintenance Manager"), React.createElement("p", {
    className: "text-[11px] text-[#736f68]"
  }, "Configure the alert popup shown to all platform visitors"))), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-8 h-8 rounded-full hover:bg-[#f5f2eb] text-[#736f68] hover:text-[#121214] flex items-center justify-center text-sm font-bold cursor-pointer"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSubmit,
    className: "mt-4 space-y-4"
  }, React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-[#faf8f5] border border-[#ece7dc] flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("div", {
    className: "text-xs font-bold text-[#121214]"
  }, "Popup Active Status"), React.createElement("div", {
    className: "text-[11px] text-[#736f68]"
  }, "When active, all visitors will see this popup modal")), React.createElement("label", {
    className: "relative inline-flex items-center cursor-pointer"
  }, React.createElement("input", {
    type: "checkbox",
    checked: enabled,
    onChange: e => setEnabled(e.target.checked),
    className: "sr-only peer"
  }), React.createElement("div", {
    className: "w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f05a28]"
  }))), React.createElement("div", null, React.createElement("label", {
    className: "block text-xs font-bold text-[#121214] mb-1.5"
  }, "Popup Title"), React.createElement("input", {
    type: "text",
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "e.g. Site Maintenance Notice",
    className: "w-full px-3.5 py-2.5 rounded-xl border border-[#dcd7cb] focus:border-[#f05a28] focus:ring-2 focus:ring-[#f05a28]/20 text-xs font-medium outline-none transition-all",
    required: true
  })), React.createElement("div", null, React.createElement("div", {
    className: "flex items-center justify-between mb-1.5"
  }, React.createElement("label", {
    className: "block text-xs font-bold text-[#121214]"
  }, "Popup Message"), React.createElement("div", {
    className: "flex items-center space-x-1"
  }, React.createElement("button", {
    type: "button",
    onClick: handleQuickMaintenance,
    className: "text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold hover:bg-amber-200 cursor-pointer"
  }, "Quick Maintenance"), React.createElement("button", {
    type: "button",
    onClick: handleQuickWelcome,
    className: "text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 cursor-pointer"
  }, "Quick Announcement"))), React.createElement("textarea", {
    value: message,
    onChange: e => setMessage(e.target.value),
    rows: 4,
    placeholder: "Enter message for visitors (e.g. Sorry, our site is under maintenance...)",
    className: "w-full px-3.5 py-2.5 rounded-xl border border-[#dcd7cb] focus:border-[#f05a28] focus:ring-2 focus:ring-[#f05a28]/20 text-xs font-medium outline-none transition-all",
    required: true
  })), React.createElement("div", {
    className: "grid grid-cols-2 gap-2.5"
  }, React.createElement("button", {
    type: "button",
    onClick: () => setType("maintenance"),
    className: `p-3 rounded-xl border text-left cursor-pointer transition-all ${type === "maintenance" ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20" : "bg-white border-[#ece7dc] hover:bg-[#faf8f5]"}`
  }, React.createElement("div", {
    className: "text-sm font-bold text-[#121214] flex items-center space-x-1"
  }, React.createElement("span", null, "\uD83D\uDEE0\uFE0F"), React.createElement("span", null, "Maintenance")), React.createElement("div", {
    className: "text-[10px] text-[#736f68] mt-0.5"
  }, "Amber warning theme")), React.createElement("button", {
    type: "button",
    onClick: () => setType("info"),
    className: `p-3 rounded-xl border text-left cursor-pointer transition-all ${type === "info" ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400/20" : "bg-white border-[#ece7dc] hover:bg-[#faf8f5]"}`
  }, React.createElement("div", {
    className: "text-sm font-bold text-[#121214] flex items-center space-x-1"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "Announcement")), React.createElement("div", {
    className: "text-[10px] text-[#736f68] mt-0.5"
  }, "Blue notice theme"))), React.createElement("div", {
    className: "p-3 rounded-2xl border border-dashed border-[#dcd7cb] bg-[#faf8f5]"
  }, React.createElement("div", {
    className: "text-[10px] uppercase font-bold text-[#736f68] tracking-wider mb-1"
  }, "Live Visitor Preview"), React.createElement("div", {
    className: "text-xs font-bold text-[#121214]"
  }, title || "Untitled Notice"), React.createElement("div", {
    className: "text-[11px] text-[#55514b] mt-1 whitespace-pre-line"
  }, message || "No message entered")), React.createElement("div", {
    className: "flex items-center justify-end space-x-2 pt-2"
  }, enabled && React.createElement("button", {
    type: "button",
    onClick: handleTurnOff,
    disabled: isSubmitting,
    className: "px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
  }, "Disable Popup"), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "px-4 py-2 rounded-xl border border-[#dcd7cb] bg-white hover:bg-[#fbf9f6] text-[#736f68] text-xs font-semibold transition-colors cursor-pointer"
  }, "Cancel"), React.createElement("button", {
    type: "submit",
    disabled: isSubmitting,
    className: "px-5 py-2 rounded-xl bg-[#f05a28] hover:bg-[#e04818] text-white text-xs font-bold shadow hover:shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
  }, React.createElement("span", null, isSubmitting ? "Saving..." : "Save & Broadcast 📢"))))));
}
function DesktopNavBar({
  activeTab,
  setActiveTab,
  onTriggerUpload,
  userProfile,
  unreadCount,
  onTriggerInstall,
  currentUser,
  onRefreshFeed,
  onTriggerBroadcast,
  announcement
}) {
  const streak = userProfile && userProfile.user ? userProfile.user.streak || 0 : 0;
  const avatarUrl = currentUser && (currentUser.avatar || currentUser.avatarUrl) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
  return React.createElement("header", {
    className: "hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc]"
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
    className: "flex items-center space-x-2.5 cursor-pointer select-none"
  }, React.createElement("div", {
    className: "w-8 h-8 rounded-xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] flex items-center justify-center text-lg shadow-2xs"
  }, "\uD83D\uDD25"), React.createElement("div", null, React.createElement("h1", {
    className: "text-base font-bold text-[#121214] tracking-tight leading-none font-heading"
  }, "FoodBite"), React.createElement("span", {
    className: "text-[9px] uppercase tracking-widest text-[#f05a28] font-bold"
  }, "Discover. Share. Crave."))), React.createElement("nav", {
    className: "flex items-center space-x-1"
  }, React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("home");
      onRefreshFeed && onRefreshFeed();
    },
    className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === "home" ? "bg-[#f5f2eb] text-[#121214]" : "text-[#736f68] hover:text-[#121214]"}`
  }, "Feed"), React.createElement("button", {
    type: "button",
    onClick: () => setActiveTab("activity"),
    className: `relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === "activity" ? "bg-[#f5f2eb] text-[#121214]" : "text-[#736f68] hover:text-[#121214]"}`
  }, React.createElement("span", null, "Activity"), unreadCount > 0 && React.createElement("span", {
    className: "ml-1 px-1.5 py-0.2 rounded-full bg-[#f05a28] text-white text-[9px] font-bold"
  }, unreadCount)), React.createElement("button", {
    type: "button",
    onClick: () => setActiveTab("profile"),
    className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === "profile" ? "bg-[#f5f2eb] text-[#121214]" : "text-[#736f68] hover:text-[#121214]"}`
  }, "Profile"))), React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("div", {
    className: "flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] text-xs font-bold shadow-2xs"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "d Streak")), React.createElement("button", {
    type: "button",
    onClick: onTriggerInstall,
    className: "px-3 py-1.5 rounded-xl border border-[#e8e4dc] bg-white hover:bg-[#fbf9f6] text-[#736f68] hover:text-[#121214] text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1"
  }, React.createElement("span", null, "\uD83D\uDCF1"), React.createElement("span", null, "App")), React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "px-4 py-2 rounded-xl bg-[#f05a28] hover:bg-[#e04818] text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5"
  }, React.createElement("span", null, "+"), React.createElement("span", null, "Share Food")), currentUser && (currentUser.role === 'admin' || currentUser.username === 'sachin' || currentUser.id === 'usr-1') && React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: `relative px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${announcement && announcement.enabled ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 ring-2 ring-amber-400/30' : 'bg-white border-[#e8e4dc] text-[#736f68] hover:text-[#121214] hover:bg-[#fbf9f6]'}`,
    title: "Admin Announcement & Maintenance Broadcast Manager"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "Broadcast"), announcement && announcement.enabled && React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-amber-500 animate-ping"
  })), React.createElement("div", {
    onClick: () => setActiveTab("profile"),
    className: "w-8 h-8 rounded-full border border-[#e8e4dc] overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#f05a28]/20 transition-all"
  }, React.createElement("img", {
    src: avatarUrl,
    alt: "Avatar",
    className: "w-full h-full object-cover"
  })))));
}
function MobileTopBar({
  streak,
  onTriggerInstall,
  onLogoClick,
  onTriggerBroadcast,
  announcement,
  currentUser
}) {
  return React.createElement("header", {
    className: "md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc] px-4 py-2.5 flex items-center justify-between"
  }, React.createElement("div", {
    onClick: onLogoClick,
    className: "flex items-center space-x-2 cursor-pointer select-none"
  }, React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] flex items-center justify-center text-sm"
  }, "\uD83D\uDD25"), React.createElement("span", {
    className: "text-sm font-bold text-[#121214] tracking-tight font-heading"
  }, "FoodBite"), React.createElement("span", {
    className: "text-[9px] uppercase tracking-widest text-[#f05a28] font-bold"
  }, "DISCOVER. SHARE. CRAVE.")), React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("div", {
    className: "flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] text-[11px] font-bold"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "d")), React.createElement("button", {
    type: "button",
    onClick: onTriggerInstall,
    className: "p-1.5 rounded-lg border border-[#e8e4dc] bg-white text-xs",
    title: "Install App"
  }, "\uD83D\uDCF1"), currentUser && (currentUser.role === 'admin' || currentUser.username === 'sachin' || currentUser.id === 'usr-1') && React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: `p-1.5 rounded-lg border text-xs transition-colors flex items-center justify-center ${announcement && announcement.enabled ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-[#e8e4dc] bg-white text-[#736f68]'}`,
    title: "Admin Broadcast"
  }, React.createElement("span", null, "\uD83D\uDCE2"))));
}
function MobileBottomNav({
  activeTab,
  setActiveTab,
  onTriggerUpload,
  unreadCount,
  onRefreshFeed
}) {
  return React.createElement("nav", {
    className: "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e8e4dc] px-2 py-1 flex items-center justify-around"
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
    className: `flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${activeTab === "home" ? "text-[#f05a28]" : "text-[#a6a198]"}`
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83C\uDFE0"), React.createElement("span", null, "Home")), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("home");
      const el = document.getElementById("food-feed-section");
      if (el) el.scrollIntoView({
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${activeTab === "explore" ? "text-[#f05a28]" : "text-[#a6a198]"}`
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83E\uDDED"), React.createElement("span", null, "Explore")), React.createElement("div", {
    className: "-mt-5"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "w-12 h-12 rounded-full bg-[#f05a28] hover:bg-[#e04818] text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-[#f05a28]/30 active:scale-95 transition-transform cursor-pointer"
  }, "+")), React.createElement("button", {
    type: "button",
    onClick: () => setActiveTab("activity"),
    className: `relative flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${activeTab === "activity" ? "text-[#f05a28]" : "text-[#a6a198]"}`
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83D\uDD14"), React.createElement("span", null, "Activity"), unreadCount > 0 && React.createElement("span", {
    className: "absolute top-1 right-2 w-2 h-2 rounded-full bg-[#f05a28]"
  })), React.createElement("button", {
    type: "button",
    onClick: () => setActiveTab("profile"),
    className: `flex flex-col items-center py-1 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${activeTab === "profile" ? "text-[#f05a28]" : "text-[#a6a198]"}`
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83D\uDC64"), React.createElement("span", null, "Profile")));
}
function ShareFoodModal({
  isOpen,
  onClose,
  currentUser,
  onStoryUploaded,
  showToast
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [duration, setDuration] = useState(0);
  const [foodTitle, setFoodTitle] = useState("");
  const [foodCategory, setFoodCategory] = useState("street");
  const [foodLocation, setFoodLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setIsVideo(false);
    setDuration(0);
    setFoodTitle("");
    setFoodCategory("street");
    setFoodLocation("");
    setDescription("");
    setErrorMessage("");
  };
  const handleFileChange = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const isVid = file.type.startsWith("video/");
    setIsVideo(isVid);
    if (isVid) {
      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      const objectUrl = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(objectUrl);
        if (videoElement.duration > 10.05) {
          setErrorMessage("Video must be 10 seconds or shorter.");
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
  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please capture or select a photo or short video (max 10s)");
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
          headers: {
            "Content-Type": selectedFile.type || "video/mp4"
          },
          body: selectedFile
        });
        if (!resp.ok) {
          let serverMsg = "Video upload failed";
          try {
            const errJson = await resp.json();
            if (errJson && errJson.error) serverMsg = errJson.error;
          } catch (e) {}
          throw new Error(serverMsg);
        }
        const data = await resp.json();
        uploadedUrl = data.url;
        uploadedPath = "uploads/" + data.filename;
      } else {
        let base64 = "";
        try {
          base64 = await compressImageFile(selectedFile, 1600, 0.85);
        } catch (readErr) {
          throw new Error(readErr && readErr.message ? readErr.message : "Failed to process photo from your device");
        }
        const resp = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: base64
          })
        });
        if (!resp.ok) {
          let serverMsg = "Photo upload failed";
          try {
            const errJson = await resp.json();
            if (errJson && errJson.error) serverMsg = errJson.error;
          } catch (e) {}
          throw new Error(serverMsg);
        }
        const data = await resp.json();
        uploadedUrl = data.url;
        uploadedPath = "uploads/" + data.filename;
      }
      const uid = currentUser ? currentUser.id || currentUser.uid : "usr-1";
      const uname = currentUser ? currentUser.username || currentUser.name : "Sachin Bhandari";
      const uavatar = currentUser ? currentUser.avatar || currentUser.avatarUrl : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
      let compositeCaption = "";
      if (foodTitle.trim()) {
        compositeCaption += foodTitle.trim();
      }
      if (description.trim()) {
        compositeCaption += (compositeCaption ? " • " : "") + description.trim();
      }
      if (foodLocation.trim()) {
        compositeCaption += (compositeCaption ? " — 📍 " : "📍 ") + foodLocation.trim();
      }
      if (!compositeCaption) {
        compositeCaption = "Delicious " + foodCategory + " creation";
      }
      const postResp = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: uid,
          username: uname,
          userAvatar: uavatar,
          mediaUrl: uploadedUrl,
          mediaPath: uploadedPath,
          mediaType: isVideo ? "video" : "image",
          caption: compositeCaption,
          duration: duration
        })
      });
      if (!postResp.ok) {
        let postErrMsg = "Failed to save story record";
        try {
          const errJson = await postResp.json();
          if (errJson && errJson.error) postErrMsg = errJson.error;
        } catch (e) {}
        throw new Error(postErrMsg);
      }
      const postData = await postResp.json();
      showToast("🔥 Food story posted! Active streak: " + postData.currentStreak + " days!", "success");
      resetForm();
      onStoryUploaded && onStoryUploaded(postData);
      onClose();
    } catch (err) {
      const displayMsg = err && err.message ? err.message : typeof err === "string" ? err : "Failed to post story. Please check your image and connection.";
      setErrorMessage(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
  }, React.createElement("div", {
    className: "w-full max-w-lg bg-white rounded-2xl border border-[#e8e4dc] shadow-2xl overflow-hidden animate-pop-in text-left flex flex-col max-h-[90vh]",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 border-b border-[#f0ece4] flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("h3", {
    className: "text-base font-bold text-[#121214] tracking-tight"
  }, "Share Food Creation"), React.createElement("p", {
    className: "text-[11px] text-[#736f68]"
  }, "Visible for 24 hours in the live community feed")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1 rounded-lg text-[#736f68] hover:text-[#121214] hover:bg-[#f5f2eb] transition-colors cursor-pointer text-sm"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSubmit,
    className: "p-6 space-y-4 overflow-y-auto"
  }, errorMessage && React.createElement("div", {
    className: "p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
  }, errorMessage), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-semibold text-[#121214] block"
  }, "Food Photo or Short Video"), React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: [["image", "*"].join("/"), "video/mp4", "video/webm", "video/quicktime"].join(","),
    onChange: handleFileChange,
    className: "hidden"
  }), previewUrl ? React.createElement("div", {
    className: "relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#f5f2eb] border border-[#e8e4dc]"
  }, isVideo ? React.createElement("video", {
    src: previewUrl,
    controls: true,
    className: "w-full h-full object-cover"
  }) : React.createElement("img", {
    src: previewUrl,
    alt: "Preview",
    className: "w-full h-full object-cover"
  }), React.createElement("button", {
    type: "button",
    onClick: () => {
      setSelectedFile(null);
      setPreviewUrl("");
    },
    className: "absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white text-xs hover:bg-black cursor-pointer"
  }, "\u2715")) : React.createElement("div", {
    onClick: () => fileInputRef.current && fileInputRef.current.click(),
    className: "w-full border-2 border-dashed border-[#e8e4dc] hover:border-[#f05a28] rounded-xl p-8 text-center cursor-pointer bg-[#fbf9f6] transition-colors group"
  }, React.createElement("div", {
    className: "text-3xl mb-1 group-hover:scale-110 transition-transform"
  }, "\uD83D\uDCF8"), React.createElement("p", {
    className: "text-xs font-semibold text-[#121214]"
  }, "Tap to upload photo or short video"), React.createElement("p", {
    className: "text-[11px] text-[#736f68] mt-0.5"
  }, "JPEG, PNG, MP4 (max 10 seconds)"))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-semibold text-[#121214] block"
  }, "Dish Name"), React.createElement("input", {
    type: "text",
    required: true,
    value: foodTitle,
    onChange: e => setFoodTitle(e.target.value),
    placeholder: "e.g. Spicy Street Tacos, Hand-pulled Noodles",
    className: "w-full px-3.5 py-2 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white"
  })), React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
  }, React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-semibold text-[#121214] block"
  }, "Category"), React.createElement("select", {
    value: foodCategory,
    onChange: e => setFoodCategory(e.target.value),
    className: "w-full px-3.5 py-2 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] focus:outline-none focus:border-[#f05a28] focus:bg-white"
  }, React.createElement("option", {
    value: "street"
  }, "\uD83C\uDF2E Street Food"), React.createElement("option", {
    value: "pizza"
  }, "\uD83C\uDF55 Pizza & Pasta"), React.createElement("option", {
    value: "healthy"
  }, "\uD83E\uDD57 Healthy Bowls"), React.createElement("option", {
    value: "desserts"
  }, "\uD83C\uDF70 Desserts & Bakery"), React.createElement("option", {
    value: "drinks"
  }, "\u2615 Coffee & Drinks"), React.createElement("option", {
    value: "trending"
  }, "\uD83D\uDD25 Specials"))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-semibold text-[#121214] block"
  }, "Location (Optional)"), React.createElement("input", {
    type: "text",
    value: foodLocation,
    onChange: e => setFoodLocation(e.target.value),
    placeholder: "e.g. Downtown Bistro, Home Kitchen",
    className: "w-full px-3.5 py-2 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white"
  }))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-semibold text-[#121214] block"
  }, "Story Notes"), React.createElement("textarea", {
    rows: 2,
    value: description,
    onChange: e => setDescription(e.target.value),
    placeholder: "What made this dish craveable today? Flavors, secret ingredient, experience...",
    className: "w-full px-3.5 py-2 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white resize-none"
  })), React.createElement("div", {
    className: "pt-2 flex items-center justify-end space-x-3"
  }, React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "px-4 py-2 rounded-xl text-xs font-semibold text-[#736f68] hover:text-[#121214] cursor-pointer"
  }, "Cancel"), React.createElement("button", {
    type: "submit",
    disabled: isSubmitting || !selectedFile,
    className: "px-5 py-2 rounded-xl bg-[#f05a28] hover:bg-[#e04818] disabled:opacity-40 text-white text-xs font-semibold shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
  }, isSubmitting ? "Sharing..." : "Post to Feed 🔥")))));
}
function StoryViewerModal({
  isOpen,
  story,
  stories,
  onClose,
  onDeletePost,
  currentUser
}) {
  if (!isOpen || !story) return null;
  const isOwner = currentUser && story.userId === (currentUser.id || currentUser.uid);
  return React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "relative max-w-sm w-full bg-[#121214] rounded-2xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[92vh]",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "p-3.5 flex items-center justify-between border-b border-white/10"
  }, React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, React.createElement("img", {
    src: story.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    alt: story.username,
    className: "w-8 h-8 rounded-full object-cover border border-white/20"
  }), React.createElement("div", null, React.createElement("span", {
    className: "text-xs font-bold block"
  }, story.username), React.createElement("span", {
    className: "text-[10px] text-white/60 block"
  }, formatTimeAgo(story.createdAt)))), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1 rounded-lg text-white/60 hover:text-white cursor-pointer text-sm"
  }, "\u2715")), React.createElement("div", {
    className: "relative aspect-[9/16] bg-black flex items-center justify-center overflow-hidden"
  }, story.mediaType === "video" ? React.createElement("video", {
    src: story.mediaUrl,
    autoPlay: true,
    controls: true,
    playsInline: true,
    loop: true,
    className: "w-full h-full object-cover"
  }) : React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    className: "w-full h-full object-cover"
  }), React.createElement("div", {
    className: "absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-medium backdrop-blur-sm"
  }, "\u23F3 ", formatHoursLeft(story.expiresAt))), story.caption && React.createElement("div", {
    className: "p-3.5 border-t border-white/10 bg-[#1a1917] text-left"
  }, React.createElement("p", {
    className: "text-xs text-white/90 leading-relaxed"
  }, decodeUnicode(story.caption)))));
}
function InstallAppModal({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled
}) {
  if (!isOpen) return null;
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        onInstalled();
      }
    } else {
      alert("To install FoodBite, open your browser menu (⋮ or Share) and tap 'Add to Home screen' or 'Install app'.");
    }
    onClose();
  };
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-white rounded-2xl border border-[#e8e4dc] p-6 shadow-2xl text-center space-y-4 animate-pop-in",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "w-14 h-14 rounded-2xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] flex items-center justify-center text-3xl mx-auto shadow-xs"
  }, "\uD83D\uDCF1"), React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("h3", {
    className: "text-base font-bold text-[#121214] tracking-tight"
  }, "Install FoodBite App"), React.createElement("p", {
    className: "text-xs text-[#736f68] leading-relaxed"
  }, "Install FoodBite as a native app on your phone or desktop for instant access, offline mode, and fast food story sharing.")), React.createElement("div", {
    className: "pt-2 flex flex-col space-y-2"
  }, React.createElement("button", {
    type: "button",
    onClick: handleInstallClick,
    className: "w-full py-2.5 rounded-xl bg-[#121214] hover:bg-black text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
  }, "Install Now"), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-full py-2 rounded-xl text-xs font-medium text-[#736f68] hover:text-[#121214] cursor-pointer"
  }, "Not Now"))));
}
function ActivityView({
  currentUser,
  userProfile,
  notifications,
  onRefreshNotifs
}) {
  return React.createElement("div", {
    className: "max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-lg font-bold text-[#121214] tracking-tight"
  }, "Activity & Alerts"), React.createElement("p", {
    className: "text-xs text-[#736f68]"
  }, "Real-time interactions on your daily food stories")), React.createElement("button", {
    type: "button",
    onClick: onRefreshNotifs,
    className: "text-xs text-[#f05a28] font-semibold hover:underline cursor-pointer"
  }, "Refresh")), !notifications || notifications.length === 0 ? React.createElement("div", {
    className: "p-8 rounded-2xl bg-white border border-[#e8e4dc] text-center space-y-2"
  }, React.createElement("span", {
    className: "text-3xl block"
  }, "\uD83D\uDD14"), React.createElement("h4", {
    className: "text-sm font-bold text-[#121214]"
  }, "No new alerts"), React.createElement("p", {
    className: "text-xs text-[#736f68]"
  }, "When other food lovers like, comment, or follow your culinary creations, you will see alerts here.")) : React.createElement("div", {
    className: "space-y-2.5"
  }, notifications.map(n => React.createElement("div", {
    key: n.id,
    className: "p-3.5 rounded-xl bg-white border border-[#e8e4dc] flex items-center space-x-3 shadow-2xs hover:border-[#f05a28]/40 transition-colors"
  }, React.createElement("img", {
    src: n.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    alt: n.senderName,
    className: "w-9 h-9 rounded-full object-cover border border-[#e8e4dc]"
  }), React.createElement("div", {
    className: "flex-1 text-left"
  }, React.createElement("p", {
    className: "text-xs text-[#121214] leading-relaxed"
  }, React.createElement("strong", {
    className: "font-semibold"
  }, n.senderName), " ", n.message), React.createElement("span", {
    className: "text-[10px] text-[#a6a198]"
  }, formatTimeAgo(n.createdAt)))))));
}
function ProfileView({
  currentUser,
  userProfile,
  stories,
  onLogout,
  onTriggerUpload,
  onTriggerBroadcast,
  announcement
}) {
  const user = userProfile && userProfile.user || currentUser || {};
  const streak = user.streak || 0;
  const userStories = (stories || []).filter(s => s.userId === (user.id || user.uid));
  return React.createElement("div", {
    className: "max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left"
  }, React.createElement("div", {
    className: "p-6 rounded-2xl bg-white border border-[#e8e4dc] shadow-2xs flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5"
  }, React.createElement("img", {
    src: user.avatar || user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    alt: user.username || "Profile",
    className: "w-20 h-20 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-[#e8e4dc]"
  }), React.createElement("div", {
    className: "space-y-2 text-center sm:text-left flex-1"
  }, React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-lg font-bold text-[#121214] tracking-tight leading-tight"
  }, user.name || user.username || "Chef"), React.createElement("span", {
    className: "text-xs text-[#736f68] font-mono"
  }, "@", user.username || "chef")), React.createElement("button", {
    type: "button",
    onClick: onLogout,
    className: "px-3 py-1.5 rounded-lg border border-[#e8e4dc] hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
  }, "Sign Out")), (user.role === 'admin' || user.username === 'sachin' || user.id === 'usr-1') && React.createElement("div", {
    className: "pt-2"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: "w-full py-2.5 px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "Manage Maintenance & Visitor Popup"), announcement && announcement.enabled && React.createElement("span", {
    className: "px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold uppercase tracking-wide"
  }, "Live Active"))), React.createElement("div", {
    className: "flex items-center justify-center sm:justify-start space-x-4 pt-1"
  }, React.createElement("div", {
    className: "flex items-center space-x-1 text-xs"
  }, React.createElement("span", {
    className: "font-bold text-[#121214]"
  }, userStories.length), React.createElement("span", {
    className: "text-[#736f68]"
  }, "Active Bites")), React.createElement("div", {
    className: "flex items-center space-x-1 text-xs"
  }, React.createElement("span", {
    className: "font-bold text-[#121214]"
  }, userProfile && userProfile.followersCount || 0), React.createElement("span", {
    className: "text-[#736f68]"
  }, "Followers")), React.createElement("div", {
    className: "flex items-center space-x-1 text-xs"
  }, React.createElement("span", {
    className: "font-bold text-[#121214]"
  }, userProfile && userProfile.followingCount || 0), React.createElement("span", {
    className: "text-[#736f68]"
  }, "Following"))), React.createElement("div", {
    className: "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] text-xs font-bold"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, " Days Ephemeral Streak")))), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("h3", {
    className: "text-sm font-bold text-[#121214] tracking-tight"
  }, "Your Active Food Stories"), React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "text-xs font-semibold text-[#f05a28] hover:underline cursor-pointer"
  }, "+ New Bite")), userStories.length === 0 ? React.createElement("div", {
    className: "p-8 rounded-2xl bg-white border border-[#e8e4dc] text-center space-y-2"
  }, React.createElement("span", {
    className: "text-3xl block"
  }, "\uD83C\uDF72"), React.createElement("h4", {
    className: "text-sm font-bold text-[#121214]"
  }, "No active stories"), React.createElement("p", {
    className: "text-xs text-[#736f68]"
  }, "You haven't posted any food stories today. Share what you're cooking or eating!")) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-3"
  }, userStories.map(story => React.createElement("div", {
    key: story.id,
    className: "relative rounded-xl overflow-hidden bg-black aspect-square shadow-2xs group cursor-pointer"
  }, story.mediaType === "video" ? React.createElement("video", {
    src: story.mediaUrl,
    className: "w-full h-full object-cover"
  }) : React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 text-white text-[10px]"
  }, React.createElement("span", {
    className: "truncate"
  }, decodeUnicode(story.caption))))))));
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
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
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
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);
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
        if (!silent) setFeedError("Failed to fetch food feed.");
      }
    } catch (err) {
      if (!silent) setFeedError("Network connection issue.");
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
  useEffect(() => {
    const handleBeforeInstall = e => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);
  const handleToggleFollow = async (targetUserId, targetUsername) => {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.uid;
    if (uid === targetUserId) return;
    const isCurrentlyFollowing = followingList.includes(targetUserId);
    const nextFollowing = isCurrentlyFollowing ? followingList.filter(id => id !== targetUserId) : [...followingList, targetUserId];
    setFollowingList(nextFollowing);
    showToast(isCurrentlyFollowing ? "Unfollowed @" + (targetUsername || "user") : "Now following @" + (targetUsername || "user") + "! 🔥", "success");
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
        showToast("Food story deleted", "info");
        fetchProfile(uid);
      } else {
        showToast(data && data.error ? data.error : "Could not delete story", "error");
      }
    } catch (err) {
      showToast("Failed to delete story", "error");
    }
  };
  const toggleLike = async postId => {
    if (!currentUser) {
      showToast("Please sign in to like food stories", "info");
      return;
    }
    const uid = currentUser.id || currentUser.uid;
    const uname = currentUser.username || currentUser.name || "foodie";
    const uavatar = currentUser.avatar || currentUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
    const isLiked = !!likes[postId];
    const curCount = likeCounts[postId] || 0;
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? curCount + 1 : Math.max(0, curCount - 1);
    setLikes(prev => ({
      ...prev,
      [postId]: nextLiked
    }));
    setLikeCounts(prev => ({
      ...prev,
      [postId]: nextCount
    }));
    setPostLikes(prev => {
      const list = prev[postId] || [];
      if (nextLiked) {
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
    showToast("Comment posted! 💬", "success");
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
        showToast("Food link copied to clipboard! 🔗", "info");
      } catch (e) {
        showToast("Link: " + window.location.href, "info");
      }
    }
  };
  const toggleSave = postId => {
    const isSaved = !!savedPosts[postId];
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !isSaved
    }));
    showToast(isSaved ? "Removed from saved bites" : "Saved to your food collection! 🔖", "info");
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
          const text = ((s.caption || "") + " " + (s.username || "")).toLowerCase();
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
      className: "min-h-screen w-full bg-[#fbf9f6] text-[#1a1917]"
    }, React.createElement(AuthScreen, {
      onAuthSuccess: (user, token) => {
        localStorage.setItem("foodbite_session", JSON.stringify({
          user,
          token
        }));
        setCurrentUser(user);
        showToast("Welcome to FoodBite, @" + (user.username || user.name) + "! 🔥", "success");
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
      onClose: () => setDismissedAnnouncement(true)
    }), React.createElement(AdminBroadcastModal, {
      isOpen: showBroadcastModal,
      onClose: () => setShowBroadcastModal(false),
      announcement: announcement,
      onSaveAnnouncement: updated => {
        setAnnouncement(updated);
        if (updated && updated.enabled) {
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
    className: "min-h-screen w-full flex flex-col bg-[#fbf9f6] text-[#1a1917] antialiased"
  }, React.createElement(DesktopNavBar, {
    activeTab: activeTab,
    setActiveTab: setActiveTab,
    onTriggerUpload: () => setStoryModalOpen(true),
    userProfile: userProfile,
    unreadCount: notifications.length,
    onTriggerInstall: () => setShowInstallModal(true),
    currentUser: currentUser,
    onRefreshFeed: () => fetchStories(true),
    onTriggerBroadcast: () => setShowBroadcastModal(true),
    announcement: announcement
  }), React.createElement(MobileTopBar, {
    streak: streakCount,
    onTriggerInstall: () => setShowInstallModal(true),
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
    currentUser: currentUser
  }), React.createElement("main", {
    className: "flex-1 w-full"
  }, activeTab === "home" && React.createElement("div", {
    className: "w-full"
  }, React.createElement(HomeHeroSection, {
    onExplore: () => {
      const el = document.getElementById("food-feed-section");
      if (el) el.scrollIntoView({
        behavior: "smooth"
      });
    },
    onShareFood: () => setStoryModalOpen(true)
  }), React.createElement(StoriesTray, {
    stories: stories,
    currentUser: currentUser,
    onTriggerUpload: () => setStoryModalOpen(true),
    onViewStory: s => setViewingStory(s)
  }), React.createElement("div", {
    id: "food-feed-section",
    className: "max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6"
  }, React.createElement(TrendingNowShelf, {
    stories: stories,
    onViewStory: s => setViewingStory(s)
  }), React.createElement(SearchFilterBar, {
    searchQuery: searchQuery,
    setSearchQuery: setSearchQuery,
    activeCategory: activeCategory,
    setActiveCategory: setActiveCategory
  }), feedError && React.createElement(ErrorState, {
    message: feedError,
    onRetry: fetchStories
  }), isLoadingFeed ? React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, React.createElement(FoodCardSkeleton, null), React.createElement(FoodCardSkeleton, null), React.createElement(FoodCardSkeleton, null)) : filteredStories.length === 0 ? React.createElement(EmptyState, {
    title: searchQuery ? "No dishes matched your search" : "No food stories active",
    message: searchQuery ? "Try searching for street food, desserts, bowls, or another creator." : "Be the first home chef to share your daily food creation today!",
    actionLabel: searchQuery ? "Clear Search" : "+ Share First Bite",
    onAction: () => {
      if (searchQuery) setSearchQuery("");else setStoryModalOpen(true);
    }
  }) : React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, filteredStories.map(post => React.createElement(FoodCard, {
    key: post.id,
    post: post,
    currentUserId: currentUserId,
    isFollowing: followingList.includes(post.userId),
    onToggleFollow: handleToggleFollow,
    onLike: toggleLike,
    isLiked: !!likes[post.id],
    likeCount: likeCounts[post.id] !== undefined ? likeCounts[post.id] : post.likeCount || 0,
    postLikes: postLikes[post.id] || post.likes || [],
    onShowLikes: (pId, lks) => setLikesModalData({
      postId: pId,
      likes: lks
    }),
    onDoubleTap: handleDoubleTap,
    heartBurst: !!heartBursts[post.id],
    comments: comments[post.id] || post.comments || [],
    onAddComment: handleAddComment,
    onShare: handleSharePost,
    onSave: toggleSave,
    isSaved: !!savedPosts[post.id],
    onViewStory: s => setViewingStory(s),
    onDeletePost: handleDeletePost
  }))))), activeTab === "activity" && React.createElement(ActivityView, {
    currentUser: currentUser,
    userProfile: userProfile,
    notifications: notifications,
    onRefreshNotifs: () => fetchNotifications()
  }), activeTab === "profile" && React.createElement(ProfileView, {
    currentUser: currentUser,
    userProfile: userProfile,
    stories: stories,
    onLogout: handleLogout,
    onTriggerUpload: () => setStoryModalOpen(true),
    onTriggerBroadcast: () => setShowBroadcastModal(true),
    announcement: announcement
  })), React.createElement(MobileBottomNav, {
    activeTab: activeTab,
    setActiveTab: setActiveTab,
    onTriggerUpload: () => setStoryModalOpen(true),
    unreadCount: notifications.length,
    onRefreshFeed: () => fetchStories(true)
  }), React.createElement(ShareFoodModal, {
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
    isOpen: !!viewingStory,
    story: viewingStory,
    stories: stories,
    onClose: () => setViewingStory(null),
    onDeletePost: handleDeletePost,
    currentUser: currentUser
  }), React.createElement(InstallAppModal, {
    isOpen: showInstallModal,
    onClose: () => setShowInstallModal(false),
    deferredPrompt: deferredPrompt,
    onInstalled: () => {
      setDeferredPrompt(null);
      showToast("FoodBite installed successfully! 📱", "success");
    }
  }), React.createElement(LikesModal, {
    isOpen: !!likesModalData,
    onClose: () => setLikesModalData(null),
    likes: likesModalData ? likesModalData.likes : [],
    currentUser: currentUser,
    onToggleFollow: handleToggleFollow,
    followingList: followingList
  }), React.createElement(AnnouncementModal, {
    announcement: announcement,
    isOpen: Boolean(announcement && announcement.enabled && !dismissedAnnouncement),
    onClose: () => setDismissedAnnouncement(true)
  }), React.createElement(AdminBroadcastModal, {
    isOpen: showBroadcastModal,
    onClose: () => setShowBroadcastModal(false),
    announcement: announcement,
    onSaveAnnouncement: updated => {
      setAnnouncement(updated);
      if (updated && updated.enabled) {
        setDismissedAnnouncement(false);
      }
    },
    showToast: showToast
  }), React.createElement(ToastContainer, {
    toasts: toasts,
    removeToast: removeToast
  }));
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App boundary error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return React.createElement("div", {
        className: "min-h-screen flex items-center justify-center bg-[#fbf9f6] p-6 text-center text-[#1a1917]"
      }, React.createElement("div", {
        className: "max-w-sm w-full bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-xl space-y-4"
      }, React.createElement("div", {
        className: "text-4xl"
      }, "\u26A0\uFE0F"), React.createElement("h3", {
        className: "text-base font-bold text-[#121214]"
      }, "App Notice"), React.createElement("p", {
        className: "text-xs text-[#736f68] leading-relaxed"
      }, String(this.state.error && (this.state.error.message || this.state.error))), React.createElement("button", {
        type: "button",
        onClick: () => {
          localStorage.removeItem("foodbite_session");
          window.location.reload();
        },
        className: "w-full py-2.5 rounded-xl bg-[#121214] hover:bg-black text-white font-semibold text-xs tracking-wide cursor-pointer shadow-sm active:scale-95 transition-all"
      }, "\uD83D\uDD04 Refresh FoodBite")));
    }
    return this.props.children;
  }
}
const rootElement = document.getElementById("root");
if (rootElement && window.ReactDOM) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(ErrorBoundary, null, React.createElement(App, null)));
}

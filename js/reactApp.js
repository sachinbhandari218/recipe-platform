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
  id: "pizza",
  label: "Pizza & Pasta",
  icon: "🍕"
}, {
  id: "asian",
  label: "Asian & Noodles",
  icon: "🍜"
}, {
  id: "burgers",
  label: "Burgers & Street",
  icon: "🍔"
}, {
  id: "street",
  label: "Street Food",
  icon: "🌮"
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
    className: `pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl shadow-lg border text-xs font-semibold animate-pop-in ${toast.type === "success" ? "bg-[#171717] text-white border-black/10" : toast.type === "error" ? "bg-rose-900 text-white border-rose-800" : "bg-white text-[#171717] border-[#F0ECE4]"}`
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
    className: "w-full max-w-sm bg-white rounded-3xl border border-[#F0ECE4] shadow-2xl overflow-hidden animate-pop-in text-left",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-5 py-4 border-b border-[#F0ECE4] flex items-center justify-between bg-white"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-base"
  }, "\u2764\uFE0F"), React.createElement("h3", {
    className: "text-sm font-bold text-[#171717]"
  }, "Likes (", (likes || []).length, ")")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1.5 rounded-xl text-[#8A817B] hover:text-[#171717] hover:bg-[#FFF0E8] transition-colors cursor-pointer text-xs font-bold"
  }, "\u2715")), React.createElement("div", {
    className: "max-h-72 overflow-y-auto divide-y divide-[#F7F3EC] p-1"
  }, !likes || likes.length === 0 ? React.createElement("div", {
    className: "py-8 text-center text-xs text-[#8A817B]"
  }, "No likes yet. Be the first to crave this!") : likes.map((u, idx) => {
    const uId = u.userId || "usr-" + idx;
    const uName = u.username || "foodie";
    const isSelf = currentUid && uId === currentUid || currentUname && uName.toLowerCase() === currentUname;
    const isFollowed = (followingList || []).includes(uId);
    return React.createElement("div", {
      key: idx,
      className: "flex items-center justify-between px-4 py-2.5 hover:bg-[#FFF9F5] transition-colors"
    }, React.createElement("div", {
      className: "flex items-center space-x-3 min-w-0"
    }, React.createElement("img", {
      src: u.userAvatar || "/uploads/avatars/" + uName + ".svg",
      alt: uName,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      className: "w-9 h-9 rounded-full object-cover border border-[#F0ECE4] flex-shrink-0"
    }), React.createElement("div", {
      className: "min-w-0"
    }, React.createElement("div", {
      className: "text-xs font-bold text-[#171717] truncate leading-tight"
    }, uName), React.createElement("div", {
      className: "text-[10px] text-[#8A817B] truncate"
    }, u.likedAt ? formatTimeAgo(u.likedAt) : "Recently"))), !isSelf && onToggleFollow && React.createElement("button", {
      type: "button",
      onClick: () => onToggleFollow(uId, uName),
      className: `text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer flex-shrink-0 ${isFollowed ? "bg-[#FFF0E8] text-[#8A817B] hover:bg-[#F5EBE1]" : "bg-[#FF5A2A] text-white hover:bg-[#E6471A] shadow-xs"}`
    }, isFollowed ? "Following" : "+ Follow"));
  }))));
}
function FoodCardSkeleton() {
  return React.createElement("div", {
    className: "food-card p-4 space-y-3.5 text-left animate-pulse bg-white"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, React.createElement("div", {
    className: "w-9 h-9 rounded-full bg-[#FFF0E8]"
  }), React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("div", {
    className: "w-24 h-3 bg-[#FFF0E8] rounded-md"
  }), React.createElement("div", {
    className: "w-14 h-2 bg-[#FFF0E8] rounded-md"
  }))), React.createElement("div", {
    className: "w-16 h-4 bg-[#FFF0E8] rounded-full"
  })), React.createElement("div", {
    className: "w-full aspect-[4/3] rounded-2xl bg-[#FFF0E8] skeleton-shimmer"
  }), React.createElement("div", {
    className: "space-y-2"
  }, React.createElement("div", {
    className: "w-16 h-3 bg-[#FFF0E8] rounded-md"
  }), React.createElement("div", {
    className: "w-3/4 h-4 bg-[#FFF0E8] rounded-md"
  }), React.createElement("div", {
    className: "w-full h-3 bg-[#FFF0E8] rounded-md"
  })), React.createElement("div", {
    className: "pt-2 border-t border-[#F0ECE4] flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-4"
  }, React.createElement("div", {
    className: "w-10 h-4 bg-[#FFF0E8] rounded-md"
  }), React.createElement("div", {
    className: "w-10 h-4 bg-[#FFF0E8] rounded-md"
  })), React.createElement("div", {
    className: "w-6 h-4 bg-[#FFF0E8] rounded-md"
  })));
}
function EmptyState({
  title,
  message,
  actionLabel,
  onAction
}) {
  return React.createElement("div", {
    className: "w-full py-16 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white border border-[#F0ECE4] rounded-3xl shadow-xs"
  }, React.createElement("div", {
    className: "w-16 h-16 rounded-2xl bg-[#FFF0E8] border border-[#FFE4D6] text-[#FF5A2A] flex items-center justify-center text-3xl shadow-xs"
  }, "\uD83C\uDF5C"), React.createElement("h3", {
    className: "text-base font-bold text-[#171717]"
  }, title || "No bites yet 🍜"), React.createElement("p", {
    className: "text-xs text-[#8A817B] max-w-sm"
  }, message || "Be the first to share something delicious."), actionLabel && React.createElement("button", {
    type: "button",
    onClick: onAction,
    className: "mt-2 px-5 py-2.5 rounded-full bg-[#FF5A2A] hover:bg-[#E6471A] text-white text-xs font-semibold shadow-md shadow-[#FF5A2A]/20 active:scale-95 transition-all cursor-pointer"
  }, actionLabel));
}
function ErrorState({
  message,
  onRetry
}) {
  return React.createElement("div", {
    className: "w-full py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white border border-rose-100 rounded-3xl"
  }, React.createElement("div", {
    className: "w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-2xl"
  }, "\u26A0\uFE0F"), React.createElement("h3", {
    className: "text-sm font-bold text-[#171717]"
  }, "Could not load feed"), React.createElement("p", {
    className: "text-xs text-[#8A817B] max-w-xs"
  }, message || "Connection issue. Please try again."), onRetry && React.createElement("button", {
    type: "button",
    onClick: onRetry,
    className: "px-4 py-2 rounded-xl bg-[#171717] hover:bg-black text-white text-xs font-semibold shadow-sm cursor-pointer"
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
    className: "min-h-screen flex items-center justify-center p-4 bg-[#FFF9F5]"
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-white border border-[#F0ECE4] rounded-3xl p-8 shadow-xl shadow-black/5 text-[#171717] space-y-6 animate-pop-in"
  }, React.createElement("div", {
    className: "text-center space-y-2"
  }, React.createElement("div", {
    className: "w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5A2A] to-[#FFB38F] text-white flex items-center justify-center text-2xl mx-auto shadow-md shadow-[#FF5A2A]/20"
  }, "\uD83D\uDD25"), React.createElement("h2", {
    className: "text-2xl font-black text-[#171717] tracking-tight font-heading"
  }, "FoodBite"), React.createElement("p", {
    className: "text-[11px] uppercase tracking-widest text-[#FF5A2A] font-bold"
  }, "Discover. Share. Crave."), React.createElement("p", {
    className: "text-xs text-[#8A817B] leading-relaxed max-w-xs mx-auto pt-1"
  }, "Join the social food community. Share your daily bites and discover what foodies are cooking and craving right now.")), errorMessage && React.createElement("div", {
    className: "p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center animate-fade-in"
  }, errorMessage), React.createElement("form", {
    onSubmit: handleContinue,
    className: "space-y-4"
  }, React.createElement("div", {
    className: "space-y-1.5 text-left"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#171717] block"
  }, "Your Username"), React.createElement("div", {
    className: "relative"
  }, React.createElement("span", {
    className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8A817B] font-mono"
  }, "@"), React.createElement("input", {
    type: "text",
    autoFocus: true,
    required: true,
    value: username,
    onChange: e => setUsername(e.target.value),
    placeholder: "chef_sachin",
    maxLength: 30,
    className: "w-full pl-8 pr-4 py-3 rounded-2xl bg-[#FFF9F5] border border-[#F0ECE4] text-xs font-semibold text-[#171717] placeholder:text-[#8A817B] focus:outline-none focus:border-[#FF5A2A] focus:bg-white focus:ring-2 focus:ring-[#FF5A2A]/10 transition-all"
  })), React.createElement("p", {
    className: "text-[10px] text-[#8A817B]"
  }, "Enter your username to continue immediately.")), React.createElement("button", {
    type: "submit",
    disabled: isLoading || !cleanUsername,
    className: "w-full py-3.5 rounded-2xl bg-[#FF5A2A] hover:bg-[#E6471A] text-white text-xs font-bold tracking-wide disabled:opacity-40 shadow-lg shadow-[#FF5A2A]/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
  }, isLoading ? React.createElement("span", null, "Entering...") : React.createElement(React.Fragment, null, React.createElement("span", null, "Continue to FoodBite"), React.createElement("span", null, "\u2192")))), React.createElement("div", {
    className: "pt-2 text-center border-t border-[#F0ECE4]"
  }, React.createElement("p", {
    className: "text-[10px] text-[#8A817B]"
  }, "\xA9 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari."))));
}
function PersonalizedFeedHeader({
  currentUser,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = currentUser ? currentUser.name || currentUser.username : "Foodie";
  return React.createElement("div", {
    className: "w-full bg-gradient-to-b from-[#FFF0E8]/70 via-[#FFF9F5] to-[#FFF9F5] pt-6 pb-4 px-4 sm:px-6 border-b border-[#F0ECE4]"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto space-y-4"
  }, React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
  }, React.createElement("div", null, React.createElement("h1", {
    className: "text-xl sm:text-2xl font-black text-[#171717] tracking-tight font-heading"
  }, greeting, ", ", displayName, " \uD83D\uDC4B"), React.createElement("p", {
    className: "text-xs sm:text-sm text-[#8A817B] font-medium pt-0.5"
  }, "What are you craving today?")), React.createElement("div", {
    className: "hidden sm:flex items-center space-x-2"
  }, React.createElement("span", {
    className: "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFF0E8] border border-[#FFE4D6] text-[#FF5A2A] text-xs font-bold"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, "24h Ephemeral Stories")))), React.createElement("div", {
    className: "relative w-full max-w-2xl"
  }, React.createElement("span", {
    className: "absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8A817B]"
  }, "\uD83D\uDD0D"), React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    placeholder: "Search dishes, cravings, creators...",
    className: "w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-[#F0ECE4] text-xs sm:text-sm text-[#171717] placeholder:text-[#8A817B] focus:outline-none focus:border-[#FF5A2A] focus:ring-2 focus:ring-[#FF5A2A]/10 shadow-xs hover:border-[#FFB38F] transition-all"
  }), searchQuery && React.createElement("button", {
    type: "button",
    onClick: () => setSearchQuery(""),
    className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8A817B] hover:text-[#171717] p-1 rounded-lg cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 pt-1"
  }, CATEGORIES.map(cat => {
    const isActive = activeCategory === cat.id;
    return React.createElement("button", {
      key: cat.id,
      type: "button",
      onClick: () => setActiveCategory(cat.id),
      className: `flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? "bg-[#171717] text-white shadow-xs scale-[1.02]" : "bg-white text-[#8A817B] hover:text-[#171717] border border-[#F0ECE4] hover:border-[#FFB38F] hover:bg-[#FFF0E8]/40"}`
    }, React.createElement("span", null, cat.icon), React.createElement("span", null, cat.label));
  }))));
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
    className: "w-full bg-white border-b border-[#F0ECE4] py-4 px-4 sm:px-6"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto space-y-3"
  }, React.createElement("div", {
    className: "flex items-center justify-between px-1 text-left"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("h2", {
    className: "text-xs sm:text-sm font-bold text-[#171717] tracking-tight"
  }, "Food Stories"), React.createElement("span", {
    className: "px-2 py-0.5 rounded-full bg-[#FFF0E8] border border-[#FFE4D6] text-[#FF5A2A] text-[10px] font-bold"
  }, "Fresh today \u2022 24h")), React.createElement("span", {
    className: "text-[11px] text-[#8A817B]"
  }, stories ? stories.length : 0, " active")), React.createElement("div", {
    className: "flex items-center space-x-4 overflow-x-auto scrollbar-none pb-1"
  }, React.createElement("div", {
    onClick: onTriggerUpload,
    className: "flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
  }, React.createElement("div", {
    className: "relative w-15 h-15 rounded-full p-[2px] border-2 border-dashed border-[#FF5A2A] group-hover:border-[#171717] transition-colors flex items-center justify-center bg-[#FFF0E8]"
  }, React.createElement("img", {
    src: currentUser && (currentUser.avatar || currentUser.avatarUrl) || "/uploads/avatars/sachin.svg",
    alt: "Your story",
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-full h-full rounded-full object-cover"
  }), React.createElement("span", {
    className: "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A2A] text-white flex items-center justify-center text-xs font-bold shadow-xs"
  }, "+")), React.createElement("span", {
    className: "text-[11px] font-bold text-[#171717] max-w-[68px] truncate"
  }, "Your Bite")), uniqueUsers.map(story => {
    const isCurrentUser = story.userId === currentUid;
    return React.createElement("div", {
      key: story.userId,
      onClick: () => onViewStory(story),
      className: "flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
    }, React.createElement("div", {
      className: "w-15 h-15 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF5A2A] via-[#FF8A65] to-[#FFB38F] group-hover:scale-105 transition-transform duration-200"
    }, React.createElement("div", {
      className: "w-full h-full rounded-full p-[1.5px] bg-white"
    }, React.createElement("img", {
      src: story.userAvatar || "/uploads/avatars/" + (story.username || "sachin") + ".svg",
      alt: story.username,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      className: "w-full h-full rounded-full object-cover"
    }))), React.createElement("span", {
      className: "text-[11px] font-medium text-[#8A817B] group-hover:text-[#171717] max-w-[68px] truncate transition-colors"
    }, isCurrentUser ? "You" : story.username));
  }))));
}
function ForYouShelf({
  stories,
  onViewStory,
  onLike,
  likes
}) {
  if (!stories || stories.length === 0) return null;
  const recommendations = stories.slice(0, 3);
  return React.createElement("div", {
    className: "w-full py-4 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-3 px-1"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-sm font-bold text-[#171717] tracking-tight flex items-center space-x-1.5"
  }, React.createElement("span", null, "For You \u2728")), React.createElement("p", {
    className: "text-[11px] text-[#8A817B]"
  }, "Because you love spicy street food and artisan culinary creations"))), React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
  }, recommendations.map(post => React.createElement("div", {
    key: post.id,
    onClick: () => onViewStory(post),
    className: "flex items-center space-x-3 p-3 rounded-2xl bg-white border border-[#F0ECE4] shadow-xs hover:shadow-md hover:border-[#FFB38F] transition-all cursor-pointer group"
  }, React.createElement("div", {
    className: "relative w-20 h-20 rounded-xl overflow-hidden bg-[#FFF0E8] flex-shrink-0"
  }, React.createElement("img", {
    src: post.mediaUrl,
    alt: post.caption || "Food",
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
  }), React.createElement("span", {
    className: "absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-semibold text-white"
  }, formatHoursLeft(post.expiresAt))), React.createElement("div", {
    className: "flex-1 min-w-0 space-y-1"
  }, React.createElement("span", {
    className: "text-[9px] font-bold text-[#FF5A2A] uppercase tracking-wider block"
  }, "RECOMMENDED"), React.createElement("h4", {
    className: "text-xs font-bold text-[#171717] truncate leading-tight"
  }, decodeUnicode(post.caption) || "Community Bite"), React.createElement("p", {
    className: "text-[10px] text-[#8A817B] truncate"
  }, "by @", post.username)), React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onLike(post.id);
    },
    className: "p-2 rounded-xl bg-[#FFF9F5] hover:bg-[#FFF0E8] text-xs font-bold transition-colors cursor-pointer"
  }, likes[post.id] ? "❤️" : "🤍")))));
}
function TrendingNowShelf({
  stories,
  onViewStory
}) {
  if (!stories || stories.length === 0) return null;
  const topBites = stories.slice(0, 6);
  return React.createElement("div", {
    className: "w-full py-4 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-3 px-1"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-sm font-bold text-[#171717] tracking-tight flex items-center space-x-1.5"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, "Trending right now")), React.createElement("p", {
    className: "text-[11px] text-[#8A817B]"
  }, "Most craved dishes in the community today"))), React.createElement("div", {
    className: "flex items-center space-x-3.5 overflow-x-auto scrollbar-none pb-2"
  }, topBites.map(story => React.createElement("div", {
    key: story.id,
    onClick: () => onViewStory(story),
    className: "flex-shrink-0 w-48 rounded-2xl bg-white border border-[#F0ECE4] overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group text-left"
  }, React.createElement("div", {
    className: "relative aspect-[4/3] bg-[#FFF0E8] overflow-hidden"
  }, story.mediaType === "video" ? React.createElement("video", {
    src: story.mediaUrl,
    className: "w-full h-full object-cover"
  }) : React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption || "Food item",
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
  }), React.createElement("span", {
    className: "absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold"
  }, "\u23F3 ", formatHoursLeft(story.expiresAt))), React.createElement("div", {
    className: "p-3 space-y-1"
  }, React.createElement("span", {
    className: "text-[9px] font-extrabold uppercase tracking-wider text-[#FF5A2A] block"
  }, "TRENDING"), React.createElement("p", {
    className: "text-xs font-bold text-[#171717] truncate leading-tight"
  }, decodeUnicode(story.caption) || "Daily Food Creation"), React.createElement("div", {
    className: "flex items-center justify-between text-[10px] text-[#8A817B] pt-0.5"
  }, React.createElement("span", null, "@", story.username), React.createElement("span", null, "\u2764\uFE0F ", story.likeCount || (story.likes ? story.likes.length : 0))))))));
}
function PopularNearYouShelf() {
  const localCategories = [{
    title: "Local Street Heroes",
    distance: "0.5 km away",
    icon: "🌮",
    tag: "Street & Chaat"
  }, {
    title: "Woodfired Slices",
    distance: "1.2 km away",
    icon: "🍕",
    tag: "Pizza & Oven"
  }, {
    title: "Artisan Brews & Roasts",
    distance: "0.8 km away",
    icon: "☕",
    tag: "Specialty Coffee"
  }, {
    title: "Sweet Confections",
    distance: "1.5 km away",
    icon: "🍰",
    tag: "Desserts & Bakery"
  }];
  return React.createElement("div", {
    className: "w-full py-4 text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-3 px-1"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-sm font-bold text-[#171717] tracking-tight flex items-center space-x-1.5"
  }, React.createElement("span", null, "\uD83D\uDCCD"), React.createElement("span", null, "Popular near you")), React.createElement("p", {
    className: "text-[11px] text-[#8A817B]"
  }, "Neighborhood cravings and local culinary creations"))), React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-3"
  }, localCategories.map((item, idx) => React.createElement("div", {
    key: idx,
    className: "p-3.5 rounded-2xl bg-white border border-[#F0ECE4] shadow-xs hover:border-[#FFB38F] hover:shadow-md transition-all cursor-pointer group text-left space-y-1.5"
  }, React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-[#FFF0E8] text-[#FF5A2A] flex items-center justify-center text-lg group-hover:scale-110 transition-transform"
  }, item.icon), React.createElement("h4", {
    className: "text-xs font-bold text-[#171717] leading-tight truncate"
  }, item.title), React.createElement("div", {
    className: "flex items-center justify-between text-[10px] text-[#8A817B]"
  }, React.createElement("span", null, item.tag), React.createElement("span", {
    className: "font-semibold text-[#FF5A2A]"
  }, item.distance))))));
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
  const categoryLabel = (post.category || "Food Creation").toUpperCase();
  const handleCommentSubmit = e => {
    e.preventDefault();
    const clean = commentText.trim();
    if (!clean) return;
    onAddComment(post.id, clean);
    setCommentText("");
    setShowComments(true);
  };
  return React.createElement("article", {
    className: "food-card p-4 space-y-3 text-left bg-white"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", {
    onClick: () => onViewStory(post),
    className: "flex items-center space-x-2.5 cursor-pointer group"
  }, React.createElement("div", {
    className: "p-[1.5px] rounded-full bg-gradient-to-tr from-[#FF5A2A] to-[#FFB38F]"
  }, React.createElement("img", {
    src: post.userAvatar || "/uploads/avatars/" + (post.username || "sachin") + ".svg",
    alt: post.username,
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-9 h-9 rounded-full object-cover border border-white"
  })), React.createElement("div", null, React.createElement("div", {
    className: "flex items-center space-x-1.5"
  }, React.createElement("h4", {
    className: "text-xs font-bold text-[#171717] group-hover:text-[#FF5A2A] transition-colors"
  }, post.username), !isOwner && onToggleFollow && React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onToggleFollow(post.userId, post.username);
    },
    className: `text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${isFollowing ? "bg-[#FFF0E8] text-[#8A817B] hover:bg-[#F5EBE1]" : "bg-[#FFF0E8] text-[#FF5A2A] hover:bg-[#FFE4D6]"}`
  }, isFollowing ? "Following" : "+ Follow")), React.createElement("span", {
    className: "text-[10px] text-[#8A817B] block"
  }, formatTimeAgo(post.createdAt)))), React.createElement("div", {
    className: "flex items-center space-x-1.5"
  }, React.createElement("span", {
    className: "text-[10px] font-bold text-[#FF5A2A] px-2.5 py-0.5 rounded-full bg-[#FFF0E8] border border-[#FFE4D6]"
  }, "\u23F3 ", formatHoursLeft(post.expiresAt)), isOwner && onDeletePost && React.createElement("button", {
    type: "button",
    onClick: () => {
      if (window.confirm("Delete this food story?")) {
        onDeletePost(post.id);
      }
    },
    className: "p-1 rounded-lg text-[#8A817B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer",
    title: "Delete Story"
  }, "\uD83D\uDDD1\uFE0F"))), React.createElement("div", {
    onDoubleClick: () => onDoubleTap(post),
    className: "relative w-full aspect-[4/3] bg-[#FFF0E8] rounded-2xl overflow-hidden cursor-pointer select-none flex items-center justify-center group"
  }, React.createElement("div", {
    className: "absolute inset-0 bg-cover bg-center scale-125 blur-2xl opacity-25 pointer-events-none",
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
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "relative z-10 w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300",
    loading: "lazy"
  }), heartBurst && React.createElement("div", {
    className: "absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-heart-burst"
  }, React.createElement("span", {
    className: "text-6xl filter drop-shadow-xl"
  }, "\u2764\uFE0F"))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("div", {
    className: "inline-block px-2 py-0.5 rounded-md bg-[#FFF0E8] text-[#FF5A2A] text-[9px] font-black uppercase tracking-wider"
  }, categoryLabel), dishTitle && React.createElement("h3", {
    className: "text-sm sm:text-base font-bold text-[#171717] tracking-tight font-heading leading-snug"
  }, dishTitle), dishDescription && React.createElement("p", {
    className: "text-xs text-[#8A817B] leading-relaxed line-clamp-2"
  }, dishDescription)), React.createElement("div", {
    className: "pt-2 border-t border-[#F0ECE4] flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-3.5"
  }, React.createElement("button", {
    type: "button",
    onClick: () => onLike(post.id),
    className: "flex items-center space-x-1.5 text-xs font-bold text-[#171717] hover:text-[#FF5A2A] transition-colors cursor-pointer group",
    title: isLiked ? "Unlike" : "Like"
  }, React.createElement("span", {
    className: `text-sm transition-transform group-hover:scale-125 ${isLiked ? "scale-110" : ""}`
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
    className: "flex items-center space-x-1.5 text-xs font-bold text-[#8A817B] hover:text-[#171717] transition-colors cursor-pointer",
    title: "Comments"
  }, React.createElement("span", {
    className: "text-sm"
  }, "\uD83D\uDCAC"), React.createElement("span", null, (comments || []).length)), React.createElement("button", {
    type: "button",
    onClick: () => onShare(post),
    className: "text-xs text-[#8A817B] hover:text-[#171717] transition-colors cursor-pointer",
    title: "Share Food"
  }, "\u2197\uFE0F")), React.createElement("button", {
    type: "button",
    onClick: () => onSave(post.id),
    className: `text-sm transition-colors cursor-pointer ${isSaved ? "text-[#FF5A2A]" : "text-[#8A817B] hover:text-[#171717]"}`,
    title: isSaved ? "Saved" : "Save"
  }, isSaved ? "🔖" : "🏷️")), postLikes && postLikes.length > 0 && React.createElement("div", {
    onClick: () => onShowLikes && onShowLikes(post.id, postLikes),
    className: "pt-0.5 text-[11px] text-[#8A817B] hover:text-[#171717] cursor-pointer transition-colors flex items-center space-x-1 select-none"
  }, React.createElement("span", null, "Liked by"), React.createElement("strong", {
    className: "text-[#171717]"
  }, "@", postLikes[0].username), postLikes.length > 1 && React.createElement("span", null, " and ", postLikes.length - 1, " other", postLikes.length > 2 ? "s" : "")), showComments && React.createElement("div", {
    className: "pt-2 space-y-2 border-t border-[#F7F3EC]"
  }, comments && comments.length > 0 && React.createElement("div", {
    className: "space-y-1.5 max-h-36 overflow-y-auto divide-y divide-[#F7F3EC]/60 pr-1"
  }, comments.map((c, i) => React.createElement("div", {
    key: c.id || i,
    className: "pt-1 text-xs text-[#8A817B] leading-tight"
  }, React.createElement("strong", {
    className: "text-[#171717] mr-1.5"
  }, "@", c.author || c.username), React.createElement("span", null, c.text)))), React.createElement("form", {
    onSubmit: handleCommentSubmit,
    className: "pt-1 flex items-center space-x-2"
  }, React.createElement("input", {
    type: "text",
    value: commentText,
    onChange: e => setCommentText(e.target.value),
    placeholder: "Add a comment...",
    className: "flex-1 px-3 py-2 rounded-xl bg-[#FFF9F5] border border-[#F0ECE4] text-xs text-[#171717] placeholder:text-[#8A817B] focus:outline-none focus:border-[#FF5A2A] focus:bg-white transition-colors"
  }), React.createElement("button", {
    type: "submit",
    disabled: !commentText.trim(),
    className: "px-3 py-2 rounded-xl bg-[#171717] hover:bg-black disabled:opacity-30 text-white text-[11px] font-bold transition-colors cursor-pointer"
  }, "Post"))));
}
function FloatingCreateButton({
  onTriggerUpload
}) {
  return React.createElement("div", {
    className: "fixed bottom-20 md:bottom-8 right-6 z-40"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "flex items-center space-x-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#FF5A2A] to-[#E6471A] hover:from-[#E6471A] hover:to-[#C2350E] text-white font-bold text-xs sm:text-sm tracking-wide shadow-xl shadow-[#FF5A2A]/35 active:scale-95 hover:-translate-y-0.5 transition-all cursor-pointer btn-float-bite select-none",
    title: "Share your daily food story"
  }, React.createElement("span", {
    className: "text-base leading-none"
  }, "\u2795"), React.createElement("span", null, "Share Bite")));
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
  const avatarUrl = currentUser && (currentUser.avatar || currentUser.avatarUrl) || "/uploads/avatars/sachin.svg";
  return React.createElement("header", {
    className: "hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0ECE4]"
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
    className: "w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF5A2A] to-[#FFB38F] text-white flex items-center justify-center text-lg shadow-sm shadow-[#FF5A2A]/20"
  }, "\uD83D\uDD25"), React.createElement("div", null, React.createElement("h1", {
    className: "text-lg font-black text-[#171717] tracking-tight leading-none font-heading"
  }, "FoodBite"), React.createElement("span", {
    className: "text-[9px] uppercase tracking-widest text-[#FF5A2A] font-extrabold block pt-0.5"
  }, "Discover. Share. Crave."))), React.createElement("nav", {
    className: "flex items-center space-x-1"
  }, React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("home");
      onRefreshFeed && onRefreshFeed();
    },
    className: `px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "home" ? "bg-[#FFF0E8] text-[#FF5A2A]" : "text-[#8A817B] hover:text-[#171717] hover:bg-[#FFF9F5]"}`
  }, "Home"), React.createElement("button", {
    type: "button",
    onClick: () => setActiveTab("discover"),
    className: `px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "discover" ? "bg-[#FFF0E8] text-[#FF5A2A]" : "text-[#8A817B] hover:text-[#171717] hover:bg-[#FFF9F5]"}`
  }, "Discover"), React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "px-3.5 py-2 rounded-xl text-xs font-bold text-[#8A817B] hover:text-[#171717] hover:bg-[#FFF9F5] transition-all cursor-pointer flex items-center space-x-1"
  }, React.createElement("span", null, "+"), React.createElement("span", null, "Create")), React.createElement("button", {
    type: "button",
    onClick: () => setActiveTab("activity"),
    className: `relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "activity" ? "bg-[#FFF0E8] text-[#FF5A2A]" : "text-[#8A817B] hover:text-[#171717] hover:bg-[#FFF9F5]"}`
  }, React.createElement("span", null, "Activity"), unreadCount > 0 && React.createElement("span", {
    className: "ml-1 px-1.5 py-0.2 rounded-full bg-[#FF5A2A] text-white text-[9px] font-bold"
  }, unreadCount)), React.createElement("button", {
    type: "button",
    onClick: () => setActiveTab("profile"),
    className: `px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "profile" ? "bg-[#FFF0E8] text-[#FF5A2A]" : "text-[#8A817B] hover:text-[#171717] hover:bg-[#FFF9F5]"}`
  }, "Profile"))), React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("div", {
    className: "flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#FFF0E8] border border-[#FFE4D6] text-[#FF5A2A] text-xs font-bold shadow-xs"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "d Streak")), React.createElement("button", {
    type: "button",
    onClick: onTriggerInstall,
    className: "px-3 py-1.5 rounded-xl border border-[#F0ECE4] bg-white hover:bg-[#FFF9F5] text-[#8A817B] hover:text-[#171717] text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1"
  }, React.createElement("span", null, "\uD83D\uDCF1"), React.createElement("span", null, "App")), React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "px-4 py-2 rounded-xl bg-[#FF5A2A] hover:bg-[#E6471A] text-white text-xs font-bold tracking-wide shadow-md shadow-[#FF5A2A]/25 active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5"
  }, React.createElement("span", null, "+"), React.createElement("span", null, "Share Bite")), currentUser && (currentUser.role === "admin" || currentUser.username === "sachin" || currentUser.id === "usr-1") && React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: `relative px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${announcement && announcement.enabled ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 ring-2 ring-amber-400/30" : "bg-white border-[#F0ECE4] text-[#8A817B] hover:text-[#171717] hover:bg-[#FFF9F5]"}`,
    title: "Admin Announcement & Maintenance Broadcast Manager"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "Broadcast"), announcement && announcement.enabled && React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-amber-500 animate-ping"
  })), React.createElement("div", {
    onClick: () => setActiveTab("profile"),
    className: "w-9 h-9 rounded-full border border-[#F0ECE4] overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#FF5A2A]/30 transition-all flex-shrink-0"
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
  currentUser
}) {
  return React.createElement("header", {
    className: "md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0ECE4] px-4 py-2.5 flex items-center justify-between"
  }, React.createElement("div", {
    onClick: onLogoClick,
    className: "flex items-center space-x-2 cursor-pointer select-none"
  }, React.createElement("div", {
    className: "w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF5A2A] to-[#FFB38F] text-white flex items-center justify-center text-sm shadow-xs"
  }, "\uD83D\uDD25"), React.createElement("div", null, React.createElement("span", {
    className: "text-base font-extrabold text-[#171717] tracking-tight font-heading leading-none"
  }, "FoodBite"), React.createElement("span", {
    className: "text-[8px] uppercase tracking-widest text-[#FF5A2A] font-bold block leading-none pt-0.5"
  }, "Discover. Share. Crave."))), React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("div", {
    className: "flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#FFF0E8] border border-[#FFE4D6] text-[#FF5A2A] text-[11px] font-bold"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "d")), React.createElement("button", {
    type: "button",
    onClick: onTriggerInstall,
    className: "p-1.5 rounded-xl border border-[#F0ECE4] bg-white text-xs",
    title: "Install App"
  }, "\uD83D\uDCF1"), currentUser && (currentUser.role === "admin" || currentUser.username === "sachin" || currentUser.id === "usr-1") && React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: `p-1.5 rounded-xl border text-xs transition-colors flex items-center justify-center ${announcement && announcement.enabled ? "bg-amber-50 border-amber-300 text-amber-800" : "border-[#F0ECE4] bg-white text-[#8A817B]"}`,
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
    className: "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F0ECE4] px-2 py-1.5 flex items-center justify-around shadow-lg"
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
    className: `flex flex-col items-center py-1 px-3 text-[10px] font-bold transition-colors cursor-pointer ${activeTab === "home" ? "text-[#FF5A2A]" : "text-[#8A817B]"}`
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83C\uDFE0"), React.createElement("span", null, "Home")), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("discover");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-3 text-[10px] font-bold transition-colors cursor-pointer ${activeTab === "discover" ? "text-[#FF5A2A]" : "text-[#8A817B]"}`
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83E\uDDED"), React.createElement("span", null, "Discover")), React.createElement("div", {
    className: "-mt-6"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "w-13 h-13 rounded-full bg-gradient-to-tr from-[#FF5A2A] to-[#FF8A65] text-white flex items-center justify-center text-2xl font-bold shadow-xl shadow-[#FF5A2A]/40 active:scale-95 transition-transform cursor-pointer",
    title: "Share Food"
  }, "+")), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("activity");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `relative flex flex-col items-center py-1 px-3 text-[10px] font-bold transition-colors cursor-pointer ${activeTab === "activity" ? "text-[#FF5A2A]" : "text-[#8A817B]"}`
  }, React.createElement("span", {
    className: "text-lg"
  }, "\u2764\uFE0F"), React.createElement("span", null, "Activity"), unreadCount > 0 && React.createElement("span", {
    className: "absolute top-1 right-2.5 w-2 h-2 rounded-full bg-[#FF5A2A]"
  })), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("profile");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-3 text-[10px] font-bold transition-colors cursor-pointer ${activeTab === "profile" ? "text-[#FF5A2A]" : "text-[#8A817B]"}`
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83D\uDC64"), React.createElement("span", null, "Profile")));
}
function DiscoverView({
  stories,
  onViewStory,
  onTriggerUpload,
  onToggleFollow,
  followingList,
  currentUser
}) {
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const tasteTags = [{
    id: "all",
    label: "All Flavors",
    icon: "✨"
  }, {
    id: "spicy",
    label: "#SpicyFiesta",
    icon: "🌶️"
  }, {
    id: "cheesy",
    label: "#CheesyCravings",
    icon: "🧀"
  }, {
    id: "crispy",
    label: "#CrispyBites",
    icon: "🍗"
  }, {
    id: "street",
    label: "#StreetFood",
    icon: "🌮"
  }, {
    id: "desserts",
    label: "#SweetTooth",
    icon: "🍰"
  }, {
    id: "healthy",
    label: "#HealthyBowls",
    icon: "🥗"
  }, {
    id: "coffee",
    label: "#ArtisanCoffee",
    icon: "☕"
  }];
  const creators = useMemo(() => {
    if (!stories) return [];
    const map = new Map();
    stories.forEach(s => {
      if (!map.has(s.userId)) {
        map.set(s.userId, {
          userId: s.userId,
          username: s.username,
          avatar: s.userAvatar || "/uploads/avatars/" + (s.username || "sachin") + ".svg",
          postCount: stories.filter(x => x.userId === s.userId).length
        });
      }
    });
    return Array.from(map.values());
  }, [stories]);
  const cravingsMoods = [{
    title: "Late Night Cravings",
    desc: "Midnight street food & quick eats",
    icon: "🌙",
    color: "from-amber-600 to-orange-700"
  }, {
    title: "Weekend Brunch",
    desc: "Fluffy stacks, artisanal sourdough & eggs",
    icon: "☀️",
    color: "from-orange-500 to-amber-600"
  }, {
    title: "Spice Quest",
    desc: "Fiery curries, loaded tacos & fiery noodles",
    icon: "🌶️",
    color: "from-rose-600 to-red-700"
  }, {
    title: "Sweet Tooth Sanctuary",
    desc: "Pastries, gelatos & baked delicacies",
    icon: "🍰",
    color: "from-pink-500 to-rose-600"
  }];
  const filtered = useMemo(() => {
    if (!stories) return [];
    let list = [...stories];
    if (discoverSearch.trim()) {
      const q = discoverSearch.trim().toLowerCase();
      list = list.filter(s => {
        const text = ((s.caption || "") + " " + (s.username || "")).toLowerCase();
        return text.includes(q);
      });
    }
    if (selectedTag !== "all") {
      const needle = selectedTag.toLowerCase();
      list = list.filter(s => {
        const text = ((s.caption || "") + " " + (s.category || "")).toLowerCase();
        return text.includes(needle);
      });
    }
    return list;
  }, [stories, discoverSearch, selectedTag]);
  return React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-7 text-left animate-fade-in"
  }, React.createElement("div", {
    className: "space-y-2"
  }, React.createElement("h1", {
    className: "text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight font-heading"
  }, "Discover Food"), React.createElement("p", {
    className: "text-xs sm:text-sm text-[#8A817B]"
  }, "Explore trending community dishes, local creators, and hand-crafted culinary cravings."), React.createElement("div", {
    className: "relative w-full max-w-2xl pt-2"
  }, React.createElement("span", {
    className: "absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8A817B]"
  }, "\uD83D\uDD0D"), React.createElement("input", {
    type: "text",
    value: discoverSearch,
    onChange: e => setDiscoverSearch(e.target.value),
    placeholder: "Search pizza, noodles, tacos, sweet dishes...",
    className: "w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-[#F0ECE4] text-xs sm:text-sm text-[#171717] placeholder:text-[#8A817B] focus:outline-none focus:border-[#FF5A2A] focus:ring-2 focus:ring-[#FF5A2A]/10 shadow-xs transition-all"
  }), discoverSearch && React.createElement("button", {
    type: "button",
    onClick: () => setDiscoverSearch(""),
    className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8A817B] hover:text-[#171717] p-1 rounded-lg cursor-pointer"
  }, "\u2715"))), React.createElement("div", {
    className: "flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1"
  }, tasteTags.map(tag => {
    const isActive = selectedTag === tag.id;
    return React.createElement("button", {
      key: tag.id,
      type: "button",
      onClick: () => setSelectedTag(tag.id),
      className: `flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? "bg-[#171717] text-white shadow-xs" : "bg-white text-[#8A817B] hover:text-[#171717] border border-[#F0ECE4] hover:border-[#FFB38F]"}`
    }, React.createElement("span", null, tag.icon), React.createElement("span", null, tag.label));
  })), creators && creators.length > 0 && React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("h3", {
    className: "text-sm font-bold text-[#171717] tracking-tight"
  }, "Top Food Creators"), React.createElement("span", {
    className: "text-xs text-[#8A817B]"
  }, creators.length, " chefs sharing")), React.createElement("div", {
    className: "flex items-center space-x-3.5 overflow-x-auto scrollbar-none pb-2"
  }, creators.map(c => {
    const isFollowed = (followingList || []).includes(c.userId);
    const isSelf = currentUser && (currentUser.id === c.userId || currentUser.uid === c.userId);
    return React.createElement("div", {
      key: c.userId,
      className: "flex-shrink-0 w-36 p-3 rounded-2xl bg-white border border-[#F0ECE4] shadow-xs text-center space-y-2 hover:border-[#FFB38F] transition-all"
    }, React.createElement("img", {
      src: c.avatar,
      alt: c.username,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      className: "w-14 h-14 rounded-full mx-auto object-cover border-2 border-[#FFF0E8]"
    }), React.createElement("div", null, React.createElement("h4", {
      className: "text-xs font-bold text-[#171717] truncate"
    }, "@", c.username), React.createElement("span", {
      className: "text-[10px] text-[#8A817B] block"
    }, c.postCount, " bites today")), !isSelf && onToggleFollow && React.createElement("button", {
      type: "button",
      onClick: () => onToggleFollow(c.userId, c.username),
      className: `w-full py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${isFollowed ? "bg-[#FFF0E8] text-[#8A817B]" : "bg-[#FF5A2A] text-white hover:bg-[#E6471A] shadow-xs"}`
    }, isFollowed ? "Following" : "+ Follow"));
  }))), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("h3", {
    className: "text-sm font-bold text-[#171717] tracking-tight"
  }, "Curated Cravings & Moods"), React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, cravingsMoods.map((m, idx) => React.createElement("div", {
    key: idx,
    className: `p-5 rounded-3xl bg-gradient-to-br ${m.color} text-white space-y-2 shadow-sm hover:shadow-lg transition-all cursor-pointer group`
  }, React.createElement("span", {
    className: "text-3xl block group-hover:scale-110 transition-transform"
  }, m.icon), React.createElement("h4", {
    className: "text-sm font-bold font-heading"
  }, m.title), React.createElement("p", {
    className: "text-xs text-white/80 leading-relaxed font-light"
  }, m.desc))))), React.createElement("div", {
    className: "space-y-4 pt-2"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("h3", {
    className: "text-base font-bold text-[#171717] tracking-tight"
  }, discoverSearch ? `Results for "${discoverSearch}"` : "Community Discovered Bites"), React.createElement("span", {
    className: "text-xs text-[#8A817B]"
  }, filtered.length, " bites")), filtered.length === 0 ? React.createElement(EmptyState, {
    title: "No dishes found",
    message: "Try searching for another crave or clear your filter.",
    actionLabel: "Reset Search",
    onAction: () => {
      setDiscoverSearch("");
      setSelectedTag("all");
    }
  }) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
  }, filtered.map(dish => React.createElement("div", {
    key: dish.id,
    onClick: () => onViewStory(dish),
    className: "rounded-2xl overflow-hidden bg-white border border-[#F0ECE4] shadow-xs hover:shadow-md hover:border-[#FFB38F] transition-all cursor-pointer group text-left"
  }, React.createElement("div", {
    className: "relative aspect-square bg-[#FFF0E8] overflow-hidden"
  }, React.createElement("img", {
    src: dish.mediaUrl,
    alt: dish.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
  }), React.createElement("span", {
    className: "absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold"
  }, "\u23F3 ", formatHoursLeft(dish.expiresAt))), React.createElement("div", {
    className: "p-3 space-y-1"
  }, React.createElement("h4", {
    className: "text-xs font-bold text-[#171717] truncate leading-tight"
  }, decodeUnicode(dish.caption) || "Daily Dish"), React.createElement("div", {
    className: "flex items-center justify-between text-[10px] text-[#8A817B]"
  }, React.createElement("span", null, "@", dish.username), React.createElement("span", null, "\u2764\uFE0F ", dish.likeCount || 0))))))));
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
  likes
}) {
  const [activeProfileTab, setActiveProfileTab] = useState("bites");
  const user = userProfile && userProfile.user || currentUser || {};
  const streak = user.streak || 0;
  const currentUid = user.id || user.uid;
  const userStories = (stories || []).filter(s => s.userId === currentUid);
  const savedStories = (stories || []).filter(s => savedPosts && savedPosts[s.id]);
  const likedStories = (stories || []).filter(s => likes && likes[s.id]);
  return React.createElement("div", {
    className: "max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6 text-left animate-fade-in"
  }, React.createElement("div", {
    className: "p-6 sm:p-8 rounded-3xl bg-white border border-[#F0ECE4] shadow-xs flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6"
  }, React.createElement("div", {
    className: "relative"
  }, React.createElement("div", {
    className: "w-22 h-22 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF5A2A] via-[#FF8A65] to-[#FFB38F] shadow-md"
  }, React.createElement("img", {
    src: user.avatar || user.avatarUrl || "/uploads/avatars/sachin.svg",
    alt: user.username || "Profile",
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-full h-full rounded-full object-cover border-2 border-white"
  })), React.createElement("span", {
    className: "absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#171717] text-white text-[10px] font-bold border border-white"
  }, "\uD83D\uDD25 ", streak, "d")), React.createElement("div", {
    className: "space-y-3 text-center sm:text-left flex-1"
  }, React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-xl font-black text-[#171717] tracking-tight font-heading leading-tight"
  }, user.name || user.username || "Chef", "'s Food Diary"), React.createElement("span", {
    className: "text-xs text-[#8A817B] font-mono block pt-0.5"
  }, "@", user.username || "chef")), React.createElement("button", {
    type: "button",
    onClick: onLogout,
    className: "px-3.5 py-1.5 rounded-xl border border-[#F0ECE4] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold text-[#8A817B] transition-colors cursor-pointer"
  }, "Sign Out")), React.createElement("p", {
    className: "text-xs text-[#8A817B] leading-relaxed max-w-md"
  }, "Passionate food lover, home cook & street explorer. Sharing daily culinary experiments and neighborhood cravings."), React.createElement("div", {
    className: "flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1"
  }, React.createElement("span", {
    className: "px-2.5 py-1 rounded-full bg-[#FFF0E8] text-[#FF5A2A] text-[10px] font-bold"
  }, "\uD83C\uDF36\uFE0F Spice Lover"), React.createElement("span", {
    className: "px-2.5 py-1 rounded-full bg-[#FFF0E8] text-[#FF5A2A] text-[10px] font-bold"
  }, "\uD83C\uDF55 Pizza Connoisseur"), React.createElement("span", {
    className: "px-2.5 py-1 rounded-full bg-[#FFF0E8] text-[#FF5A2A] text-[10px] font-bold"
  }, "\u2615 Specialty Coffee")), React.createElement("div", {
    className: "flex items-center justify-center sm:justify-start space-x-6 pt-2 border-t border-[#F7F3EC]"
  }, React.createElement("div", {
    className: "flex items-center space-x-1.5 text-xs"
  }, React.createElement("span", {
    className: "font-extrabold text-[#171717]"
  }, userStories.length), React.createElement("span", {
    className: "text-[#8A817B]"
  }, "Active Bites")), React.createElement("div", {
    className: "flex items-center space-x-1.5 text-xs"
  }, React.createElement("span", {
    className: "font-extrabold text-[#171717]"
  }, userProfile && userProfile.followersCount || 0), React.createElement("span", {
    className: "text-[#8A817B]"
  }, "Followers")), React.createElement("div", {
    className: "flex items-center space-x-1.5 text-xs"
  }, React.createElement("span", {
    className: "font-extrabold text-[#171717]"
  }, userProfile && userProfile.followingCount || 0), React.createElement("span", {
    className: "text-[#8A817B]"
  }, "Following"))), (user.role === "admin" || user.username === "sachin" || user.id === "usr-1") && React.createElement("div", {
    className: "pt-2"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: "w-full py-2.5 px-4 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "Manage Maintenance & Visitor Popup"), announcement && announcement.enabled && React.createElement("span", {
    className: "px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold uppercase tracking-wide"
  }, "Live Active"))))), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "flex items-center border-b border-[#F0ECE4] space-x-4"
  }, React.createElement("button", {
    type: "button",
    onClick: () => setActiveProfileTab("bites"),
    className: `pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${activeProfileTab === "bites" ? "border-[#FF5A2A] text-[#FF5A2A]" : "border-transparent text-[#8A817B] hover:text-[#171717]"}`
  }, React.createElement("span", null, "\uD83C\uDF72"), React.createElement("span", null, "Bites (", userStories.length, ")")), React.createElement("button", {
    type: "button",
    onClick: () => setActiveProfileTab("saved"),
    className: `pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${activeProfileTab === "saved" ? "border-[#FF5A2A] text-[#FF5A2A]" : "border-transparent text-[#8A817B] hover:text-[#171717]"}`
  }, React.createElement("span", null, "\uD83D\uDD16"), React.createElement("span", null, "Saved (", savedStories.length, ")")), React.createElement("button", {
    type: "button",
    onClick: () => setActiveProfileTab("liked"),
    className: `pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${activeProfileTab === "liked" ? "border-[#FF5A2A] text-[#FF5A2A]" : "border-transparent text-[#8A817B] hover:text-[#171717]"}`
  }, React.createElement("span", null, "\u2764\uFE0F"), React.createElement("span", null, "Liked (", likedStories.length, ")"))), activeProfileTab === "bites" && (userStories.length === 0 ? React.createElement(EmptyState, {
    title: "No active stories",
    message: "You haven't posted any food stories today. Share what you're cooking or eating!",
    actionLabel: "+ New Bite",
    onAction: onTriggerUpload
  }) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-3"
  }, userStories.map(story => React.createElement("div", {
    key: story.id,
    className: "relative rounded-2xl overflow-hidden bg-black aspect-square shadow-xs group cursor-pointer"
  }, React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 text-white text-xs font-medium"
  }, React.createElement("span", {
    className: "truncate"
  }, decodeUnicode(story.caption))), React.createElement("span", {
    className: "absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold"
  }, "\u23F3 ", formatHoursLeft(story.expiresAt)))))), activeProfileTab === "saved" && (savedStories.length === 0 ? React.createElement(EmptyState, {
    title: "No saved bites yet",
    message: "Tap the bookmark icon \uD83D\uDD16 on any food card to curate your personal collection of cravings."
  }) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-3"
  }, savedStories.map(story => React.createElement("div", {
    key: story.id,
    className: "relative rounded-2xl overflow-hidden bg-black aspect-square shadow-xs group cursor-pointer"
  }, React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 text-white text-xs font-medium"
  }, React.createElement("span", {
    className: "truncate"
  }, decodeUnicode(story.caption))))))), activeProfileTab === "liked" && (likedStories.length === 0 ? React.createElement(EmptyState, {
    title: "No liked bites yet",
    message: "Tap the heart icon \u2764\uFE0F on dishes you crave to revisit them anytime."
  }) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-3"
  }, likedStories.map(story => React.createElement("div", {
    key: story.id,
    className: "relative rounded-2xl overflow-hidden bg-black aspect-square shadow-xs group cursor-pointer"
  }, React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 text-white text-xs font-medium"
  }, React.createElement("span", {
    className: "truncate"
  }, decodeUnicode(story.caption)))))))));
}
function ActivityView({
  currentUser,
  userProfile,
  notifications,
  onRefreshNotifs
}) {
  const [filterType, setFilterType] = useState("all");
  const filteredNotifs = useMemo(() => {
    if (!notifications) return [];
    if (filterType === "likes") {
      return notifications.filter(n => (n.message || "").toLowerCase().includes("like"));
    }
    if (filterType === "comments") {
      return notifications.filter(n => (n.message || "").toLowerCase().includes("comment"));
    }
    if (filterType === "follows") {
      return notifications.filter(n => (n.message || "").toLowerCase().includes("follow"));
    }
    return notifications;
  }, [notifications, filterType]);
  return React.createElement("div", {
    className: "max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-5 text-left animate-fade-in"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-xl font-black text-[#171717] tracking-tight font-heading"
  }, "Activity & Alerts"), React.createElement("p", {
    className: "text-xs text-[#8A817B]"
  }, "Real-time interactions on your daily food stories")), React.createElement("button", {
    type: "button",
    onClick: onRefreshNotifs,
    className: "text-xs text-[#FF5A2A] font-bold hover:underline cursor-pointer"
  }, "Refresh")), React.createElement("div", {
    className: "flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1"
  }, [{
    id: "all",
    label: "All Alerts"
  }, {
    id: "likes",
    label: "❤️ Likes"
  }, {
    id: "comments",
    label: "💬 Comments"
  }, {
    id: "follows",
    label: "👤 Follows"
  }].map(f => React.createElement("button", {
    key: f.id,
    type: "button",
    onClick: () => setFilterType(f.id),
    className: `px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${filterType === f.id ? "bg-[#171717] text-white shadow-xs" : "bg-white text-[#8A817B] border border-[#F0ECE4] hover:border-[#FFB38F]"}`
  }, f.label))), filteredNotifs.length === 0 ? React.createElement("div", {
    className: "p-10 rounded-3xl bg-white border border-[#F0ECE4] text-center space-y-2"
  }, React.createElement("span", {
    className: "text-3xl block"
  }, "\uD83D\uDD14"), React.createElement("h4", {
    className: "text-sm font-bold text-[#171717]"
  }, "No alerts yet"), React.createElement("p", {
    className: "text-xs text-[#8A817B] max-w-xs mx-auto"
  }, "When other food lovers like, comment, or follow your culinary creations, you will see alerts here.")) : React.createElement("div", {
    className: "space-y-2.5"
  }, filteredNotifs.map(n => React.createElement("div", {
    key: n.id,
    className: "p-4 rounded-2xl bg-white border border-[#F0ECE4] flex items-center space-x-3.5 shadow-xs hover:border-[#FFB38F] transition-all text-left"
  }, React.createElement("img", {
    src: n.senderAvatar || "/uploads/avatars/sachin.svg",
    alt: n.senderName,
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-10 h-10 rounded-full object-cover border border-[#F0ECE4] flex-shrink-0"
  }), React.createElement("div", {
    className: "flex-1 min-w-0"
  }, React.createElement("p", {
    className: "text-xs text-[#171717] leading-relaxed"
  }, React.createElement("strong", {
    className: "font-bold mr-1"
  }, n.senderName), n.message), React.createElement("span", {
    className: "text-[10px] text-[#8A817B] block pt-0.5"
  }, formatTimeAgo(n.createdAt)))))));
}
function ShareFoodModal({
  isOpen,
  onClose,
  currentUser,
  onStoryUploaded,
  showToast
}) {
  if (!isOpen) return null;
  const [dishTitle, setDishTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("street");
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
      if (showToast) showToast("Please select a photo of your food", "error");
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
        if (showToast) showToast("Your Food Bite is live for 24 hours! 🔥", "success");
        onStoryUploaded && onStoryUploaded();
        onClose();
      } else {
        if (showToast) showToast(resData && resData.error || "Failed to share food bite", "error");
      }
    } catch (err) {
      if (showToast) showToast("Network error uploading bite", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-lg bg-white rounded-3xl border border-[#F0ECE4] shadow-2xl overflow-hidden animate-pop-in text-left max-h-[90vh] flex flex-col",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 border-b border-[#F0ECE4] flex items-center justify-between bg-white"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83C\uDF72"), React.createElement("h3", {
    className: "text-base font-bold text-[#171717] font-heading"
  }, "Share a Bite")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1.5 rounded-xl text-[#8A817B] hover:text-[#171717] hover:bg-[#FFF0E8] transition-colors cursor-pointer text-xs font-bold"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSubmit,
    className: "p-6 space-y-4 overflow-y-auto flex-1 text-left"
  }, React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#171717] block"
  }, "Food Photo"), React.createElement("div", {
    onClick: () => fileInputRef.current && fileInputRef.current.click(),
    className: "relative w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-[#F0ECE4] hover:border-[#FF5A2A] bg-[#FFF9F5] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group"
  }, imagePreview ? React.createElement(React.Fragment, null, React.createElement("img", {
    src: imagePreview,
    alt: "Preview",
    className: "w-full h-full object-cover"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
  }, "Tap to Change Photo")) : React.createElement("div", {
    className: "text-center p-4 space-y-2"
  }, React.createElement("span", {
    className: "text-4xl block"
  }, "\uD83D\uDCF8"), React.createElement("div", {
    className: "text-xs font-bold text-[#171717]"
  }, "Tap to upload food photo"), React.createElement("p", {
    className: "text-[10px] text-[#8A817B]"
  }, "JPEG, PNG, WEBP \u2022 Automatically compressed")), React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif",
    capture: "environment",
    onChange: handleFileSelect,
    className: "hidden"
  }))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#171717] block"
  }, "What are you eating?"), React.createElement("input", {
    type: "text",
    required: true,
    value: dishTitle,
    onChange: e => setDishTitle(e.target.value),
    placeholder: "e.g., Truffle Mushroom Pizza, Street Tacos...",
    className: "w-full px-4 py-2.5 rounded-xl bg-[#FFF9F5] border border-[#F0ECE4] text-xs font-semibold text-[#171717] placeholder:text-[#8A817B] focus:outline-none focus:border-[#FF5A2A] focus:bg-white transition-all"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#171717] block"
  }, "Review or Craving Caption"), React.createElement("textarea", {
    rows: 3,
    value: caption,
    onChange: e => setCaption(e.target.value),
    placeholder: "Tell other foodies why you loved it, flavors, secret ingredients...",
    className: "w-full px-4 py-2.5 rounded-xl bg-[#FFF9F5] border border-[#F0ECE4] text-xs text-[#171717] placeholder:text-[#8A817B] focus:outline-none focus:border-[#FF5A2A] focus:bg-white transition-all resize-none"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#171717] block"
  }, "Category"), React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, CATEGORIES.filter(c => c.id !== "all" && c.id !== "trending").map(cat => React.createElement("button", {
    key: cat.id,
    type: "button",
    onClick: () => setCategory(cat.id),
    className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${category === cat.id ? "bg-[#FF5A2A] text-white shadow-xs" : "bg-[#FFF9F5] text-[#8A817B] border border-[#F0ECE4] hover:border-[#FFB38F]"}`
  }, React.createElement("span", null, cat.icon), React.createElement("span", null, cat.label))))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#171717] block"
  }, "Location or Restaurant (Optional)"), React.createElement("input", {
    type: "text",
    value: locationTag,
    onChange: e => setLocationTag(e.target.value),
    placeholder: "e.g., Bandra West, Mumbai or Homemade",
    className: "w-full px-4 py-2.5 rounded-xl bg-[#FFF9F5] border border-[#F0ECE4] text-xs text-[#171717] placeholder:text-[#8A817B] focus:outline-none focus:border-[#FF5A2A] focus:bg-white transition-all"
  })), React.createElement("div", {
    className: "pt-2"
  }, React.createElement("button", {
    type: "submit",
    disabled: isSubmitting || !imagePreview,
    className: "w-full py-3.5 rounded-2xl bg-[#FF5A2A] hover:bg-[#E6471A] disabled:opacity-40 text-white text-xs font-bold tracking-wide shadow-lg shadow-[#FF5A2A]/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
  }, isSubmitting ? React.createElement("span", null, "Publishing your Bite...") : React.createElement(React.Fragment, null, React.createElement("span", null, "\uD83D\uDD25 Share Bite (Live for 24h)")))))));
}
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
    className: "fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "relative w-full max-w-sm rounded-3xl overflow-hidden bg-black aspect-[9/16] shadow-2xl flex flex-col justify-between",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "relative z-20 p-4 space-y-2 bg-gradient-to-b from-black/80 to-transparent"
  }, React.createElement("div", {
    className: "w-full h-1 bg-white/30 rounded-full overflow-hidden"
  }, React.createElement("div", {
    className: "w-full h-full bg-[#FF5A2A] rounded-full animate-pulse"
  })), React.createElement("div", {
    className: "flex items-center justify-between text-white"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("img", {
    src: story.userAvatar || "/uploads/avatars/" + (story.username || "sachin") + ".svg",
    alt: story.username,
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-8 h-8 rounded-full object-cover border border-white"
  }), React.createElement("div", null, React.createElement("h4", {
    className: "text-xs font-bold leading-tight"
  }, "@", story.username), React.createElement("span", {
    className: "text-[10px] text-white/70"
  }, formatTimeAgo(story.createdAt)))), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-white/80 hover:text-white text-base font-bold p-1 cursor-pointer"
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
    className: "w-full h-full object-cover object-top"
  })), React.createElement("div", {
    className: "relative z-20 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white space-y-2 text-left"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "px-2 py-0.5 rounded-full bg-[#FF5A2A] text-white text-[9px] font-bold uppercase"
  }, story.category || "Food"), React.createElement("span", {
    className: "text-[10px] text-white/80"
  }, "\u23F3 ", formatHoursLeft(story.expiresAt))), React.createElement("p", {
    className: "text-xs leading-relaxed font-medium"
  }, decodeUnicode(story.caption)))));
}
function InstallAppModal({
  isOpen,
  onClose
}) {
  if (!isOpen) return null;
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-white rounded-3xl border border-[#F0ECE4] shadow-2xl p-6 text-center space-y-4 animate-pop-in",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5A2A] to-[#FFB38F] text-white flex items-center justify-center text-3xl mx-auto shadow-md"
  }, "\uD83D\uDCF1"), React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("h3", {
    className: "text-base font-bold text-[#171717] font-heading"
  }, "Install FoodBite App"), React.createElement("p", {
    className: "text-xs text-[#8A817B]"
  }, "Add FoodBite directly to your phone or desktop home screen for instant camera access and fast browsing.")), React.createElement("div", {
    className: "p-3 bg-[#FFF9F5] rounded-2xl border border-[#F0ECE4] text-xs text-[#171717] text-left space-y-1.5"
  }, React.createElement("div", {
    className: "font-bold text-[#FF5A2A]"
  }, "How to install:"), React.createElement("div", null, "\u2022 ", React.createElement("strong", null, "Chrome / Android:"), " Tap menu \u22EE and select \"Install App\""), React.createElement("div", null, "\u2022 ", React.createElement("strong", null, "Safari / iOS:"), " Tap Share \u238B and select \"Add to Home Screen\"")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-full py-3 rounded-2xl bg-[#171717] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
  }, "Got It")));
}
function AnnouncementModal({
  announcement,
  isOpen,
  onClose
}) {
  if (!isOpen || !announcement || !announcement.enabled) return null;
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-md bg-white rounded-3xl border border-amber-200 shadow-2xl overflow-hidden animate-pop-in text-left",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCE2"), React.createElement("h3", {
    className: "text-sm font-bold"
  }, announcement.title || "Community Announcement")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-white/80 hover:text-white text-xs font-bold cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "p-6 space-y-4"
  }, React.createElement("p", {
    className: "text-xs text-[#171717] leading-relaxed whitespace-pre-line"
  }, announcement.message || "Welcome to FoodBite!"), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-full py-3 rounded-2xl bg-[#FF5A2A] hover:bg-[#E6471A] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#FF5A2A]/20"
  }, "I Understand & Continue"))));
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
        if (showToast) showToast("Announcement settings updated! 📢", "success");
        onSaveAnnouncement && onSaveAnnouncement(data.announcement || {
          enabled,
          title,
          message
        });
        onClose();
      } else {
        if (showToast) showToast("Failed to save announcement", "error");
      }
    } catch (err) {
      if (showToast) showToast("Connection error saving announcement", "error");
    } finally {
      setIsSaving(false);
    }
  };
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-lg bg-white rounded-3xl border border-[#F0ECE4] shadow-2xl overflow-hidden animate-pop-in text-left max-h-[90vh] flex flex-col",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 border-b border-[#F0ECE4] flex items-center justify-between bg-white"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCE2"), React.createElement("h3", {
    className: "text-sm font-bold text-[#171717]"
  }, "Admin Broadcast Manager")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1 rounded-lg text-[#8A817B] hover:text-[#171717] cursor-pointer text-xs font-bold"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSave,
    className: "p-6 space-y-4 overflow-y-auto flex-1"
  }, React.createElement("div", {
    className: "flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0ECE4]"
  }, React.createElement("div", null, React.createElement("h4", {
    className: "text-xs font-bold text-[#171717]"
  }, "Enable Visitor Popup"), React.createElement("p", {
    className: "text-[10px] text-[#8A817B]"
  }, "Show this notice when visitors open FoodBite")), React.createElement("label", {
    className: "relative inline-flex items-center cursor-pointer"
  }, React.createElement("input", {
    type: "checkbox",
    checked: enabled,
    onChange: e => setEnabled(e.target.checked),
    className: "sr-only peer"
  }), React.createElement("div", {
    className: "w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5A2A]"
  }))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#171717] block"
  }, "Popup Title"), React.createElement("input", {
    type: "text",
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "e.g., System Maintenance Notice",
    className: "w-full px-4 py-2.5 rounded-xl bg-[#FFF9F5] border border-[#F0ECE4] text-xs text-[#171717] focus:outline-none focus:border-[#FF5A2A] focus:bg-white"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-xs font-bold text-[#171717] block"
  }, "Popup Message"), React.createElement("textarea", {
    rows: 4,
    value: message,
    onChange: e => setMessage(e.target.value),
    placeholder: "Enter message for users...",
    className: "w-full px-4 py-2.5 rounded-xl bg-[#FFF9F5] border border-[#F0ECE4] text-xs text-[#171717] focus:outline-none focus:border-[#FF5A2A] focus:bg-white resize-none"
  })), React.createElement("div", {
    className: "pt-2"
  }, React.createElement("button", {
    type: "submit",
    disabled: isSaving,
    className: "w-full py-3 rounded-2xl bg-[#FF5A2A] hover:bg-[#E6471A] text-white text-xs font-bold shadow-md shadow-[#FF5A2A]/25 cursor-pointer"
  }, isSaving ? "Saving..." : "Save Broadcast Settings")))));
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
    const uavatar = currentUser.avatar || currentUser.avatarUrl || "/uploads/avatars/sachin.svg";
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
      className: "min-h-screen w-full bg-[#FFF9F5] text-[#171717]"
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
    className: "min-h-screen w-full flex flex-col bg-[#FFF9F5] text-[#171717] antialiased"
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
  }, React.createElement(PersonalizedFeedHeader, {
    currentUser: currentUser,
    searchQuery: searchQuery,
    setSearchQuery: setSearchQuery,
    activeCategory: activeCategory,
    setActiveCategory: setActiveCategory
  }), React.createElement(StoriesTray, {
    stories: stories,
    currentUser: currentUser,
    onTriggerUpload: () => setStoryModalOpen(true),
    onViewStory: s => setViewingStory(s)
  }), React.createElement("div", {
    id: "food-feed-section",
    className: "max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-16 space-y-6"
  }, React.createElement(ForYouShelf, {
    stories: stories,
    onViewStory: s => setViewingStory(s),
    onLike: toggleLike,
    likes: likes
  }), React.createElement(TrendingNowShelf, {
    stories: stories,
    onViewStory: s => setViewingStory(s)
  }), React.createElement(PopularNearYouShelf, null), React.createElement("div", {
    className: "pt-2 text-left space-y-1"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("h2", {
    className: "text-base sm:text-lg font-bold text-[#171717] tracking-tight font-heading"
  }, searchQuery ? `Dishes matching "${searchQuery}"` : activeCategory !== "all" ? `${activeCategory.toUpperCase()} Bites` : "Community Discovery Feed"), React.createElement("span", {
    className: "text-xs text-[#8A817B]"
  }, filteredStories.length, " bites")), React.createElement("p", {
    className: "text-xs text-[#8A817B]"
  }, "Real homemade dishes and street cravings shared by foodies in the last 24 hours.")), feedError && React.createElement(ErrorState, {
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
  }))))), activeTab === "discover" && React.createElement(DiscoverView, {
    stories: stories,
    onViewStory: s => setViewingStory(s),
    onTriggerUpload: () => setStoryModalOpen(true),
    onToggleFollow: handleToggleFollow,
    followingList: followingList,
    currentUser: currentUser
  }), activeTab === "activity" && React.createElement(ActivityView, {
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
    announcement: announcement,
    savedPosts: savedPosts,
    likes: likes
  })), React.createElement(FloatingCreateButton, {
    onTriggerUpload: () => setStoryModalOpen(true)
  }), React.createElement("footer", {
    className: "w-full py-6 text-center border-t border-[#F0ECE4] bg-white text-xs text-[#8A817B] mt-auto hidden md:block"
  }, React.createElement("p", null, "\xA9 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari.")), React.createElement(MobileBottomNav, {
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
    story: viewingStory,
    onClose: () => setViewingStory(null)
  }), React.createElement(InstallAppModal, {
    isOpen: showInstallModal,
    onClose: () => setShowInstallModal(false)
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

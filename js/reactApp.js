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
  if (remainingMs <= 0) return "EXPIRING";
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const mins = Math.floor(remainingMs % (1000 * 60 * 60) / (1000 * 60));
  return hours + "H " + mins + "M LEFT";
}
function formatTimeAgo(timestamp) {
  const diffMs = Date.now() - Number(timestamp);
  if (diffMs < 60000) return "JUST NOW";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins + "M AGO";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "H AGO";
  const days = Math.floor(hours / 24);
  return days + "D AGO";
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
  number: "01",
  label: "ALL BITES",
  icon: "✨"
}, {
  id: "trending",
  number: "02",
  label: "TRENDING",
  icon: "🔥"
}, {
  id: "pizza",
  number: "03",
  label: "PIZZA & PASTA",
  icon: "🍕"
}, {
  id: "street",
  number: "04",
  label: "STREET FOOD",
  icon: "🌮"
}, {
  id: "asian",
  number: "05",
  label: "ASIAN & NOODLES",
  icon: "🍜"
}, {
  id: "burgers",
  number: "06",
  label: "BURGERS",
  icon: "🍔"
}, {
  id: "healthy",
  number: "07",
  label: "HEALTHY BOWLS",
  icon: "🥗"
}, {
  id: "desserts",
  number: "08",
  label: "DESSERTS",
  icon: "🍰"
}, {
  id: "drinks",
  number: "09",
  label: "COFFEE & DRINKS",
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
    className: `pointer-events-auto flex items-center justify-between p-3.5 border text-xs font-mono tracking-wider uppercase animate-pop-in ${toast.type === "success" ? "bg-[#181714] text-[#F7F4ED] border-[#FF5428]" : toast.type === "error" ? "bg-[#2A100C] text-[#FFB38F] border-[#C94325]" : "bg-[#181714] text-[#F2EBDD] border-[#262420]"}`
  }, React.createElement("span", {
    className: "flex-1 mr-2"
  }, toast.message), React.createElement("button", {
    type: "button",
    onClick: () => removeToast(toast.id),
    className: "text-[#85817A] hover:text-[#F7F4ED] transition-colors cursor-pointer text-sm font-bold font-mono"
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
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-editorial animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-[#181714] border border-[#262420] shadow-2xl overflow-hidden animate-pop-in text-left",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-5 py-4 border-b border-[#262420] flex items-center justify-between bg-[#11110F]"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-xs text-[#FF5428] font-mono"
  }, "01 / LIKES"), React.createElement("h3", {
    className: "text-sm font-bold text-[#F7F4ED] font-grotesk uppercase tracking-wider"
  }, "CRAVED BY (", (likes || []).length, ")")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1 text-[#85817A] hover:text-[#F7F4ED] transition-colors cursor-pointer text-xs font-mono font-bold"
  }, "\u2715")), React.createElement("div", {
    className: "max-h-72 overflow-y-auto divide-y divide-[#262420] p-1"
  }, !likes || likes.length === 0 ? React.createElement("div", {
    className: "py-8 text-center text-xs font-mono text-[#85817A] uppercase tracking-wider"
  }, "NO CRAVES RECORDED YET.") : likes.map((u, idx) => {
    const uId = u.userId || "usr-" + idx;
    const uName = u.username || "foodie";
    const isSelf = currentUid && uId === currentUid || currentUname && uName.toLowerCase() === currentUname;
    const isFollowed = (followingList || []).includes(uId);
    return React.createElement("div", {
      key: idx,
      className: "flex items-center justify-between px-4 py-2.5 hover:bg-[#11110F] transition-colors"
    }, React.createElement("div", {
      className: "flex items-center space-x-3 min-w-0"
    }, React.createElement("img", {
      src: u.userAvatar || "/uploads/avatars/" + uName + ".svg",
      alt: uName,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      className: "w-8 h-8 object-cover border border-[#262420] flex-shrink-0"
    }), React.createElement("div", {
      className: "min-w-0"
    }, React.createElement("div", {
      className: "text-xs font-bold text-[#F7F4ED] font-grotesk truncate leading-tight"
    }, "@", uName), React.createElement("div", {
      className: "text-[10px] text-[#85817A] font-mono tracking-wider uppercase"
    }, u.likedAt ? formatTimeAgo(u.likedAt) : "RECENTLY"))), !isSelf && onToggleFollow && React.createElement("button", {
      type: "button",
      onClick: () => onToggleFollow(uId, uName),
      className: `text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 transition-all cursor-pointer flex-shrink-0 border ${isFollowed ? "border-[#262420] text-[#85817A] hover:border-[#FF5428]" : "border-[#FF5428] bg-[#FF5428] text-white hover:bg-[#C94325]"}`
    }, isFollowed ? "FOLLOWING" : "+ FOLLOW"));
  }))));
}
function FoodCardSkeleton() {
  return React.createElement("div", {
    className: "editorial-card p-5 space-y-4 text-left animate-pulse bg-[#181714]"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, React.createElement("div", {
    className: "w-8 h-8 bg-[#262420]"
  }), React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("div", {
    className: "w-24 h-3 bg-[#262420]"
  }), React.createElement("div", {
    className: "w-14 h-2 bg-[#262420]"
  }))), React.createElement("div", {
    className: "w-16 h-4 bg-[#262420]"
  })), React.createElement("div", {
    className: "w-full aspect-[4/3] bg-[#262420]"
  }), React.createElement("div", {
    className: "space-y-2"
  }, React.createElement("div", {
    className: "w-16 h-3 bg-[#262420]"
  }), React.createElement("div", {
    className: "w-3/4 h-5 bg-[#262420]"
  }), React.createElement("div", {
    className: "w-full h-3 bg-[#262420]"
  })), React.createElement("div", {
    className: "pt-2 border-t border-[#262420] flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-4"
  }, React.createElement("div", {
    className: "w-10 h-4 bg-[#262420]"
  }), React.createElement("div", {
    className: "w-10 h-4 bg-[#262420]"
  })), React.createElement("div", {
    className: "w-6 h-4 bg-[#262420]"
  })));
}
function EmptyState({
  title,
  message,
  actionLabel,
  onAction
}) {
  return React.createElement("div", {
    className: "w-full py-16 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-[#181714] border border-[#262420]"
  }, React.createElement("span", {
    className: "text-[10px] text-[#FF5428] font-mono uppercase tracking-widest"
  }, "00 / EMPTY ARCHIVE"), React.createElement("h3", {
    className: "text-xl sm:text-2xl font-black text-[#F7F4ED] font-display uppercase tracking-tight"
  }, title || "NO BITES DISCOVERED"), React.createElement("p", {
    className: "text-xs text-[#85817A] max-w-sm font-grotesk leading-relaxed"
  }, message || "Be the first home chef or street explorer to publish something craveable."), actionLabel && React.createElement("button", {
    type: "button",
    onClick: onAction,
    className: "mt-2 btn-editorial-primary px-5 py-2.5 text-xs cursor-pointer"
  }, actionLabel));
}
function ErrorState({
  message,
  onRetry
}) {
  return React.createElement("div", {
    className: "w-full py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-[#181714] border border-[#C94325]"
  }, React.createElement("span", {
    className: "text-[10px] text-[#FF5428] font-mono uppercase tracking-widest"
  }, "ERR / TRANSMISSION FAILURE"), React.createElement("h3", {
    className: "text-base font-bold text-[#F7F4ED] font-display uppercase"
  }, "FEED TRANSMISSION INTERRUPTED"), React.createElement("p", {
    className: "text-xs text-[#85817A] max-w-xs font-mono"
  }, message || "Connection issue. Please retry."), onRetry && React.createElement("button", {
    type: "button",
    onClick: onRetry,
    className: "btn-editorial-ghost px-4 py-2 text-xs cursor-pointer"
  }, "RETRY TRANSMISSION"));
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
      setErrorMessage("ENTER A VALID IDENTIFIER (MIN 2 CHARACTERS)");
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
        setErrorMessage(data && data.message ? data.message : "COULD NOT AUTHENTICATE");
      }
    } catch (err) {
      setErrorMessage("NETWORK TRANSMISSION ERROR");
    } finally {
      setIsLoading(false);
    }
  };
  return React.createElement("div", {
    className: "min-h-screen flex items-center justify-center p-4 bg-[#11110F] text-[#F2EBDD]"
  }, React.createElement("div", {
    className: "w-full max-w-md bg-[#181714] border border-[#262420] p-8 sm:p-10 shadow-2xl space-y-6 text-left animate-pop-in"
  }, React.createElement("div", {
    className: "space-y-2"
  }, React.createElement("div", {
    className: "inline-flex items-center space-x-2 text-[10px] text-[#FF5428] font-mono uppercase tracking-widest"
  }, React.createElement("span", null, "01 / ACCESS PLATFORM")), React.createElement("h2", {
    className: "text-4xl sm:text-5xl font-black text-[#F7F4ED] tracking-tighter uppercase font-display leading-none"
  }, "FOODBITE\xAE"), React.createElement("p", {
    className: "text-[11px] uppercase tracking-widest text-[#85817A] font-mono"
  }, "DISCOVER. SHARE. CRAVE."), React.createElement("p", {
    className: "text-xs text-[#85817A] leading-relaxed pt-2 font-grotesk"
  }, "Enter your handle to access the daily food culture publication and broadcast your daily culinary creations.")), errorMessage && React.createElement("div", {
    className: "p-3 border border-[#C94325] bg-[#2A100C] text-[#FFB38F] text-xs font-mono tracking-wider uppercase"
  }, errorMessage), React.createElement("form", {
    onSubmit: handleContinue,
    className: "space-y-5"
  }, React.createElement("div", {
    className: "space-y-2 text-left"
  }, React.createElement("label", {
    className: "text-[10px] uppercase font-mono tracking-widest text-[#85817A] block"
  }, "USER IDENTIFIER"), React.createElement("div", {
    className: "relative"
  }, React.createElement("span", {
    className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#FF5428] font-mono"
  }, "@"), React.createElement("input", {
    type: "text",
    autoFocus: true,
    required: true,
    value: username,
    onChange: e => setUsername(e.target.value),
    placeholder: "chef_sachin",
    maxLength: 30,
    className: "w-full pl-8 pr-4 py-3 bg-[#11110F] border border-[#262420] text-sm font-mono text-[#F7F4ED] placeholder:text-[#85817A]/60 focus:outline-none focus:border-[#FF5428] transition-all"
  })), React.createElement("p", {
    className: "text-[10px] text-[#85817A] font-mono"
  }, "INSTANT ACCESS \u2022 NO PASSWORD REQUIRED")), React.createElement("button", {
    type: "submit",
    disabled: isLoading || !cleanUsername,
    className: "w-full py-3.5 btn-editorial-primary text-xs font-bold tracking-wider cursor-pointer"
  }, isLoading ? "AUTHENTICATING..." : "ENTER PUBLICATION →")), React.createElement("div", {
    className: "pt-4 text-center border-t border-[#262420]"
  }, React.createElement("p", {
    className: "text-[10px] font-mono text-[#85817A] uppercase tracking-wider"
  }, "\xA9 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari."))));
}
function EditorialHeroSection({
  currentUser,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  onTriggerUpload,
  onScrollToFeed
}) {
  const displayName = currentUser ? currentUser.name || currentUser.username : "GUEST CURATOR";
  return React.createElement("section", {
    className: "w-full bg-[#11110F] border-b border-[#262420] pt-8 pb-10 px-4 sm:px-6 lg:px-8 text-left"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto space-y-8"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4 border-b border-[#262420] pb-3 text-[11px] font-mono text-[#85817A] uppercase tracking-widest"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("span", {
    className: "inline-block w-2 h-2 rounded-full bg-[#FF5428] animate-pulse"
  }), React.createElement("span", {
    className: "text-[#F2EBDD]"
  }, "EDITION 2026 / VOL. 26"), React.createElement("span", null, "\u2022"), React.createElement("span", null, "FOOD CULTURE & STREET GASTRONOMY")), React.createElement("div", {
    className: "flex items-center space-x-4"
  }, React.createElement("span", {
    className: "text-[#FF5428]"
  }, "CURATOR: @", displayName), React.createElement("span", null, "\u2022"), React.createElement("span", null, "STATUS: ARCHIVE LIVE"))), React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-end"
  }, React.createElement("div", {
    className: "lg:col-span-8 space-y-4"
  }, React.createElement("div", {
    className: "text-xs sm:text-sm font-mono text-[#FF5428] uppercase tracking-[0.25em]"
  }, "01 / THE DIGITAL FOOD PUBLICATION"), React.createElement("h1", {
    className: "text-6xl sm:text-8xl md:text-9xl font-black text-[#F7F4ED] uppercase font-heading leading-[0.88] tracking-tight"
  }, "DISCOVER.", React.createElement("br", null), "SHARE.", React.createElement("br", null), React.createElement("span", {
    className: "text-[#FF5428]"
  }, "CRAVE.")), React.createElement("p", {
    className: "text-sm sm:text-base text-[#85817A] max-w-2xl font-sans leading-relaxed pt-2"
  }, "A living photographic archive of street food culture, home-cooked revelations, and daily cravings. Documented by real food lovers in 24-hour transmissions.")), React.createElement("div", {
    className: "lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "w-full py-4 px-6 btn-editorial-primary text-xs font-mono font-bold tracking-widest uppercase cursor-pointer flex items-center justify-between"
  }, React.createElement("span", null, "+ DISPATCH A BITE"), React.createElement("span", null, "\u2192")), React.createElement("button", {
    type: "button",
    onClick: () => {
      const el = document.getElementById("food-feed-section");
      if (el) el.scrollIntoView({
        behavior: "smooth"
      });
    },
    className: "w-full py-4 px-6 btn-editorial-ghost text-xs font-mono font-bold tracking-widest uppercase cursor-pointer flex items-center justify-between"
  }, React.createElement("span", null, "EXPLORE ARCHIVE"), React.createElement("span", null, "\u2193")))), React.createElement("div", {
    className: "space-y-4 pt-2"
  }, React.createElement("div", {
    className: "relative w-full max-w-3xl"
  }, React.createElement("span", {
    className: "absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[#FF5428]"
  }, "[QUERY]"), React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    placeholder: "SEARCH DISHES, CREATORS, INGREDIENTS...",
    className: "w-full pl-24 pr-10 py-3.5 bg-[#181714] border border-[#262420] text-xs sm:text-sm font-mono text-[#F7F4ED] placeholder:text-[#85817A] focus:outline-none focus:border-[#FF5428] transition-all"
  }), searchQuery && React.createElement("button", {
    type: "button",
    onClick: () => setSearchQuery(""),
    className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#85817A] hover:text-[#F7F4ED] p-1 cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 pt-1"
  }, CATEGORIES.map(cat => {
    const isActive = activeCategory === cat.id;
    return React.createElement("button", {
      key: cat.id,
      type: "button",
      onClick: () => setActiveCategory(cat.id),
      className: `flex-shrink-0 px-3.5 py-2 text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${isActive ? "bg-[#FF5428] text-black font-bold border border-[#FF5428]" : "bg-[#181714] text-[#85817A] hover:text-[#F7F4ED] border border-[#262420] hover:border-[#3D3A34]"}`
    }, React.createElement("span", {
      className: isActive ? "text-black" : "text-[#FF5428]"
    }, cat.number), React.createElement("span", null, cat.label));
  })))));
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
  return React.createElement("section", {
    className: "w-full bg-[#181714] border-b border-[#262420] py-6 px-4 sm:px-6 lg:px-8 text-left"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto space-y-4"
  }, React.createElement("div", {
    className: "flex items-center justify-between border-b border-[#262420] pb-2"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#FF5428]"
  }, "02 /"), React.createElement("h2", {
    className: "text-sm font-mono text-[#F7F4ED] tracking-wider uppercase font-bold"
  }, "FOOD STORIES [24H EPHEMERAL]")), React.createElement("span", {
    className: "text-xs font-mono text-[#85817A]"
  }, stories ? stories.length : 0, " TRANSMISSIONS ACTIVE")), React.createElement("div", {
    className: "flex items-center space-x-4 overflow-x-auto scrollbar-none pb-2 pt-1"
  }, React.createElement("div", {
    onClick: onTriggerUpload,
    className: "flex-shrink-0 w-28 h-36 bg-[#11110F] border border-dashed border-[#FF5428] hover:border-[#F7F4ED] p-3 flex flex-col justify-between cursor-pointer group transition-all"
  }, React.createElement("div", {
    className: "w-8 h-8 rounded-full border border-[#FF5428] flex items-center justify-center text-xs font-mono text-[#FF5428] group-hover:bg-[#FF5428] group-hover:text-black transition-colors"
  }, "+"), React.createElement("div", null, React.createElement("div", {
    className: "text-[10px] font-mono text-[#FF5428] uppercase"
  }, "YOUR STORY"), React.createElement("div", {
    className: "text-xs font-mono font-bold text-[#F7F4ED] truncate"
  }, "SHARE BITE"))), uniqueUsers.map(story => {
    const isCurrentUser = story.userId === currentUid;
    return React.createElement("div", {
      key: story.userId,
      onClick: () => onViewStory(story),
      className: "flex-shrink-0 w-28 h-36 bg-[#11110F] border border-[#262420] hover:border-[#FF5428] relative overflow-hidden cursor-pointer group transition-all text-left"
    }, React.createElement("img", {
      src: story.mediaUrl,
      alt: story.caption,
      onError: e => {
        e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
      },
      className: "w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-90"
    }), React.createElement("div", {
      className: "absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-2.5 flex flex-col justify-between"
    }, React.createElement("div", {
      className: "flex items-center justify-between"
    }, React.createElement("img", {
      src: story.userAvatar || "/uploads/avatars/" + (story.username || "sachin") + ".svg",
      alt: story.username,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      className: "w-6 h-6 rounded-full border border-[#FF5428] object-cover"
    }), React.createElement("span", {
      className: "text-[9px] font-mono text-[#FF5428] bg-black/70 px-1 py-0.5"
    }, "24H")), React.createElement("div", null, React.createElement("span", {
      className: "text-[10px] font-mono text-[#85817A] block"
    }, formatHoursLeft(story.expiresAt)), React.createElement("span", {
      className: "text-xs font-mono font-bold text-[#F7F4ED] truncate block"
    }, "@", isCurrentUser ? "YOU" : story.username))));
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
  return React.createElement("section", {
    className: "w-full bg-[#181714] border border-[#262420] p-5 sm:p-6 text-left space-y-4"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-2 border-b border-[#262420] pb-3"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#FF5428]"
  }, "03 /"), React.createElement("h2", {
    className: "text-sm font-mono text-[#F7F4ED] tracking-wider uppercase font-bold"
  }, "CURATOR'S SELECTION [FOR YOU]")), React.createElement("span", {
    className: "text-[11px] font-mono text-[#85817A]"
  }, "ALGORITHMIC TASTE RECOGNITION")), React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-4"
  }, recommendations.map((post, idx) => React.createElement("div", {
    key: post.id,
    onClick: () => onViewStory(post),
    className: "bg-[#11110F] border border-[#262420] hover:border-[#FF5428] p-4 flex flex-col justify-between group cursor-pointer transition-all"
  }, React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "relative aspect-[16/10] overflow-hidden bg-black"
  }, React.createElement("img", {
    src: post.mediaUrl,
    alt: post.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  }), React.createElement("div", {
    className: "absolute top-2 left-2 px-2 py-0.5 bg-black/80 font-mono text-[9px] text-[#FF5428] border border-[#262420]"
  }, "#0", idx + 1, " PICK"), React.createElement("div", {
    className: "absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 font-mono text-[9px] text-[#85817A]"
  }, formatHoursLeft(post.expiresAt))), React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("div", {
    className: "text-[10px] font-mono text-[#FF5428] uppercase tracking-wider"
  }, post.category || "CULINARY ARCHIVE"), React.createElement("h4", {
    className: "text-sm font-bold text-[#F7F4ED] font-heading tracking-wide uppercase line-clamp-1"
  }, decodeUnicode(post.caption) || "FEATURED CREATION"))), React.createElement("div", {
    className: "pt-3 border-t border-[#262420] flex items-center justify-between text-xs font-mono"
  }, React.createElement("span", {
    className: "text-[#85817A]"
  }, "BY @", post.username), React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onLike(post.id);
    },
    className: "text-[#FF5428] hover:text-[#F7F4ED] transition-colors cursor-pointer"
  }, likes[post.id] ? "★ LIKED" : "☆ LIKE"))))));
}
function TrendingNowShelf({
  stories,
  onViewStory
}) {
  if (!stories || stories.length === 0) return null;
  const topBites = stories.slice(0, 5);
  const heroBite = topBites[0];
  const sideBites = topBites.slice(1, 5);
  return React.createElement("section", {
    className: "w-full bg-[#181714] border border-[#262420] p-5 sm:p-6 text-left space-y-4"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-2 border-b border-[#262420] pb-3"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#FF5428]"
  }, "04 /"), React.createElement("h2", {
    className: "text-sm font-mono text-[#F7F4ED] tracking-wider uppercase font-bold"
  }, "TRENDING NOW \u2014 WHAT EVERYONE'S EATING")), React.createElement("span", {
    className: "text-[11px] font-mono text-[#85817A]"
  }, "HIGH VELOCITY SOCIAL ENGAGEMENT")), React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-12 gap-5"
  }, heroBite && React.createElement("div", {
    onClick: () => onViewStory(heroBite),
    className: "lg:col-span-7 bg-[#11110F] border border-[#262420] hover:border-[#FF5428] p-5 flex flex-col justify-between group cursor-pointer transition-all"
  }, React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "relative aspect-[16/10] overflow-hidden bg-black"
  }, React.createElement("img", {
    src: heroBite.mediaUrl,
    alt: heroBite.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
  }), React.createElement("div", {
    className: "absolute top-3 left-3 px-2.5 py-1 bg-black/90 font-mono text-[10px] text-[#FF5428] border border-[#FF5428]"
  }, "\u2605 #01 TRENDING ARCHIVE"), React.createElement("div", {
    className: "absolute bottom-3 right-3 px-2 py-1 bg-black/80 font-mono text-[10px] text-[#85817A]"
  }, formatHoursLeft(heroBite.expiresAt))), React.createElement("div", {
    className: "space-y-2"
  }, React.createElement("div", {
    className: "text-[10px] font-mono text-[#FF5428] uppercase tracking-wider"
  }, "HOT TOPIC \u2022 ", heroBite.category || "STREET FOOD"), React.createElement("h3", {
    className: "text-2xl sm:text-3xl font-black text-[#F7F4ED] font-heading tracking-wide uppercase"
  }, decodeUnicode(heroBite.caption) || "FEATURED SIGNATURE DISH"))), React.createElement("div", {
    className: "pt-4 border-t border-[#262420] flex items-center justify-between text-xs font-mono text-[#85817A]"
  }, React.createElement("span", null, "CREATOR: @", heroBite.username), React.createElement("span", {
    className: "text-[#FF5428] font-bold"
  }, heroBite.likeCount || (heroBite.likes ? heroBite.likes.length : 0), " CRAVES"))), React.createElement("div", {
    className: "lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3"
  }, sideBites.map((story, i) => React.createElement("div", {
    key: story.id,
    onClick: () => onViewStory(story),
    className: "bg-[#11110F] border border-[#262420] hover:border-[#FF5428] p-3 flex items-center space-x-3.5 group cursor-pointer transition-all"
  }, React.createElement("div", {
    className: "relative w-20 h-20 bg-black flex-shrink-0 overflow-hidden"
  }, React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  }), React.createElement("span", {
    className: "absolute top-1 left-1 px-1 bg-black/80 font-mono text-[8px] text-[#FF5428]"
  }, "#0", i + 2)), React.createElement("div", {
    className: "flex-1 min-w-0 space-y-1"
  }, React.createElement("span", {
    className: "text-[9px] font-mono text-[#FF5428] uppercase"
  }, story.category || "FOOD"), React.createElement("h4", {
    className: "text-xs font-bold text-[#F7F4ED] font-mono truncate uppercase"
  }, decodeUnicode(story.caption) || "Community Bite"), React.createElement("div", {
    className: "flex items-center justify-between text-[10px] font-mono text-[#85817A]"
  }, React.createElement("span", null, "@", story.username), React.createElement("span", null, story.likeCount || (story.likes ? story.likes.length : 0), " LIKES"))))))));
}
function PopularNearYouShelf() {
  const localCategories = [{
    num: "01",
    title: "LOCAL STREET HEROES",
    distance: "0.5 KM",
    icon: "🌮",
    tag: "STREET & CHAAT"
  }, {
    num: "02",
    title: "WOODFIRED SLICES",
    distance: "1.2 KM",
    icon: "🍕",
    tag: "PIZZA & OVEN"
  }, {
    num: "03",
    title: "ARTISAN BREWS & ROASTS",
    distance: "0.8 KM",
    icon: "☕",
    tag: "SPECIALTY COFFEE"
  }, {
    num: "04",
    title: "SWEET CONFECTIONS",
    distance: "1.5 KM",
    icon: "🍰",
    tag: "DESSERTS & BAKERY"
  }];
  return React.createElement("section", {
    className: "w-full bg-[#181714] border border-[#262420] p-5 sm:p-6 text-left space-y-4"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-2 border-b border-[#262420] pb-3"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#FF5428]"
  }, "05 /"), React.createElement("h2", {
    className: "text-sm font-mono text-[#F7F4ED] tracking-wider uppercase font-bold"
  }, "LOCAL RADAR \u2014 POPULAR NEAR YOU")), React.createElement("span", {
    className: "text-[11px] font-mono text-[#85817A]"
  }, "HYPER-LOCAL GASTRONOMIC OBSERVATIONS")), React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
  }, localCategories.map(item => React.createElement("div", {
    key: item.num,
    className: "p-4 bg-[#11110F] border border-[#262420] hover:border-[#FF5428] space-y-2.5 transition-all cursor-pointer group text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between text-xs font-mono"
  }, React.createElement("span", {
    className: "text-[#FF5428]"
  }, item.num, " /"), React.createElement("span", {
    className: "text-[#85817A] group-hover:text-[#FF5428] transition-colors"
  }, item.distance)), React.createElement("div", {
    className: "text-2xl"
  }, item.icon), React.createElement("h4", {
    className: "text-xs font-mono font-bold text-[#F7F4ED] tracking-wider uppercase leading-snug"
  }, item.title), React.createElement("div", {
    className: "text-[10px] font-mono text-[#85817A] uppercase"
  }, "TAG: ", item.tag)))));
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
  } else if (rawCaption.length > 0 && rawCaption.length <= 45) {
    dishTitle = rawCaption;
    dishDescription = "";
  }
  const categoryLabel = (post.category || "CULINARY ARCHIVE").toUpperCase();
  const handleCommentSubmit = e => {
    e.preventDefault();
    const clean = commentText.trim();
    if (!clean) return;
    onAddComment(post.id, clean);
    setCommentText("");
    setShowComments(true);
  };
  return React.createElement("article", {
    className: "bg-[#181714] border border-[#262420] hover:border-[#3D3A34] transition-all text-left flex flex-col justify-between group"
  }, React.createElement("div", null, React.createElement("div", {
    className: "p-4 border-b border-[#262420] flex items-center justify-between bg-[#11110F]"
  }, React.createElement("div", {
    onClick: () => onViewStory(post),
    className: "flex items-center space-x-3 cursor-pointer group/user"
  }, React.createElement("div", {
    className: "w-9 h-9 rounded-full border border-[#FF5428] overflow-hidden flex-shrink-0 bg-black"
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
    className: "text-xs font-mono font-bold text-[#F7F4ED] group-hover/user:text-[#FF5428] transition-colors"
  }, "@", post.username), !isOwner && onToggleFollow && React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onToggleFollow(post.userId, post.username);
    },
    className: `text-[9px] font-mono uppercase px-2 py-0.5 border transition-all cursor-pointer ${isFollowing ? "border-[#262420] text-[#85817A] hover:border-[#FF5428] hover:text-[#F7F4ED]" : "border-[#FF5428] text-[#FF5428] hover:bg-[#FF5428] hover:text-black font-bold"}`
  }, isFollowing ? "FOLLOWING" : "+ FOLLOW")), React.createElement("span", {
    className: "text-[10px] font-mono text-[#85817A] block"
  }, formatTimeAgo(post.createdAt)))), React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-[9px] font-mono text-[#FF5428] border border-[#262420] bg-black px-2 py-0.5"
  }, formatHoursLeft(post.expiresAt)), isOwner && onDeletePost && React.createElement("button", {
    type: "button",
    onClick: () => {
      if (window.confirm("Archive / Delete this food story?")) {
        onDeletePost(post.id);
      }
    },
    className: "text-[10px] font-mono text-[#85817A] hover:text-rose-500 border border-[#262420] hover:border-rose-500 px-2 py-0.5 transition-colors cursor-pointer",
    title: "Delete"
  }, "DEL"))), React.createElement("div", {
    onDoubleClick: () => onDoubleTap(post),
    className: "relative w-full aspect-[4/3] bg-black overflow-hidden cursor-pointer select-none flex items-center justify-center group/img"
  }, post.mediaType === "video" ? React.createElement("video", {
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
    className: "relative z-10 w-full h-full object-cover object-center group-hover/img:scale-103 transition-transform duration-500",
    loading: "lazy"
  }), heartBurst && React.createElement("div", {
    className: "absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-heart-burst"
  }, React.createElement("span", {
    className: "text-6xl text-[#FF5428] font-mono font-black drop-shadow-2xl"
  }, "\u2605 CRAVED!")), React.createElement("div", {
    className: "absolute top-2 left-2 z-20 px-2 py-0.5 bg-black/80 font-mono text-[9px] text-[#FF5428] border border-[#262420]"
  }, "TAG: ", categoryLabel)), React.createElement("div", {
    className: "p-4 space-y-2 text-left"
  }, dishTitle && React.createElement("h3", {
    className: "text-xl sm:text-2xl font-black text-[#F7F4ED] uppercase font-heading tracking-wide leading-tight"
  }, dishTitle), dishDescription && React.createElement("p", {
    className: "text-xs sm:text-sm text-[#85817A] leading-relaxed font-sans line-clamp-3"
  }, dishDescription))), React.createElement("div", null, React.createElement("div", {
    className: "px-4 py-3 border-t border-[#262420] flex items-center justify-between text-xs font-mono bg-[#11110F]"
  }, React.createElement("div", {
    className: "flex items-center space-x-4"
  }, React.createElement("button", {
    type: "button",
    onClick: () => onLike(post.id),
    className: `flex items-center space-x-1.5 transition-colors cursor-pointer ${isLiked ? "text-[#FF5428] font-bold" : "text-[#85817A] hover:text-[#F7F4ED]"}`
  }, React.createElement("span", null, isLiked ? "★" : "☆"), React.createElement("span", {
    onClick: e => {
      if (likeCount > 0 && onShowLikes) {
        e.stopPropagation();
        onShowLikes(post.id, postLikes);
      }
    },
    className: likeCount > 0 ? "hover:underline cursor-pointer" : ""
  }, likeCount, " ", likeCount === 1 ? "CRAVE" : "CRAVES")), React.createElement("button", {
    type: "button",
    onClick: () => setShowComments(prev => !prev),
    className: "text-[#85817A] hover:text-[#F7F4ED] transition-colors cursor-pointer"
  }, "\uD83D\uDCAC ", (comments || []).length, " NOTES"), React.createElement("button", {
    type: "button",
    onClick: () => onShare(post),
    className: "text-[#85817A] hover:text-[#F7F4ED] transition-colors cursor-pointer",
    title: "Share Transmission"
  }, "\u2197 DISPATCH")), React.createElement("button", {
    type: "button",
    onClick: () => onSave(post.id),
    className: `transition-colors cursor-pointer ${isSaved ? "text-[#FF5428] font-bold" : "text-[#85817A] hover:text-[#F7F4ED]"}`,
    title: isSaved ? "Saved" : "Save"
  }, isSaved ? "■ ARCHIVED" : "□ ARCHIVE")), postLikes && postLikes.length > 0 && React.createElement("div", {
    onClick: () => onShowLikes && onShowLikes(post.id, postLikes),
    className: "px-4 py-2 border-t border-[#262420] text-[10px] font-mono text-[#85817A] hover:text-[#F7F4ED] cursor-pointer transition-colors bg-[#11110F]/50 select-none flex items-center space-x-1"
  }, React.createElement("span", null, "CRAVED BY"), React.createElement("strong", {
    className: "text-[#FF5428]"
  }, "@", postLikes[0].username), postLikes.length > 1 && React.createElement("span", null, " + ", postLikes.length - 1, " OTHER", postLikes.length > 2 ? "S" : "")), showComments && React.createElement("div", {
    className: "p-4 border-t border-[#262420] bg-[#11110F] space-y-3"
  }, comments && comments.length > 0 && React.createElement("div", {
    className: "space-y-2 max-h-40 overflow-y-auto divide-y divide-[#262420] pr-1"
  }, comments.map((c, i) => React.createElement("div", {
    key: c.id || i,
    className: "pt-2 text-xs font-mono leading-relaxed"
  }, React.createElement("strong", {
    className: "text-[#FF5428] mr-2"
  }, "@", c.author || c.username), React.createElement("span", {
    className: "text-[#F2EBDD]"
  }, c.text)))), React.createElement("form", {
    onSubmit: handleCommentSubmit,
    className: "pt-2 flex items-center space-x-2"
  }, React.createElement("input", {
    type: "text",
    value: commentText,
    onChange: e => setCommentText(e.target.value),
    placeholder: "ADD EDITORIAL NOTE...",
    className: "flex-1 px-3 py-2 bg-[#181714] border border-[#262420] text-xs font-mono text-[#F7F4ED] placeholder:text-[#85817A] focus:outline-none focus:border-[#FF5428]"
  }), React.createElement("button", {
    type: "submit",
    disabled: !commentText.trim(),
    className: "px-3.5 py-2 btn-editorial-primary text-xs font-mono font-bold tracking-wider cursor-pointer disabled:opacity-40"
  }, "POST \u2192")))));
}
function FloatingCreateButton({
  onTriggerUpload
}) {
  return React.createElement("div", {
    className: "fixed bottom-8 right-6 z-40 hidden md:block"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "flex items-center space-x-2 px-5 py-3 btn-editorial-primary font-mono font-bold text-xs uppercase tracking-widest shadow-2xl cursor-pointer select-none",
    title: "Share your daily food transmission"
  }, React.createElement("span", null, "+"), React.createElement("span", null, "DISPATCH BITE")));
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
    className: "hidden md:block sticky top-0 z-40 bg-[#11110F]/95 backdrop-blur-md border-b border-[#262420]"
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
    className: "flex items-center space-x-3 cursor-pointer select-none"
  }, React.createElement("div", {
    className: "w-8 h-8 bg-[#FF5428] text-black font-mono font-black flex items-center justify-center text-sm"
  }, "FB"), React.createElement("div", null, React.createElement("h1", {
    className: "text-xl font-black text-[#F7F4ED] tracking-wider leading-none font-heading uppercase"
  }, "FOODBITE\xAE"), React.createElement("span", {
    className: "text-[9px] uppercase tracking-widest text-[#FF5428] font-mono block pt-0.5"
  }, "DISCOVER. SHARE. CRAVE."))), React.createElement("nav", {
    className: "flex items-center space-x-2"
  }, [{
    id: "home",
    num: "01",
    label: "FEED"
  }, {
    id: "discover",
    num: "02",
    label: "DISCOVER"
  }, {
    id: "activity",
    num: "03",
    label: "ACTIVITY",
    badge: unreadCount
  }, {
    id: "profile",
    num: "04",
    label: "DOSSIER"
  }].map(tab => {
    const isActive = activeTab === tab.id;
    return React.createElement("button", {
      key: tab.id,
      type: "button",
      onClick: () => {
        setActiveTab(tab.id);
        if (tab.id === "home" && onRefreshFeed) onRefreshFeed();
      },
      className: `px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? "bg-[#181714] text-[#FF5428] border border-[#FF5428] font-bold" : "text-[#85817A] hover:text-[#F7F4ED] border border-transparent hover:border-[#262420]"}`
    }, React.createElement("span", {
      className: isActive ? "text-[#FF5428]" : "text-[#85817A]"
    }, tab.num), React.createElement("span", null, tab.label), tab.badge > 0 && React.createElement("span", {
      className: "ml-1 px-1.5 py-0.2 bg-[#FF5428] text-black font-mono text-[9px] font-bold"
    }, tab.badge));
  }))), React.createElement("div", {
    className: "flex items-center space-x-3 font-mono"
  }, React.createElement("div", {
    className: "flex items-center space-x-1 px-3 py-1.5 bg-[#181714] border border-[#262420] text-[#FF5428] text-xs"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "D STREAK")), React.createElement("button", {
    type: "button",
    onClick: onTriggerInstall,
    className: "px-3 py-1.5 border border-[#262420] bg-[#181714] hover:border-[#FF5428] text-[#85817A] hover:text-[#F7F4ED] text-xs transition-colors cursor-pointer",
    title: "Install Application"
  }, "[ APP ]"), currentUser && (currentUser.role === "admin" || currentUser.username === "sachin" || currentUser.id === "usr-1") && React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: `px-3 py-1.5 border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${announcement && announcement.enabled ? "bg-[#2A100C] border-[#FF5428] text-[#FF5428] animate-pulse" : "bg-[#181714] border-[#262420] text-[#85817A] hover:text-[#F7F4ED] hover:border-[#3D3A34]"}`,
    title: "Admin Broadcast & Maintenance Popup"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "BROADCAST")), React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "px-4 py-2 btn-editorial-primary text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center space-x-1.5"
  }, React.createElement("span", null, "+"), React.createElement("span", null, "DISPATCH BITE")), React.createElement("div", {
    onClick: () => setActiveTab("profile"),
    className: "w-9 h-9 rounded-full border border-[#262420] overflow-hidden cursor-pointer hover:border-[#FF5428] transition-all flex-shrink-0 bg-black"
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
    className: "md:hidden sticky top-0 z-40 bg-[#11110F]/95 backdrop-blur-md border-b border-[#262420] px-4 py-3 flex items-center justify-between text-left"
  }, React.createElement("div", {
    onClick: onLogoClick,
    className: "flex items-center space-x-2.5 cursor-pointer select-none"
  }, React.createElement("div", {
    className: "w-7 h-7 bg-[#FF5428] text-black font-mono font-black flex items-center justify-center text-xs"
  }, "FB"), React.createElement("div", null, React.createElement("span", {
    className: "text-base font-black text-[#F7F4ED] tracking-wider font-heading uppercase leading-none block"
  }, "FOODBITE\xAE"), React.createElement("span", {
    className: "text-[8px] uppercase tracking-widest text-[#FF5428] font-mono block leading-none pt-0.5"
  }, "DISCOVER. SHARE. CRAVE."))), React.createElement("div", {
    className: "flex items-center space-x-2 font-mono"
  }, React.createElement("div", {
    className: "flex items-center space-x-1 px-2.5 py-1 bg-[#181714] border border-[#262420] text-[#FF5428] text-[11px]"
  }, React.createElement("span", null, "\uD83D\uDD25"), React.createElement("span", null, streak, "D")), React.createElement("button", {
    type: "button",
    onClick: onTriggerInstall,
    className: "p-1.5 border border-[#262420] bg-[#181714] text-[#85817A] text-xs",
    title: "Install App"
  }, "\uD83D\uDCF1"), currentUser && (currentUser.role === "admin" || currentUser.username === "sachin" || currentUser.id === "usr-1") && React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: `p-1.5 border text-xs ${announcement && announcement.enabled ? "bg-[#2A100C] border-[#FF5428] text-[#FF5428]" : "border-[#262420] bg-[#181714] text-[#85817A]"}`,
    title: "Admin Broadcast"
  }, "\uD83D\uDCE2")));
}
function MobileBottomNav({
  activeTab,
  setActiveTab,
  onTriggerUpload,
  unreadCount,
  onRefreshFeed
}) {
  return React.createElement("nav", {
    className: "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#11110F] border-t border-[#262420] px-2 py-2 flex items-center justify-around shadow-2xl"
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
    className: `flex flex-col items-center py-1 px-2 text-[10px] font-mono uppercase tracking-wider cursor-pointer ${activeTab === "home" ? "text-[#FF5428] font-bold" : "text-[#85817A]"}`
  }, React.createElement("span", {
    className: "text-base"
  }, "01"), React.createElement("span", null, "FEED")), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("discover");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-2 text-[10px] font-mono uppercase tracking-wider cursor-pointer ${activeTab === "discover" ? "text-[#FF5428] font-bold" : "text-[#85817A]"}`
  }, React.createElement("span", {
    className: "text-base"
  }, "02"), React.createElement("span", null, "DISCOVER")), React.createElement("button", {
    type: "button",
    onClick: onTriggerUpload,
    className: "w-11 h-11 bg-[#FF5428] text-black font-mono font-bold flex items-center justify-center text-xl shadow-lg active:scale-95 cursor-pointer -mt-4 border border-black",
    title: "Dispatch Bite"
  }, "+"), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("activity");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `relative flex flex-col items-center py-1 px-2 text-[10px] font-mono uppercase tracking-wider cursor-pointer ${activeTab === "activity" ? "text-[#FF5428] font-bold" : "text-[#85817A]"}`
  }, React.createElement("span", {
    className: "text-base"
  }, "03"), React.createElement("span", null, "ALERTS"), unreadCount > 0 && React.createElement("span", {
    className: "absolute top-1 right-2 w-2 h-2 rounded-full bg-[#FF5428]"
  })), React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveTab("profile");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    },
    className: `flex flex-col items-center py-1 px-2 text-[10px] font-mono uppercase tracking-wider cursor-pointer ${activeTab === "profile" ? "text-[#FF5428] font-bold" : "text-[#85817A]"}`
  }, React.createElement("span", {
    className: "text-base"
  }, "04"), React.createElement("span", null, "DOSSIER")));
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
    number: "01",
    label: "ALL TASTES"
  }, {
    id: "spicy",
    number: "02",
    label: "SPICY FIESTA"
  }, {
    id: "cheesy",
    number: "03",
    label: "CHEESY CRAVINGS"
  }, {
    id: "crispy",
    number: "04",
    label: "CRISPY BITES"
  }, {
    id: "street",
    number: "05",
    label: "STREET FOOD"
  }, {
    id: "desserts",
    number: "06",
    label: "SWEET TOOTH"
  }, {
    id: "healthy",
    number: "07",
    label: "HEALTHY BOWLS"
  }, {
    id: "coffee",
    number: "08",
    label: "ARTISAN COFFEE"
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
    num: "01",
    title: "LATE NIGHT TRANSMISSIONS",
    desc: "Midnight street food & clandestine cravings",
    tag: "STREET"
  }, {
    num: "02",
    title: "WEEKEND BRUNCH CODEX",
    desc: "Artisanal sourdough, fluffy eggs & espresso",
    tag: "BRUNCH"
  }, {
    num: "03",
    title: "FIERY SPICE OBSESSION",
    desc: "High Scoville curries, loaded tacos & peppers",
    tag: "SPICY"
  }, {
    num: "04",
    title: "SWEET TOOTH SANCTUARY",
    desc: "Pâtisserie, layered desserts & confections",
    tag: "DESSERT"
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
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16 space-y-8 text-left animate-fade-in"
  }, React.createElement("div", {
    className: "space-y-4 border-b border-[#262420] pb-6"
  }, React.createElement("div", {
    className: "flex items-center space-x-3 text-xs font-mono text-[#FF5428]"
  }, React.createElement("span", null, "02 /"), React.createElement("span", {
    className: "text-[#85817A] uppercase tracking-widest"
  }, "DISCOVER \u2014 CURATED INDEX")), React.createElement("h1", {
    className: "text-4xl sm:text-6xl font-black text-[#F7F4ED] tracking-tight font-heading uppercase"
  }, "FIND YOUR NEXT CRAVING"), React.createElement("p", {
    className: "text-xs sm:text-sm font-sans text-[#85817A] max-w-2xl leading-relaxed"
  }, "Traverse culinary transmissions across flavors, cooking techniques, and independent food creators."), React.createElement("div", {
    className: "relative w-full max-w-2xl pt-2"
  }, React.createElement("span", {
    className: "absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[#FF5428]"
  }, "[QUERY]"), React.createElement("input", {
    type: "text",
    value: discoverSearch,
    onChange: e => setDiscoverSearch(e.target.value),
    placeholder: "PIZZA, NOODLES, TACOS, SWEET DISHES...",
    className: "w-full pl-24 pr-10 py-3.5 bg-[#181714] border border-[#262420] text-xs sm:text-sm font-mono text-[#F7F4ED] placeholder:text-[#85817A] focus:outline-none focus:border-[#FF5428] transition-all"
  }), discoverSearch && React.createElement("button", {
    type: "button",
    onClick: () => setDiscoverSearch(""),
    className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#85817A] hover:text-[#F7F4ED] p-1 cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 pt-2"
  }, tasteTags.map(tag => {
    const isActive = selectedTag === tag.id;
    return React.createElement("button", {
      key: tag.id,
      type: "button",
      onClick: () => setSelectedTag(tag.id),
      className: `flex-shrink-0 px-3.5 py-2 text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? "bg-[#FF5428] text-black font-bold border border-[#FF5428]" : "bg-[#181714] text-[#85817A] hover:text-[#F7F4ED] border border-[#262420] hover:border-[#3D3A34]"}`
    }, React.createElement("span", {
      className: isActive ? "text-black" : "text-[#FF5428]"
    }, tag.number), React.createElement("span", null, tag.label));
  }))), creators && creators.length > 0 && React.createElement("section", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "flex items-center justify-between border-b border-[#262420] pb-2"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#FF5428]"
  }, "02.1 /"), React.createElement("h3", {
    className: "text-sm font-mono text-[#F7F4ED] uppercase font-bold tracking-wider"
  }, "FEATURED FOOD CREATORS")), React.createElement("span", {
    className: "text-xs font-mono text-[#85817A]"
  }, creators.length, " CHEFS ACTIVE")), React.createElement("div", {
    className: "flex items-center space-x-4 overflow-x-auto scrollbar-none pb-2"
  }, creators.map(c => {
    const isFollowed = (followingList || []).includes(c.userId);
    const isSelf = currentUser && (currentUser.id === c.userId || currentUser.uid === c.userId);
    return React.createElement("div", {
      key: c.userId,
      className: "flex-shrink-0 w-44 p-4 bg-[#181714] border border-[#262420] hover:border-[#FF5428] space-y-3 text-left transition-all"
    }, React.createElement("div", {
      className: "w-12 h-12 rounded-full border border-[#FF5428] overflow-hidden bg-black"
    }, React.createElement("img", {
      src: c.avatar,
      alt: c.username,
      onError: e => {
        e.currentTarget.src = "/uploads/avatars/sachin.svg";
      },
      className: "w-full h-full object-cover"
    })), React.createElement("div", null, React.createElement("h4", {
      className: "text-xs font-mono font-bold text-[#F7F4ED] truncate"
    }, "@", c.username), React.createElement("span", {
      className: "text-[10px] font-mono text-[#85817A] block pt-0.5"
    }, c.postCount, " TRANSMISSIONS")), !isSelf && onToggleFollow && React.createElement("button", {
      type: "button",
      onClick: () => onToggleFollow(c.userId, c.username),
      className: `w-full py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${isFollowed ? "border border-[#262420] text-[#85817A] hover:border-[#FF5428] hover:text-[#F7F4ED]" : "btn-editorial-primary font-bold"}`
    }, isFollowed ? "FOLLOWING" : "+ FOLLOW"));
  }))), React.createElement("section", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "flex items-center justify-between border-b border-[#262420] pb-2"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#FF5428]"
  }, "02.2 /"), React.createElement("h3", {
    className: "text-sm font-mono text-[#F7F4ED] uppercase font-bold tracking-wider"
  }, "CURATED CRAVINGS & MOODS"))), React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, cravingsMoods.map((m, idx) => React.createElement("div", {
    key: idx,
    className: "p-5 bg-[#181714] border border-[#262420] hover:border-[#FF5428] space-y-3 cursor-pointer group transition-all text-left"
  }, React.createElement("div", {
    className: "flex items-center justify-between text-xs font-mono"
  }, React.createElement("span", {
    className: "text-[#FF5428]"
  }, m.num, " /"), React.createElement("span", {
    className: "text-[10px] text-[#85817A] border border-[#262420] px-1.5 py-0.5"
  }, m.tag)), React.createElement("h4", {
    className: "text-base font-bold text-[#F7F4ED] font-heading tracking-wide uppercase group-hover:text-[#FF5428] transition-colors"
  }, m.title), React.createElement("p", {
    className: "text-xs text-[#85817A] leading-relaxed font-sans"
  }, m.desc))))), React.createElement("section", {
    className: "space-y-4 pt-2"
  }, React.createElement("div", {
    className: "flex items-center justify-between border-b border-[#262420] pb-2"
  }, React.createElement("div", {
    className: "flex items-center space-x-3"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#FF5428]"
  }, "02.3 /"), React.createElement("h3", {
    className: "text-sm font-mono text-[#F7F4ED] uppercase font-bold tracking-wider"
  }, discoverSearch ? `RESULTS FOR "${discoverSearch}"` : "COMMUNITY DISCOVERED BITES")), React.createElement("span", {
    className: "text-xs font-mono text-[#85817A]"
  }, filtered.length, " ARCHIVED")), filtered.length === 0 ? React.createElement(EmptyState, {
    title: "NO DISHES MATCHED YOUR QUERY",
    message: "TRY BROADENING YOUR SEARCH TERM OR SWITCHING CATEGORY FILTERS.",
    actionLabel: "RESET FILTERS",
    onAction: () => {
      setDiscoverSearch("");
      setSelectedTag("all");
    }
  }) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
  }, filtered.map(dish => React.createElement("div", {
    key: dish.id,
    onClick: () => onViewStory(dish),
    className: "bg-[#181714] border border-[#262420] hover:border-[#FF5428] overflow-hidden group cursor-pointer transition-all text-left flex flex-col justify-between"
  }, React.createElement("div", null, React.createElement("div", {
    className: "relative aspect-square bg-black overflow-hidden"
  }, React.createElement("img", {
    src: dish.mediaUrl,
    alt: dish.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
  }), React.createElement("span", {
    className: "absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 font-mono text-[9px] text-[#FF5428] border border-[#262420]"
  }, formatHoursLeft(dish.expiresAt))), React.createElement("div", {
    className: "p-3 space-y-1"
  }, React.createElement("span", {
    className: "text-[9px] font-mono text-[#FF5428] uppercase block"
  }, dish.category || "FOOD"), React.createElement("h4", {
    className: "text-xs font-mono font-bold text-[#F7F4ED] truncate uppercase"
  }, decodeUnicode(dish.caption) || "DAILY DISH"))), React.createElement("div", {
    className: "px-3 py-2 border-t border-[#262420] flex items-center justify-between text-[10px] font-mono text-[#85817A] bg-[#11110F]"
  }, React.createElement("span", null, "@", dish.username), React.createElement("span", {
    className: "text-[#FF5428]"
  }, "\u2605 ", dish.likeCount || 0)))))));
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
    className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16 space-y-8 text-left animate-fade-in"
  }, React.createElement("div", {
    className: "bg-[#181714] border border-[#262420] p-6 sm:p-8 space-y-6"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4 border-b border-[#262420] pb-4"
  }, React.createElement("div", {
    className: "flex items-center space-x-3 text-xs font-mono text-[#FF5428]"
  }, React.createElement("span", null, "04 /"), React.createElement("span", {
    className: "text-[#85817A] uppercase tracking-widest"
  }, "FOOD DOSSIER [CURATOR PROFILE]")), React.createElement("button", {
    type: "button",
    onClick: onLogout,
    className: "px-3.5 py-1.5 border border-[#262420] hover:border-rose-500 hover:text-rose-500 text-xs font-mono uppercase text-[#85817A] transition-colors cursor-pointer"
  }, "SIGN OUT \u2192")), React.createElement("div", {
    className: "flex flex-col sm:flex-row items-center sm:items-start gap-6"
  }, React.createElement("div", {
    className: "relative flex-shrink-0"
  }, React.createElement("div", {
    className: "w-24 h-24 rounded-full border-2 border-[#FF5428] overflow-hidden bg-black"
  }, React.createElement("img", {
    src: user.avatar || user.avatarUrl || "/uploads/avatars/sachin.svg",
    alt: user.username || "Profile",
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-full h-full object-cover"
  })), React.createElement("span", {
    className: "absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#FF5428] text-black text-[9px] font-mono font-bold tracking-wider uppercase"
  }, "\uD83D\uDD25 ", streak, "D")), React.createElement("div", {
    className: "space-y-4 text-center sm:text-left flex-1"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl sm:text-4xl font-black text-[#F7F4ED] tracking-wide font-heading uppercase"
  }, user.name || user.username || "CHEF", "'S DOSSIER"), React.createElement("span", {
    className: "text-xs font-mono text-[#FF5428] block pt-1"
  }, "IDENTITY: @", user.username || "chef")), React.createElement("p", {
    className: "text-xs sm:text-sm text-[#85817A] leading-relaxed font-sans max-w-xl"
  }, "Documenting culinary transmissions, neighborhood recipes, and daily cravings on the FoodBite platform."), React.createElement("div", {
    className: "flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono"
  }, React.createElement("span", {
    className: "px-2.5 py-1 bg-[#11110F] border border-[#262420] text-[#FF5428]"
  }, "#SPICE_OBSESSED"), React.createElement("span", {
    className: "px-2.5 py-1 bg-[#11110F] border border-[#262420] text-[#FF5428]"
  }, "#PIZZA_ARCHIVIST"), React.createElement("span", {
    className: "px-2.5 py-1 bg-[#11110F] border border-[#262420] text-[#FF5428]"
  }, "#STREET_GASTRONOMY")), React.createElement("div", {
    className: "grid grid-cols-3 gap-3 pt-3 border-t border-[#262420] font-mono text-center"
  }, React.createElement("div", {
    className: "p-3 bg-[#11110F] border border-[#262420]"
  }, React.createElement("div", {
    className: "text-lg font-bold text-[#F7F4ED]"
  }, userStories.length), React.createElement("div", {
    className: "text-[10px] text-[#85817A] uppercase"
  }, "ACTIVE BITES")), React.createElement("div", {
    className: "p-3 bg-[#11110F] border border-[#262420]"
  }, React.createElement("div", {
    className: "text-lg font-bold text-[#F7F4ED]"
  }, userProfile && userProfile.followersCount || 0), React.createElement("div", {
    className: "text-[10px] text-[#85817A] uppercase"
  }, "FOLLOWERS")), React.createElement("div", {
    className: "p-3 bg-[#11110F] border border-[#262420]"
  }, React.createElement("div", {
    className: "text-lg font-bold text-[#F7F4ED]"
  }, userProfile && userProfile.followingCount || 0), React.createElement("div", {
    className: "text-[10px] text-[#85817A] uppercase"
  }, "FOLLOWING"))), (user.role === "admin" || user.username === "sachin" || user.id === "usr-1") && React.createElement("div", {
    className: "pt-2"
  }, React.createElement("button", {
    type: "button",
    onClick: onTriggerBroadcast,
    className: "w-full py-3 px-4 border border-[#FF5428] bg-[#2A100C] text-[#FF5428] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer hover:bg-[#FF5428] hover:text-black transition-colors"
  }, React.createElement("span", null, "\uD83D\uDCE2"), React.createElement("span", null, "MANAGE SYSTEM BROADCAST & VISITOR POPUP"), announcement && announcement.enabled && React.createElement("span", {
    className: "px-1.5 py-0.2 bg-[#FF5428] text-black text-[9px] font-bold"
  }, "ACTIVE")))))), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "flex items-center border-b border-[#262420] space-x-2"
  }, [{
    id: "bites",
    num: "01",
    label: "MY BITES",
    count: userStories.length
  }, {
    id: "saved",
    num: "02",
    label: "ARCHIVED",
    count: savedStories.length
  }, {
    id: "liked",
    num: "03",
    label: "CRAVED",
    count: likedStories.length
  }].map(t => {
    const isActive = activeProfileTab === t.id;
    return React.createElement("button", {
      key: t.id,
      type: "button",
      onClick: () => setActiveProfileTab(t.id),
      className: `pb-3 px-3 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${isActive ? "border-b-2 border-[#FF5428] text-[#FF5428] font-bold" : "text-[#85817A] hover:text-[#F7F4ED] border-b-2 border-transparent"}`
    }, React.createElement("span", null, t.num), React.createElement("span", null, t.label, " (", t.count, ")"));
  })), activeProfileTab === "bites" && (userStories.length === 0 ? React.createElement(EmptyState, {
    title: "NO ACTIVE FOOD TRANSMISSIONS",
    message: "YOU HAVEN'T DISPATCHED ANY FOOD BITES IN THE LAST 24 HOURS.",
    actionLabel: "+ DISPATCH FIRST BITE",
    onAction: onTriggerUpload
  }) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-4"
  }, userStories.map(story => React.createElement("div", {
    key: story.id,
    className: "relative aspect-square bg-black border border-[#262420] hover:border-[#FF5428] overflow-hidden group cursor-pointer"
  }, React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between"
  }, React.createElement("span", {
    className: "text-[9px] font-mono text-[#FF5428] bg-black/80 px-1.5 py-0.5 self-end"
  }, formatHoursLeft(story.expiresAt)), React.createElement("span", {
    className: "text-xs font-mono text-[#F7F4ED] truncate"
  }, decodeUnicode(story.caption))))))), activeProfileTab === "saved" && (savedStories.length === 0 ? React.createElement(EmptyState, {
    title: "NO ARCHIVED BITES YET",
    message: "USE THE ARCHIVE ACTION ON ANY DISH TO CURATE YOUR PERSONAL TASTE CATALOG."
  }) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-4"
  }, savedStories.map(story => React.createElement("div", {
    key: story.id,
    className: "relative aspect-square bg-black border border-[#262420] hover:border-[#FF5428] overflow-hidden group cursor-pointer"
  }, React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#F7F4ED] truncate"
  }, decodeUnicode(story.caption))))))), activeProfileTab === "liked" && (likedStories.length === 0 ? React.createElement(EmptyState, {
    title: "NO CRAVED BITES YET",
    message: "DOUBLE TAP ANY DISH YOU CRAVE TO LOG IT INTO YOUR TASTE REPERTOIRE."
  }) : React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-4"
  }, likedStories.map(story => React.createElement("div", {
    key: story.id,
    className: "relative aspect-square bg-black border border-[#262420] hover:border-[#FF5428] overflow-hidden group cursor-pointer"
  }, React.createElement("img", {
    src: story.mediaUrl,
    alt: story.caption,
    onError: e => {
      e.currentTarget.src = "/uploads/dish_1790010828136_7926.jpg";
    },
    className: "w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end"
  }, React.createElement("span", {
    className: "text-xs font-mono text-[#F7F4ED] truncate"
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
      return notifications.filter(n => (n.message || "").toLowerCase().includes("like") || (n.message || "").toLowerCase().includes("crave"));
    }
    if (filterType === "comments") {
      return notifications.filter(n => (n.message || "").toLowerCase().includes("comment") || (n.message || "").toLowerCase().includes("note"));
    }
    if (filterType === "follows") {
      return notifications.filter(n => (n.message || "").toLowerCase().includes("follow"));
    }
    return notifications;
  }, [notifications, filterType]);
  return React.createElement("div", {
    className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-16 space-y-6 text-left animate-fade-in font-mono"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-3 border-b border-[#262420] pb-4"
  }, React.createElement("div", null, React.createElement("div", {
    className: "flex items-center space-x-2 text-xs text-[#FF5428]"
  }, React.createElement("span", null, "03 /"), React.createElement("span", {
    className: "text-[#85817A] uppercase tracking-widest"
  }, "TRANSMISSION LOG")), React.createElement("h2", {
    className: "text-3xl font-black text-[#F7F4ED] uppercase font-heading tracking-wide pt-1"
  }, "ACTIVITY & ALERTS"), React.createElement("p", {
    className: "text-xs text-[#85817A] pt-0.5"
  }, "Real-time interactions on your daily food stories and community transmissions.")), React.createElement("button", {
    type: "button",
    onClick: onRefreshNotifs,
    className: "px-3.5 py-1.5 border border-[#262420] hover:border-[#FF5428] text-xs font-mono text-[#FF5428] transition-colors cursor-pointer"
  }, "SYNC LOG \u21BB")), React.createElement("div", {
    className: "flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1"
  }, [{
    id: "all",
    num: "01",
    label: "ALL TRANSMISSIONS"
  }, {
    id: "likes",
    num: "02",
    label: "CRAVES (LIKES)"
  }, {
    id: "comments",
    num: "03",
    label: "NOTES (COMMENTS)"
  }, {
    id: "follows",
    num: "04",
    label: "FOLLOWS"
  }].map(f => React.createElement("button", {
    key: f.id,
    type: "button",
    onClick: () => setFilterType(f.id),
    className: `px-3 py-1.5 text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${filterType === f.id ? "bg-[#FF5428] text-black font-bold border border-[#FF5428]" : "bg-[#181714] text-[#85817A] hover:text-[#F7F4ED] border border-[#262420] hover:border-[#3D3A34]"}`
  }, React.createElement("span", {
    className: filterType === f.id ? "text-black" : "text-[#FF5428]"
  }, f.num), React.createElement("span", null, f.label)))), filteredNotifs.length === 0 ? React.createElement("div", {
    className: "p-12 bg-[#181714] border border-[#262420] text-center space-y-3"
  }, React.createElement("span", {
    className: "text-3xl font-mono text-[#FF5428] block"
  }, "[]"), React.createElement("h4", {
    className: "text-sm font-mono font-bold text-[#F7F4ED] uppercase"
  }, "NO TRANSMISSIONS LOGGED"), React.createElement("p", {
    className: "text-xs text-[#85817A] max-w-sm mx-auto font-sans leading-relaxed"
  }, "When other food enthusiasts crave, note, or follow your culinary creations, entries will be recorded in this live transmission log.")) : React.createElement("div", {
    className: "space-y-3"
  }, filteredNotifs.map(n => React.createElement("div", {
    key: n.id,
    className: "p-4 bg-[#181714] border border-[#262420] hover:border-[#FF5428] flex items-center space-x-4 transition-all text-left"
  }, React.createElement("img", {
    src: n.senderAvatar || "/uploads/avatars/sachin.svg",
    alt: n.senderName,
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-10 h-10 rounded-full object-cover border border-[#262420] flex-shrink-0"
  }), React.createElement("div", {
    className: "flex-1 min-w-0"
  }, React.createElement("p", {
    className: "text-xs text-[#F2EBDD] font-mono leading-relaxed"
  }, React.createElement("strong", {
    className: "text-[#FF5428] mr-2"
  }, "@", n.senderName), React.createElement("span", null, n.message)), React.createElement("span", {
    className: "text-[10px] text-[#85817A] block pt-1 font-mono"
  }, "TIMESTAMP: ", formatTimeAgo(n.createdAt)))))));
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
      if (showToast) showToast("COULD NOT PROCESS IMAGE FILE", "error");
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!imagePreview) {
      if (showToast) showToast("PLEASE ATTACH A FOOD PHOTOGRAPH", "error");
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
        if (showToast) showToast("FOOD BITE TRANSMISSION IS LIVE FOR 24H ★", "success");
        onStoryUploaded && onStoryUploaded();
        onClose();
      } else {
        if (showToast) showToast(resData && resData.error || "FAILED TO TRANSMIT FOOD BITE", "error");
      }
    } catch (err) {
      if (showToast) showToast("NETWORK ERROR TRANSMITTING BITE", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-editorial animate-fade-in",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-lg bg-[#181714] border border-[#262420] shadow-2xl overflow-hidden animate-pop-in text-left max-h-[92vh] flex flex-col font-mono",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 border-b border-[#262420] flex items-center justify-between bg-[#11110F]"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-xs text-[#FF5428]"
  }, "01 /"), React.createElement("h3", {
    className: "text-sm font-bold text-[#F7F4ED] tracking-wider uppercase"
  }, "DISPATCH A BITE")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-xs text-[#85817A] hover:text-[#F7F4ED] p-1 cursor-pointer font-bold"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSubmit,
    className: "p-6 space-y-4 overflow-y-auto flex-1 text-left"
  }, React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-[10px] text-[#85817A] uppercase tracking-wider block font-bold"
  }, "FOOD PHOTOGRAPH (REQUIRED)"), React.createElement("div", {
    onClick: () => fileInputRef.current && fileInputRef.current.click(),
    className: "relative w-full aspect-[16/10] border-2 border-dashed border-[#262420] hover:border-[#FF5428] bg-[#11110F] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group"
  }, imagePreview ? React.createElement(React.Fragment, null, React.createElement("img", {
    src: imagePreview,
    alt: "Preview",
    className: "w-full h-full object-cover"
  }), React.createElement("div", {
    className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-mono text-[#F7F4ED] uppercase"
  }, "[ TAP TO CHANGE PHOTOGRAPH ]")) : React.createElement("div", {
    className: "text-center p-4 space-y-2"
  }, React.createElement("span", {
    className: "text-3xl font-mono text-[#FF5428] block"
  }, "+"), React.createElement("div", {
    className: "text-xs font-mono font-bold text-[#F7F4ED] uppercase"
  }, "CLICK TO ATTACH FOOD PHOTO"), React.createElement("p", {
    className: "text-[10px] text-[#85817A] font-mono"
  }, "JPEG, PNG, WEBP \u2022 COMPRESSED ON DEVICE")), React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif",
    capture: "environment",
    onChange: handleFileSelect,
    className: "hidden"
  }))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-[10px] text-[#85817A] uppercase tracking-wider block font-bold"
  }, "DISH TITLE / CREATION NAME"), React.createElement("input", {
    type: "text",
    required: true,
    value: dishTitle,
    onChange: e => setDishTitle(e.target.value),
    placeholder: "E.G. CHARRED TRUFFLE PIZZA, BIRRIA TACOS...",
    className: "w-full px-4 py-3 bg-[#11110F] border border-[#262420] text-xs font-mono text-[#F7F4ED] placeholder:text-[#85817A] focus:outline-none focus:border-[#FF5428] transition-all"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-[10px] text-[#85817A] uppercase tracking-wider block font-bold"
  }, "CULINARY NOTES / TASTE REPORT"), React.createElement("textarea", {
    rows: 3,
    value: caption,
    onChange: e => setCaption(e.target.value),
    placeholder: "Flavors, crust fermentation, spices, secret recipes...",
    className: "w-full px-4 py-3 bg-[#11110F] border border-[#262420] text-xs font-mono text-[#F7F4ED] placeholder:text-[#85817A] focus:outline-none focus:border-[#FF5428] transition-all resize-none"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-[10px] text-[#85817A] uppercase tracking-wider block font-bold"
  }, "SELECT CATEGORY"), React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-2"
  }, CATEGORIES.filter(c => c.id !== "all" && c.id !== "trending").map(cat => React.createElement("button", {
    key: cat.id,
    type: "button",
    onClick: () => setCategory(cat.id),
    className: `px-2.5 py-2 text-[10px] font-mono tracking-wider transition-all cursor-pointer truncate ${category === cat.id ? "bg-[#FF5428] text-black font-bold border border-[#FF5428]" : "bg-[#11110F] text-[#85817A] border border-[#262420] hover:border-[#3D3A34]"}`
  }, cat.label)))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-[10px] text-[#85817A] uppercase tracking-wider block font-bold"
  }, "LOCATION OR RESTAURANT (OPTIONAL)"), React.createElement("input", {
    type: "text",
    value: locationTag,
    onChange: e => setLocationTag(e.target.value),
    placeholder: "E.G. BANDRA WEST, MUMBAI OR HOMEMADE",
    className: "w-full px-4 py-3 bg-[#11110F] border border-[#262420] text-xs font-mono text-[#F7F4ED] placeholder:text-[#85817A] focus:outline-none focus:border-[#FF5428] transition-all"
  })), React.createElement("div", {
    className: "pt-3"
  }, React.createElement("button", {
    type: "submit",
    disabled: isSubmitting || !imagePreview,
    className: "w-full py-4 btn-editorial-primary text-xs font-mono font-bold tracking-widest uppercase cursor-pointer disabled:opacity-40"
  }, isSubmitting ? "TRANSMITTING TO ARCHIVE..." : "PUBLISH TRANSMISSION (24H LIVE) →")))));
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
    className: "fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-fade-in font-mono",
    onClick: onClose
  }, React.createElement("div", {
    className: "relative w-full max-w-sm overflow-hidden bg-[#11110F] border border-[#262420] aspect-[9/16] shadow-2xl flex flex-col justify-between",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "relative z-20 p-4 space-y-3 bg-gradient-to-b from-black via-black/80 to-transparent"
  }, React.createElement("div", {
    className: "w-full h-1 bg-[#262420] overflow-hidden"
  }, React.createElement("div", {
    className: "w-full h-full bg-[#FF5428] animate-pulse"
  })), React.createElement("div", {
    className: "flex items-center justify-between text-[#F7F4ED]"
  }, React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, React.createElement("img", {
    src: story.userAvatar || "/uploads/avatars/" + (story.username || "sachin") + ".svg",
    alt: story.username,
    onError: e => {
      e.currentTarget.src = "/uploads/avatars/sachin.svg";
    },
    className: "w-8 h-8 rounded-full object-cover border border-[#FF5428]"
  }), React.createElement("div", null, React.createElement("h4", {
    className: "text-xs font-bold font-mono"
  }, "@", story.username), React.createElement("span", {
    className: "text-[10px] text-[#85817A]"
  }, formatTimeAgo(story.createdAt)))), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-[#85817A] hover:text-[#F7F4ED] text-sm font-bold p-1 cursor-pointer"
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
    className: "relative z-20 p-4 bg-gradient-to-t from-black via-black/80 to-transparent text-[#F7F4ED] space-y-2 text-left"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "px-2 py-0.5 bg-[#FF5428] text-black text-[9px] font-bold uppercase"
  }, story.category || "CULINARY"), React.createElement("span", {
    className: "text-[10px] text-[#FF5428] font-mono"
  }, "EXP: ", formatHoursLeft(story.expiresAt))), React.createElement("p", {
    className: "text-xs font-sans leading-relaxed text-[#F2EBDD]"
  }, decodeUnicode(story.caption)))));
}
function InstallAppModal({
  isOpen,
  onClose
}) {
  if (!isOpen) return null;
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-editorial animate-fade-in font-mono",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-[#181714] border border-[#262420] shadow-2xl p-6 text-center space-y-4 animate-pop-in",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "w-12 h-12 bg-[#FF5428] text-black font-mono font-bold flex items-center justify-center text-xl mx-auto"
  }, "FB"), React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("h3", {
    className: "text-sm font-bold text-[#F7F4ED] font-mono uppercase tracking-wide"
  }, "INSTALL FOODBITE APPLICATION"), React.createElement("p", {
    className: "text-xs text-[#85817A] font-sans"
  }, "Add FoodBite to your mobile or desktop environment for immediate camera capture and high-speed browsing.")), React.createElement("div", {
    className: "p-3 bg-[#11110F] border border-[#262420] text-xs text-[#F2EBDD] text-left space-y-2"
  }, React.createElement("div", {
    className: "font-bold text-[#FF5428]"
  }, "INSTALLATION PROTOCOL:"), React.createElement("div", null, "\u2022 ", React.createElement("strong", null, "CHROME / ANDROID:"), " Tap menu \u22EE and choose \"Install App\""), React.createElement("div", null, "\u2022 ", React.createElement("strong", null, "SAFARI / IOS:"), " Tap Share \u238B and choose \"Add to Home Screen\"")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-full py-3.5 btn-editorial-primary text-xs font-bold uppercase tracking-wider cursor-pointer"
  }, "CONFIRM & CLOSE")));
}
function AnnouncementModal({
  announcement,
  isOpen,
  onClose
}) {
  if (!isOpen || !announcement || !announcement.enabled) return null;
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-editorial animate-fade-in font-mono",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-md bg-[#181714] border border-[#FF5428] shadow-2xl overflow-hidden animate-pop-in text-left",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 bg-[#2A100C] border-b border-[#FF5428] text-[#F7F4ED] flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-xs text-[#FF5428] font-bold animate-pulse"
  }, "\u25CF"), React.createElement("h3", {
    className: "text-xs font-bold uppercase tracking-wider"
  }, announcement.title || "COMMUNITY TRANSMISSION")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-[#85817A] hover:text-[#F7F4ED] text-xs font-bold cursor-pointer"
  }, "\u2715")), React.createElement("div", {
    className: "p-6 space-y-4"
  }, React.createElement("div", {
    className: "text-[10px] text-[#FF5428] uppercase tracking-widest"
  }, "PRIORITY: SYSTEM_NOTICE / STATUS: ACTIVE"), React.createElement("p", {
    className: "text-xs text-[#F2EBDD] leading-relaxed whitespace-pre-line font-sans"
  }, announcement.message || "Welcome to FoodBite!"), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "w-full py-3.5 btn-editorial-primary text-xs font-bold uppercase tracking-wider cursor-pointer"
  }, "ACKNOWLEDGE & ENTER ARCHIVE \u2192"))));
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
        if (showToast) showToast("BROADCAST SETTINGS SAVED &amp; DEPLOYED", "success");
        onSaveAnnouncement && onSaveAnnouncement(data.announcement || {
          enabled,
          title,
          message
        });
        onClose();
      } else {
        if (showToast) showToast("FAILED TO SAVE BROADCAST SETTINGS", "error");
      }
    } catch (err) {
      if (showToast) showToast("CONNECTION ERROR SAVING BROADCAST", "error");
    } finally {
      setIsSaving(false);
    }
  };
  return React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-editorial animate-fade-in font-mono",
    onClick: onClose
  }, React.createElement("div", {
    className: "w-full max-w-lg bg-[#181714] border border-[#262420] shadow-2xl overflow-hidden animate-pop-in text-left max-h-[90vh] flex flex-col",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "px-6 py-4 border-b border-[#262420] flex items-center justify-between bg-[#11110F]"
  }, React.createElement("div", {
    className: "flex items-center space-x-2"
  }, React.createElement("span", {
    className: "text-xs text-[#FF5428]"
  }, "ADMIN /"), React.createElement("h3", {
    className: "text-xs font-bold text-[#F7F4ED] uppercase tracking-wider"
  }, "BROADCAST & POPUP MANAGER")), React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "p-1 text-[#85817A] hover:text-[#F7F4ED] cursor-pointer text-xs font-bold"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSave,
    className: "p-6 space-y-4 overflow-y-auto flex-1"
  }, React.createElement("div", {
    className: "flex items-center justify-between p-3.5 bg-[#11110F] border border-[#262420]"
  }, React.createElement("div", null, React.createElement("h4", {
    className: "text-xs font-bold text-[#F7F4ED] uppercase"
  }, "VISITOR POPUP WINDOW"), React.createElement("p", {
    className: "text-[10px] text-[#85817A]"
  }, "Show maintenance or announcement notice to all visitors")), React.createElement("label", {
    className: "relative inline-flex items-center cursor-pointer"
  }, React.createElement("input", {
    type: "checkbox",
    checked: enabled,
    onChange: e => setEnabled(e.target.checked),
    className: "sr-only peer"
  }), React.createElement("div", {
    className: "w-11 h-6 bg-[#262420] rounded-none peer peer-checked:bg-[#FF5428] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
  }))), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-[10px] font-bold text-[#85817A] uppercase tracking-wider block"
  }, "POPUP TITLE"), React.createElement("input", {
    type: "text",
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "E.G. SCHEDULED SYSTEM MAINTENANCE",
    className: "w-full px-4 py-3 bg-[#11110F] border border-[#262420] text-xs font-mono text-[#F7F4ED] placeholder:text-[#85817A] focus:outline-none focus:border-[#FF5428]"
  })), React.createElement("div", {
    className: "space-y-1.5"
  }, React.createElement("label", {
    className: "text-[10px] font-bold text-[#85817A] uppercase tracking-wider block"
  }, "POPUP MESSAGE"), React.createElement("textarea", {
    rows: 4,
    value: message,
    onChange: e => setMessage(e.target.value),
    placeholder: "Enter message text for site visitors...",
    className: "w-full px-4 py-3 bg-[#11110F] border border-[#262420] text-xs font-mono text-[#F7F4ED] placeholder:text-[#85817A] focus:outline-none focus:border-[#FF5428] resize-none"
  })), React.createElement("div", {
    className: "pt-2"
  }, React.createElement("button", {
    type: "submit",
    disabled: isSaving,
    className: "w-full py-4 btn-editorial-primary text-xs font-bold uppercase tracking-wider cursor-pointer"
  }, isSaving ? "SAVING..." : "DISPATCH BROADCAST TO PLATFORM →")))));
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
        if (!silent) setFeedError("FAILED TO RETRIEVE FOOD ARCHIVE.");
      }
    } catch (err) {
      if (!silent) setFeedError("NETWORK INTERFACE DISRUPTION.");
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
    showToast(isCurrentlyFollowing ? "UNFOLLOWED @" + (targetUsername || "user") : "NOW FOLLOWING @" + (targetUsername || "user") + " ★", "success");
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
        showToast("TRANSMISSION ARCHIVED / DELETED", "info");
        fetchProfile(uid);
      } else {
        showToast(data && data.error ? data.error : "COULD NOT REMOVE TRANSMISSION", "error");
      }
    } catch (err) {
      showToast("FAILED TO DELETE TRANSMISSION", "error");
    }
  };
  const toggleLike = async postId => {
    if (!currentUser) {
      showToast("AUTHENTICATION REQUIRED TO LOG CRAVES", "info");
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
    showToast("EDITORIAL NOTE TRANSMITTED 💬", "success");
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
        showToast("TRANSMISSION LINK COPIED 🔗", "info");
      } catch (e) {
        showToast("LINK: " + window.location.href, "info");
      }
    }
  };
  const toggleSave = postId => {
    const isSaved = !savedPosts[postId];
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !isSaved
    }));
    showToast(isSaved ? "REMOVED FROM ARCHIVES" : "ADDED TO PERSONAL ARCHIVE ■", "info");
  };
  const handleLogout = () => {
    localStorage.removeItem("foodbite_session");
    setCurrentUser(null);
    showToast("SESSION TERMINATED", "info");
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
      className: "min-h-screen w-full bg-[#11110F] text-[#F2EBDD]"
    }, React.createElement(AuthScreen, {
      onAuthSuccess: (user, token) => {
        localStorage.setItem("foodbite_session", JSON.stringify({
          user,
          token
        }));
        setCurrentUser(user);
        showToast("ACCESS GRANTED. WELCOME @" + (user.username || user.name) + " ★", "success");
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
    className: "min-h-screen w-full flex flex-col bg-[#11110F] text-[#F2EBDD] antialiased"
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
  }, React.createElement(EditorialHeroSection, {
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
  }, React.createElement(ForYouShelf, {
    stories: stories,
    onViewStory: s => setViewingStory(s),
    onLike: toggleLike,
    likes: likes
  }), React.createElement(TrendingNowShelf, {
    stories: stories,
    onViewStory: s => setViewingStory(s)
  }), React.createElement(PopularNearYouShelf, null), React.createElement("div", {
    className: "pt-4 text-left border-b border-[#262420] pb-4 flex flex-wrap items-center justify-between gap-3"
  }, React.createElement("div", {
    className: "space-y-1"
  }, React.createElement("div", {
    className: "flex items-center space-x-2 text-xs font-mono text-[#FF5428]"
  }, React.createElement("span", null, "06 /"), React.createElement("span", {
    className: "text-[#85817A] uppercase tracking-widest"
  }, "LIVE TRANSMISSION FEED")), React.createElement("h2", {
    className: "text-2xl sm:text-3xl font-black text-[#F7F4ED] tracking-tight font-heading uppercase"
  }, searchQuery ? `TRANSMISSIONS MATCHING "${searchQuery}"` : activeCategory !== "all" ? `${activeCategory.toUpperCase()} ARCHIVE` : "THE CHRONICLES OF FLAVOR")), React.createElement("span", {
    className: "text-xs font-mono text-[#85817A]"
  }, filteredStories.length, " TRANSMISSIONS REGISTERED")), feedError && React.createElement(ErrorState, {
    message: feedError,
    onRetry: fetchStories
  }), isLoadingFeed ? React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, React.createElement(FoodCardSkeleton, null), React.createElement(FoodCardSkeleton, null), React.createElement(FoodCardSkeleton, null)) : filteredStories.length === 0 ? React.createElement(EmptyState, {
    title: searchQuery ? "NO TRANSMISSIONS MATCHED SEARCH" : "NO ACTIVE FOOD TRANSMISSIONS",
    message: searchQuery ? "TRY SEARCHING FOR STREET FOOD, DESSERTS, NOODLES, OR ANOTHER CHEF." : "BE THE FIRST CULINARY ARTIST TO TRANSMIT YOUR DISH TODAY!",
    actionLabel: searchQuery ? "CLEAR QUERY" : "+ TRANSMIT FIRST BITE",
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
    className: "w-full py-10 border-t border-[#262420] bg-[#11110F] text-xs font-mono text-[#85817A] mt-auto hidden md:block text-left"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto px-6 space-y-6"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4 border-b border-[#262420] pb-6"
  }, React.createElement("div", null, React.createElement("span", {
    className: "text-xl font-heading font-black text-[#F7F4ED] tracking-widest block uppercase"
  }, "FOODBITE\xAE"), React.createElement("span", {
    className: "text-[10px] text-[#FF5428] uppercase tracking-widest block pt-0.5"
  }, "DISCOVER. SHARE. CRAVE.")), React.createElement("div", {
    className: "flex items-center space-x-6 text-[11px] text-[#85817A]"
  }, React.createElement("span", null, "EDITION 2026 / VOL. 26"), React.createElement("span", null, "\u2022"), React.createElement("span", null, "STREET GASTRONOMY ARCHIVE"), React.createElement("span", null, "\u2022"), React.createElement("span", {
    className: "text-[#FF5428]"
  }, "STATUS: LIVE"))), React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4 text-[10px]"
  }, React.createElement("p", {
    className: "text-[#85817A] tracking-wider uppercase"
  }, "\xA9 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari."), React.createElement("div", {
    className: "flex items-center space-x-4 text-[#85817A]"
  }, React.createElement("span", {
    className: "hover:text-[#F7F4ED] cursor-pointer"
  }, "TERMS"), React.createElement("span", null, "/"), React.createElement("span", {
    className: "hover:text-[#F7F4ED] cursor-pointer"
  }, "PRIVACY"), React.createElement("span", null, "/"), React.createElement("span", {
    className: "hover:text-[#F7F4ED] cursor-pointer"
  }, "CULINARY MANIFESTO"))))), React.createElement(MobileBottomNav, {
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

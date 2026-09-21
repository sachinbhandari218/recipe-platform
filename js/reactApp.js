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

const CATEGORIES = [
  { id: "all", label: "All Bites", icon: "✨" },
  { id: "trending", label: "Trending", icon: "🔥" },
  { id: "street", label: "Street Food", icon: "🌮" },
  { id: "pizza", label: "Pizza & Pasta", icon: "🍕" },
  { id: "healthy", label: "Healthy Bowls", icon: "🥗" },
  { id: "desserts", label: "Desserts & Bakery", icon: "🍰" },
  { id: "drinks", label: "Coffee & Drinks", icon: "☕" }
];

function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed top-5 inset-x-4 max-w-sm mx-auto z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        let bgClass = "bg-white border-[#e8e4dc] text-[#1a1917] shadow-lg";
        let icon = "ℹ️";
        if (toast.type === "success") {
          bgClass = "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-lg shadow-emerald-900/10";
          icon = "✅";
        } else if (toast.type === "error") {
          bgClass = "bg-rose-50 border-rose-300 text-rose-950 shadow-lg shadow-rose-900/10";
          icon = "⚠️";
        } else if (toast.type === "warning") {
          bgClass = "bg-amber-50 border-amber-300 text-amber-950 shadow-lg shadow-amber-900/10";
          icon = "⚡";
        }
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border backdrop-blur-md transition-all animate-pop-in ${bgClass}`}
          >
            <div className="flex items-center space-x-2.5 mr-3">
              <span className="text-base">{icon}</span>
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-[#736f68] hover:text-[#1a1917] p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
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

function EmptyState({ icon = "🍽️", title = "No bites here yet", description = "Be the first person to share something delicious.", actionText, onAction }) {
  return (
    <div className="w-full max-w-md mx-auto my-10 p-8 text-center bg-white border border-[#e8e4dc] rounded-2xl shadow-xs space-y-3.5">
      <div className="w-14 h-14 rounded-2xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] text-2xl flex items-center justify-center mx-auto shadow-2xs">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#121214] tracking-tight">{title}</h3>
      <p className="text-xs text-[#736f68] leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
      {actionText && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-5 py-2.5 rounded-xl bg-[#f05a28] hover:bg-[#d94918] text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer inline-flex items-center space-x-2"
          >
            <span>🔥</span>
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="w-full max-w-md mx-auto my-8 p-6 text-center bg-white border border-rose-200 rounded-2xl shadow-xs space-y-3">
      <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 text-xl flex items-center justify-center mx-auto">
        ⚠️
      </div>
      <h3 className="text-sm font-bold text-[#121214]">Something went wrong</h3>
      <p className="text-xs text-[#736f68] leading-relaxed">
        {message || "FoodBite couldn&apos;t load this content. Please try again."}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-[#121214] hover:bg-black text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

function FoodCardSkeleton() {
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-2xl p-4 space-y-3.5 shadow-2xs">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-full skeleton-shimmer flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="w-24 h-3 rounded-md skeleton-shimmer" />
          <div className="w-16 h-2.5 rounded-md skeleton-shimmer" />
        </div>
        <div className="w-14 h-5 rounded-full skeleton-shimmer" />
      </div>
      <div className="w-full aspect-[4/3] rounded-xl skeleton-shimmer" />
      <div className="space-y-2 pt-1">
        <div className="w-3/4 h-3.5 rounded-md skeleton-shimmer" />
        <div className="w-full h-2.5 rounded-md skeleton-shimmer" />
        <div className="w-1/2 h-2.5 rounded-md skeleton-shimmer" />
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-[#f0ece4]">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-md skeleton-shimmer" />
          <div className="w-5 h-5 rounded-md skeleton-shimmer" />
          <div className="w-5 h-5 rounded-md skeleton-shimmer" />
        </div>
        <div className="w-5 h-5 rounded-md skeleton-shimmer" />
      </div>
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
      if (resp.ok && data && data.success) {
        onAuthSuccess(data.user, data.token);
      } else {
        setErrorMessage((data && data.message) ? data.message : "Could not sign in with this username");
      }
    } catch (err) {
      setErrorMessage("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fbf9f6]">
      <div className="w-full max-w-sm bg-white border border-[#e8e4dc] rounded-2xl p-7 shadow-lg shadow-black/5 text-[#1a1917] space-y-5 animate-pop-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] flex items-center justify-center text-2xl mx-auto shadow-2xs">
            🔥
          </div>
          <h2 className="text-xl font-bold text-[#121214] tracking-tight">FoodBite</h2>
          <p className="text-[11px] uppercase tracking-widest text-[#f05a28] font-semibold">Discover. Share. Crave.</p>
          <p className="text-xs text-[#736f68] leading-relaxed max-w-xs mx-auto pt-1">
            Enter your username to explore fresh daily food stories and share your cravings. No password required.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center animate-fade-in">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-[#121214] block">Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#a6a198] font-mono">@</span>
              <input
                type="text"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="chef_sachin"
                maxLength={30}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs font-medium text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white focus:ring-2 focus:ring-[#f05a28]/10 transition-all"
              />
            </div>
            <p className="text-[10px] text-[#736f68]">
              Existing profiles resume immediately; new usernames create a profile instantly.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !cleanUsername}
            className="w-full py-3 rounded-xl bg-[#121214] hover:bg-black text-white text-xs font-semibold tracking-wide disabled:opacity-40 shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span>Entering...</span>
            ) : (
              <>
                <span>Continue to FoodBite</span>
                <span>&rarr;</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-[#f0ece4]">
          <p className="text-[10px] text-[#a6a198]">
            &copy; 2026 Online Recipe Sharing Platform. Built &amp; Engineered by Sachin Bhandari.
          </p>
        </div>
      </div>
    </div>
  );
}

function HomeHeroSection({ onExplore, onShareFood }) {
  return (
    <section className="w-full bg-white border-b border-[#e8e4dc] py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl space-y-3 text-left">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] text-[11px] font-semibold">
            <span>🔥</span>
            <span>24-Hour Ephemeral Food Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#121214] leading-tight font-heading">
            Discover food. Share your cravings.
          </h1>
          <p className="text-xs sm:text-sm text-[#736f68] leading-relaxed">
            FoodBite is a social discovery platform where everyday food lovers and home chefs share their daily food creations. Every post stays fresh for 24 hours to keep the community vibrant.
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onExplore}
              className="px-4 py-2 rounded-xl bg-[#121214] hover:bg-black text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
            >
              Explore Food
            </button>
            <button
              type="button"
              onClick={onShareFood}
              className="px-4 py-2 rounded-xl bg-[#f05a28] hover:bg-[#d94918] text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer inline-flex items-center space-x-1.5"
            >
              <span>+</span>
              <span>Share Food</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3 overflow-hidden py-1">
          <div className="w-32 sm:w-36 rounded-xl overflow-hidden border border-[#e8e4dc] shadow-sm bg-white">
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=300&q=80"
              alt="Stone Baked Pizza"
              className="w-full h-24 sm:h-28 object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="p-2 text-left">
              <span className="text-[9px] font-bold text-[#f05a28] uppercase">Pizza</span>
              <p className="text-[11px] font-semibold text-[#121214] truncate">Truffle Margherita</p>
            </div>
          </div>
          <div className="w-32 sm:w-36 rounded-xl overflow-hidden border border-[#e8e4dc] shadow-sm bg-white -translate-y-2">
            <img
              src="https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=300&q=80"
              alt="Artisan Ramen"
              className="w-full h-24 sm:h-28 object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="p-2 text-left">
              <span className="text-[9px] font-bold text-[#f05a28] uppercase">Bowls</span>
              <p className="text-[11px] font-semibold text-[#121214] truncate">Spicy Tonkotsu</p>
            </div>
          </div>
          <div className="w-32 sm:w-36 rounded-xl overflow-hidden border border-[#e8e4dc] shadow-sm bg-white hidden sm:block">
            <img
              src="https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=300&q=80"
              alt="Bakery Pastry"
              className="w-full h-24 sm:h-28 object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="p-2 text-left">
              <span className="text-[9px] font-bold text-[#f05a28] uppercase">Desserts</span>
              <p className="text-[11px] font-semibold text-[#121214] truncate">Honey Brioche</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoriesTray({ stories, currentUser, onTriggerUpload, onViewStory }) {
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

  const avatarUrl = currentUser && (currentUser.avatar || currentUser.avatarUrl)
    ? (currentUser.avatar || currentUser.avatarUrl)
    : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

  return (
    <div className="w-full bg-white border-b border-[#e8e4dc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center space-x-4 overflow-x-auto scrollbar-none">
        <div
          onClick={onTriggerUpload}
          className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group"
          title="Share Food Story"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-full p-[2px] border-2 border-dashed border-[#f05a28] flex items-center justify-center bg-[#fbf9f6] group-hover:scale-105 transition-transform">
              <img
                src={avatarUrl}
                alt="Your Story"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#f05a28] text-white flex items-center justify-center text-[10px] font-bold border border-white shadow-xs">
              +
            </div>
          </div>
          <span className="text-[11px] font-medium text-[#121214]">Your Story</span>
        </div>

        {distinctCreators.map((creatorStory, idx) => (
          <div
            key={creatorStory.id || idx}
            onClick={() => onViewStory(creatorStory)}
            className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group"
          >
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#f05a28] via-amber-500 to-rose-500 group-hover:scale-105 transition-transform shadow-2xs">
              <div className="p-[1.5px] bg-white rounded-full">
                <img
                  src={creatorStory.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                  alt={creatorStory.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#736f68] max-w-[64px] truncate text-center group-hover:text-[#121214] transition-colors">
              {creatorStory.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendingNowShelf({ stories, onViewStory }) {
  if (!stories || stories.length === 0) return null;

  const topBites = useMemo(() => {
    return stories.slice(0, 6);
  }, [stories]);

  return (
    <div className="w-full py-4 text-left">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-sm font-bold text-[#121214] tracking-tight flex items-center space-x-1.5">
            <span>🔥</span>
            <span>Trending Bites</span>
          </h2>
          <p className="text-[11px] text-[#736f68]">Popular dishes right now</p>
        </div>
      </div>

      <div className="flex items-center space-x-3.5 overflow-x-auto scrollbar-none pb-2">
        {topBites.map((story) => (
          <div
            key={story.id}
            onClick={() => onViewStory(story)}
            className="flex-shrink-0 w-44 rounded-xl bg-white border border-[#e8e4dc] overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group text-left"
          >
            <div className="relative aspect-[4/3] bg-[#f5f2eb] overflow-hidden">
              {story.mediaType === "video" ? (
                <video src={story.mediaUrl} className="w-full h-full object-cover" />
              ) : (
                <img
                  src={story.mediaUrl}
                  alt={story.caption || "Food item"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                ⏳ {formatHoursLeft(story.expiresAt)}
              </span>
            </div>
            <div className="p-2.5 space-y-1">
              <p className="text-xs font-semibold text-[#121214] truncate">
                {decodeUnicode(story.caption) || "Daily Food Creation"}
              </p>
              <div className="flex items-center space-x-1.5 text-[10px] text-[#736f68]">
                <span>@{story.username}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchFilterBar({ searchQuery, setSearchQuery, activeCategory, setActiveCategory }) {
  return (
    <div className="w-full space-y-3 py-2 text-left">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#736f68]">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search food, dishes, or cravings..."
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:ring-2 focus:ring-[#f05a28]/10 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a6a198] hover:text-[#121214] text-xs p-0.5 rounded-md cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                isActive
                  ? "bg-[#121214] text-white shadow-2xs"
                  : "bg-white hover:bg-[#f5f2eb] border border-[#e8e4dc] text-[#736f68] hover:text-[#121214]"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FoodCard({
  post,
  currentUserId,
  isFollowing,
  onToggleFollow,
  onLike,
  isLiked,
  likeCount,
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

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const clean = commentText.trim();
    if (!clean) return;
    onAddComment(post.id, clean);
    setCommentText("");
    setShowComments(true);
  };

  return (
    <article className="food-card p-4 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div
          onClick={() => onViewStory(post)}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-[#f05a28] to-amber-500">
            <img
              src={post.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
              alt={post.username}
              className="w-8 h-8 rounded-full object-cover border border-white"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-bold text-[#121214] group-hover:text-[#f05a28] transition-colors">
                {post.username}
              </h4>
              {!isOwner && onToggleFollow && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFollow(post.userId, post.username);
                  }}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                    isFollowing
                      ? "bg-[#f5f2eb] text-[#736f68] hover:bg-[#e8e4dc]"
                      : "bg-[#fff5f0] text-[#f05a28] hover:bg-[#ffe8de]"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
            <span className="text-[10px] text-[#a6a198] block">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-medium text-[#f05a28] px-2 py-0.5 rounded-full bg-[#fff5f0] border border-[#ffe8de]">
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
              className="p-1 rounded-lg text-[#a6a198] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete Story"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div
        onDoubleClick={() => onDoubleTap(post)}
        className="relative w-full aspect-[4/3] bg-[#f5f2eb] rounded-xl overflow-hidden cursor-pointer select-none flex items-center justify-center group"
      >
        <div
          className="absolute inset-0 bg-cover bg-center scale-125 blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${post.mediaUrl})` }}
        />

        {post.mediaType === "video" ? (
          <video
            src={post.mediaUrl}
            loop
            muted
            playsInline
            autoPlay
            className="relative z-10 w-full h-full object-cover"
          />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption || "Food photo"}
            className="relative z-10 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        )}

        {heartBurst && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-heart-burst">
            <span className="text-6xl filter drop-shadow-lg">❤️</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {dishTitle && (
          <h3 className="text-sm font-bold text-[#121214] tracking-tight">
            {dishTitle}
          </h3>
        )}
        {dishDescription && (
          <p className="text-xs text-[#736f68] leading-relaxed line-clamp-2">
            {dishDescription}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-[#f0ece4] flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <button
            type="button"
            onClick={() => onLike(post.id)}
            className="flex items-center space-x-1 text-xs font-semibold text-[#121214] hover:text-[#f05a28] transition-colors cursor-pointer"
            title={isLiked ? "Unlike" : "Like"}
          >
            <span className={isLiked ? "text-[#f05a28] scale-110" : "text-[#736f68]"}>
              {isLiked ? "❤️" : "🤍"}
            </span>
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments((prev) => !prev)}
            className="flex items-center space-x-1 text-xs font-semibold text-[#736f68] hover:text-[#121214] transition-colors cursor-pointer"
            title="Comments"
          >
            <span>💬</span>
            <span>{(comments || []).length}</span>
          </button>

          <button
            type="button"
            onClick={() => onShare(post)}
            className="text-xs text-[#736f68] hover:text-[#121214] transition-colors cursor-pointer"
            title="Share Food"
          >
            ↗️
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSave(post.id)}
          className={`text-xs transition-colors cursor-pointer ${
            isSaved ? "text-[#f05a28]" : "text-[#a6a198] hover:text-[#121214]"
          }`}
          title={isSaved ? "Saved" : "Save"}
        >
          {isSaved ? "🔖" : "🏷️"}
        </button>
      </div>

      {showComments && comments && comments.length > 0 && (
        <div className="pt-2 space-y-1.5 max-h-32 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="text-xs text-[#736f68] leading-tight">
              <strong className="text-[#121214] mr-1.5">@{c.author}</strong>
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCommentSubmit} className="pt-1 flex items-center space-x-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-1.5 rounded-lg bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white transition-colors"
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className="px-2.5 py-1.5 rounded-lg bg-[#121214] hover:bg-black disabled:opacity-30 text-white text-[11px] font-semibold transition-colors cursor-pointer"
        >
          Post
        </button>
      </form>
    </article>
  );
}

function DesktopNavBar({ activeTab, setActiveTab, onTriggerUpload, userProfile, unreadCount, onTriggerInstall, currentUser }) {
  const streak = userProfile && userProfile.user ? (userProfile.user.streak || 0) : 0;
  const avatarUrl = currentUser && (currentUser.avatar || currentUser.avatarUrl)
    ? (currentUser.avatar || currentUser.avatarUrl)
    : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc]">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] flex items-center justify-center text-lg shadow-2xs">
              🔥
            </div>
            <div>
              <h1 className="text-base font-bold text-[#121214] tracking-tight leading-none font-heading">
                FoodBite
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-[#f05a28] font-semibold block mt-0.5">
                Discover. Share. Crave.
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "home" ? "bg-[#f5f2eb] text-[#121214]" : "text-[#736f68] hover:text-[#121214]"
              }`}
            >
              Feed
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "activity" ? "bg-[#f5f2eb] text-[#121214]" : "text-[#736f68] hover:text-[#121214]"
              }`}
            >
              Activity
              {unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#f05a28] text-white text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "profile" ? "bg-[#f5f2eb] text-[#121214]" : "text-[#736f68] hover:text-[#121214]"
              }`}
            >
              Profile
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <div
            onClick={() => setActiveTab("profile")}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#fff5f0] border border-[#ffe8de] text-xs font-bold text-[#f05a28] cursor-pointer"
            title="Daily Active Streak"
          >
            <span>🔥</span>
            <span>{streak}d Streak</span>
          </div>

          <button
            type="button"
            onClick={onTriggerInstall}
            className="px-3 py-1.5 rounded-xl bg-[#f5f2eb] hover:bg-[#e8e4dc] text-[#121214] text-xs font-medium transition-colors cursor-pointer"
          >
            📱 App
          </button>

          <button
            type="button"
            onClick={onTriggerUpload}
            className="px-4 py-2 rounded-xl bg-[#f05a28] hover:bg-[#d94918] text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span>+</span>
            <span>Share Food</span>
          </button>

          <div
            onClick={() => setActiveTab("profile")}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#e8e4dc] cursor-pointer hover:ring-2 hover:ring-[#f05a28]/30 transition-all"
          >
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileTopBar({ streak, onTriggerInstall, onLogoClick }) {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc] px-4 py-2.5 flex items-center justify-between">
      <div onClick={onLogoClick} className="flex items-center space-x-2 cursor-pointer">
        <span className="text-xl">🔥</span>
        <div>
          <h1 className="text-sm font-bold text-[#121214] leading-none font-heading">FoodBite</h1>
          <span className="text-[9px] uppercase tracking-wider text-[#f05a28] font-semibold">Discover. Share. Crave.</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#fff5f0] border border-[#ffe8de] text-[11px] font-bold text-[#f05a28]">
          <span>🔥</span>
          <span>{streak}d</span>
        </div>
        <button
          type="button"
          onClick={onTriggerInstall}
          className="px-2 py-1 rounded-lg bg-[#f5f2eb] text-[11px] font-medium text-[#121214] cursor-pointer"
        >
          📱
        </button>
      </div>
    </header>
  );
}

function MobileBottomBar({ activeTab, setActiveTab, onTriggerUpload, unreadCount }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#e8e4dc] h-16 flex items-center justify-around px-2 z-40">
      <button
        type="button"
        onClick={() => setActiveTab("home")}
        className={`flex flex-col items-center justify-center space-y-0.5 cursor-pointer ${
          activeTab === "home" ? "text-[#f05a28] font-bold" : "text-[#736f68]"
        }`}
      >
        <span className="text-lg">🏠</span>
        <span className="text-[10px]">Feed</span>
      </button>

      <button
        type="button"
        onClick={onTriggerUpload}
        className="w-11 h-11 -mt-5 rounded-full bg-[#f05a28] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
        title="Share Food"
      >
        <span className="text-xl font-bold">+</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("activity")}
        className={`relative flex flex-col items-center justify-center space-y-0.5 cursor-pointer ${
          activeTab === "activity" ? "text-[#f05a28] font-bold" : "text-[#736f68]"
        }`}
      >
        <span className="text-lg">🔔</span>
        <span className="text-[10px]">Activity</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 right-1 px-1.5 py-0.2 rounded-full bg-[#f05a28] text-white text-[9px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("profile")}
        className={`flex flex-col items-center justify-center space-y-0.5 cursor-pointer ${
          activeTab === "profile" ? "text-[#f05a28] font-bold" : "text-[#736f68]"
        }`}
      >
        <span className="text-lg">👤</span>
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
}

function ShareFoodModal({ isOpen, onClose, currentUser, onStoryUploaded, showToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [duration, setDuration] = useState(0);
  const [foodTitle, setFoodTitle] = useState("");
  const [foodCategory, setFoodCategory] = useState("Street Food");
  const [foodLocation, setFoodLocation] = useState("");
  const [description, setDescription] = useState("");
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
    setFoodTitle("");
    setFoodCategory("Street Food");
    setFoodLocation("");
    setDescription("");
    setErrorMessage("");
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!isOpen) resetForm();
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
        headers: { "Content-Type": "application/json" },
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

      if (!postResp.ok) throw new Error("Failed to save story record");
      const postData = await postResp.json();

      showToast("🔥 Food story posted! Active streak: " + postData.currentStreak + " days!", "success");
      resetForm();
      onStoryUploaded && onStoryUploaded(postData);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to post story");
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptString = [ "image", "*" ].join("/") + "," + [ "video", "*" ].join("/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#e8e4dc] p-6 text-[#1a1917] shadow-xl max-h-[90vh] overflow-y-auto text-left">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#a6a198] hover:text-[#121214] p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-5 space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#fff5f0] text-[#f05a28] text-[10px] font-bold border border-[#ffe8de]">
            <span>🔥</span>
            <span>24-Hour Story</span>
          </div>
          <h3 className="text-lg font-bold text-[#121214] tracking-tight">Share Food</h3>
          <p className="text-xs text-[#736f68]">
            Capture or upload a photo or short video (up to 10s).
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#121214] block">Media Upload</label>
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="w-full aspect-[16/9] border-2 border-dashed border-[#e8e4dc] hover:border-[#f05a28] rounded-xl flex flex-col items-center justify-center bg-[#fbf9f6] hover:bg-[#fff5f0]/30 transition-colors cursor-pointer p-4 space-y-2"
              >
                <span className="text-3xl">📷</span>
                <p className="text-xs font-medium text-[#121214]">Click to upload photo or short video</p>
                <p className="text-[10px] text-[#736f68]">JPG, PNG, WebP or MP4 up to 10s (max 50MB)</p>
              </div>
            ) : (
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {isVideo ? (
                  <video src={previewUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-medium cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptString}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#121214] block">Food Name</label>
            <input
              type="text"
              value={foodTitle}
              onChange={(e) => setFoodTitle(e.target.value)}
              placeholder="e.g. Truffle Mushroom Risotto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#121214] block">Category</label>
              <select
                value={foodCategory}
                onChange={(e) => setFoodCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] focus:outline-none focus:border-[#f05a28] focus:bg-white transition-all"
              >
                <option value="Street Food">Street Food</option>
                <option value="Pizza & Pasta">Pizza &amp; Pasta</option>
                <option value="Healthy Bowls">Healthy Bowls</option>
                <option value="Desserts & Bakery">Desserts &amp; Bakery</option>
                <option value="Coffee & Drinks">Coffee &amp; Drinks</option>
                <option value="Homemade">Homemade</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#121214] block">Location (Optional)</label>
              <input
                type="text"
                value={foodLocation}
                onChange={(e) => setFoodLocation(e.target.value)}
                placeholder="e.g. Downtown Cafe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#121214] block">Story Notes / Recipe Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell other foodies about the taste, flavors, or cooking method..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fbf9f6] border border-[#e8e4dc] text-xs text-[#121214] placeholder:text-[#a6a198] focus:outline-none focus:border-[#f05a28] focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-[#e8e4dc] text-xs font-semibold text-[#736f68] hover:text-[#121214] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="flex-1 py-2.5 rounded-xl bg-[#f05a28] hover:bg-[#d94918] disabled:opacity-40 text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              {isSubmitting ? (
                <span>Posting...</span>
              ) : (
                <>
                  <span>🔥</span>
                  <span>Share Food</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StoryViewerModal({ isOpen, story, stories, onClose, onDeletePost, currentUser }) {
  const [progress, setProgress] = useState(0);
  const currentUserId = currentUser ? (currentUser.id || currentUser.uid) : "usr-1";

  const currentIndex = useMemo(() => {
    if (!story || !stories) return 0;
    const idx = stories.findIndex((s) => s.id === story.id);
    return idx >= 0 ? idx : 0;
  }, [story, stories]);

  useEffect(() => {
    if (!isOpen || !story) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleNext();
          return 100;
        }
        return prev + 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen, story]);

  if (!isOpen || !story) return null;

  const handleNext = () => {
    if (!stories || stories.length === 0) return onClose();
    if (currentIndex < stories.length - 1) {
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("openStory", { detail: stories[currentIndex + 1] }));
      }, 50);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!stories || stories.length === 0) return;
    if (currentIndex > 0) {
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("openStory", { detail: stories[currentIndex - 1] }));
      }, 50);
    }
  };

  const isOwner = story.userId === currentUserId;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none">
      <div className="relative w-full h-full max-w-md bg-black flex flex-col justify-between overflow-hidden">
        <div className="absolute top-3 inset-x-3 z-30 flex items-center space-x-1">
          <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="absolute top-7 inset-x-4 z-30 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <img
              src={story.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
              alt={story.username}
              className="w-9 h-9 rounded-full object-cover border border-white/50"
            />
            <div>
              <p className="text-xs font-bold leading-none">{story.username}</p>
              <span className="text-[10px] text-white/70">
                {formatTimeAgo(story.createdAt)} • {formatHoursLeft(story.expiresAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isOwner && onDeletePost && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Delete this story?")) {
                    onDeletePost(story.id);
                    onClose();
                  }
                }}
                className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-xs hover:bg-rose-600 transition-colors cursor-pointer"
              >
                🗑️
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
          <div
            onClick={handlePrev}
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-pointer"
          />

          {story.mediaType === "video" ? (
            <video
              src={story.mediaUrl}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={story.mediaUrl}
              alt={story.caption || "Story"}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {story.caption && (
          <div className="absolute bottom-6 inset-x-4 z-30 p-3.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs text-left">
            <strong className="font-bold mr-1.5">{story.username}:</strong>
            <span>{decodeUnicode(story.caption)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityView({ currentUser, userProfile, notifications, onRefreshNotifs }) {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 text-left space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#121214] tracking-tight">Activity &amp; Alerts</h2>
          <p className="text-xs text-[#736f68]">Recent updates from creators you follow</p>
        </div>
        <button
          type="button"
          onClick={onRefreshNotifs}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f5f2eb] border border-[#e8e4dc] text-xs font-semibold text-[#121214] transition-colors cursor-pointer shadow-2xs"
        >
          🔄 Refresh
        </button>
      </div>

      {userProfile && userProfile.user && (
        <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] shadow-2xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] flex items-center justify-center text-xl">
              🔥
            </div>
            <div>
              <p className="text-xs font-bold text-[#121214]">Daily Streak Active</p>
              <p className="text-[11px] text-[#736f68]">
                {userProfile.user.streak > 0
                  ? userProfile.user.streak + "-day culinary streak in progress!"
                  : "Post today&apos;s food story to ignite your streak."}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#f05a28] font-mono">
            {userProfile.user.streak}d
          </span>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#736f68] px-1">
          Notification Inbox
        </h3>

        {!notifications || notifications.length === 0 ? (
          <EmptyState
            icon="📬"
            title="No New Notifications"
            description="When food creators you follow publish new daily food stories, alerts will appear right here."
          />
        ) : (
          <div className="divide-y divide-[#f0ece4] rounded-2xl bg-white border border-[#e8e4dc] shadow-2xs overflow-hidden">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 flex items-center space-x-3 hover:bg-[#fbf9f6] transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={notif.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                    alt={notif.senderName}
                    className="w-10 h-10 rounded-full border border-[#f05a28] object-cover"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#f05a28] text-white flex items-center justify-center text-[9px]">
                    🔥
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#121214] leading-snug">
                    <strong className="font-bold mr-1">{notif.senderName}</strong>
                    just posted a new daily food story.
                  </p>
                  <span className="text-[10px] text-[#736f68] block mt-0.5">
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
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 text-left space-y-6 animate-fade-in">
      <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-4">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#f05a28] via-amber-500 to-rose-500">
            <img
              src={user.avatarUrl || user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
              alt={user.username}
              className="w-16 h-16 rounded-full border-2 border-white object-cover"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#121214]">{user.name || user.username}</h2>
            <p className="text-xs text-[#f05a28] font-mono font-semibold">@{user.username}</p>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f5f2eb] text-[11px] text-[#736f68] font-medium">
              Following <strong className="text-[#121214] ml-1 font-bold">{(followingList || []).length}</strong>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#fff5f0] border border-[#ffe8de] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#f05a28]">
              Daily Culinary Streak
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-2xl font-bold text-[#121214]">{user.streak}</span>
              <span className="text-xs text-[#736f68]">Days Active</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white border border-[#ffe8de] flex items-center justify-center text-2xl shadow-2xs">
            🔥
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onTriggerUpload}
            className="py-2.5 rounded-xl bg-[#f05a28] hover:bg-[#d94918] text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>🔥</span>
            <span>Share Story</span>
          </button>
          <button
            type="button"
            onClick={onTriggerInstall}
            className="py-2.5 rounded-xl bg-white hover:bg-[#f5f2eb] border border-[#e8e4dc] text-[#121214] text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>📱</span>
            <span>Install App</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#736f68]">
            Active 24H Stories ({activePosts ? activePosts.length : 0})
          </h3>
          <span className="text-[10px] text-[#a6a198]">Auto-purges after 24h</span>
        </div>

        {!activePosts || activePosts.length === 0 ? (
          <EmptyState
            icon="📸"
            title="No Active Stories"
            description="You haven&apos;t shared any food creations in the past 24 hours."
            actionText="Share Today&apos;s Bite"
            onAction={onTriggerUpload}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {activePosts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white border border-[#e8e4dc] shadow-2xs group"
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
                  className="absolute top-2 right-2 w-6 h-6 rounded-md bg-white/90 hover:bg-rose-600 hover:text-white text-[#736f68] flex items-center justify-center text-xs shadow-sm transition-colors z-20 cursor-pointer"
                  title="Delete Story"
                >
                  🗑️
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                  <span className="text-[9px] font-bold text-[#f05a28]">
                    {post.mediaType === "video" ? "🎬 Video" : "📷 Photo"}
                  </span>
                  {post.caption && (
                    <span className="text-[10px] text-white/90 line-clamp-1 truncate">{post.caption}</span>
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
        className="w-full py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-[#e8e4dc] text-[#736f68] hover:text-rose-600 hover:border-rose-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
      >
        Sign Out of FoodBite
      </button>

      <div className="text-center pt-2">
        <p className="text-[10px] text-[#a6a198]">
          &copy; 2026 Online Recipe Sharing Platform. Built &amp; Engineered by Sachin Bhandari.
        </p>
      </div>
    </div>
  );
}

function InstallAppModal({ isOpen, onClose, deferredPrompt, onInstalled }) {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        onInstalled();
      }
      onClose();
    } else {
      alert("To install FoodBite, tap your browser menu (three dots or Share button) and select 'Add to Home Screen' or 'Install App'.");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white border border-[#e8e4dc] p-6 text-[#1a1917] shadow-xl text-center space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#a6a198] hover:text-[#121214] p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="w-14 h-14 rounded-2xl bg-[#fff5f0] border border-[#ffe8de] text-[#f05a28] text-2xl flex items-center justify-center mx-auto shadow-2xs">
          📱
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#121214] tracking-tight">Install FoodBite</h3>
          <p className="text-xs text-[#736f68] leading-relaxed">
            Install FoodBite on your phone or desktop home screen for instant food sharing, fast loading, and offline access.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2.5 rounded-xl bg-[#121214] hover:bg-black text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
          >
            Install Now
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-medium text-[#736f68] hover:text-[#121214] transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
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
  const [comments, setComments] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [heartBursts, setHeartBursts] = useState({});
  const lastTapRef = useRef({});

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
    setIsLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      if (data && data.success) {
        setStories(data.posts || []);
      } else {
        setFeedError("Failed to fetch food feed.");
      }
    } catch (err) {
      setFeedError("Network connection issue.");
    } finally {
      setIsLoadingFeed(false);
    }
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
    const handleOpenStoryEvent = (e) => {
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
    }
  }, [currentUser]);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
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
    }, 750);

    if (!likes[postId]) {
      const curCount = likeCounts[postId] !== undefined ? likeCounts[postId] : 12;
      setLikes((prev) => ({ ...prev, [postId]: true }));
      setLikeCounts((prev) => ({ ...prev, [postId]: curCount + 1 }));
    }
  };

  const handleAddComment = (postId, commentText) => {
    const author = currentUser ? (currentUser.username || currentUser.name || "foodie") : "foodie";
    const newComment = { id: Date.now(), author, text: commentText };
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));
    showToast("Comment posted! 💬", "success");
  };

  const handleSharePost = (post) => {
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

  const toggleSave = (postId) => {
    const nextSaved = !savedPosts[postId];
    setSavedPosts((prev) => ({ ...prev, [postId]: nextSaved }));
    showToast(nextSaved ? "Saved to your food collection! 🔖" : "Removed from saved bites", "info");
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
      const catObj = CATEGORIES.find((c) => c.id === activeCategory);
      if (catObj) {
        const needle = catObj.label.toLowerCase();
        list = list.filter((s) => {
          const text = ((s.caption || "") + " " + (s.username || "")).toLowerCase();
          return text.includes(catObj.id) || text.includes(needle);
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        const text = ((s.caption || "") + " " + (s.username || "")).toLowerCase();
        return text.includes(q);
      });
    }

    return list;
  }, [stories, activeCategory, searchQuery, likeCounts]);

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#fbf9f6] text-[#1a1917]">
        <AuthScreen
          onAuthSuccess={(user, token) => {
            localStorage.setItem("foodbite_session", JSON.stringify({ user, token }));
            setCurrentUser(user);
            showToast("Welcome to FoodBite, @" + (user.username || user.name) + "! 🔥", "success");
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

  const currentUserId = currentUser.id || currentUser.uid;
  const streakCount = userProfile && userProfile.user ? (userProfile.user.streak || 0) : 0;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#fbf9f6] text-[#1a1917] antialiased">
      <DesktopNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerUpload={() => setStoryModalOpen(true)}
        userProfile={userProfile}
        unreadCount={notifications.length}
        onTriggerInstall={() => setShowInstallModal(true)}
        currentUser={currentUser}
      />

      <MobileTopBar
        streak={streakCount}
        onTriggerInstall={() => setShowInstallModal(true)}
        onLogoClick={() => setActiveTab("home")}
      />

      <main className="flex-1 w-full">
        {activeTab === "home" && (
          <div className="w-full">
            <HomeHeroSection
              onExplore={() => {
                const el = document.getElementById("food-feed-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              onShareFood={() => setStoryModalOpen(true)}
            />

            <StoriesTray
              stories={stories}
              currentUser={currentUser}
              onTriggerUpload={() => setStoryModalOpen(true)}
              onViewStory={(s) => setViewingStory(s)}
            />

            <div id="food-feed-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
              <TrendingNowShelf
                stories={stories}
                onViewStory={(s) => setViewingStory(s)}
              />

              <SearchFilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />

              {feedError && (
                <ErrorState message={feedError} onRetry={fetchStories} />
              )}

              {isLoadingFeed ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FoodCardSkeleton />
                  <FoodCardSkeleton />
                  <FoodCardSkeleton />
                </div>
              ) : filteredStories.length === 0 ? (
                searchQuery || activeCategory !== "all" ? (
                  <EmptyState
                    icon="🔍"
                    title="No Cravings Found"
                    description={`No food posts matched your search for &quot;${searchQuery || activeCategory}&quot;. Try exploring other categories.`}
                    actionText="Reset Filters"
                    onAction={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                  />
                ) : (
                  <EmptyState
                    icon="🍽️"
                    title="No Bites Here Yet"
                    description="FoodBite stories stay fresh for 24 hours. Be the first person to share today&apos;s delicious food creation!"
                    actionText="Share First Bite"
                    onAction={() => setStoryModalOpen(true)}
                  />
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStories.map((post) => (
                    <FoodCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUserId}
                      isFollowing={followingList.includes(post.userId)}
                      onToggleFollow={handleToggleFollow}
                      onLike={toggleLike}
                      isLiked={!!likes[post.id]}
                      likeCount={likeCounts[post.id] !== undefined ? likeCounts[post.id] : 12}
                      onDoubleTap={handleDoubleTap}
                      heartBurst={!!heartBursts[post.id]}
                      comments={comments[post.id] || []}
                      onAddComment={handleAddComment}
                      onShare={handleSharePost}
                      onSave={toggleSave}
                      isSaved={!!savedPosts[post.id]}
                      onViewStory={(s) => setViewingStory(s)}
                      onDeletePost={handleDeletePost}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <ActivityView
            currentUser={currentUser}
            userProfile={userProfile}
            notifications={notifications}
            onRefreshNotifs={() => fetchNotifications()}
          />
        )}

        {activeTab === "profile" && (
          <UserProfileView
            userProfile={userProfile}
            currentUser={currentUser}
            followingList={followingList}
            onTriggerUpload={() => setStoryModalOpen(true)}
            onTriggerInstall={() => setShowInstallModal(true)}
            onDeletePost={handleDeletePost}
            onLogout={handleLogout}
          />
        )}
      </main>

      <MobileBottomBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerUpload={() => setStoryModalOpen(true)}
        unreadCount={notifications.length}
      />

      <ShareFoodModal
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
        <div className="min-h-screen flex items-center justify-center bg-[#fbf9f6] p-6 text-center text-[#1a1917]">
          <div className="max-w-sm w-full bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-base font-bold text-[#121214]">App Notice</h3>
            <p className="text-xs text-[#736f68] leading-relaxed">
              {String(this.state.error && (this.state.error.message || this.state.error))}
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("foodbite_session");
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-xl bg-[#121214] hover:bg-black text-white font-semibold text-xs tracking-wide cursor-pointer shadow-sm active:scale-95 transition-all"
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
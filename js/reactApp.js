const { useState, useEffect, useRef, useMemo } = React;

function escapeStr(str) {
  if (typeof str !== "string") return String(str || "");
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl backdrop-blur-md border text-xs font-semibold transform transition-all duration-300 animate-slide-up ${
            t.type === "success"
              ? "bg-emerald-900/95 text-emerald-100 border-emerald-500/30"
              : t.type === "error"
              ? "bg-rose-900/95 text-rose-100 border-rose-500/30"
              : "bg-stone-900/95 text-orange-100 border-orange-500/30"
          }`}
        >
          <div className="flex items-center space-x-3">
            {t.type === "success" && (
              <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {t.type === "error" && (
              <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {t.type !== "success" && t.type !== "error" && (
              <svg className="w-5 h-5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="leading-snug">{t.message}</span>
          </div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="ml-3 text-stone-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function Navbar({ currentUser, activeRoute, navigateTo, openAuth, onLogout, isOwner, platformName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 glass-header shadow-sm bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a
            href="#discover"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("#discover");
            }}
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl text-stone-900 tracking-tight block leading-tight group-hover:text-orange-700 transition-colors">
                {platformName || "FlavorCraft"}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-600">
                Online Recipe Sharing Platform
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              type="button"
              onClick={() => navigateTo("#discover")}
              className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                activeRoute === "#discover" || !activeRoute
                  ? "text-orange-700 bg-orange-50"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              Discover Recipes
            </button>

            <button
              type="button"
              onClick={() => navigateTo("#share-recipe")}
              className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center space-x-1.5 ${
                activeRoute === "#share-recipe"
                  ? "text-orange-700 bg-orange-50"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Share Recipe</span>
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => navigateTo("#user-dashboard")}
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  activeRoute === "#user-dashboard"
                    ? "text-orange-700 bg-orange-50"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                My Dashboard
              </button>
            )}

            {(currentUser?.role === "admin" || isOwner) && (
              <button
                type="button"
                onClick={() => navigateTo("#admin")}
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center space-x-1.5 ${
                  activeRoute === "#admin"
                    ? "text-emerald-800 bg-emerald-50"
                    : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/60"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Admin Dashboard</span>
              </button>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            {!currentUser ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => openAuth("login", true)}
                  className="px-3 py-2 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all shadow-sm flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.35 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                  </svg>
                  <span>Google Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-600/20 transition-colors"
                >
                  Sign In / Register
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2.5 bg-stone-100/90 py-1.5 px-3 rounded-2xl border border-stone-200/80">
                  <img
                    src={currentUser.avatar_url || currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                    alt={currentUser.display_name || currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-white"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-stone-900 leading-tight">
                      {currentUser.display_name || currentUser.name}
                    </span>
                    <span className="text-[10px] text-stone-500 capitalize">
                      {isOwner ? "Platform Owner" : currentUser.role}
                    </span>
                  </div>
                  {isOwner && (
                    <span className="ml-1 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                      Owner
                    </span>
                  )}
                  {currentUser.role === "admin" && !isOwner && (
                    <span className="ml-1 text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                      Admin
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="py-2 px-3 rounded-xl font-bold text-xs bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={() => navigateTo("#share-recipe")}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-orange-600 text-white hover:bg-orange-700 transition-all flex items-center space-x-1 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
          <div className="relative ml-auto w-4/5 max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
                <span className="font-serif font-bold text-lg text-stone-900">FlavorCraft</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="text-stone-400 hover:text-stone-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    navigateTo("#discover");
                    setMobileOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-semibold rounded-xl text-stone-700 hover:bg-orange-50 hover:text-orange-700"
                >
                  Discover Recipes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigateTo("#share-recipe");
                    setMobileOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-semibold rounded-xl text-stone-700 hover:bg-orange-50 hover:text-orange-700"
                >
                  Share Recipe
                </button>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo("#user-dashboard");
                      setMobileOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 text-sm font-semibold rounded-xl text-stone-700 hover:bg-orange-50 hover:text-orange-700"
                  >
                    My Dashboard
                  </button>
                )}
                {(currentUser?.role === "admin" || isOwner) && (
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo("#admin");
                      setMobileOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 text-sm font-semibold rounded-xl text-emerald-800 bg-emerald-50"
                  >
                    Admin Dashboard
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200">
              {!currentUser ? (
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      openAuth("login", true);
                      setMobileOpen(false);
                    }}
                    className="w-full py-2.5 px-3 text-xs font-bold text-stone-700 bg-stone-100 rounded-xl flex items-center justify-center space-x-2"
                  >
                    <span>Google Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openAuth("login");
                      setMobileOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-orange-600 text-white"
                  >
                    Sign In / Register
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function DiscoverRecipes({ recipes, onSelectRecipe, onEditRecipe, onDeleteRecipe, currentUser, isOwner, navigateTo }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPrepTime, setFilterPrepTime] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const approvedRecipes = useMemo(() => {
    return recipes.filter((r) => r.status === "approved" || !r.status);
  }, [recipes]);

  const filtered = useMemo(() => {
    let list = [...approvedRecipes];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((r) => {
        const title = (r.title || "").toLowerCase();
        const desc = (r.description || "").toLowerCase();
        const author = (r.author_name || "").toLowerCase();
        const ings = Array.isArray(r.ingredients)
          ? r.ingredients.map((i) => (typeof i === "object" ? i.name || "" : String(i))).join(" ").toLowerCase()
          : "";
        return title.includes(q) || desc.includes(q) || author.includes(q) || ings.includes(q);
      });
    }

    if (filterPrepTime !== "all") {
      list = list.filter((r) => {
        const prep = Number(r.prep_time || 25);
        if (filterPrepTime === "quick") return prep <= 20;
        if (filterPrepTime === "medium") return prep > 20 && prep <= 40;
        if (filterPrepTime === "elaborate") return prep > 40;
        return true;
      });
    }

    if (sortOrder === "newest") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortOrder === "rating") {
      list.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    } else if (sortOrder === "quickest") {
      list.sort((a, b) => (a.prep_time || 25) - (b.prep_time || 25));
    } else if (sortOrder === "reviews") {
      list.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    }

    return list;
  }, [approvedRecipes, searchTerm, filterCategory, filterPrepTime, sortOrder]);

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-100/70 border border-orange-200 text-orange-800 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
            <span>FlavorCraft Culinary Community</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-stone-900 tracking-tight mb-4 leading-tight">
            Discover Authentic Flavors & Heritage Dishes
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
            Explore chef-tested recipes, secret spice measurements, and dining favorites crafted by home cooks and passionate foodies across the nation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo("#share-recipe")}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-orange-600/30 transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Share Your Recipe or Video</span>
            </button>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-4 sm:p-6 mb-10 shadow-md border border-stone-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
            <div className="sm:col-span-5 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recipe title, ingredients, or chef..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              />
              <svg className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterPrepTime}
                onChange={(e) => setFilterPrepTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="all">All Prep Times</option>
                <option value="quick">Quick (&le; 20 mins)</option>
                <option value="medium">Medium (20-40 mins)</option>
                <option value="elaborate">Elaborate (&gt; 40 mins)</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="newest">Sort by: Newest Additions</option>
                <option value="rating">Sort by: Highest Rated</option>
                <option value="reviews">Sort by: Most Reviewed</option>
                <option value="quickest">Sort by: Quickest Prep Time</option>
              </select>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 shadow-sm max-w-lg mx-auto p-8">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">No Matching Recipes Found</h3>
            <p className="text-stone-500 text-xs mb-6">
              We couldn't find any recipes matching your search filters. Try adjusting your query or share your own recipe!
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilterPrepTime("all");
                setSortOrder("newest");
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.map((recipe) => {
              const recId = recipe.recipe_id || recipe.id;
              const photo = recipe.image_url || (recipe.photos && recipe.photos[0]) || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80";
              const canEdit = window.auth ? window.auth.canEditRecipe(recipe) : false;
              const canDelete = window.auth ? window.auth.canDeleteRecipe(recipe) : false;
              const ingredientsArr = Array.isArray(recipe.ingredients)
                ? recipe.ingredients.map((i) => (typeof i === "object" ? `${i.quantity || ""} ${i.unit || ""} ${i.name || ""}`.trim() : String(i).trim()))
                : [];

              return (
                <div
                  key={recId}
                  className="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-stone-200/90 hover:-translate-y-1 bg-white"
                >
                  <div
                    className="relative overflow-hidden recipe-image-aspect bg-stone-100 cursor-pointer h-52 sm:h-56"
                    onClick={() => onSelectRecipe(recId)}
                  >
                    <img
                      src={photo}
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    {recipe.video_url && (
                      <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-md text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-md border border-amber-400/30">
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <span>Video Reel</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-sm text-stone-800">
                      <svg className="w-3.5 h-3.5 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{recipe.review_count > 0 ? recipe.average_rating : "New"}</span>
                      <span className="text-slate-400 font-normal">({recipe.review_count || 0})</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md text-stone-100 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold flex items-center space-x-1">
                      <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{recipe.prep_time || 25} mins prep</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
                        <span className="font-semibold text-slate-700 truncate">{recipe.author_name || "Community Chef"}</span>
                        <span>•</span>
                        <span>{new Date(recipe.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <h3
                        className="text-lg font-serif font-bold text-stone-900 group-hover:text-orange-700 transition-colors line-clamp-1 mb-2 cursor-pointer"
                        onClick={() => onSelectRecipe(recId)}
                      >
                        {recipe.title}
                      </h3>
                      <p className="text-stone-600 text-xs line-clamp-2 mb-4 leading-relaxed">
                        {recipe.description || recipe.instructions || "Prepared with fresh ingredients and authentic spices."}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {ingredientsArr.slice(0, 3).map((ing, idx) => (
                          <span key={idx} className="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs font-medium truncate max-w-[140px]">
                            {ing}
                          </span>
                        ))}
                        {ingredientsArr.length > 3 && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-medium">
                            +{ingredientsArr.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-3 border-t border-stone-100">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditRecipe(recId);
                            }}
                            className="px-3 py-2.5 rounded-xl font-semibold text-xs text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors flex items-center justify-center space-x-1"
                            title="Edit recipe"
                          >
                            <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRecipe(recId, recipe.title);
                            }}
                            className="px-3 py-2.5 rounded-xl font-semibold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center space-x-1"
                            title={isOwner ? "Delete recipe as Owner" : "Delete recipe"}
                          >
                            <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectRecipe(recId)}
                          className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs tracking-wide text-orange-700 bg-orange-50 hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center space-x-1.5"
                        >
                          <span>View Full Recipe</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-6 right-5 z-40">
        <button
          type="button"
          onClick={() => navigateTo("#share-recipe")}
          className="px-4 py-3 rounded-full font-bold text-xs bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xl shadow-orange-600/40 hover:from-orange-700 hover:to-amber-700 active:scale-95 transition-all flex items-center space-x-2 border border-orange-400/40"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Share Recipe</span>
        </button>
      </div>
    </div>
  );
}

function RecipeDetailModal({ recipeId, onClose, currentUser, isOwner, onEditRecipe, onDeleteRecipe, showToast }) {
  const [recipe, setRecipe] = useState(null);
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingRevId, setEditingRevId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editRating, setEditRating] = useState(5);

  const loadData = () => {
    if (!recipeId) return;
    const rec = window.store.getRecipeById(recipeId);
    setRecipe(rec ? { ...rec } : null);
  };

  useEffect(() => {
    loadData();
  }, [recipeId]);

  if (!recipe) return null;

  const reviews = window.store.getReviewsByRecipe(recipeId);
  const canEdit = window.auth ? window.auth.canEditRecipe(recipe) : false;
  const canDelete = window.auth ? window.auth.canDeleteRecipe(recipe) : false;
  const photo = recipe.image_url || (recipe.photos && recipe.photos[0]) || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80";

  let ingredients = [];
  if (Array.isArray(recipe.ingredients)) {
    ingredients = recipe.ingredients.map((i) => (typeof i === "object" ? `${i.quantity || ""} ${i.unit || ""} ${i.name || ""}`.trim() : String(i).trim()));
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast("Please sign in to rate and review this recipe.", "info");
      return;
    }
    if (!commentText.trim()) {
      showToast("Please write a short review comment.", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      const userUid = currentUser.uid || currentUser.id;
      await window.store.addReview(recipeId, userUid, rating, commentText.trim());
      showToast("Review submitted successfully!", "success");
      setCommentText("");
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to submit review.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSaveEditReview = async (revId) => {
    try {
      await window.store.updateReview(revId, {
        rating: editRating,
        comment_text: editCommentText.trim()
      });
      showToast("Review updated successfully!", "success");
      setEditingRevId(null);
      loadData();
    } catch (err) {
      showToast("Failed to update review.", "error");
    }
  };

  const handleDeleteReview = async (revId) => {
    if (confirm("Permanently delete this review?")) {
      await window.store.deleteReview(revId);
      showToast("Review deleted.", "info");
      loadData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col">
        <div className="relative h-64 sm:h-80 bg-stone-900 shrink-0">
          <img
            src={photo}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>

          <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditRecipe(recipeId);
                }}
                className="px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg backdrop-blur-md transition-all"
              >
                <span>Edit Recipe</span>
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRecipe(recipeId, recipe.title);
                }}
                className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg backdrop-blur-md transition-all"
              >
                <span>{isOwner ? "Delete Recipe (Owner)" : "Delete Recipe"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-5 left-6 right-6 text-white">
            <div className="flex items-center space-x-2 text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2">
              <span className="bg-emerald-500/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Verified Heritage Dish
              </span>
              <span>•</span>
              <span className="text-stone-200">{recipe.prep_time || 25} Mins Prep</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-extrabold text-white leading-tight mb-2">
              {recipe.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-200">
              <span className="font-medium text-white">By {recipe.author_name || "Community Chef"}</span>
              <div className="flex items-center space-x-1.5 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md">
                <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-white">{recipe.average_rating || 5}</span>
                <span className="text-stone-400">({reviews.length} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-stone-50 rounded-2xl p-5 border border-stone-200/80">
              <h4 className="font-serif font-bold text-stone-900 text-base mb-4 flex items-center space-x-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Ingredients</span>
              </h4>
              {ingredients.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No specific ingredients listed.</p>
              ) : (
                <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                  {ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-orange-600 font-bold">&bull;</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="md:col-span-2 space-y-6">
              {recipe.video_url && (
                <div className="bg-stone-950 rounded-2xl overflow-hidden p-3 border border-stone-800 shadow-md">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 px-1">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span>Cooking Video Reel</span>
                  </div>
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={photo}
                    className="w-full rounded-xl max-h-96 bg-black shadow-inner"
                    src={recipe.video_url}
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>
              )}
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-lg mb-3">Preparation Instructions</h4>
                <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                  {recipe.instructions || "Cook with fresh ingredients and serve hot."}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-200">
            <h3 className="font-serif font-bold text-stone-900 text-xl mb-4 flex items-center justify-between">
              <span>Ratings & Reviews ({reviews.length})</span>
            </h3>

            <form onSubmit={handleReviewSubmit} className="bg-stone-50 rounded-2xl p-5 border border-stone-200 mb-6">
              <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700 mb-3">Leave Your Review</h5>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs font-semibold text-stone-600">Rating:</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <svg
                        className={`w-5 h-5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-stone-300"}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-stone-800 ml-2">{rating} Stars</span>
              </div>

              <textarea
                rows="3"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={currentUser ? "Share your thoughts on the taste, spices, and prep..." : "Please sign in to write a review"}
                disabled={!currentUser}
                className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 mb-3"
              ></textarea>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-500">
                  {currentUser ? `Posting as ${currentUser.display_name || currentUser.name}` : "Sign in to post review"}
                </span>
                <button
                  type="submit"
                  disabled={!currentUser || submittingReview}
                  className="py-2 px-5 rounded-xl font-bold text-xs bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-4 text-center">No reviews yet. Be the first to share your rating!</p>
              ) : (
                reviews.map((rev) => {
                  const revAuthor = window.store.getUserById(rev.author_uid || rev.user_id);
                  const revName = revAuthor ? (revAuthor.display_name || revAuthor.name) : "Community Chef";
                  const revAvatar = revAuthor ? (revAuthor.avatar_url || revAuthor.avatar) : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(revName)}`;
                  const isMine = currentUser && (currentUser.uid === rev.author_uid || currentUser.id === rev.author_uid);
                  const canDeleteRev = isMine || isOwner || currentUser?.role === "admin";

                  return (
                    <div key={rev.review_id || rev.id} className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2.5">
                          <img src={revAvatar} alt={revName} className="w-6 h-6 rounded-full object-cover" />
                          <span className="font-bold text-xs text-stone-800">{revName}</span>
                          <span className="text-[11px] text-stone-400">•</span>
                          <span className="text-[11px] text-stone-400">
                            {new Date(rev.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <svg
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= rev.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"}`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          {isMine && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRevId(rev.review_id || rev.id);
                                setEditCommentText(rev.comment_text || rev.value || "");
                                setEditRating(rev.rating || 5);
                              }}
                              className="text-xs font-semibold text-amber-600 hover:text-amber-800 ml-2"
                            >
                              Edit
                            </button>
                          )}
                          {canDeleteRev && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev.review_id || rev.id)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 ml-1"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {editingRevId === (rev.review_id || rev.id) ? (
                        <div className="mt-2 pt-2 border-t border-stone-100">
                          <div className="flex space-x-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button key={s} type="button" onClick={() => setEditRating(s)}>
                                <svg
                                  className={`w-4 h-4 ${s <= editRating ? "text-amber-400 fill-amber-400" : "text-stone-300"}`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows="2"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full p-2 text-xs border rounded-lg"
                          ></textarea>
                          <div className="flex space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEditReview(rev.review_id || rev.id)}
                              className="px-3 py-1 bg-amber-600 text-white rounded-md text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRevId(null)}
                              className="px-3 py-1 bg-stone-200 text-stone-700 rounded-md text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                          {rev.comment_text || rev.value}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareRecipeForm({ currentUser, editingRecipeId, onComplete, showToast }) {
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [prepTime, setPrepTime] = useState(25);
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [searchingPhoto, setSearchingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRecipeId) {
      const rec = window.store.getRecipeById(editingRecipeId);
      if (rec) {
        setTitle(rec.title || "");
        setAuthorName(rec.author_name || "");
        setPrepTime(rec.prep_time || 25);
        if (Array.isArray(rec.ingredients)) {
          setIngredientsText(
            rec.ingredients
              .map((i) => (typeof i === "object" ? `${i.quantity || ""} ${i.unit || ""} ${i.name || ""}`.trim() : String(i).trim()))
              .join("\n")
          );
        } else {
          setIngredientsText(rec.ingredients || "");
        }
        setInstructionsText(rec.instructions || "");
        setPhotoUrl(rec.image_url || (rec.photos && rec.photos[0]) || "");
        setVideoUrl(rec.video_url || "");
      }
    } else {
      setTitle("");
      setAuthorName(currentUser ? (currentUser.display_name || currentUser.name) : "");
      setPrepTime(25);
      setIngredientsText("");
      setInstructionsText("");
      setPhotoUrl("");
      setVideoUrl("");
    }
  }, [editingRecipeId, currentUser]);

  const handleAutoFindPhoto = async () => {
    if (!title.trim()) {
      showToast("Please enter a recipe title first to search photos online.", "info");
      return;
    }
    setSearchingPhoto(true);
    try {
      const found = await window.searchOnlineDishPhoto(title.trim());
      setPhotoUrl(found);
      showToast(`Found authentic restaurant photo for '${title.trim()}'!`, "success");
    } catch (err) {
      showToast("Could not find online photo. You can upload a photo directly.", "error");
    } finally {
      setSearchingPhoto(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Photo must be less than 10MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        try {
          const resp = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: compressedBase64 })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.url) {
              setPhotoUrl(data.url);
              showToast("Photo saved to high-capacity storage!", "success");
              return;
            }
          }
        } catch (uploadErr) {}
        setPhotoUrl(compressedBase64);
        showToast("Photo processed and ready to upload!", "success");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      showToast("Video file exceeds the 50MB limit.", "error");
      return;
    }
    setUploadingVideo(true);
    try {
      const resp = await fetch("/api/upload?type=video", {
        method: "POST",
        headers: { "Content-Type": file.type || "video/mp4" },
        body: file
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.url) {
          setVideoUrl(data.url);
          showToast("Cooking video uploaded successfully!", "success");
        } else {
          showToast("Could not parse video upload response.", "error");
        }
      } else {
        showToast("Video upload failed. Check server connection.", "error");
      }
    } catch (err) {
      showToast("Network error uploading video.", "error");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Please enter a recipe title.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const userUid = currentUser ? (currentUser.uid || currentUser.id) : "guest-" + Date.now().toString(36);
      const chefName = authorName.trim() || (currentUser ? (currentUser.display_name || currentUser.name) : "Guest Chef");

      let finalPhoto = photoUrl;
      if (!finalPhoto) {
        finalPhoto = await window.searchOnlineDishPhoto(title.trim());
      }
      if (!finalPhoto) {
        finalPhoto = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      }

      if (finalPhoto && typeof finalPhoto === "string" && finalPhoto.startsWith("data:image")) {
        try {
          const resp = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: finalPhoto })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.url) {
              finalPhoto = data.url;
            }
          }
        } catch (uploadErr) {}
      }

      const ingredients = ingredientsText
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean);

      const instructions = instructionsText.trim() || "Prepared with fresh ingredients and served hot.";

      if (editingRecipeId) {
        await window.store.updateRecipe(editingRecipeId, {
          title: title.trim(),
          author_name: chefName,
          prep_time: Number(prepTime) || 25,
          ingredients,
          instructions,
          image_url: finalPhoto,
          photos: [finalPhoto],
          video_url: videoUrl || null,
          status: "approved"
        });
        showToast(`Recipe '${title.trim()}' updated successfully!`, "success");
      } else {
        await window.store.addRecipe({
          author_uid: userUid,
          author_id: userUid,
          author_name: chefName,
          title: title.trim(),
          prep_time: Number(prepTime) || 25,
          ingredients,
          instructions,
          image_url: finalPhoto,
          photos: [finalPhoto],
          video_url: videoUrl || null,
          status: "approved"
        });
        showToast(`Recipe '${title.trim()}' successfully submitted!`, "success");
      }
      onComplete();
    } catch (err) {
      showToast("Failed to save recipe.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="glass-card rounded-3xl p-6 sm:p-10 shadow-lg border border-stone-200/90 bg-white">
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{editingRecipeId ? "Edit Mode" : "Recipe Submission"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {editingRecipeId ? "Update Your Heritage Recipe" : "Share a Delicious Recipe with the Community"}
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Anyone can share dishes with spice measurements, secret tips, and diner photography.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                Recipe Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cold Coffee, Garlic Bread, Paneer Naan"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                Chef / Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Prep Time (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="240"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Ingredients (Optional — One per line)
            </label>
            <textarea
              rows="4"
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="e.g.&#10;2 cups Full Cream Milk&#10;2 tbsp Instant Coffee Powder&#10;3 tbsp Sugar&#10;Ice Cubes"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono text-xs"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Preparation Instructions
            </label>
            <textarea
              rows="5"
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              placeholder="Describe step-by-step how to prepare and cook this dish..."
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs sm:text-sm"
            ></textarea>
          </div>

          <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/70">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Recipe Photo (Up to 10MB or Auto Online Search)
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-center mb-3">
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileUpload}
                className="w-full text-xs text-stone-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
              />
              <button
                type="button"
                onClick={handleAutoFindPhoto}
                disabled={searchingPhoto}
                className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{searchingPhoto ? "Searching..." : "Auto-Find Photo Online"}</span>
              </button>
            </div>

            {photoUrl && (
              <div className="relative rounded-2xl overflow-hidden h-48 border border-stone-200 mt-3">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/70">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Cooking Video / Reel (Optional — Up to 50MB)
              </label>
              {uploadingVideo && (
                <span className="text-xs text-amber-600 font-bold animate-pulse">Uploading video...</span>
              )}
            </div>
            <p className="text-stone-500 text-xs mb-3">
              Upload a step-by-step video demonstration or reel in MP4 or WebM format.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center mb-3">
              <input
                type="file"
                accept="video/mp4, video/webm, video/quicktime"
                onChange={handleVideoUpload}
                disabled={uploadingVideo}
                className="w-full text-xs text-stone-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer disabled:opacity-50"
              />
            </div>

            {videoUrl && (
              <div className="relative rounded-2xl overflow-hidden bg-black mt-3 border border-stone-800">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  src={videoUrl}
                  className="w-full max-h-64 object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={() => setVideoUrl("")}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  title="Remove video"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onComplete}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Publishing Recipe..." : editingRecipeId ? "Save Changes" : "Publish Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ recipes, users, reviews, activities, settings, showToast, onSelectRecipe }) {
  const [activeTab, setActiveTab] = useState("users");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("user");

  const [platformName, setPlatformName] = useState(settings?.platformName || "FlavorCraft");
  const [allowGuestBrowsing, setAllowGuestBrowsing] = useState(settings?.allowGuestBrowsing ?? true);
  const [autoApproveVerified, setAutoApproveVerified] = useState(settings?.autoApproveVerified ?? true);
  const [allowPhotoUploads, setAllowPhotoUploads] = useState(settings?.allowPhotoUploads ?? true);
  const [contentModeration, setContentModeration] = useState(settings?.contentModeration ?? true);
  const [maxPhotosPerRecipe, setMaxPhotosPerRecipe] = useState(settings?.maxPhotosPerRecipe || 5);
  const [contactEmail, setContactEmail] = useState(settings?.contactEmail || "admin@recipes.com");
  const [maintenanceMode, setMaintenanceMode] = useState(settings?.maintenanceMode ?? false);

  const statsChartRef1 = useRef(null);
  const statsChartRef2 = useRef(null);
  const chartInstance1 = useRef(null);
  const chartInstance2 = useRef(null);

  useEffect(() => {
    if (activeTab === "stats" && window.Chart) {
      if (chartInstance1.current) chartInstance1.current.destroy();
      if (chartInstance2.current) chartInstance2.current.destroy();

      const approvedCount = recipes.filter((r) => r.status === "approved" || !r.status).length;
      const pendingCount = recipes.filter((r) => r.status === "pending").length;
      const rejectedCount = recipes.filter((r) => r.status === "rejected").length;

      if (statsChartRef1.current) {
        chartInstance1.current = new window.Chart(statsChartRef1.current, {
          type: "doughnut",
          data: {
            labels: ["Approved", "Pending", "Rejected"],
            datasets: [
              {
                data: [approvedCount, pendingCount, rejectedCount],
                backgroundColor: ["#059669", "#d97706", "#e11d48"],
                borderWidth: 0
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom" }
            }
          }
        });
      }

      if (statsChartRef2.current) {
        const ratingCounts = [0, 0, 0, 0, 0];
        reviews.forEach((rv) => {
          const r = Math.round(Number(rv.rating) || 5);
          if (r >= 1 && r <= 5) ratingCounts[r - 1]++;
        });

        chartInstance2.current = new window.Chart(statsChartRef2.current, {
          type: "bar",
          data: {
            labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
            datasets: [
              {
                label: "Ratings Given",
                data: ratingCounts,
                backgroundColor: "#ea580c",
                borderRadius: 8
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
          }
        });
      }
    }
    return () => {
      if (chartInstance1.current) chartInstance1.current.destroy();
      if (chartInstance2.current) chartInstance2.current.destroy();
    };
  }, [activeTab, recipes, reviews]);

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showToast("Please fill in all user fields.", "error");
      return;
    }
    window.store.createUser({
      name: newUserName.trim(),
      display_name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword.trim(),
      role: newUserRole
    });
    showToast(`User account for '${newUserName.trim()}' created successfully!`, "success");
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
  };

  const handleSaveEditUser = () => {
    if (!editingUserId) return;
    window.store.updateUser(editingUserId, {
      name: editUserName.trim(),
      display_name: editUserName.trim(),
      email: editUserEmail.trim(),
      role: editUserRole
    });
    showToast(`User account updated successfully!`, "success");
    setEditingUserId(null);
  };

  const handleDeleteUser = (userId, name) => {
    if (confirm(`Permanently delete user account '${name}'?`)) {
      window.store.deleteUser(userId);
      showToast(`User account '${name}' permanently deleted.`, "info");
    }
  };

  const handleApproveRecipe = async (id, title) => {
    await window.store.approveRecipe(id);
    showToast(`Recipe '${title}' approved and published!`, "success");
  };

  const handleRejectRecipe = async (id, title) => {
    const reason = prompt("Enter revision reason for chef:", "Please adjust spices/instructions");
    if (reason !== null) {
      await window.store.rejectRecipe(id, reason);
      showToast(`Recipe '${title}' marked for revision.`, "info");
    }
  };

  const handleDeleteRecipe = async (id, title) => {
    if (confirm(`As Administrator, permanently delete recipe '${title}'?`)) {
      await window.store.deleteRecipe(id, "usr-1");
      showToast(`Recipe '${title}' permanently deleted.`, "info");
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    window.store.updateSettings({
      platformName,
      allowGuestBrowsing,
      autoApproveVerified,
      allowPhotoUploads,
      contentModeration,
      maxPhotosPerRecipe: Number(maxPhotosPerRecipe) || 5,
      contactEmail,
      maintenanceMode
    });
    showToast("System configuration updated successfully!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-stone-900">FlavorCraft Platform Admin</h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-stone-200 pb-3">
        {[
          { id: "users", label: "User Management", count: users.length },
          { id: "recipes", label: "Recipe Management", count: recipes.length },
          { id: "stats", label: "Recipe Statistics", count: null },
          { id: "activity", label: "Activity Monitoring", count: activities.length },
          { id: "settings", label: "System Settings", count: null }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
              activeTab === tab.id
                ? "bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="space-y-8">
          <div className="glass-card rounded-3xl p-6 shadow-sm border border-stone-200 bg-white">
            <h3 className="font-serif font-bold text-stone-900 text-lg mb-4">Create New User Account</h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm bg-stone-50"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm bg-stone-50"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm bg-stone-50"
              />
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm bg-stone-50 font-bold"
              >
                <option value="user">Role: User</option>
                <option value="admin">Role: Admin</option>
              </select>
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
              >
                Create User
              </button>
            </form>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden shadow-sm border border-stone-200 bg-white">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900 text-base">Registered Accounts Data Table</h3>
              <span className="text-xs text-stone-500 font-semibold">{users.length} registered members</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-100">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map((u) => (
                    <tr key={u.uid || u.id} className="hover:bg-stone-50/50">
                      <td className="p-4 flex items-center space-x-3">
                        <img
                          src={u.avatar_url || u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                          alt={u.display_name || u.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-bold text-stone-900">{u.display_name || u.name}</span>
                      </td>
                      <td className="p-4 text-stone-600 font-mono text-xs">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            u.role === "admin" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(u.uid || u.id);
                            setEditUserName(u.display_name || u.name);
                            setEditUserEmail(u.email);
                            setEditUserRole(u.role || "user");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.uid || u.id, u.display_name || u.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {editingUserId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h3 className="font-serif font-bold text-lg text-stone-900">Edit User Account</h3>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full p-2.5 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full p-2.5 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Role</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="w-full p-2.5 text-xs border rounded-xl"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingUserId(null)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditUser}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "recipes" && (
        <div className="glass-card rounded-3xl overflow-hidden shadow-sm border border-stone-200 bg-white">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base">Community Submissions Management</h3>
            <span className="text-xs text-stone-500 font-semibold">{recipes.length} total recipes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-100">
                <tr>
                  <th className="p-4">Recipe</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Prep Time</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recipes.map((r) => {
                  const id = r.recipe_id || r.id;
                  const isApproved = r.status === "approved" || !r.status;
                  const isPending = r.status === "pending";
                  const isRejected = r.status === "rejected";

                  return (
                    <tr key={id} className="hover:bg-stone-50/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={r.image_url || (r.photos && r.photos[0]) || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=200&q=80"}
                            alt={r.title}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <span className="font-bold text-stone-900 block leading-tight">{r.title}</span>
                            <span className="text-[11px] text-stone-400">ID: {id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-stone-700 font-medium">{r.author_name || "Community Chef"}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isApproved ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {r.status || "approved"}
                        </span>
                      </td>
                      <td className="p-4 text-stone-600">{r.prep_time || 25}m</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => onSelectRecipe(id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200"
                        >
                          Preview
                        </button>
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApproveRecipe(id, r.title)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200"
                          >
                            Approve
                          </button>
                        )}
                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => handleRejectRecipe(id, r.title)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteRecipe(id, r.title)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-stone-200 bg-white">
              <span className="text-xs text-stone-500 uppercase font-bold tracking-wider">Total Recipes</span>
              <h3 className="text-3xl font-serif font-black text-stone-900 mt-2">{recipes.length}</h3>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-stone-200 bg-white">
              <span className="text-xs text-stone-500 uppercase font-bold tracking-wider">Community Users</span>
              <h3 className="text-3xl font-serif font-black text-stone-900 mt-2">{users.length}</h3>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-stone-200 bg-white">
              <span className="text-xs text-stone-500 uppercase font-bold tracking-wider">Total Reviews</span>
              <h3 className="text-3xl font-serif font-black text-stone-900 mt-2">{reviews.length}</h3>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-stone-200 bg-white">
              <span className="text-xs text-stone-500 uppercase font-bold tracking-wider">Pending Moderation</span>
              <h3 className="text-3xl font-serif font-black text-amber-600 mt-2">
                {recipes.filter((r) => r.status === "pending").length}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl p-6 border border-stone-200 bg-white">
              <h4 className="font-serif font-bold text-stone-900 text-base mb-4">Submission Status Breakdown</h4>
              <div className="h-64 relative">
                <canvas ref={statsChartRef1}></canvas>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-stone-200 bg-white">
              <h4 className="font-serif font-bold text-stone-900 text-base mb-4">Community Rating Distribution</h4>
              <div className="h-64 relative">
                <canvas ref={statsChartRef2}></canvas>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="glass-card rounded-3xl p-6 border border-stone-200 bg-white">
          <h3 className="font-serif font-bold text-stone-900 text-lg mb-4">Real-Time User Activity Monitoring Feed</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {activities.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No recorded activity yet.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-xs sm:text-sm text-stone-800 font-medium">{act.action_description}</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono shrink-0 ml-4">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-stone-200 bg-white max-w-2xl">
          <h3 className="font-serif font-bold text-stone-900 text-xl mb-6">Generic System-Wide Configurations</h3>
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Platform Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Contact / Support Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Max Photos per Recipe</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxPhotosPerRecipe}
                onChange={(e) => setMaxPhotosPerRecipe(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowGuestBrowsing}
                  onChange={(e) => setAllowGuestBrowsing(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-stone-800">Allow Guest Browsing</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApproveVerified}
                  onChange={(e) => setAutoApproveVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-stone-800">Auto-Approve Verified Chef Recipes</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contentModeration}
                  onChange={(e) => setContentModeration(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-stone-800">Enable Automated Content Moderation</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-rose-700">Maintenance Mode</span>
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 w-full py-3 rounded-xl font-bold text-xs bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-md shadow-emerald-700/20"
            >
              Save System Settings
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function UserDashboard({ recipes, reviews, currentUser, onEditRecipe, onDeleteRecipe, showToast, onSelectRecipe, navigateTo }) {
  const [activeTab, setActiveTab] = useState("my-recipes");
  const [name, setName] = useState(currentUser?.display_name || currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || currentUser?.avatar || "");

  const userUid = currentUser?.uid || currentUser?.id;

  const myRecipes = useMemo(() => {
    let myUploads = [];
    try {
      myUploads = JSON.parse(localStorage.getItem("my_uploaded_recipe_ids") || "[]");
    } catch (e) {}

    return recipes.filter((r) => {
      const recId = r.recipe_id || r.id;
      if (myUploads.includes(recId)) return true;
      if (userUid && (r.author_uid === userUid || r.author_id === userUid)) return true;
      if (r.author_name && currentUser?.display_name && r.author_name.toLowerCase() === currentUser.display_name.toLowerCase()) return true;
      return false;
    });
  }, [recipes, userUid, currentUser]);

  const myReviews = useMemo(() => {
    if (!userUid) return [];
    return reviews.filter((rev) => rev.author_uid === userUid || rev.user_id === userUid);
  }, [reviews, userUid]);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Name cannot be empty.", "error");
      return;
    }
    window.auth.updateProfile({
      name: name.trim(),
      email: email.trim(),
      password: password.trim() || undefined,
      avatar_url: avatarUrl.trim()
    });
    showToast("Profile updated successfully!", "success");
  };

  const handleDeleteReview = async (revId) => {
    if (confirm("Permanently delete this review?")) {
      await window.store.deleteReview(revId);
      showToast("Review deleted.", "info");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Chef Studio</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-stone-900">
            Welcome, {currentUser?.display_name || currentUser?.name || "Chef"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigateTo("#share-recipe")}
          className="py-2.5 px-5 rounded-xl font-bold text-xs bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/20 flex items-center space-x-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Share New Recipe</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-stone-200 pb-3">
        {[
          { id: "my-recipes", label: "My Recipes (Sharing History)", count: myRecipes.length },
          { id: "my-reviews", label: "My Ratings & Comments", count: myReviews.length },
          { id: "profile", label: "Profile Management", count: null }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 ${
              activeTab === tab.id
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "my-recipes" && (
        <div className="glass-card rounded-3xl overflow-hidden shadow-sm border border-stone-200 bg-white">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base">Shared Recipes Data Table</h3>
            <span className="text-xs text-stone-500 font-semibold">{myRecipes.length} recipes created</span>
          </div>

          {myRecipes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xs sm:text-sm text-stone-500 mb-4">You haven't shared any recipes yet.</p>
              <button
                type="button"
                onClick={() => navigateTo("#share-recipe")}
                className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl"
              >
                Share Your First Recipe
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-100">
                  <tr>
                    <th className="p-4">Recipe Title</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4">Prep Time</th>
                    <th className="p-4">Date Shared</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {myRecipes.map((r) => {
                    const id = r.recipe_id || r.id;
                    const status = r.status || "approved";
                    const isApproved = status === "approved";
                    const isPending = status === "pending";

                    return (
                      <tr key={id} className="hover:bg-stone-50/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={r.image_url || (r.photos && r.photos[0]) || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=200&q=80"}
                              alt={r.title}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                            <span className="font-bold text-stone-900 flex items-center space-x-1.5">
                              <span>{r.title}</span>
                              {r.video_url && <span className="text-xs text-amber-600 font-semibold" title="Includes Cooking Video">🎬</span>}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isApproved ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-stone-600">{r.prep_time || 25}m</td>
                        <td className="p-4 text-stone-500 font-mono text-xs">
                          {new Date(r.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => onSelectRecipe(id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditRecipe(id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecipe(id, r.title)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "my-reviews" && (
        <div className="glass-card rounded-3xl p-6 border border-stone-200 bg-white">
          <h3 className="font-serif font-bold text-stone-900 text-lg mb-4">My Submitted Ratings & Comments</h3>
          {myReviews.length === 0 ? (
            <p className="text-xs sm:text-sm text-stone-500 italic py-6 text-center">
              You haven't left any reviews yet. Explore recipes and share your feedback!
            </p>
          ) : (
            <div className="space-y-4">
              {myReviews.map((rev) => {
                const rec = window.store.getRecipeById(rev.recipe_id);
                return (
                  <div key={rev.review_id || rev.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-stone-900 text-sm">{rec ? rec.title : "Recipe"}</span>
                        <span className="text-xs text-amber-600 font-bold">★ {rev.rating}/5</span>
                      </div>
                      <p className="text-xs text-stone-700">{rev.comment_text || rev.value}</p>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.review_id || rev.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "profile" && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-stone-200 bg-white max-w-xl">
          <h3 className="font-serif font-bold text-stone-900 text-xl mb-6">Profile Management</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Change Password</label>
              <input
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-mono text-xs"
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full py-3 rounded-xl font-bold text-xs bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/20"
            >
              Update Profile Details
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function AuthModal({ isOpen, onClose, mode: initialMode, showToast, showGooglePickerDirectly = false }) {
  const [mode, setMode] = useState(initialMode || "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showGooglePicker, setShowGooglePicker] = useState(showGooglePickerDirectly);

  useEffect(() => {
    setMode(initialMode || "login");
    setShowGooglePicker(showGooglePickerDirectly);
  }, [initialMode, showGooglePickerDirectly]);

  if (!isOpen) return null;

  const handleStandardSubmit = (e) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        window.auth.login(email.trim(), password.trim());
        showToast("Signed in successfully!", "success");
      } else {
        window.auth.register(name.trim(), email.trim(), password.trim());
        showToast("Account registered successfully!", "success");
      }
      onClose();
    } catch (err) {
      showToast(err.message || "Authentication error", "error");
    }
  };

  const handleGoogleLogin = (profile) => {
    window.auth.loginWithGoogle(profile);
    showToast(`Signed in with Google as ${profile ? profile.name : "Sachin Bhandari (Owner)"}!`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="font-serif font-bold text-2xl text-stone-900">
            {mode === "login" ? "Sign In to FlavorCraft" : "Join FlavorCraft Community"}
          </h3>
          <p className="text-stone-500 text-xs mt-1">
            {mode === "login" ? "Welcome back! Choose an account or sign in below." : "Create an account to save recipes and reviews."}
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowGooglePicker(!showGooglePicker)}
            className="w-full py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.35 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
            </svg>
            <span>Continue with Google Account</span>
          </button>

          {showGooglePicker && (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleLogin({ name: "Sachin Bhandari (Owner)", email: "sachin.bhandari@gmail.com" })}
                className="w-full p-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-200 flex items-center space-x-3 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs">SB</div>
                <div>
                  <span className="font-bold text-xs text-stone-900 block">Sachin Bhandari (Owner)</span>
                  <span className="text-[10px] text-stone-500">sachin.bhandari@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleLogin({ name: "Rahul", email: "rahul.foodie@gmail.com" })}
                className="w-full p-2 rounded-xl bg-white hover:bg-orange-50 border border-stone-200 flex items-center space-x-3 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs">R</div>
                <div>
                  <span className="font-bold text-xs text-stone-900 block">Rahul (Foodie)</span>
                  <span className="text-[10px] text-stone-500">rahul.foodie@gmail.com</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink mx-3 text-[11px] text-stone-400 uppercase font-bold tracking-wider">or with credentials</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        <form onSubmit={handleStandardSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 text-xs border rounded-xl"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 text-xs border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 text-xs border rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-xs bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-md"
          >
            {mode === "login" ? "Sign In" : "Register Account"}
          </button>
        </form>

        <div className="text-center text-xs text-stone-500">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("register")} className="font-bold text-orange-600 hover:underline">
                Register now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")} className="font-bold text-orange-600 hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [recipes, setRecipes] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activities, setActivities] = useState([]);
  const [settings, setSettings] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRoute, setActiveRoute] = useState(window.location.hash || "#discover");
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [directGooglePicker, setDirectGooglePicker] = useState(false);
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

  useEffect(() => {
    window.showToast = showToast;

    const syncState = () => {
      if (window.store) {
        setRecipes([...window.store.getRecipes()]);
        setUsers([...window.store.getUsers()]);
        setReviews([...window.store.getReviews()]);
        setActivities([...window.store.getActivities()]);
        setSettings({ ...window.store.getSettings() });
      }
      if (window.auth) {
        setCurrentUser(window.auth.getCurrentUser());
      }
    };

    syncState();

    let unsubStore = () => {};
    let unsubAuth = () => {};

    if (window.store) {
      unsubStore = window.store.subscribe(() => {
        syncState();
      });
    }

    if (window.auth) {
      unsubAuth = window.auth.onAuthChange((u) => {
        setCurrentUser(u);
      });
    }

    const handleHash = () => {
      setActiveRoute(window.location.hash || "#discover");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHash);

    return () => {
      unsubStore();
      unsubAuth();
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  const navigateTo = (route) => {
    window.location.hash = route;
    setActiveRoute(route);
  };

  const handleLogout = () => {
    if (window.auth) {
      window.auth.logout();
      showToast("Signed out successfully.", "info");
      navigateTo("#discover");
    }
  };

  const handleEditRecipe = (id) => {
    setEditingRecipeId(id);
    navigateTo("#share-recipe");
  };

  const handleDeleteRecipe = async (id, title) => {
    const isOwner = window.auth ? window.auth.isOwner() : false;
    const promptText = isOwner
      ? `As Platform Owner (Sachin Bhandari), permanently delete "${title}"?`
      : `Are you sure you want to permanently delete "${title}"?`;
    if (confirm(promptText)) {
      const currentUid = currentUser ? (currentUser.uid || currentUser.id) : null;
      await window.store.deleteRecipe(id, currentUid);
      showToast(isOwner ? `Recipe '${title}' deleted by Owner.` : `Recipe '${title}' has been deleted.`, "info");
    }
  };

  const isOwner = window.auth ? window.auth.isOwner() : false;

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] text-stone-900 selection:bg-orange-600 selection:text-white">
      <Navbar
        currentUser={currentUser}
        activeRoute={activeRoute}
        navigateTo={navigateTo}
        openAuth={(mode, googleDirect) => {
          setAuthModalMode(mode);
          setDirectGooglePicker(!!googleDirect);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        isOwner={isOwner}
        platformName={settings?.platformName || "FlavorCraft"}
      />

      <main className="flex-1">
        {activeRoute === "#admin" ? (
          currentUser?.role === "admin" || isOwner ? (
            <AdminDashboard
              recipes={recipes}
              users={users}
              reviews={reviews}
              activities={activities}
              settings={settings}
              showToast={showToast}
              onSelectRecipe={setSelectedRecipeId}
            />
          ) : (
            <div className="py-20 text-center">
              <h2 className="text-2xl font-bold text-stone-800">Access Denied</h2>
              <p className="text-stone-500 mt-2">Administrator credentials required.</p>
              <button
                type="button"
                onClick={() => navigateTo("#discover")}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
              >
                Go to Discover
              </button>
            </div>
          )
        ) : activeRoute === "#user-dashboard" ? (
          currentUser ? (
            <UserDashboard
              recipes={recipes}
              reviews={reviews}
              currentUser={currentUser}
              onEditRecipe={handleEditRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              showToast={showToast}
              onSelectRecipe={setSelectedRecipeId}
              navigateTo={navigateTo}
            />
          ) : (
            <div className="py-20 text-center">
              <h2 className="text-2xl font-bold text-stone-800">Sign In Required</h2>
              <p className="text-stone-500 mt-2">Please sign in to access your user dashboard.</p>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setAuthModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
              >
                Sign In Now
              </button>
            </div>
          )
        ) : activeRoute === "#share-recipe" ? (
          <ShareRecipeForm
            currentUser={currentUser}
            editingRecipeId={editingRecipeId}
            onComplete={() => {
              setEditingRecipeId(null);
              navigateTo("#discover");
            }}
            showToast={showToast}
          />
        ) : (
          <DiscoverRecipes
            recipes={recipes}
            onSelectRecipe={setSelectedRecipeId}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            currentUser={currentUser}
            isOwner={isOwner}
            navigateTo={navigateTo}
          />
        )}
      </main>

      {selectedRecipeId && (
        <RecipeDetailModal
          recipeId={selectedRecipeId}
          onClose={() => setSelectedRecipeId(null)}
          currentUser={currentUser}
          isOwner={isOwner}
          onEditRecipe={handleEditRecipe}
          onDeleteRecipe={handleDeleteRecipe}
          showToast={showToast}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
        showToast={showToast}
        showGooglePickerDirectly={directGooglePicker}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-white font-serif font-black text-lg shadow-md shadow-orange-600/30">
                  FC
                </div>
                <span className="text-white font-serif font-bold text-xl tracking-tight">FlavorCraft</span>
              </div>
              <p className="text-sm text-stone-400 max-w-md leading-relaxed">
                A comprehensive culinary ecosystem where anyone can instantly share and discover authentic heritage recipes, explore spice measurements, and connect with fellow food lovers.
              </p>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Platform Features</h4>
              <ul className="space-y-2 text-xs">
                <li><span className="text-orange-400 font-semibold">Open Sharing:</span> Upload recipes with your name without login</li>
                <li><span className="text-emerald-400 font-semibold">Community Feed:</span> Real-time recipe discovery & reviews</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Quick Demo Access</h4>
              <p className="text-xs text-stone-400 mb-2">Instant 1-click evaluation profiles:</p>
              <div className="space-y-1.5 text-xs">
                <div className="text-stone-300 font-mono">admin@recipes.com / admin</div>
                <div className="text-stone-300 font-mono">aarav@recipes.com / password123</div>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
            <div>&copy; 2026 Online Recipe Sharing Platform. Built & Engineered by Sachin Bhandari.</div>
            <div className="flex items-center space-x-3 text-stone-400">
              <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-orange-400 font-semibold border border-stone-700">React • Tailwind CSS • Chart.js • Java</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement && window.ReactDOM) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

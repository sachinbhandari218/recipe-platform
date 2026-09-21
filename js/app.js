import { store } from "./store.js";
import { auth } from "./auth.js";
import { showToast } from "./toast.js";
import { renderDiscoverView, refreshRecipeCards } from "./views/discover.js";
import { renderUserDashboard } from "./views/userDashboard.js";
import { renderAdminDashboard } from "./views/admin.js";
import { openAuthModal } from "./views/authModal.js";

class AppRouter {
  constructor() {
    this.appContainer = document.getElementById("app-main-content");
    this.navContainer = document.getElementById("app-navbar");
    this.mobileNavContainer = document.getElementById("mobile-menu-drawer");
    this.init();
  }

  init() {
    window.addEventListener("hashchange", () => this.handleRouting());
    auth.onAuthChange(() => {
      this.renderNavigation();
      this.handleRouting();
    });
    store.subscribe(() => {
      const hash = window.location.hash || "#discover";
      if (hash === "#discover" || !hash) {
        refreshRecipeCards();
      } else if (hash === "#admin" && auth.isAdmin()) {
        renderAdminDashboard(this.appContainer);
      } else if (hash === "#user-dashboard" && auth.isAuthenticated()) {
        renderUserDashboard(this.appContainer);
      }
    });

    this.renderNavigation();
    this.handleRouting();
  }

  renderNavigation() {
    const currentUser = auth.getCurrentUser();
    const settings = store.getSettings();
    const currentHash = window.location.hash || "#discover";

    const brandHtml = `
      <a href="#discover" class="flex items-center space-x-3 group">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <div>
          <span id="header-platform-name" class="font-serif font-bold text-lg sm:text-xl text-stone-900 tracking-tight block leading-tight group-hover:text-orange-700 transition-colors">${escapeHtml(settings.platformName)}</span>
          <span class="text-[10px] uppercase font-bold tracking-widest text-orange-600">Heritage Recipe Platform</span>
        </div>
      </a>
    `;

    const isOwner = auth.isOwner();

    let navLinksHtml = "";
    if (!currentUser) {
      navLinksHtml = `
        <a href="#discover" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#discover" ? "text-orange-700 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}">
          Discover Recipes
        </a>
        <a href="#share-recipe" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#share-recipe" ? "text-orange-700 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}">
          Share Recipe
        </a>
      `;
    } else if (currentUser.role === "admin" || isOwner) {
      navLinksHtml = `
        <a href="#discover" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#discover" ? "text-orange-700 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}">
          Discover Recipes
        </a>
        <a href="#share-recipe" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#share-recipe" ? "text-orange-700 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}">
          Share Recipe
        </a>
        <a href="#admin" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#admin" ? "text-emerald-900 bg-emerald-100" : "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"}">
          Admin Dashboard
        </a>
        <a href="#user-dashboard" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#user-dashboard" ? "text-orange-700 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}">
          Chef Studio
        </a>
      `;
    } else {
      navLinksHtml = `
        <a href="#discover" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#discover" ? "text-orange-700 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}">
          Discover Recipes
        </a>
        <a href="#share-recipe" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#share-recipe" ? "text-orange-700 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}">
          Share Recipe
        </a>
        <a href="#user-dashboard" class="nav-link px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${currentHash === "#user-dashboard" ? "text-orange-700 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}">
          My Recipes & History
        </a>
      `;
    }

    let authActionsHtml = "";
    if (!currentUser) {
      authActionsHtml = `
        <button id="nav-btn-google" class="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 shadow-sm transition-all">
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.35 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
          </svg>
          <span>Google Sign In</span>
        </button>
        <button id="nav-btn-signin" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all transform hover:-translate-y-0.5">
          Sign In / Register
        </button>
      `;
    } else {
      authActionsHtml = `
        <div class="flex items-center space-x-3">
          <div class="hidden md:flex flex-col items-end">
            <div class="flex items-center space-x-2">
              <span id="header-user-name" class="font-bold text-xs sm:text-sm text-stone-800">${escapeHtml(currentUser.name)}</span>
              ${isOwner ? `
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Owner
                </span>
              ` : `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentUser.role === "admin" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-orange-100 text-orange-800 border border-orange-200"}">
                  ${currentUser.role}
                </span>
              `}
            </div>
            <span class="text-[11px] text-stone-400">${escapeHtml(currentUser.email)}</span>
          </div>

          <a href="#user-dashboard" class="relative block">
            <img src="${escapeHtml(currentUser.avatar)}" class="w-9 h-9 rounded-xl object-cover ring-2 ring-orange-500/30" />
          </a>

          <button id="nav-btn-logout" class="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Sign Out">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
      `;
    }

    this.navContainer.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <div class="flex items-center space-x-8">
            ${brandHtml}
            <div class="hidden md:flex items-center space-x-2">
              ${navLinksHtml}
            </div>
          </div>

          <div class="flex items-center space-x-3">
            ${authActionsHtml}
            <button id="btn-toggle-mobile" class="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderMobileDrawer(currentUser, navLinksHtml);
    this.attachNavEvents();
  }

  renderMobileDrawer(currentUser, navLinksHtml) {
    if (!this.mobileNavContainer) return;
    const isOwner = auth.isOwner();
    this.mobileNavContainer.innerHTML = `
      <div class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm hidden" id="mobile-backdrop"></div>
      <div class="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl p-6 flex flex-col justify-between transform translate-x-full transition-transform duration-300 ease-in-out" id="mobile-drawer-content">
        <div class="space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <span class="font-extrabold text-slate-900">Navigation</span>
            <button id="btn-close-mobile" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="flex flex-col space-y-2">
            ${navLinksHtml}
          </div>

          ${currentUser ? `
            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div class="flex items-center space-x-3 mb-2">
                <img src="${escapeHtml(currentUser.avatar)}" class="w-9 h-9 rounded-xl object-cover" />
                <div class="overflow-hidden">
                  <div class="font-bold text-xs text-slate-900 truncate">${escapeHtml(currentUser.name)}</div>
                  ${isOwner ? `
                    <div class="text-[10px] text-amber-800 uppercase font-black">Owner</div>
                  ` : `
                    <div class="text-[10px] text-slate-400 uppercase font-bold">${currentUser.role}</div>
                  `}
                </div>
              </div>
            </div>
          ` : `
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <button id="mobile-btn-google" class="w-full py-2 px-3 text-xs font-bold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center space-x-2">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
                </svg>
                <span>Google Sign In</span>
              </button>
              <button id="mobile-demo-admin" class="w-full py-2 px-3 text-xs font-bold text-amber-900 bg-amber-50 rounded-xl">Owner (Sachin) Login</button>
              <button id="mobile-demo-user" class="w-full py-2 px-3 text-xs font-bold text-orange-800 bg-orange-50 rounded-xl">Demo User Login</button>
            </div>
          `}
        </div>

        <div>
          ${currentUser ? `
            <button id="mobile-btn-logout" class="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors">
              Sign Out
            </button>
          ` : `
            <button id="mobile-btn-signin" class="w-full py-2.5 rounded-xl font-bold text-xs bg-orange-600 text-white hover:bg-orange-700 transition-colors">
              Sign In / Register
            </button>
          `}
        </div>
      </div>
    `;

    const toggleBtn = document.getElementById("btn-toggle-mobile");
    const closeBtn = document.getElementById("btn-close-mobile");
    const backdrop = document.getElementById("mobile-backdrop");
    const drawer = document.getElementById("mobile-drawer-content");

    const openDrawer = () => {
      backdrop.classList.remove("hidden");
      drawer.classList.remove("translate-x-full");
    };
    const closeDrawer = () => {
      backdrop.classList.add("hidden");
      drawer.classList.add("translate-x-full");
    };

    if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (backdrop) backdrop.addEventListener("click", closeDrawer);

    const mGoogle = document.getElementById("mobile-btn-google");
    if (mGoogle) mGoogle.addEventListener("click", () => {
      openAuthModal("login");
      const gp = document.getElementById("google-picker-container");
      if (gp) gp.classList.remove("hidden");
      closeDrawer();
    });

    const mAdmin = document.getElementById("mobile-demo-admin");
    if (mAdmin) mAdmin.addEventListener("click", () => { auth.quickLoginAs("admin"); closeDrawer(); });
    const mUser = document.getElementById("mobile-demo-user");
    if (mUser) mUser.addEventListener("click", () => { auth.quickLoginAs("user"); closeDrawer(); });
    const mLogout = document.getElementById("mobile-btn-logout");
    if (mLogout) mLogout.addEventListener("click", () => { auth.logout(); closeDrawer(); });
    const mSignIn = document.getElementById("mobile-btn-signin");
    if (mSignIn) mSignIn.addEventListener("click", () => { openAuthModal("login"); closeDrawer(); });

    this.mobileNavContainer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeDrawer);
    });
  }

  attachNavEvents() {
    const signinBtn = document.getElementById("nav-btn-signin");
    if (signinBtn) {
      signinBtn.addEventListener("click", () => openAuthModal("login"));
    }

    const googleBtn = document.getElementById("nav-btn-google");
    if (googleBtn) {
      googleBtn.addEventListener("click", () => {
        openAuthModal("login");
        const gp = document.getElementById("google-picker-container");
        if (gp) gp.classList.remove("hidden");
      });
    }

    const logoutBtn = document.getElementById("nav-btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => auth.logout());
    }

    const demoAdminBtn = document.getElementById("nav-btn-demo-admin");
    if (demoAdminBtn) {
      demoAdminBtn.addEventListener("click", () => auth.quickLoginAs("admin"));
    }

    const demoUserBtn = document.getElementById("nav-btn-demo-user");
    if (demoUserBtn) {
      demoUserBtn.addEventListener("click", () => auth.quickLoginAs("user"));
    }
  }

  handleRouting() {
    const hash = window.location.hash || "#discover";
    this.renderNavigation();

    if (hash === "#auth") {
      openAuthModal("login");
      window.location.hash = "#discover";
      return;
    }

    if (hash === "#share-recipe") {
      renderUserDashboard(this.appContainer, "share-recipe");
    } else if (hash === "#admin") {
      if (!auth.isAdmin()) {
        showToast("Access denied: Administrator credentials required.", "error");
        window.location.hash = "#discover";
        return;
      }
      renderAdminDashboard(this.appContainer);
    } else if (hash === "#user-dashboard") {
      if (!auth.isAuthenticated()) {
        showToast("Please sign in to access your user dashboard.", "info");
        openAuthModal("login");
        window.location.hash = "#discover";
        return;
      }
      renderUserDashboard(this.appContainer);
    } else {
      renderDiscoverView(this.appContainer);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str || "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  new AppRouter();
});

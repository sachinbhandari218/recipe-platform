import { store } from "../store.js";
import { auth } from "../auth.js";
import { showToast } from "../toast.js";
import { setEditingRecipeId } from "./userDashboard.js";

let currentSearchTerm = "";
let currentFilterType = "all";
let currentSortOrder = "newest";
let selectedRecipeId = null;
let ratingInputState = 5;
let editingReviewId = null;
let editRatingState = 5;

export function renderDiscoverView(container) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-700 via-amber-800 to-stone-900 text-white p-8 md:p-14 shadow-2xl mb-10">
        <div class="relative z-10 max-w-2xl">
          <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-300/30">
            <span>Authentic Spice & Heritage Kitchen</span>
          </div>
          <h1 class="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-4 text-white leading-tight">
            Discover, Cook & Share Handcrafted Heritage Recipes
          </h1>
          <p class="text-stone-200 text-base md:text-lg mb-8 leading-relaxed font-light">
            Explore authentic Indian culinary creations with traditional spice measurements, slow-simmered handi guides, and verified community reviews.
          </p>
          <div class="flex flex-wrap gap-3">
            <button id="btn-hero-share" class="px-6 py-3 rounded-xl font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-all transform hover:-translate-y-0.5 shadow-lg shadow-orange-600/30">
              Share Your Recipe
            </button>
            <button id="btn-hero-explore" class="px-6 py-3 rounded-xl font-semibold bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-md border border-white/20">
              Browse Top Rated
            </button>
          </div>
        </div>
        <div class="absolute -right-16 -bottom-16 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div class="glass-card rounded-2xl p-5 mb-8 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div class="md:col-span-6 relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              id="discover-search-input"
              value="${escapeHtml(currentSearchTerm)}"
              placeholder="Search by recipe title or ingredients..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-slate-50/50"
            />
          </div>

          <div class="md:col-span-3">
            <select id="discover-filter-type" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-slate-50/50">
              <option value="all" ${currentFilterType === "all" ? "selected" : ""}>All Recipes</option>
              <option value="highest_rated" ${currentFilterType === "highest_rated" ? "selected" : ""}>Highest Rated</option>
              <option value="newest" ${currentFilterType === "newest" ? "selected" : ""}>Newest</option>
              <option value="quick_prep" ${currentFilterType === "quick_prep" ? "selected" : ""}>Quick Prep Time (&lt; 30 mins)</option>
            </select>
          </div>

          <div class="md:col-span-3 flex items-center space-x-2">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sort:</label>
            <select id="discover-sort-order" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-slate-50/50">
              <option value="newest" ${currentSortOrder === "newest" ? "selected" : ""}>Newest Submissions</option>
              <option value="highest_rated" ${currentSortOrder === "highest_rated" ? "selected" : ""}>Highest Rated</option>
              <option value="title_asc" ${currentSortOrder === "title_asc" ? "selected" : ""}>Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      <div id="recipe-cards-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      </div>

      <div id="recipe-detail-modal-container"></div>
    </div>
  `;

  attachDiscoverEvents(container);
  showLoadingSkeletons();
  setTimeout(() => {
    refreshRecipeCards();
  }, 120);
}

function showLoadingSkeletons() {
  const grid = document.getElementById("recipe-cards-grid");
  if (!grid) return;

  grid.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="glass-card rounded-2xl overflow-hidden shadow-sm border border-stone-200 p-4 animate-pulse">
      <div class="bg-stone-200 h-48 rounded-xl mb-4 w-full"></div>
      <div class="flex items-center space-x-2 mb-3">
        <div class="w-6 h-6 rounded-full bg-stone-200"></div>
        <div class="h-3 bg-stone-200 rounded w-24"></div>
      </div>
      <div class="h-5 bg-stone-200 rounded w-3/4 mb-2"></div>
      <div class="h-3 bg-stone-200 rounded w-full mb-1"></div>
      <div class="h-3 bg-stone-200 rounded w-2/3 mb-4"></div>
      <div class="h-8 bg-stone-200 rounded-xl w-full"></div>
    </div>
  `).join("");
}

function attachDiscoverEvents(container) {
  const searchInput = container.querySelector("#discover-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchTerm = e.target.value;
      refreshRecipeCards();
    });
  }

  const filterType = container.querySelector("#discover-filter-type");
  if (filterType) {
    filterType.addEventListener("change", (e) => {
      currentFilterType = e.target.value;
      if (currentFilterType === "highest_rated") {
        currentSortOrder = "highest_rated";
        const so = container.querySelector("#discover-sort-order");
        if (so) so.value = "highest_rated";
      } else if (currentFilterType === "newest") {
        currentSortOrder = "newest";
        const so = container.querySelector("#discover-sort-order");
        if (so) so.value = "newest";
      }
      refreshRecipeCards();
    });
  }

  const sortOrder = container.querySelector("#discover-sort-order");
  if (sortOrder) {
    sortOrder.addEventListener("change", (e) => {
      currentSortOrder = e.target.value;
      refreshRecipeCards();
    });
  }

  const btnHeroShare = container.querySelector("#btn-hero-share");
  if (btnHeroShare) {
    btnHeroShare.addEventListener("click", () => {
      window.location.hash = "#share-recipe";
    });
  }

  const btnHeroExplore = container.querySelector("#btn-hero-explore");
  if (btnHeroExplore) {
    btnHeroExplore.addEventListener("click", () => {
      currentFilterType = "highest_rated";
      currentSortOrder = "highest_rated";
      const ft = container.querySelector("#discover-filter-type");
      if (ft) ft.value = "highest_rated";
      const so = container.querySelector("#discover-sort-order");
      if (so) so.value = "highest_rated";
      refreshRecipeCards();
    });
  }
}

export function refreshRecipeCards() {
  const grid = document.getElementById("recipe-cards-grid");
  if (!grid) return;

  const approvedRecipes = store.getApprovedRecipes();
  const searchLower = currentSearchTerm.toLowerCase().trim();

  let filtered = approvedRecipes.filter((recipe) => {
    const author = store.getUserById(recipe.author_uid || recipe.author_id);
    const authorName = author ? (author.display_name || author.name).toLowerCase() : "";
    const titleMatch = (recipe.title || "").toLowerCase().includes(searchLower);

    let ingredientStrings = [];
    if (Array.isArray(recipe.ingredients)) {
      ingredientStrings = recipe.ingredients.map((ing) => {
        if (typeof ing === "object" && ing !== null) {
          return `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ""}`.toLowerCase();
        }
        return String(ing).toLowerCase();
      });
    }
    const ingredientsMatch = ingredientStrings.some((s) => s.includes(searchLower));

    let instructionsText = "";
    if (Array.isArray(recipe.instructions)) {
      instructionsText = recipe.instructions.join(" ").toLowerCase();
    } else {
      instructionsText = (recipe.instructions || "").toLowerCase();
    }
    const instructionsMatch = instructionsText.includes(searchLower);
    const authorMatch = authorName.includes(searchLower);

    const matchesSearch = !searchLower || titleMatch || ingredientsMatch || instructionsMatch || authorMatch;
    if (!matchesSearch) return false;

    if (currentFilterType === "quick_prep") {
      const prepMinutes = Number(recipe.prep_time || 0);
      if (prepMinutes > 30) return false;
    }

    if (currentFilterType === "highest_rated") {
      const stats = store.getRecipeRatingStats(recipe.recipe_id || recipe.id);
      if (stats.averageRating < 4.0) return false;
    }

    return true;
  });

  if (currentSortOrder === "newest") {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (currentSortOrder === "highest_rated") {
    filtered.sort((a, b) => {
      const statsA = store.getRecipeRatingStats(a.recipe_id || a.id);
      const statsB = store.getRecipeRatingStats(b.recipe_id || b.id);
      return statsB.averageRating - statsA.averageRating || statsB.count - statsA.count;
    });
  } else if (currentSortOrder === "title_asc") {
    filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }

  if (filtered.length === 0) {
    const isGlobalEmpty = approvedRecipes.length === 0;
    grid.innerHTML = `
      <div class="col-span-full text-center py-16 px-4">
        <div class="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <h3 class="text-xl font-serif font-bold text-stone-900 mb-1">${isGlobalEmpty ? "No Recipes Published Yet" : "Your spice rack is searching..."}</h3>
        <p class="text-sm text-stone-500 max-w-md mx-auto mb-6">${isGlobalEmpty ? "Be the first chef to share a recipe with our community! Click below to publish your creation." : "No culinary recipes match your search criteria. Try searching for paneer, biryani, cardamom, or reset filters to explore all dishes."}</p>
        <button id="${isGlobalEmpty ? "btn-empty-share" : "btn-clear-filters"}" class="px-5 py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all">
          ${isGlobalEmpty ? "Share Your Recipe" : "Explore All Recipes"}
        </button>
      </div>
    `;
    const emptyShareBtn = grid.querySelector("#btn-empty-share");
    if (emptyShareBtn) {
      emptyShareBtn.addEventListener("click", () => {
        window.location.hash = "#share-recipe";
      });
    }
    const clearBtn = grid.querySelector("#btn-clear-filters");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        currentSearchTerm = "";
        currentFilterType = "all";
        currentSortOrder = "newest";
        const si = document.getElementById("discover-search-input");
        if (si) si.value = "";
        const ft = document.getElementById("discover-filter-type");
        if (ft) ft.value = "all";
        const so = document.getElementById("discover-sort-order");
        if (so) so.value = "newest";
        refreshRecipeCards();
      });
    }
    return;
  }

  grid.innerHTML = filtered
    .map((recipe) => {
      const recId = recipe.recipe_id || recipe.id;
      const canEdit = auth.canEditRecipe(recipe);
      const canDelete = auth.canDeleteRecipe(recipe);
      const isOwner = auth.isOwner();
      const author = store.getUserById(recipe.author_uid || recipe.author_id);
      const authorName = author ? (author.display_name || author.name) : (recipe.author_name || "Community Chef");
      const authorAvatar = author ? (author.avatar_url || author.avatar) : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName)}`;
      const stats = store.getRecipeRatingStats(recId);
      const photoUrl = recipe.image_url || (recipe.photos && recipe.photos.length > 0 ? recipe.photos[0] : "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80");
      const formattedDate = new Date(recipe.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const prepTime = Number(recipe.prep_time || 25);

      let ingredientLabels = [];
      if (Array.isArray(recipe.ingredients)) {
        ingredientLabels = recipe.ingredients.map((ing) => {
          if (typeof ing === "object" && ing !== null) {
            return `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ""}`.trim();
          }
          return String(ing).trim();
        });
      }

      let instructionsSummary = "";
      if (Array.isArray(recipe.instructions)) {
        instructionsSummary = recipe.instructions.join(" ");
      } else {
        instructionsSummary = recipe.instructions || "";
      }

      return `
        <div class="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-stone-200/90 hover:-translate-y-1">
          <div class="relative overflow-hidden recipe-image-aspect bg-stone-100 cursor-pointer btn-open-recipe" data-id="${recId}">
            <img
              src="${escapeHtml(photoUrl)}"
              alt="${escapeHtml(recipe.title)}"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'"
            />
            <div class="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-sm text-stone-800">
              <svg class="w-3.5 h-3.5 text-amber-500 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <span>${stats.count > 0 ? stats.averageRating : "New"}</span>
              <span class="text-slate-400 font-normal">(${stats.count})</span>
            </div>
            <div class="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md text-stone-100 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold flex items-center space-x-1">
              <svg class="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>${prepTime} mins prep</span>
            </div>
          </div>

          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center space-x-2 text-xs text-slate-500 mb-2">
                <img src="${escapeHtml(authorAvatar)}" class="w-5 h-5 rounded-full object-cover" />
                <span class="font-medium text-slate-700 truncate">${escapeHtml(authorName)}</span>
                <span>•</span>
                <span>${formattedDate}</span>
              </div>
              <h3 class="text-lg font-serif font-bold text-stone-900 group-hover:text-orange-700 transition-colors line-clamp-2 mb-2 cursor-pointer btn-open-recipe" data-id="${recId}">
                ${escapeHtml(recipe.title)}
              </h3>
              <p class="text-stone-600 text-xs line-clamp-2 mb-4 leading-relaxed">
                ${escapeHtml(recipe.description || instructionsSummary)}
              </p>
            </div>

            <div>
              <div class="flex flex-wrap gap-1.5 mb-4">
                ${ingredientLabels.slice(0, 3).map((ing) => `
                  <span class="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs font-medium truncate max-w-[140px]">
                    ${escapeHtml(ing)}
                  </span>
                `).join("")}
                ${ingredientLabels.length > 3 ? `
                  <span class="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-medium">
                    +${ingredientLabels.length - 3} more
                  </span>
                ` : ""}
              </div>

              <div class="flex items-center space-x-2">
                ${canEdit ? `
                  <button
                    type="button"
                    data-id="${recId}"
                    class="btn-card-edit-recipe px-3 py-2.5 rounded-xl font-semibold text-xs tracking-wide text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors flex items-center justify-center space-x-1"
                    title="Edit recipe"
                  >
                    <svg class="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    <span>Edit</span>
                  </button>
                ` : ""}
                ${canDelete ? `
                  <button
                    type="button"
                    data-id="${recId}"
                    data-title="${escapeHtml(recipe.title)}"
                    class="btn-card-owner-delete px-3 py-2.5 rounded-xl font-semibold text-xs tracking-wide text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center space-x-1"
                    title="${isOwner ? "Delete recipe as Owner" : "Delete recipe"}"
                  >
                    <svg class="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    <span>Delete</span>
                  </button>
                ` : ""}
                <button
                  type="button"
                  data-id="${recId}"
                  class="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs tracking-wide text-orange-700 bg-orange-50 hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center space-x-1.5 btn-open-recipe"
                >
                  <span>View Full Recipe & Reviews</span>
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  grid.querySelectorAll(".btn-open-recipe").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openRecipeDetailModal(id);
    });
  });

  grid.querySelectorAll(".btn-card-edit-recipe").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      setEditingRecipeId(id);
      window.location.hash = "#share-recipe";
    });
  });

  grid.querySelectorAll(".btn-card-owner-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title") || "this recipe";
      const isOwner = auth.isOwner();
      const promptText = isOwner
        ? `As Platform Owner (Sachin Bhandari), permanently delete "${title}"?`
        : `Are you sure you want to permanently delete "${title}"?`;
      if (confirm(promptText)) {
        const currentUser = auth.getCurrentUser();
        const currentUid = currentUser ? (currentUser.uid || currentUser.id) : null;
        await store.deleteRecipe(id, currentUid);
        showToast(isOwner ? `Recipe '${title}' deleted by Owner.` : `Recipe '${title}' has been deleted.`, "info");
        refreshRecipeCards();
      }
    });
  });
}

export function openRecipeDetailModal(recipeId) {
  selectedRecipeId = recipeId;
  editingReviewId = null;
  const recipe = store.getRecipeById(recipeId);
  if (!recipe) return;

  const container = document.getElementById("recipe-detail-modal-container");
  if (!container) return;

  const author = store.getUserById(recipe.author_uid || recipe.author_id);
  const authorName = author ? (author.display_name || author.name) : (recipe.author_name || "Community Chef");
  const authorAvatar = author ? (author.avatar_url || author.avatar) : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName)}`;
  const stats = store.getRecipeRatingStats(recipe.recipe_id || recipe.id);
  const reviews = store.getReviewsByRecipe(recipe.recipe_id || recipe.id);
  const currentUser = auth.getCurrentUser();
  const currentUid = currentUser ? (currentUser.uid || currentUser.id) : null;
  const isOwner = auth.isOwner();
  const isAdmin = (currentUser && currentUser.role === "admin") || isOwner;
  const canEditRecipe = auth.canEditRecipe(recipe);
  const canDeleteRecipe = auth.canDeleteRecipe(recipe) || isOwner;

  const userReview = currentUid ? store.getUserReviewForRecipe(recipe.recipe_id || recipe.id, currentUid) : null;

  const photoUrl = recipe.image_url || (recipe.photos && recipe.photos.length > 0 ? recipe.photos[0] : "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80");
  ratingInputState = 5;

  let ingredientList = [];
  if (Array.isArray(recipe.ingredients)) {
    ingredientList = recipe.ingredients.map((ing) => {
      if (typeof ing === "object" && ing !== null) {
        return `${ing.quantity ? ing.quantity + " " : ""}${ing.unit ? ing.unit + " " : ""}${ing.name || ""}`.trim();
      }
      return String(ing).trim();
    });
  }

  let instructionSteps = [];
  if (Array.isArray(recipe.instructions)) {
    instructionSteps = recipe.instructions;
  } else if (typeof recipe.instructions === "string") {
    instructionSteps = recipe.instructions.split("\n").map((s) => s.trim()).filter(Boolean);
  }

  container.innerHTML = `
    <div id="recipe-modal" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div class="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-pop-in border border-stone-200">
        
        <div class="relative h-64 sm:h-80 w-full overflow-hidden bg-stone-900 flex-shrink-0">
          <img
            src="${escapeHtml(photoUrl)}"
            alt="${escapeHtml(recipe.title)}"
            class="w-full h-full object-cover opacity-90"
            onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
          
          <div class="absolute top-4 right-4 z-10 flex items-center space-x-2">
            ${canEditRecipe ? `
              <button id="modal-edit-recipe-btn" class="px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg backdrop-blur-md transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                <span>Edit Recipe</span>
              </button>
            ` : ""}
            ${canDeleteRecipe ? `
              <button id="modal-delete-recipe-btn" class="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg backdrop-blur-md transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                <span>${isOwner ? "Delete Recipe (Owner)" : "Delete Recipe"}</span>
              </button>
            ` : ""}
            <button id="modal-close-btn" class="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="absolute bottom-5 left-6 right-6 text-white">
            <div class="flex items-center space-x-2 text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2">
              <span class="bg-emerald-500/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-400/30">Verified Heritage Dish</span>
              <span>•</span>
              <span class="text-stone-200">${Number(recipe.prep_time || 25)} Mins Prep</span>
            </div>
            <h2 class="text-2xl sm:text-4xl font-serif font-extrabold text-white leading-tight mb-2">${escapeHtml(recipe.title)}</h2>
            <div class="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-200">
              <div class="flex items-center space-x-2">
                <img src="${escapeHtml(authorAvatar)}" class="w-6 h-6 rounded-full object-cover border border-white/40" />
                <span class="font-medium text-white">${escapeHtml(authorName)}</span>
              </div>
              <div class="flex items-center space-x-1.5 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md">
                <svg class="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                <span class="font-bold text-white">${stats.averageRating}</span>
                <span class="text-stone-300">(${stats.count} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="md:col-span-1 bg-stone-50 p-5 rounded-2xl border border-stone-200">
              <h3 class="text-base font-bold text-stone-900 mb-3 flex items-center space-x-2">
                <svg class="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                <span>Ingredients</span>
              </h3>
              <p class="text-xs text-stone-500 mb-3">Check off ingredients as you cook:</p>
              <ul class="space-y-2 text-sm text-stone-700">
                ${ingredientList.map((ing, idx) => `
                  <li class="flex items-start space-x-2.5">
                    <input type="checkbox" id="ing-${idx}" class="mt-1 rounded text-emerald-700 focus:ring-emerald-600 border-stone-300 w-4 h-4 cursor-pointer" />
                    <label for="ing-${idx}" class="cursor-pointer leading-snug select-none">${escapeHtml(ing)}</label>
                  </li>
                `).join("")}
              </ul>
            </div>

            <div class="md:col-span-2 space-y-4">
              <h3 class="text-base font-bold text-stone-900 flex items-center space-x-2">
                <svg class="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                <span>Preparation Instructions</span>
              </h3>
              <div class="bg-white rounded-2xl p-6 border border-stone-200 text-stone-700 leading-relaxed text-sm sm:text-base space-y-3">
                ${instructionSteps.map((step, idx) => `
                  <div class="flex items-start space-x-3">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center mt-0.5">${idx + 1}</span>
                    <p class="flex-1">${escapeHtml(step)}</p>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="border-t border-stone-200 pt-8">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-xl font-serif font-bold text-stone-900">Ratings & Community Reviews</h3>
                <p class="text-xs sm:text-sm text-stone-500">Verified home chef reviews and kitchen feedback.</p>
              </div>
              <div class="text-right">
                <div class="text-2xl font-black text-stone-900 flex items-center space-x-1 justify-end">
                  <svg class="w-6 h-6 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <span>${stats.averageRating}</span>
                </div>
                <div class="text-xs text-stone-400">${stats.count} verified ratings</div>
              </div>
            </div>

            <div id="review-submission-box" class="bg-stone-50 rounded-2xl p-6 border border-stone-200 mb-8">
              ${currentUser ? (userReview ? `
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2">
                      <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">Your Submitted Review</span>
                      <div class="flex items-center text-amber-400">
                        ${Array.from({ length: userReview.rating || 5 }).map(() => `
                          <svg class="w-4 h-4 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        `).join("")}
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <button id="btn-edit-my-review" data-id="${userReview.review_id || userReview.id}" class="text-xs font-semibold text-emerald-800 hover:underline">
                        Edit Review
                      </button>
                      <span class="text-stone-300">•</span>
                      <button id="btn-delete-my-review" data-id="${userReview.review_id || userReview.id}" class="text-xs font-semibold text-rose-700 hover:underline">
                        Delete Review
                      </button>
                    </div>
                  </div>
                  <p class="text-stone-700 text-sm leading-relaxed">${escapeHtml(userReview.comment_text || userReview.value || "")}</p>
                </div>
              ` : `
                <form id="recipe-rating-form" class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">Your Star Rating (1-5)</label>
                    <div id="star-selector" class="flex items-center space-x-1 cursor-pointer">
                      ${[1, 2, 3, 4, 5].map((star) => `
                        <button type="button" class="star-btn p-1 text-stone-300 hover:text-amber-400 transition-colors" data-star="${star}">
                          <svg class="w-7 h-7 ${star <= ratingInputState ? "text-amber-400 fill-amber-400" : "text-stone-300 fill-transparent"}" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        </button>
                      `).join("")}
                      <span id="star-label" class="ml-3 text-sm font-semibold text-stone-700">${ratingInputState} Stars</span>
                    </div>
                  </div>

                  <div>
                    <label for="comment-text-input" class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">Write a Review / Kitchen Tip</label>
                    <textarea
                      id="comment-text-input"
                      rows="3"
                      placeholder="Share how the dish turned out, spices adjusted, or feedback for the chef..."
                      class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                      required
                    ></textarea>
                  </div>

                  <div class="flex justify-end">
                    <button
                      type="submit"
                      class="px-6 py-2.5 rounded-xl font-semibold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all"
                    >
                      Submit Rating & Review
                    </button>
                  </div>
                </form>
              `) : `
                <div class="text-center py-6">
                  <p class="text-stone-600 text-sm mb-4">You must be signed in to submit ratings and comments on recipes.</p>
                  <button id="btn-login-to-review" class="px-5 py-2.5 rounded-xl font-semibold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all">
                    Sign In to Leave Feedback
                  </button>
                </div>
              `}
            </div>

            <div class="space-y-4">
              <h4 class="text-sm font-bold text-stone-800 uppercase tracking-wider">Community Feedback (${reviews.length})</h4>
              ${reviews.length === 0 ? `
                <div class="text-center py-8 text-stone-400 text-sm italic">
                  No reviews yet. Be the first home chef to cook this dish and share your rating!
                </div>
              ` : reviews.map((rev) => {
                const revAuthor = store.getUserById(rev.author_uid || rev.user_id);
                const revAuthorName = revAuthor ? (revAuthor.display_name || revAuthor.name) : "Community Chef";
                const revAuthorAvatar = revAuthor ? (revAuthor.avatar_url || revAuthor.avatar) : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
                const dateStr = new Date(rev.created_at || rev.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });
                const isOwnReview = currentUid && (rev.author_uid === currentUid || rev.user_id === currentUid);
                const revId = rev.review_id || rev.id;

                return `
                  <div class="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm flex space-x-3.5" id="review-item-${revId}">
                    <img src="${escapeHtml(revAuthorAvatar)}" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center space-x-2">
                          <span class="font-bold text-sm text-stone-900">${escapeHtml(revAuthorName)}</span>
                          <div class="flex items-center text-amber-400">
                            ${Array.from({ length: rev.rating || 5 }).map(() => `
                              <svg class="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            `).join("")}
                          </div>
                        </div>
                        <div class="flex items-center space-x-2">
                          <span class="text-xs text-stone-400">${dateStr}</span>
                          ${isOwnReview ? `
                            <button type="button" data-id="${revId}" class="btn-edit-review-inline text-xs text-emerald-700 hover:text-emerald-900 font-semibold ml-2">
                              Edit
                            </button>
                            <button type="button" data-id="${revId}" class="btn-delete-review-inline text-xs text-rose-600 hover:text-rose-800 font-semibold ml-1">
                              Delete
                            </button>
                          ` : ""}
                          ${(isAdmin || isOwner) && !isOwnReview ? `
                            <button type="button" data-id="${revId}" class="btn-admin-delete-review text-xs text-rose-600 hover:text-rose-800 font-semibold ml-2 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                              Remove (${isOwner ? "Owner" : "Admin"})
                            </button>
                          ` : ""}
                        </div>
                      </div>
                      <p class="text-stone-700 text-sm leading-relaxed">${escapeHtml(rev.comment_text || rev.value || "")}</p>
                      ${rev.edited_at ? `<span class="text-[10px] text-stone-400 block mt-1">(edited)</span>` : ""}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  attachModalEvents(container, recipe.recipe_id || recipe.id);
}

function attachModalEvents(container, recipeId) {
  const closeBtn = container.querySelector("#modal-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      container.innerHTML = "";
    });
  }

  const editBtn = container.querySelector("#modal-edit-recipe-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      container.innerHTML = "";
      setEditingRecipeId(recipeId);
      window.location.hash = "#share-recipe";
    });
  }

  const delBtn = container.querySelector("#modal-delete-recipe-btn");
  if (delBtn) {
    delBtn.addEventListener("click", async () => {
      const recipe = store.getRecipeById(recipeId);
      const title = recipe ? recipe.title : "this recipe";
      const isOwner = auth.isOwner();
      const promptText = isOwner
        ? `As Platform Owner (Sachin Bhandari), permanently delete "${title}"?`
        : `Are you sure you want to permanently delete "${title}"?`;
      if (confirm(promptText)) {
        const currentUser = auth.getCurrentUser();
        const currentUid = currentUser ? (currentUser.uid || currentUser.id) : null;
        await store.deleteRecipe(recipeId, currentUid);
        container.innerHTML = "";
        showToast(isOwner ? `Recipe '${title}' deleted by Owner.` : `Recipe '${title}' has been deleted.`, "info");
        refreshRecipeCards();
      }
    });
  }

  const modalBackdrop = container.querySelector("#recipe-modal");
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) {
        container.innerHTML = "";
      }
    });
  }

  const starBtns = container.querySelectorAll(".star-btn");
  const starLabel = container.querySelector("#star-label");

  starBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const star = parseInt(btn.getAttribute("data-star"), 10);
      ratingInputState = star;
      if (starLabel) starLabel.textContent = `${star} Stars`;

      starBtns.forEach((b) => {
        const s = parseInt(b.getAttribute("data-star"), 10);
        const svg = b.querySelector("svg");
        if (s <= star) {
          svg.className.baseVal = "w-7 h-7 text-amber-400 fill-amber-400";
        } else {
          svg.className.baseVal = "w-7 h-7 text-stone-300 fill-transparent";
        }
      });
    });
  });

  const ratingForm = container.querySelector("#recipe-rating-form");
  if (ratingForm) {
    ratingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentUser = auth.getCurrentUser();
      if (!currentUser) return;

      const commentInput = container.querySelector("#comment-text-input");
      const commentText = commentInput ? commentInput.value.trim() : "";
      const currentUserId = currentUser.uid || currentUser.id;

      try {
        await store.addReview(recipeId, currentUserId, ratingInputState, commentText);
        showToast("Your review and star rating have been published to the community!", "success");
        openRecipeDetailModal(recipeId);
        refreshRecipeCards();
      } catch (err) {
        showToast(err.message || "Failed to submit review.", "error");
      }
    });
  }

  const editMyReviewBtn = container.querySelector("#btn-edit-my-review");
  if (editMyReviewBtn) {
    editMyReviewBtn.addEventListener("click", () => {
      const revId = editMyReviewBtn.getAttribute("data-id");
      showEditReviewInline(container, recipeId, revId);
    });
  }

  const deleteMyReviewBtn = container.querySelector("#btn-delete-my-review");
  if (deleteMyReviewBtn) {
    deleteMyReviewBtn.addEventListener("click", async () => {
      const revId = deleteMyReviewBtn.getAttribute("data-id");
      const currentUser = auth.getCurrentUser();
      const currentUid = currentUser ? (currentUser.uid || currentUser.id) : null;
      await store.deleteReview(revId, currentUid, false);
      showToast("Your review has been removed.", "info");
      openRecipeDetailModal(recipeId);
      refreshRecipeCards();
    });
  }

  container.querySelectorAll(".btn-edit-review-inline").forEach((btn) => {
    btn.addEventListener("click", () => {
      const revId = btn.getAttribute("data-id");
      showEditReviewInline(container, recipeId, revId);
    });
  });

  container.querySelectorAll(".btn-delete-review-inline").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const revId = btn.getAttribute("data-id");
      const currentUser = auth.getCurrentUser();
      const currentUid = currentUser ? (currentUser.uid || currentUser.id) : null;
      await store.deleteReview(revId, currentUid, false);
      showToast("Your review has been deleted.", "info");
      openRecipeDetailModal(recipeId);
      refreshRecipeCards();
    });
  });

  container.querySelectorAll(".btn-admin-delete-review").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const revId = btn.getAttribute("data-id");
      const currentUser = auth.getCurrentUser();
      const currentUid = currentUser ? (currentUser.uid || currentUser.id) : null;
      await store.deleteReview(revId, currentUid, true);
      showToast("Review removed by Administrator.", "info");
      openRecipeDetailModal(recipeId);
      refreshRecipeCards();
    });
  });

  const loginToReviewBtn = container.querySelector("#btn-login-to-review");
  if (loginToReviewBtn) {
    loginToReviewBtn.addEventListener("click", () => {
      container.innerHTML = "";
      window.location.hash = "#auth";
    });
  }
}

function showEditReviewInline(container, recipeId, reviewId) {
  const reviews = store.getReviewsByRecipe(recipeId);
  const rev = reviews.find((r) => (r.review_id === reviewId || r.id === reviewId));
  if (!rev) return;

  const box = container.querySelector("#review-submission-box");
  if (!box) return;

  editRatingState = rev.rating || 5;

  box.innerHTML = `
    <form id="recipe-edit-review-form" class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-orange-700">Edit Your Review</span>
        <button type="button" id="btn-cancel-review-edit" class="text-xs text-stone-500 hover:text-stone-800">Cancel</button>
      </div>

      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">Updated Star Rating</label>
        <div id="edit-star-selector" class="flex items-center space-x-1 cursor-pointer">
          ${[1, 2, 3, 4, 5].map((star) => `
            <button type="button" class="edit-star-btn p-1 text-stone-300 hover:text-amber-400 transition-colors" data-star="${star}">
              <svg class="w-7 h-7 ${star <= editRatingState ? "text-amber-400 fill-amber-400" : "text-stone-300 fill-transparent"}" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </button>
          `).join("")}
          <span id="edit-star-label" class="ml-3 text-sm font-semibold text-stone-700">${editRatingState} Stars</span>
        </div>
      </div>

      <div>
        <label for="edit-comment-input" class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">Updated Review Text</label>
        <textarea
          id="edit-comment-input"
          rows="3"
          class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
          required
        >${escapeHtml(rev.comment_text || rev.value || "")}</textarea>
      </div>

      <div class="flex justify-end space-x-2">
        <button
          type="button"
          id="btn-cancel-edit-bottom"
          class="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-6 py-2 rounded-xl font-semibold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all"
        >
          Save Changes
        </button>
      </div>
    </form>
  `;

  const editStarBtns = box.querySelectorAll(".edit-star-btn");
  const editStarLabel = box.querySelector("#edit-star-label");

  editStarBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const star = parseInt(btn.getAttribute("data-star"), 10);
      editRatingState = star;
      if (editStarLabel) editStarLabel.textContent = `${star} Stars`;

      editStarBtns.forEach((b) => {
        const s = parseInt(b.getAttribute("data-star"), 10);
        const svg = b.querySelector("svg");
        if (s <= star) {
          svg.className.baseVal = "w-7 h-7 text-amber-400 fill-amber-400";
        } else {
          svg.className.baseVal = "w-7 h-7 text-stone-300 fill-transparent";
        }
      });
    });
  });

  const cancelEdit = () => openRecipeDetailModal(recipeId);
  const cancelBtn1 = box.querySelector("#btn-cancel-review-edit");
  const cancelBtn2 = box.querySelector("#btn-cancel-edit-bottom");
  if (cancelBtn1) cancelBtn1.addEventListener("click", cancelEdit);
  if (cancelBtn2) cancelBtn2.addEventListener("click", cancelEdit);

  const editForm = box.querySelector("#recipe-edit-review-form");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentUser = auth.getCurrentUser();
      if (!currentUser) return;
      const currentUid = currentUser.uid || currentUser.id;
      const commentInput = box.querySelector("#edit-comment-input");
      const commentText = commentInput ? commentInput.value.trim() : "";

      try {
        await store.updateReview(reviewId, editRatingState, commentText, currentUid);
        showToast("Review updated successfully!", "success");
        openRecipeDetailModal(recipeId);
        refreshRecipeCards();
      } catch (err) {
        showToast(err.message || "Failed to update review.", "error");
      }
    });
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

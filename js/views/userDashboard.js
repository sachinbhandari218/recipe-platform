import { store } from "../store.js";
import { auth } from "../auth.js";
import { showToast } from "../toast.js";
import { uploadRecipeImage, compressImage } from "../firebaseConfig.js";
import { searchOnlineDishPhoto } from "../imageSearch.js";

let activeUserTab = "my-recipes";
let editingRecipeId = null;

export function setEditingRecipeId(id) {
  editingRecipeId = id;
  activeUserTab = "share-recipe";
}

const samplePhotos = [
  { label: "Pav Bhaji", url: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80" },
  { label: "Samosa", url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80" },
  { label: "Paneer Tikka", url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=1200&q=80" },
  { label: "Dum Biryani", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80" },
  { label: "Masala Chai", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80" },
  { label: "Mango Kulfi", url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1200&q=80" }
];

export function renderUserDashboard(container, requestedTab = null) {
  if (requestedTab) {
    activeUserTab = requestedTab;
  }

  const currentUser = auth.getCurrentUser();
  if (!currentUser && activeUserTab !== "share-recipe") {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-16 text-center">
        <div class="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-200">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <h2 class="text-2xl font-serif font-bold text-slate-900 mb-2">Share or Manage Recipes</h2>
        <p class="text-slate-600 mb-6">Anyone can share recipes without signing in, or sign in to track your personal kitchen cookbook.</p>
        <div class="flex justify-center space-x-3">
          <button id="btn-guest-share-go" class="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-md shadow-orange-600/20">
            Share Recipe as Guest
          </button>
          <button id="btn-login-redirect" class="px-6 py-2.5 rounded-xl font-semibold text-xs border border-stone-300 text-stone-700 hover:bg-stone-50 transition-all">
            Sign In / Register
          </button>
        </div>
      </div>
    `;

    const shareBtn = container.querySelector("#btn-guest-share-go");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        activeUserTab = "share-recipe";
        renderUserDashboard(container, "share-recipe");
      });
    }

    const btn = container.querySelector("#btn-login-redirect");
    if (btn) {
      btn.addEventListener("click", () => {
        window.location.hash = "#auth";
      });
    }
    return;
  }

  if (!currentUser && activeUserTab === "share-recipe") {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div class="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
          <div>
            <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900">Share Your Recipe</h1>
            <p class="text-stone-500 text-xs sm:text-sm mt-1">Upload your culinary creation directly with your name without needing to log in.</p>
          </div>
          <a href="#discover" class="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-stone-50">
            &larr; Back to Recipes
          </a>
        </div>
        <div id="user-tab-content"></div>
      </div>
    `;
    renderShareRecipeTab(container.querySelector("#user-tab-content"), null);
    return;
  }

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div class="flex items-center space-x-4">
          <img src="${escapeHtml(currentUser.avatar_url || currentUser.avatar)}" class="w-16 h-16 rounded-2xl object-cover ring-4 ring-orange-100 shadow-md" />
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl sm:text-3xl font-serif font-bold text-slate-900">${escapeHtml(currentUser.display_name || currentUser.name)}</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 uppercase tracking-wider">${currentUser.role}</span>
            </div>
            <p class="text-slate-500 text-sm">${escapeHtml(currentUser.email)} • Community Chef</p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <button id="btn-tab-share-quick" class="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all flex items-center space-x-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Submit New Recipe</span>
          </button>
        </div>
      </div>

      <div class="flex border-b border-slate-200 mb-8 overflow-x-auto space-x-1 sm:space-x-4">
        <button data-tab="my-recipes" class="tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeUserTab === "my-recipes" ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          My Recipes & History
        </button>
        <button data-tab="share-recipe" class="tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeUserTab === "share-recipe" ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          ${editingRecipeId ? "Edit Recipe" : "Share Recipe"}
        </button>
        <button data-tab="my-reviews" class="tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeUserTab === "my-reviews" ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          My Ratings & Comments
        </button>
        <button data-tab="profile" class="tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeUserTab === "profile" ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          Profile Management
        </button>
      </div>

      <div id="user-tab-content">
      </div>

      <div id="user-modal-container"></div>
    </div>
  `;

  attachUserTabs(container);
  renderActiveUserTab();
}

function attachUserTabs(container) {
  container.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeUserTab = btn.getAttribute("data-tab");
      container.querySelectorAll(".tab-btn").forEach((b) => {
        const isTarget = b.getAttribute("data-tab") === activeUserTab;
        b.className = `tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${isTarget ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-800"}`;
      });
      renderActiveUserTab();
    });
  });

  const quickShareBtn = container.querySelector("#btn-tab-share-quick");
  if (quickShareBtn) {
    quickShareBtn.addEventListener("click", () => {
      editingRecipeId = null;
      activeUserTab = "share-recipe";
      renderUserDashboard(container);
    });
  }
}

function renderActiveUserTab() {
  const content = document.getElementById("user-tab-content");
  if (!content) return;

  const currentUser = auth.getCurrentUser();

  if (activeUserTab === "my-recipes") {
    renderMyRecipesTab(content, currentUser);
  } else if (activeUserTab === "share-recipe") {
    renderShareRecipeTab(content, currentUser);
  } else if (activeUserTab === "my-reviews") {
    renderMyReviewsTab(content, currentUser);
  } else if (activeUserTab === "profile") {
    renderProfileTab(content, currentUser);
  }
}

function renderMyRecipesTab(content, currentUser) {
  let myUploads = [];
  try {
    myUploads = JSON.parse(localStorage.getItem("my_uploaded_recipe_ids") || "[]");
  } catch (e) {}

  const currentUid = currentUser ? (currentUser.uid || currentUser.id) : null;
  const allRecipes = store.getRecipes();
  const myRecipes = allRecipes.filter((r) => {
    const recId = r.recipe_id || r.id;
    if (myUploads.includes(recId)) return true;
    if (currentUid && (r.author_uid === currentUid || r.author_id === currentUid)) return true;
    return false;
  });

  content.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Submitted Recipes History</h2>
          <p class="text-xs text-slate-500">Track and manage your submitted culinary recipes.</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-slate-500">Total: <strong>${myRecipes.length}</strong> recipes</span>
        </div>
      </div>

      ${myRecipes.length === 0 ? `
        <div class="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <div class="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h3 class="text-xl font-serif font-bold text-stone-900 mb-1">Your recipe box is empty. Add your first signature dish.</h3>
          <p class="text-sm text-stone-500 max-w-md mx-auto mb-6">Share your family's authentic spices and cooking techniques with fellow home chefs.</p>
          <button id="btn-empty-submit" class="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all">
            Submit Your First Recipe
          </button>
        </div>
      ` : `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead class="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" class="px-6 py-4">Recipe Title</th>
                  <th scope="col" class="px-6 py-4">Ingredients</th>
                  <th scope="col" class="px-6 py-4">Submitted Date</th>
                  <th scope="col" class="px-6 py-4">Status</th>
                  <th scope="col" class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${myRecipes.map((recipe) => {
                  const recId = recipe.recipe_id || recipe.id;
                  const statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Live & Published</span>`;
                  const photoUrl = recipe.image_url || (recipe.photos && recipe.photos.length > 0 ? recipe.photos[0] : "");
                  const dateStr = new Date(recipe.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });
                  const ingCount = Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0;

                  return `
                    <tr class="hover:bg-slate-50/60 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-3">
                          ${photoUrl ? `
                            <img src="${escapeHtml(photoUrl)}" class="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                          ` : `
                            <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                          `}
                          <div>
                            <div class="font-bold text-slate-900">${escapeHtml(recipe.title)}</div>
                            <div class="text-xs text-slate-400">${Number(recipe.prep_time || 20)} mins prep</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-xs text-slate-600">${ingCount} ingredients</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        ${dateStr}
                      </td>
                      <td class="px-6 py-4">
                        ${statusBadge}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          data-id="${recId}"
                          class="btn-edit-user-recipe inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          data-id="${recId}"
                          data-title="${escapeHtml(recipe.title)}"
                          class="btn-delete-user-recipe inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `}
    </div>
  `;

  const emptyBtn = content.querySelector("#btn-empty-submit");
  if (emptyBtn) {
    emptyBtn.addEventListener("click", () => {
      editingRecipeId = null;
      activeUserTab = "share-recipe";
      renderActiveUserTab();
    });
  }

  content.querySelectorAll(".btn-edit-user-recipe").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingRecipeId = btn.getAttribute("data-id");
      activeUserTab = "share-recipe";
      renderActiveUserTab();
    });
  });

  content.querySelectorAll(".btn-delete-user-recipe").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");
      openConfirmDeleteModal(id, title, currentUser);
    });
  });
}

function openConfirmDeleteModal(recipeId, recipeTitle, currentUser) {
  const modalContainer = document.getElementById("user-modal-container");
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div id="confirm-del-modal" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-pop-in">
        <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-center text-slate-900 mb-2">Delete Recipe?</h3>
        <p class="text-center text-slate-500 text-sm mb-6">Are you sure you want to delete <strong>${escapeHtml(recipeTitle)}</strong>?</p>
        <div class="flex space-x-3">
          <button id="btn-cancel-del" type="button" class="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button id="btn-confirm-del" type="button" class="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm">
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  `;

  modalContainer.querySelector("#btn-cancel-del").addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });

  modalContainer.querySelector("#btn-confirm-del").addEventListener("click", async () => {
    await store.deleteRecipe(recipeId, currentUser ? (currentUser.uid || currentUser.id) : null);
    modalContainer.innerHTML = "";
    showToast(`Recipe '${recipeTitle}' removed.`, "info");
    renderActiveUserTab();
  });
}

function renderShareRecipeTab(content, currentUser) {
  let existingRecipe = null;
  if (editingRecipeId) {
    existingRecipe = store.getRecipeById(editingRecipeId);
  }

  const isEditing = !!existingRecipe;
  const initialTitle = isEditing ? existingRecipe.title : "";
  const initialAuthorName = isEditing ? (existingRecipe.author_name || "") : (currentUser ? (currentUser.display_name || currentUser.name) : "");
  let initialIngredients = "";
  if (isEditing) {
    if (Array.isArray(existingRecipe.ingredients)) {
      initialIngredients = existingRecipe.ingredients.map((i) => {
        if (typeof i === "object" && i !== null) {
          return `${i.quantity ? i.quantity + " " : ""}${i.unit ? i.unit + " " : ""}${i.name || ""}`.trim();
        }
        return String(i).trim();
      }).join("\n");
    } else {
      initialIngredients = String(existingRecipe.ingredients || "");
    }
  }

  let initialInstructions = "";
  if (isEditing) {
    if (Array.isArray(existingRecipe.instructions)) {
      initialInstructions = existingRecipe.instructions.join("\n");
    } else {
      initialInstructions = String(existingRecipe.instructions || "");
    }
  }

  const initialPrepTime = isEditing ? Number(existingRecipe.prep_time || 20) : 20;
  const initialPhoto = isEditing ? (existingRecipe.image_url || (existingRecipe.photos && existingRecipe.photos[0]) || "") : "";

  content.innerHTML = `
    <div class="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm animate-fade-in">
      <div class="mb-8 pb-4 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-serif font-bold text-stone-900">${isEditing ? "Edit Recipe Entry" : "Share a Recipe"}</h2>
          <p class="text-xs sm:text-sm text-stone-500 mt-1">
            Anyone can share recipes instantly! Enter your recipe details below and it will appear live on the platform.
          </p>
        </div>
        ${isEditing ? `
          <button id="btn-cancel-edit" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">
            Cancel Edit
          </button>
        ` : ""}
      </div>

      <form id="recipe-share-form" class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="recipe-title" class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Recipe Title *</label>
            <input
              type="text"
              id="recipe-title"
              value="${escapeHtml(initialTitle)}"
              placeholder="e.g. Garlic Butter Naan or Paneer Butter Masala"
              required
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-stone-50/50"
            />
          </div>

          <div>
            <label for="recipe-author-name" class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Your Name / Chef Name *</label>
            <input
              type="text"
              id="recipe-author-name"
              value="${escapeHtml(initialAuthorName)}"
              placeholder="e.g. Sachin Bhandari or Chef Rahul"
              required
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-stone-50/50"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="recipe-prep-time" class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Prep Time in Minutes (Optional)</label>
            <input
              type="number"
              id="recipe-prep-time"
              value="${initialPrepTime}"
              min="1"
              max="600"
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-stone-50/50"
            />
          </div>
          <div>
            <label for="recipe-cuisine-tag" class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Cuisine / Category (Optional)</label>
            <input
              type="text"
              id="recipe-cuisine-tag"
              placeholder="e.g. North Indian, Snacks, Dessert"
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-stone-50/50"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="recipe-ingredients" class="block text-xs font-bold uppercase tracking-wider text-stone-700">Ingredients (Optional, one per line)</label>
            <span class="text-xs text-stone-400">Easy to enter or leave blank</span>
          </div>
          <textarea
            id="recipe-ingredients"
            rows="4"
            placeholder="250g paneer cubes&#10;2 tbsp butter&#10;1 tsp garam masala"
            class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-stone-50/50 leading-relaxed font-mono text-xs sm:text-sm"
          >${escapeHtml(initialIngredients)}</textarea>
        </div>

        <div>
          <label for="recipe-instructions" class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Preparation Instructions (Optional)</label>
          <textarea
            id="recipe-instructions"
            rows="5"
            placeholder="Heat butter in a pan, add spices and simmer for 15 minutes. Serve hot with roti."
            class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-stone-50/50 leading-relaxed"
          >${escapeHtml(initialInstructions)}</textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-700">Recipe Image (Optional - Up to 10MB)</label>
            <button
              type="button"
              id="btn-auto-find-photo"
              class="text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg border border-orange-200 transition-colors flex items-center space-x-1"
            >
              <svg class="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <span>Auto-Find Photo Online</span>
            </button>
          </div>

          <div
            id="recipe-dropzone"
            class="relative border-2 border-dashed border-stone-300 hover:border-orange-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-stone-50/60 hover:bg-orange-50/20 group"
          >
            <input
              type="file"
              id="recipe-image-file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              class="hidden"
            />
            <div id="dropzone-prompt" class="space-y-2">
              <div class="w-12 h-12 rounded-2xl bg-orange-100 group-hover:bg-orange-200 text-orange-600 flex items-center justify-center mx-auto transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div class="text-sm font-semibold text-stone-800">
                <span class="text-orange-600 group-hover:underline">Choose a photo</span> or drag and drop here
              </div>
              <p class="text-xs text-stone-400">Accepts JPEG and PNG up to 10MB</p>
            </div>

            <div id="file-info-badge" class="hidden items-center justify-center space-x-2 mt-2">
              <span class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                <svg class="w-4 h-4 mr-1.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span id="selected-file-name">filename.jpg</span>
                <span id="selected-file-size" class="ml-1 text-[11px] text-emerald-700 font-normal"></span>
              </span>
              <button type="button" id="btn-clear-file" class="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 font-semibold bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">
                Remove
              </button>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <button type="button" id="btn-toggle-url-input" class="text-stone-500 hover:text-orange-700 font-semibold underline text-left">
              Or paste image URL / pick preset
            </button>
            <div class="flex items-center space-x-1.5 overflow-x-auto py-1">
              <span class="text-stone-400 whitespace-nowrap">Presets:</span>
              ${samplePhotos.map((p) => `
                <button
                  type="button"
                  data-url="${p.url}"
                  class="btn-pick-sample px-2 py-0.5 rounded-lg text-[11px] font-medium bg-stone-100 hover:bg-orange-100 hover:text-orange-800 text-stone-600 transition-colors border border-stone-200 whitespace-nowrap"
                >
                  ${p.label}
                </button>
              `).join("")}
            </div>
          </div>

          <div id="url-input-container" class="mt-3 ${initialPhoto ? "" : "hidden"}">
            <input
              type="url"
              id="recipe-photo"
              value="${escapeHtml(initialPhoto)}"
              placeholder="https://images.unsplash.com/photo-..."
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs bg-stone-50/50"
            />
          </div>

          <div id="photo-preview-container" class="mt-4 ${initialPhoto ? "" : "hidden"}">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-semibold text-stone-500">Dish Photo Preview:</span>
              <span id="upload-status-badge" class="text-[11px] text-emerald-700 font-semibold"></span>
            </div>
            <div class="relative w-full h-52 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-inner">
              <img id="photo-preview-img" src="${escapeHtml(initialPhoto)}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80'" />
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-stone-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            id="btn-reset-form"
            class="px-5 py-2.5 rounded-xl font-semibold text-xs border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Clear
          </button>
          <button
            type="submit"
            id="btn-submit-recipe"
            class="px-7 py-3 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <span id="btn-submit-text">${isEditing ? "Save & Publish Changes" : "Publish Recipe Live"}</span>
          </button>
        </div>
      </form>
    </div>
  `;

  const form = content.querySelector("#recipe-share-form");
  const titleInput = content.querySelector("#recipe-title");
  const authorNameInput = content.querySelector("#recipe-author-name");
  const prepTimeInput = content.querySelector("#recipe-prep-time");
  const ingredientsInput = content.querySelector("#recipe-ingredients");
  const instructionsInput = content.querySelector("#recipe-instructions");

  const dropzone = content.querySelector("#recipe-dropzone");
  const fileInput = content.querySelector("#recipe-image-file");
  const dropzonePrompt = content.querySelector("#dropzone-prompt");
  const fileInfoBadge = content.querySelector("#file-info-badge");
  const selectedFileName = content.querySelector("#selected-file-name");
  const selectedFileSize = content.querySelector("#selected-file-size");
  const btnClearFile = content.querySelector("#btn-clear-file");
  const btnToggleUrl = content.querySelector("#btn-toggle-url-input");
  const urlInputContainer = content.querySelector("#url-input-container");
  const photoInput = content.querySelector("#recipe-photo");
  const previewContainer = content.querySelector("#photo-preview-container");
  const previewImg = content.querySelector("#photo-preview-img");
  const uploadStatusBadge = content.querySelector("#upload-status-badge");
  const submitBtn = content.querySelector("#btn-submit-recipe");
  const submitText = content.querySelector("#btn-submit-text");

  let selectedFile = null;
  let precompressedData = null;

  const handleSelectedFile = async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("File too large. Maximum size is 10MB.", "error");
      fileInput.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      showToast("Invalid file format. Please upload a JPEG or PNG image.", "error");
      fileInput.value = "";
      return;
    }

    selectedFile = file;
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = `(${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    dropzonePrompt.classList.add("hidden");
    fileInfoBadge.classList.remove("hidden");
    fileInfoBadge.classList.add("flex");
    uploadStatusBadge.textContent = "Optimizing image...";

    const fastData = await compressImage(file);
    precompressedData = fastData;
    previewImg.src = fastData;
    previewContainer.classList.remove("hidden");
    uploadStatusBadge.textContent = "Image ready";
  };

  if (dropzone) {
    dropzone.addEventListener("click", (e) => {
      if (e.target === btnClearFile || btnClearFile.contains(e.target)) return;
      fileInput.click();
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("border-orange-500", "bg-orange-50/40");
    });

    dropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-orange-500", "bg-orange-50/40");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-orange-500", "bg-orange-50/40");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleSelectedFile(fileInput.files[0]);
      }
    });
  }

  if (btnClearFile) {
    btnClearFile.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedFile = null;
      precompressedData = null;
      if (fileInput) fileInput.value = "";
      fileInfoBadge.classList.add("hidden");
      fileInfoBadge.classList.remove("flex");
      dropzonePrompt.classList.remove("hidden");
      uploadStatusBadge.textContent = "";
      if (!photoInput.value.trim() && !initialPhoto) {
        previewContainer.classList.add("hidden");
      } else if (photoInput.value.trim()) {
        previewImg.src = photoInput.value.trim();
      } else if (initialPhoto) {
        previewImg.src = initialPhoto;
      }
    });
  }

  if (btnToggleUrl) {
    btnToggleUrl.addEventListener("click", () => {
      urlInputContainer.classList.toggle("hidden");
    });
  }

  photoInput.addEventListener("input", () => {
    const val = photoInput.value.trim();
    if (val) {
      previewImg.src = val;
      previewContainer.classList.remove("hidden");
      uploadStatusBadge.textContent = "Custom Image URL";
    } else if (!selectedFile && !initialPhoto) {
      previewContainer.classList.add("hidden");
      uploadStatusBadge.textContent = "";
    }
  });

  content.querySelectorAll(".btn-pick-sample").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      photoInput.value = url;
      previewImg.src = url;
      previewContainer.classList.remove("hidden");
      uploadStatusBadge.textContent = "Preset Photo";
      urlInputContainer.classList.remove("hidden");
    });
  });

  const btnAutoFindPhoto = content.querySelector("#btn-auto-find-photo");
  if (btnAutoFindPhoto) {
    btnAutoFindPhoto.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      if (!title) {
        showToast("Please enter a recipe title first to search photos online.", "info");
        titleInput.focus();
        return;
      }
      btnAutoFindPhoto.disabled = true;
      btnAutoFindPhoto.classList.add("opacity-50");
      uploadStatusBadge.textContent = "Searching online photo...";
      try {
        const found = await searchOnlineDishPhoto(title);
        photoInput.value = found;
        previewImg.src = found;
        previewContainer.classList.remove("hidden");
        urlInputContainer.classList.remove("hidden");
        uploadStatusBadge.textContent = "Real dish photo found online";
        showToast(`Found online photo for '${title}'!`, "success");
      } catch (err) {
        showToast("Could not find online photo. You can upload a photo directly.", "error");
      } finally {
        btnAutoFindPhoto.disabled = false;
        btnAutoFindPhoto.classList.remove("opacity-50");
      }
    });
  }

  const cancelBtn = content.querySelector("#btn-cancel-edit");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      editingRecipeId = null;
      activeUserTab = "my-recipes";
      renderActiveUserTab();
    });
  }

  const resetBtn = content.querySelector("#btn-reset-form");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      selectedFile = null;
      precompressedData = null;
      fileInfoBadge.classList.add("hidden");
      fileInfoBadge.classList.remove("flex");
      dropzonePrompt.classList.remove("hidden");
      previewContainer.classList.add("hidden");
      uploadStatusBadge.textContent = "";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const authorName = (authorNameInput ? authorNameInput.value.trim() : "") || (currentUser ? (currentUser.display_name || currentUser.name) : "Guest Chef");
    const prepTime = Number(prepTimeInput.value) || 20;
    const ingredientsRaw = ingredientsInput.value.trim();
    const instructionsRaw = instructionsInput.value.trim();
    let photoUrl = photoInput.value.trim();

    if (!title) {
      showToast("Please enter a recipe title.", "error");
      titleInput.focus();
      return;
    }

    if (!authorName) {
      showToast("Please enter your name or chef name.", "error");
      authorNameInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-75", "cursor-not-allowed");
    submitText.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Publishing Recipe...
    `;

    try {
      const userUid = currentUser ? (currentUser.uid || currentUser.id) : ("guest-" + Date.now().toString(36));

      if (selectedFile || precompressedData) {
        photoUrl = await uploadRecipeImage(selectedFile, userUid, precompressedData);
      } else if (!photoUrl && initialPhoto) {
        photoUrl = initialPhoto;
      } else if (!photoUrl) {
        submitText.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Finding online photo...
        `;
        photoUrl = await searchOnlineDishPhoto(title);
      }

      const ingredients = ingredientsRaw
        ? ingredientsRaw.split("\n").map((i) => i.trim()).filter(Boolean)
        : [];

      const instructions = instructionsRaw || "Prepared with fresh spices and served hot.";

      if (isEditing) {
        await store.updateRecipe(editingRecipeId, {
          title,
          author_name: authorName,
          prep_time: prepTime,
          ingredients,
          instructions,
          image_url: photoUrl,
          photos: [photoUrl],
          status: "approved"
        });
        showToast("Recipe updated successfully!", "success");
        editingRecipeId = null;
      } else {
        const created = await store.addRecipe({
          author_uid: userUid,
          author_id: userUid,
          author_name: authorName,
          title,
          prep_time: prepTime,
          ingredients,
          instructions,
          image_url: photoUrl,
          photos: [photoUrl],
          status: "approved"
        });
        let myUploads = [];
        try {
          myUploads = JSON.parse(localStorage.getItem("my_uploaded_recipe_ids") || "[]");
        } catch (e) {}
        const createdId = created.recipe_id || created.id;
        if (createdId && !myUploads.includes(createdId)) {
          myUploads.push(createdId);
          localStorage.setItem("my_uploaded_recipe_ids", JSON.stringify(myUploads));
        }
        showToast("Recipe published successfully! It is now live for everyone to see.", "success");
      }

      window.location.hash = "#discover";
    } catch (err) {
      showToast(err.message || "Failed to publish recipe.", "error");
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
      submitText.textContent = isEditing ? "Save & Publish Changes" : "Publish Recipe Live";
    }
  });
}

function renderMyReviewsTab(content, currentUser) {
  if (!currentUser) return;
  const currentUid = currentUser.uid || currentUser.id;
  const reviews = store.getReviews().filter((r) => r.author_uid === currentUid || r.user_id === currentUid);

  content.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div>
        <h2 class="text-xl font-bold text-slate-900">My Community Feedback</h2>
        <p class="text-xs text-slate-500">History of your dish ratings and feedback across the platform.</p>
      </div>

      ${reviews.length === 0 ? `
        <div class="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <div class="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          </div>
          <h3 class="text-xl font-serif font-bold text-stone-900 mb-1">No reviews submitted yet</h3>
          <p class="text-sm text-stone-500 max-w-md mx-auto mb-6">Explore authentic recipes from fellow home chefs and share your reviews.</p>
          <a href="#discover" class="inline-flex px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all">
            Explore Dishes
          </a>
        </div>
      ` : `
        <div class="space-y-4">
          ${reviews.map((rev) => {
            const recipe = store.getRecipeById(rev.recipe_id);
            const recipeTitle = recipe ? recipe.title : "Community Recipe";
            const dateStr = new Date(rev.created_at || rev.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
            const revId = rev.review_id || rev.id;

            return `
              <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="font-serif font-bold text-slate-900">${escapeHtml(recipeTitle)}</span>
                    <div class="flex items-center text-amber-400">
                      ${Array.from({ length: rev.rating || 5 }).map(() => `
                        <svg class="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      `).join("")}
                    </div>
                    <span class="text-xs text-slate-400">• ${dateStr}</span>
                  </div>
                  <p class="text-slate-600 text-sm leading-relaxed">${escapeHtml(rev.comment_text || rev.value || "")}</p>
                </div>
                <div class="flex items-center space-x-2">
                  <button type="button" data-id="${revId}" class="btn-delete-my-review-list px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;

  content.querySelectorAll(".btn-delete-my-review-list").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await store.deleteReview(id, currentUid, false);
      showToast("Review deleted.", "info");
      renderMyReviewsTab(content, currentUser);
    });
  });
}

function renderProfileTab(content, currentUser) {
  if (!currentUser) return;
  content.innerHTML = `
    <div class="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm animate-fade-in space-y-6">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Chef Profile Settings</h2>
        <p class="text-xs text-slate-500">Update your culinary identity and display preferences.</p>
      </div>

      <form id="profile-form" class="space-y-5">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Name</label>
          <input
            type="text"
            id="profile-name"
            value="${escapeHtml(currentUser.display_name || currentUser.name)}"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-slate-50/50"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
          <input
            type="email"
            value="${escapeHtml(currentUser.email)}"
            disabled
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
          />
          <p class="text-[11px] text-slate-400 mt-1">Managed via authentication provider</p>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Avatar Image URL</label>
          <input
            type="url"
            id="profile-avatar"
            value="${escapeHtml(currentUser.avatar_url || currentUser.avatar)}"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-slate-50/50"
          />
        </div>

        <div class="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            class="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all"
          >
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  `;

  const form = content.querySelector("#profile-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = content.querySelector("#profile-name").value.trim();
      const avatar = content.querySelector("#profile-avatar").value.trim();

      const updated = store.updateUser(currentUser.uid || currentUser.id, {
        display_name: name,
        name: name,
        avatar_url: avatar || currentUser.avatar_url || currentUser.avatar,
        avatar: avatar || currentUser.avatar_url || currentUser.avatar
      });

      if (updated) {
        auth.updateCurrentUser(updated);
        showToast("Chef profile updated successfully!", "success");
        renderUserDashboard(document.getElementById("app-main-content"));
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

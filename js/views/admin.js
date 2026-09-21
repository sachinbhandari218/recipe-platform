import { store } from "../store.js";
import { auth } from "../auth.js";
import { showToast } from "../toast.js";

let activeAdminTab = "overview";
let currentRecipeFilter = "all";
let submissionChartInstance = null;
let topRatedChartInstance = null;
let activityChartInstance = null;

export function renderAdminDashboard(container) {
  const currentUser = auth.getCurrentUser();
  if (!currentUser || (!auth.isAdmin() && !auth.isOwner())) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-16 text-center">
        <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 class="text-2xl font-bold text-slate-900 mb-2">Administrator Access Required</h2>
        <p class="text-slate-600 mb-6">You must be logged in as an administrator to view and manage platform controls.</p>
        <button id="btn-quick-admin-login" class="px-6 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md">
          Switch to Admin Account
        </button>
      </div>
    `;
    const btn = container.querySelector("#btn-quick-admin-login");
    if (btn) {
      btn.addEventListener("click", () => {
        auth.quickLoginAs("admin");
      });
    }
    return;
  }

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">Super Admin Console</span>
            <span class="text-xs text-slate-400">•</span>
            <span class="text-xs text-slate-500">Live Management</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">Platform Administration</h1>
        </div>

        <div class="flex items-center space-x-3">
          <button id="btn-admin-add-user" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <div class="flex border-b border-slate-200 mb-8 overflow-x-auto space-x-1 sm:space-x-4">
        <button data-tab="overview" class="admin-tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeAdminTab === "overview" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          Analytics & Statistics
        </button>
        <button data-tab="recipes" class="admin-tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeAdminTab === "recipes" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          Recipe Moderation
        </button>
        <button data-tab="reviews" class="admin-tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeAdminTab === "reviews" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          Review Moderation
        </button>
        <button data-tab="users" class="admin-tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeAdminTab === "users" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          User Management
        </button>
        <button data-tab="activity" class="admin-tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeAdminTab === "activity" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          User Activity Feed
        </button>
        <button data-tab="settings" class="admin-tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeAdminTab === "settings" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}">
          System Settings
        </button>
      </div>

      <div id="admin-tab-content"></div>

      <div id="admin-modal-container"></div>
    </div>
  `;

  attachAdminTabs(container);
  renderActiveAdminTab();
}

function attachAdminTabs(container) {
  container.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeAdminTab = btn.getAttribute("data-tab");
      container.querySelectorAll(".admin-tab-btn").forEach((b) => {
        const isTarget = b.getAttribute("data-tab") === activeAdminTab;
        b.className = `admin-tab-btn px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${isTarget ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}`;
      });
      renderActiveAdminTab();
    });
  });

  const addUserBtn = container.querySelector("#btn-admin-add-user");
  if (addUserBtn) {
    addUserBtn.addEventListener("click", () => {
      openAddUserModal();
    });
  }
}

function renderActiveAdminTab() {
  const content = document.getElementById("admin-tab-content");
  if (!content) return;

  if (activeAdminTab === "overview") {
    renderAnalyticsOverview(content);
  } else if (activeAdminTab === "recipes") {
    renderRecipeManagement(content);
  } else if (activeAdminTab === "reviews") {
    renderReviewManagement(content);
  } else if (activeAdminTab === "users") {
    renderUserManagement(content);
  } else if (activeAdminTab === "activity") {
    renderActivityFeed(content);
  } else if (activeAdminTab === "settings") {
    renderSystemSettings(content);
  }
}

function renderAnalyticsOverview(content) {
  const users = store.getUsers();
  const recipes = store.getRecipes();
  const approvedRecipes = recipes.filter((r) => r.status === "approved");
  const pendingRecipes = recipes.filter((r) => r.status === "pending");
  const reviews = store.getReviews();

  content.innerHTML = `
    <div class="space-y-8 animate-fade-in">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <div class="text-3xl font-black text-slate-900 mt-1">${users.length}</div>
            <div class="text-xs text-emerald-600 mt-1 font-semibold flex items-center">
              <span>Active registered chefs</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Recipes</span>
            <div class="text-3xl font-black text-emerald-600 mt-1">${approvedRecipes.length}</div>
            <div class="text-xs text-slate-500 mt-1 font-semibold">Live in public gallery</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <div class="text-3xl font-black text-amber-600 mt-1">${pendingRecipes.length}</div>
            <div class="text-xs text-amber-600 mt-1 font-semibold">Requires admin decision</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reviews</span>
            <div class="text-3xl font-black text-purple-600 mt-1">${reviews.length}</div>
            <div class="text-xs text-slate-500 mt-1 font-semibold">Community ratings & feedback</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </div>
        </div>

      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-900">Recipe Submission Trends</h3>
              <p class="text-xs text-slate-500">Submissions categorized by creation timeline</p>
            </div>
          </div>
          <div class="h-64 relative">
            <canvas id="chart-submission-trends"></canvas>
          </div>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-900">Top-Rated Recipes</h3>
              <p class="text-xs text-slate-500">Highest rated recipes based on community votes</p>
            </div>
          </div>
          <div class="h-64 relative">
            <canvas id="chart-top-rated"></canvas>
          </div>
        </div>

      </div>

      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900">Community Engagement & Comment Volume</h3>
            <p class="text-xs text-slate-500">Interaction volume across key recipes</p>
          </div>
        </div>
        <div class="h-64 relative">
          <canvas id="chart-comment-volume"></canvas>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    initAnalyticsCharts();
  }, 50);
}

function initAnalyticsCharts() {
  if (typeof Chart === "undefined") return;

  if (submissionChartInstance) submissionChartInstance.destroy();
  if (topRatedChartInstance) topRatedChartInstance.destroy();
  if (activityChartInstance) activityChartInstance.destroy();

  const canvasSub = document.getElementById("chart-submission-trends");
  if (canvasSub) {
    submissionChartInstance = new Chart(canvasSub.getContext("2d"), {
      type: "line",
      data: {
        labels: ["Sep 10", "Sep 12", "Sep 14", "Sep 15", "Sep 16", "Sep 18", "Sep 19", "Sep 20"],
        datasets: [{
          label: "Recipe Submissions",
          data: [1, 2, 3, 4, 5, 6, 7, 7],
          borderColor: "#ea580c",
          backgroundColor: "rgba(234, 88, 12, 0.1)",
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: "#ea580c",
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  const canvasTop = document.getElementById("chart-top-rated");
  if (canvasTop) {
    const recipes = store.getApprovedRecipes().slice(0, 5);
    const labels = recipes.map((r) => r.title.length > 15 ? r.title.substring(0, 13) + "..." : r.title);
    const ratings = recipes.map((r) => {
      const stats = store.getRecipeRatingStats(r.recipe_id || r.id);
      return stats.averageRating;
    });

    topRatedChartInstance = new Chart(canvasTop.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Average Rating",
          data: ratings,
          backgroundColor: "#047857",
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 5,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  const canvasVol = document.getElementById("chart-comment-volume");
  if (canvasVol) {
    const recipes = store.getRecipes();
    const volumeData = recipes.slice(0, 6).map((r) => {
      const rId = r.recipe_id || r.id;
      const reviews = store.getReviewsByRecipe(rId);
      return {
        title: r.title.length > 18 ? r.title.substring(0, 16) + "..." : r.title,
        comments: reviews.length,
        ratings: reviews.length
      };
    });

    activityChartInstance = new Chart(canvasVol.getContext("2d"), {
      type: "bar",
      data: {
        labels: volumeData.map((d) => d.title),
        datasets: [
          {
            label: "Reviews",
            data: volumeData.map((d) => d.comments),
            backgroundColor: "#ea580c",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }
}

function renderRecipeManagement(content) {
  const recipes = store.getRecipes();
  let filtered = recipes;
  if (currentRecipeFilter !== "all") {
    filtered = recipes.filter((r) => r.status === currentRecipeFilter);
  }

  content.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Submitted Recipe Moderation</h2>
          <p class="text-xs text-slate-500">Approve or reject user-submitted recipes before public publication.</p>
        </div>

        <div class="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button data-filter="all" class="recipe-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentRecipeFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}">
            All (${recipes.length})
          </button>
          <button data-filter="pending" class="recipe-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentRecipeFilter === "pending" ? "bg-white text-amber-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}">
            Pending (${recipes.filter((r) => r.status === "pending").length})
          </button>
          <button data-filter="approved" class="recipe-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentRecipeFilter === "approved" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}">
            Approved (${recipes.filter((r) => r.status === "approved").length})
          </button>
          <button data-filter="rejected" class="recipe-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentRecipeFilter === "rejected" ? "bg-white text-rose-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}">
            Rejected (${recipes.filter((r) => r.status === "rejected").length})
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" class="px-6 py-4">Recipe Details</th>
                <th scope="col" class="px-6 py-4">Author</th>
                <th scope="col" class="px-6 py-4">Date</th>
                <th scope="col" class="px-6 py-4">Status</th>
                <th scope="col" class="px-6 py-4 text-right">Quick Moderation</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-stone-400 text-sm">
                    No recipes currently pending moderation in the kitchen queue.
                  </td>
                </tr>
              ` : filtered.map((recipe) => {
                const recId = recipe.recipe_id || recipe.id;
                const author = store.getUserById(recipe.author_uid || recipe.author_id);
                const authorName = author ? (author.display_name || author.name) : "Unknown Chef";
                const dateStr = new Date(recipe.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });
                const photoUrl = recipe.image_url || (recipe.photos && recipe.photos.length > 0 ? recipe.photos[0] : "");

                let statusBadge = "";
                if (recipe.status === "approved") {
                  statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Approved</span>`;
                } else if (recipe.status === "pending") {
                  statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>Pending Review</span>`;
                } else {
                  statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>Rejected</span>`;
                }

                const ingCount = Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0;
                const instrPreview = typeof recipe.instructions === "string" ? recipe.instructions.substring(0, 45) : (Array.isArray(recipe.instructions) ? recipe.instructions[0].substring(0, 45) : "");

                return `
                  <tr class="hover:bg-slate-50/60 transition-colors">
                    <td class="px-6 py-4">
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
                          <div class="text-xs text-slate-400">${ingCount} ingredients • ${escapeHtml(instrPreview)}...</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                      ${escapeHtml(authorName)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      ${dateStr}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      ${statusBadge}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                      <button
                        type="button"
                        data-id="${recId}"
                        class="btn-admin-preview px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        data-id="${recId}"
                        data-action="approved"
                        class="btn-admin-approve px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors ${recipe.status === "approved" ? "opacity-40 cursor-not-allowed" : ""}"
                        ${recipe.status === "approved" ? "disabled" : ""}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        data-id="${recId}"
                        data-title="${escapeHtml(recipe.title)}"
                        class="btn-admin-reject px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 transition-colors ${recipe.status === "rejected" ? "opacity-40 cursor-not-allowed" : ""}"
                        ${recipe.status === "rejected" ? "disabled" : ""}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        data-id="${recId}"
                        data-title="${escapeHtml(recipe.title)}"
                        class="btn-admin-delete px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                      >
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
    </div>
  `;

  content.querySelectorAll(".recipe-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentRecipeFilter = btn.getAttribute("data-filter");
      renderRecipeManagement(content);
    });
  });

  content.querySelectorAll(".btn-admin-approve").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const currentAdmin = auth.getCurrentUser();
      const adminId = currentAdmin ? (currentAdmin.uid || currentAdmin.id) : "usr-1";
      const updated = await store.approveRecipe(id, adminId);
      if (updated) {
        showToast(`Recipe '${updated.title}' approved and published to the discover feed!`, "success");
        renderRecipeManagement(content);
      }
    });
  });

  content.querySelectorAll(".btn-admin-reject").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");
      openRejectModal(id, title);
    });
  });

  content.querySelectorAll(".btn-admin-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");
      if (confirm(`Are you sure you want to permanently delete '${title}'?`)) {
        const currentAdmin = auth.getCurrentUser();
        const adminId = currentAdmin ? (currentAdmin.uid || currentAdmin.id) : "usr-1";
        await store.deleteRecipe(id, adminId);
        showToast(`Recipe '${title}' permanently deleted.`, "info");
        renderRecipeManagement(content);
      }
    });
  });

  content.querySelectorAll(".btn-admin-preview").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openRecipePreviewModal(id);
    });
  });
}

function openRejectModal(recipeId, recipeTitle) {
  const modalContainer = document.getElementById("admin-modal-container");
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div id="reject-modal" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-pop-in space-y-4">
        <div class="flex items-center space-x-3 text-rose-600">
          <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Reject Recipe Submission</h3>
            <p class="text-xs text-slate-500">${escapeHtml(recipeTitle)}</p>
          </div>
        </div>

        <form id="form-reject-reason" class="space-y-4">
          <div>
            <label for="reject-reason-text" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Rejection Reason & Revision Guidance *
            </label>
            <textarea
              id="reject-reason-text"
              rows="4"
              required
              placeholder="e.g. Please clarify exact spice quantities, simmer temperatures, or upload a clear photo of the finished dish."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-slate-50"
            ></textarea>
            <p class="text-[11px] text-slate-400 mt-1">This feedback will be sent directly to the chef's dashboard for revision.</p>
          </div>

          <div class="flex justify-end space-x-3 pt-2">
            <button type="button" id="btn-cancel-reject-modal" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalContainer.querySelector("#btn-cancel-reject-modal").addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });

  const form = modalContainer.querySelector("#form-reject-reason");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const reasonInput = modalContainer.querySelector("#reject-reason-text");
    const reason = reasonInput ? reasonInput.value.trim() : "";
    if (!reason) {
      showToast("Please provide a reason for rejecting this recipe.", "error");
      return;
    }

    const currentAdmin = auth.getCurrentUser();
    const adminId = currentAdmin ? (currentAdmin.uid || currentAdmin.id) : "usr-1";
    await store.rejectRecipe(recipeId, reason, adminId);
    modalContainer.innerHTML = "";
    showToast(`Recipe returned to author with revision feedback.`, "info");
    renderActiveAdminTab();
  });
}

function renderReviewManagement(content) {
  const reviews = store.getReviews();
  const currentAdmin = auth.getCurrentUser();
  const adminId = currentAdmin ? (currentAdmin.uid || currentAdmin.id) : "usr-1";

  content.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Community Review Moderation</h2>
          <p class="text-xs text-slate-500">Monitor all ratings and comments. Remove any review that violates community guidelines.</p>
        </div>
        <div class="text-xs text-slate-500 font-medium">Total: <strong>${reviews.length}</strong> reviews</div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" class="px-6 py-4">Recipe</th>
                <th scope="col" class="px-6 py-4">Reviewer</th>
                <th scope="col" class="px-6 py-4">Rating</th>
                <th scope="col" class="px-6 py-4">Feedback / Comment</th>
                <th scope="col" class="px-6 py-4">Date</th>
                <th scope="col" class="px-6 py-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${reviews.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-stone-400 text-sm">
                    No community reviews recorded yet.
                  </td>
                </tr>
              ` : reviews.map((rev) => {
                const revId = rev.review_id || rev.id;
                const recipe = store.getRecipeById(rev.recipe_id);
                const recipeTitle = recipe ? recipe.title : "Unknown Recipe";
                const author = store.getUserById(rev.author_uid || rev.user_id);
                const authorName = author ? (author.display_name || author.name) : "Community Chef";
                const authorAvatar = author ? (author.avatar_url || author.avatar) : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
                const dateStr = new Date(rev.created_at || rev.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });

                return `
                  <tr class="hover:bg-slate-50/60 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      ${escapeHtml(recipeTitle)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center space-x-2">
                        <img src="${escapeHtml(authorAvatar)}" class="w-7 h-7 rounded-full object-cover" />
                        <span class="text-xs font-semibold text-slate-800">${escapeHtml(authorName)}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center text-amber-400">
                        ${Array.from({ length: rev.rating || 5 }).map(() => `
                          <svg class="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        `).join("")}
                        <span class="text-xs font-bold text-slate-700 ml-1">(${rev.rating || 5})</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-700 max-w-xs truncate">
                      ${escapeHtml(rev.comment_text || rev.value || "")}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      ${dateStr}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        data-id="${revId}"
                        class="btn-admin-delete-review-panel inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete Review
                      </button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  content.querySelectorAll(".btn-admin-delete-review-panel").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const revId = btn.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this community review? This will recalculate the recipe's aggregate rating.")) {
        await store.deleteReview(revId, adminId, true);
        showToast("Review deleted by Administrator.", "info");
        renderReviewManagement(content);
      }
    });
  });
}

function openRecipePreviewModal(recipeId) {
  const recipe = store.getRecipeById(recipeId);
  if (!recipe) return;

  const modalContainer = document.getElementById("admin-modal-container");
  if (!modalContainer) return;

  const author = store.getUserById(recipe.author_uid || recipe.author_id);
  const authorName = author ? (author.display_name || author.name) : "Community Chef";
  const photoUrl = recipe.image_url || (recipe.photos && recipe.photos.length > 0 ? recipe.photos[0] : "");

  let ingredientList = [];
  if (Array.isArray(recipe.ingredients)) {
    ingredientList = recipe.ingredients.map((ing) => {
      if (typeof ing === "object" && ing !== null) {
        return `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ""}`.trim();
      }
      return String(ing).trim();
    });
  }

  let instructionsText = "";
  if (Array.isArray(recipe.instructions)) {
    instructionsText = recipe.instructions.join("\n");
  } else {
    instructionsText = recipe.instructions || "";
  }

  modalContainer.innerHTML = `
    <div id="preview-modal" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-pop-in space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">Admin Recipe Inspector</span>
            <h3 class="text-xl font-bold text-slate-900">${escapeHtml(recipe.title)}</h3>
          </div>
          <button id="btn-close-preview" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          ${photoUrl ? `
            <img src="${escapeHtml(photoUrl)}" class="w-full h-52 object-cover rounded-xl border border-slate-200" />
          ` : ""}
          
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Author</h4>
            <p class="text-sm font-semibold text-slate-800">${escapeHtml(authorName)} (User ID: ${recipe.author_uid || recipe.author_id})</p>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Prep Time</h4>
            <p class="text-sm text-slate-700">${Number(recipe.prep_time || 25)} minutes</p>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Ingredients</h4>
            <ul class="list-disc list-inside text-sm text-slate-700 space-y-1">
              ${ingredientList.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}
            </ul>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Instructions</h4>
            <p class="text-sm text-slate-700 whitespace-pre-line leading-relaxed">${escapeHtml(instructionsText)}</p>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end space-x-3">
          <button id="btn-modal-reject" class="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors">
            Reject Recipe
          </button>
          <button id="btn-modal-approve" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm">
            Approve & Publish
          </button>
        </div>
      </div>
    </div>
  `;

  modalContainer.querySelector("#btn-close-preview").addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });

  modalContainer.querySelector("#btn-modal-reject").addEventListener("click", () => {
    modalContainer.innerHTML = "";
    openRejectModal(recipe.recipe_id || recipe.id, recipe.title);
  });

  modalContainer.querySelector("#btn-modal-approve").addEventListener("click", async () => {
    const currentAdmin = auth.getCurrentUser();
    const adminId = currentAdmin ? (currentAdmin.uid || currentAdmin.id) : "usr-1";
    await store.approveRecipe(recipe.recipe_id || recipe.id, adminId);
    showToast(`Recipe '${recipe.title}' approved and published to the discover feed!`, "success");
    modalContainer.innerHTML = "";
    renderActiveAdminTab();
  });
}

function renderUserManagement(content) {
  const users = store.getUsers();
  const recipes = store.getRecipes();

  content.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">User Account Management</h2>
          <p class="text-xs text-slate-500">Manage user accounts, credentials, and role privileges.</p>
        </div>

        <div>
          <button id="btn-inner-add-user" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" class="px-6 py-4">User</th>
                <th scope="col" class="px-6 py-4">Email</th>
                <th scope="col" class="px-6 py-4">Role</th>
                <th scope="col" class="px-6 py-4">Recipes Created</th>
                <th scope="col" class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${users.map((user) => {
                const uId = user.uid || user.id;
                const userRecipeCount = recipes.filter((r) => (r.author_uid === uId || r.author_id === uId)).length;
                const avatarUrl = user.avatar_url || user.avatar;
                const displayName = user.display_name || user.name;

                return `
                  <tr class="hover:bg-slate-50/60 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center space-x-3">
                        <img src="${escapeHtml(avatarUrl)}" class="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <div class="font-bold text-slate-900">${escapeHtml(displayName)}</div>
                          <div class="text-xs text-slate-400">ID: ${uId}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                      ${escapeHtml(user.email)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      ${user.role === "admin" ? `
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Admin</span>
                      ` : `
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">User</span>
                      `}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      ${userRecipeCount} recipes
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        type="button"
                        data-id="${uId}"
                        class="btn-edit-user inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        data-id="${uId}"
                        data-name="${escapeHtml(displayName)}"
                        class="btn-delete-user inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
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
    </div>
  `;

  const innerAdd = content.querySelector("#btn-inner-add-user");
  if (innerAdd) {
    innerAdd.addEventListener("click", () => {
      openAddUserModal();
    });
  }

  content.querySelectorAll(".btn-edit-user").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openEditUserModal(id);
    });
  });

  content.querySelectorAll(".btn-delete-user").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      openDeleteUserModal(id, name);
    });
  });
}

function openAddUserModal() {
  const modalContainer = document.getElementById("admin-modal-container");
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div id="user-crud-modal" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-pop-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
          <h3 class="text-xl font-bold text-slate-900">Add New User</h3>
          <button id="btn-close-user-modal" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form id="form-add-user" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Name *</label>
            <input type="text" id="add-user-name" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email Address *</label>
            <input type="email" id="add-user-email" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Role *</label>
            <select id="add-user-role" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="user">User (Standard)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Initial Password *</label>
            <input type="password" id="add-user-password" required value="password123" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div class="pt-4 flex justify-end space-x-3">
            <button type="button" id="btn-cancel-add-user" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              Create User Account
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalContainer.querySelector("#btn-close-user-modal").addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });
  modalContainer.querySelector("#btn-cancel-add-user").addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });

  modalContainer.querySelector("#form-add-user").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = modalContainer.querySelector("#add-user-name").value.trim();
    const email = modalContainer.querySelector("#add-user-email").value.trim();
    const role = modalContainer.querySelector("#add-user-role").value;
    const password = modalContainer.querySelector("#add-user-password").value;

    const existing = store.getUserByEmail(email);
    if (existing) {
      showToast("A user with this email already exists.", "error");
      return;
    }

    store.addUser({ display_name: name, name, email, role, password });
    modalContainer.innerHTML = "";
    showToast(`New chef account '${name}' (${role}) registered successfully!`, "success");
    renderActiveAdminTab();
  });
}

function openEditUserModal(userId) {
  const user = store.getUserById(userId);
  if (!user) return;

  const modalContainer = document.getElementById("admin-modal-container");
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div id="user-crud-modal" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-pop-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
          <h3 class="text-xl font-bold text-slate-900">Edit User Account</h3>
          <button id="btn-close-user-modal" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form id="form-edit-user" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Name *</label>
            <input type="text" id="edit-user-name" value="${escapeHtml(user.display_name || user.name)}" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email Address *</label>
            <input type="email" id="edit-user-email" value="${escapeHtml(user.email)}" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Role *</label>
            <select id="edit-user-role" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="user" ${user.role === "user" ? "selected" : ""}>User (Standard)</option>
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Administrator</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Password (Leave blank to keep existing)</label>
            <input type="password" id="edit-user-password" placeholder="••••••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>

          <div class="pt-4 flex justify-end space-x-3">
            <button type="button" id="btn-cancel-edit-user" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalContainer.querySelector("#btn-close-user-modal").addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });
  modalContainer.querySelector("#btn-cancel-edit-user").addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });

  modalContainer.querySelector("#form-edit-user").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = modalContainer.querySelector("#edit-user-name").value.trim();
    const email = modalContainer.querySelector("#edit-user-email").value.trim();
    const role = modalContainer.querySelector("#edit-user-role").value;
    const password = modalContainer.querySelector("#edit-user-password").value;

    const updates = { display_name: name, name, email, role };
    if (password) {
      updates.password = password;
    }

    store.updateUser(userId, updates);
    modalContainer.innerHTML = "";
    showToast(`Chef profile '${name}' updated successfully.`, "success");
    renderActiveAdminTab();
  });
}

function openDeleteUserModal(userId, userName) {
  const modalContainer = document.getElementById("admin-modal-container");
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div id="delete-user-modal" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-pop-in">
        <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-center text-slate-900 mb-2">Delete User Account?</h3>
        <p class="text-center text-slate-500 text-sm mb-6">Are you sure you want to remove <strong>${escapeHtml(userName)}</strong>? All corresponding session access will be revoked immediately.</p>
        <div class="flex space-x-3">
          <button id="btn-cancel-del-user" type="button" class="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button id="btn-confirm-del-user" type="button" class="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm">
            Yes, Delete Account
          </button>
        </div>
      </div>
    </div>
  `;

  modalContainer.querySelector("#btn-cancel-del-user").addEventListener("click", () => {
    modalContainer.innerHTML = "";
  });

  modalContainer.querySelector("#btn-confirm-del-user").addEventListener("click", () => {
    store.deleteUser(userId);
    modalContainer.innerHTML = "";
    showToast(`Chef profile '${userName}' removed.`, "success");
    renderActiveAdminTab();
  });
}

function renderActivityFeed(content) {
  const activities = store.getActivities();

  content.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Real-Time User Activity Feed</h2>
          <p class="text-xs text-slate-500">Live stream of submissions, moderation choices, ratings, and account events.</p>
        </div>

        <button id="btn-refresh-feed" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center space-x-1.5 self-start">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          <span>Refresh Feed</span>
        </button>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 activity-scroll-feed">
        <div class="relative pl-6 space-y-6 border-l-2 border-slate-100">
          ${activities.map((act) => {
            const user = store.getUserById(act.user_id);
            const userName = user ? (user.display_name || user.name) : "System";
            const userAvatar = user ? (user.avatar_url || user.avatar) : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
            const timeAgo = formatTimeAgo(act.timestamp);

            let dotColor = "bg-emerald-500";
            if (act.action_description.includes("Rejected") || act.action_description.includes("revision") || act.action_description.includes("returned")) dotColor = "bg-rose-500";
            if (act.action_description.includes("Pending") || act.action_description.includes("submitted")) dotColor = "bg-amber-500";
            if (act.action_description.includes("deleted") || act.action_description.includes("removed")) dotColor = "bg-rose-500";

            return `
              <div class="relative group">
                <div class="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 ring-white shadow-sm"></div>
                <div class="flex items-start justify-between space-x-4">
                  <div class="flex items-start space-x-3">
                    <img src="${escapeHtml(userAvatar)}" class="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                    <div>
                      <div class="text-sm font-bold text-slate-900">${escapeHtml(userName)}</div>
                      <p class="text-sm text-slate-600 mt-0.5">${escapeHtml(act.action_description)}</p>
                    </div>
                  </div>
                  <span class="text-xs text-slate-400 whitespace-nowrap font-medium">${timeAgo}</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  content.querySelector("#btn-refresh-feed").addEventListener("click", () => {
    renderActivityFeed(content);
    showToast("Activity stream refreshed.", "info");
  });
}

function renderSystemSettings(content) {
  const settings = store.getSettings();

  content.innerHTML = `
    <div class="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm animate-fade-in">
      <div class="mb-8 pb-4 border-b border-slate-100">
        <h2 class="text-2xl font-serif font-bold text-slate-900">System Configurations & Rules</h2>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">Configure global platform toggles, moderation flags, and administrative controls.</p>
      </div>

      <form id="form-system-settings" class="space-y-8">
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Core Platform Settings</h3>
          <div class="space-y-4">
            <div>
              <label for="setting-platform-name" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Platform Brand Name</label>
              <input
                type="text"
                id="setting-platform-name"
                value="${escapeHtml(settings.platformName)}"
                required
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label for="setting-contact-email" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Contact Support Email</label>
              <input
                type="email"
                id="setting-contact-email"
                value="${escapeHtml(settings.contactEmail)}"
                required
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label for="setting-max-photos" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Max Photos Allowed Per Recipe</label>
              <input
                type="number"
                id="setting-max-photos"
                value="${settings.maxPhotosPerRecipe}"
                min="1"
                max="10"
                required
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-slate-100">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Moderation & Access Toggles</h3>
          <div class="space-y-4">
            
            <label class="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div class="text-sm font-bold text-slate-800">Allow Guest Browsing</div>
                <div class="text-xs text-slate-500">Permits unauthenticated visitors to view the recipe gallery and read instructions</div>
              </div>
              <input type="checkbox" id="toggle-guest-browse" class="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" ${settings.allowGuestBrowsing ? "checked" : ""} />
            </label>

            <label class="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div class="text-sm font-bold text-slate-800">Auto-Approve Recipes</div>
                <div class="text-xs text-slate-500">Skip pending review status and immediately publish all submitted recipes</div>
              </div>
              <input type="checkbox" id="toggle-auto-approve" class="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" ${settings.autoApproveVerified ? "checked" : ""} />
            </label>

            <label class="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div class="text-sm font-bold text-slate-800">Enable Photo Uploads</div>
                <div class="text-xs text-slate-500">Allows chefs to attach photography links when sharing recipes</div>
              </div>
              <input type="checkbox" id="toggle-photos" class="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" ${settings.allowPhotoUploads ? "checked" : ""} />
            </label>

            <label class="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div class="text-sm font-bold text-slate-800">Content Moderation Filter</div>
                <div class="text-xs text-slate-500">Screen recipe descriptions and community reviews for inappropriate terms</div>
              </div>
              <input type="checkbox" id="toggle-moderation" class="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" ${settings.contentModeration ? "checked" : ""} />
            </label>

            <label class="flex items-center justify-between p-4 rounded-2xl border border-rose-100 bg-rose-50/30 cursor-pointer hover:bg-rose-50/50 transition-colors">
              <div>
                <div class="text-sm font-bold text-rose-900">Maintenance Mode</div>
                <div class="text-xs text-rose-600">Restrict access to administrators only while undergoing system updates</div>
              </div>
              <input type="checkbox" id="toggle-maintenance" class="w-5 h-5 text-rose-600 rounded focus:ring-rose-500" ${settings.maintenanceMode ? "checked" : ""} />
            </label>

          </div>
        </div>

        <div class="pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            id="btn-reset-data"
            class="px-4 py-2.5 rounded-xl font-semibold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            Reset Database to Default
          </button>

          <button
            type="submit"
            class="px-7 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5"
          >
            Save System Configurations
          </button>
        </div>
      </form>
    </div>
  `;

  content.querySelector("#btn-reset-data").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all mock database tables to their authentic heritage recipe defaults?")) {
      store.resetAllData();
      showToast("Kitchen database reset to authentic heritage recipe defaults.", "info");
      renderActiveAdminTab();
    }
  });

  const form = content.querySelector("#form-system-settings");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const platformName = content.querySelector("#setting-platform-name").value.trim();
    const contactEmail = content.querySelector("#setting-contact-email").value.trim();
    const maxPhotosPerRecipe = parseInt(content.querySelector("#setting-max-photos").value, 10);
    const allowGuestBrowsing = content.querySelector("#toggle-guest-browse").checked;
    const autoApproveVerified = content.querySelector("#toggle-auto-approve").checked;
    const allowPhotoUploads = content.querySelector("#toggle-photos").checked;
    const contentModeration = content.querySelector("#toggle-moderation").checked;
    const maintenanceMode = content.querySelector("#toggle-maintenance").checked;

    store.updateSettings({
      platformName,
      contactEmail,
      maxPhotosPerRecipe,
      allowGuestBrowsing,
      autoApproveVerified,
      allowPhotoUploads,
      contentModeration,
      maintenanceMode
    });

    showToast("Platform configurations and kitchen rules saved successfully!", "success");
    const logoTitle = document.querySelector("#header-platform-name");
    if (logoTitle) logoTitle.textContent = platformName;
  });
}

function formatTimeAgo(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return "recently";
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

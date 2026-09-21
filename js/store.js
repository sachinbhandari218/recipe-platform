import {
  db,
  isFirebaseConnected,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "./firebaseConfig.js";
import {
  initialUsers,
  initialRecipes,
  initialReviews,
  initialInteractions,
  initialActivities,
  initialSettings
} from "./data/initialData.js";
import { searchOnlineDishPhoto } from "./imageSearch.js";

const STORAGE_KEY_USERS = "flavorcraft_users";
const STORAGE_KEY_RECIPES = "flavorcraft_recipes";
const STORAGE_KEY_REVIEWS = "flavorcraft_reviews";
const STORAGE_KEY_INTERACTIONS = "flavorcraft_interactions";
const STORAGE_KEY_ACTIVITIES = "flavorcraft_activities";
const STORAGE_KEY_SETTINGS = "flavorcraft_settings";
const DATA_VERSION = "online_recipe_v3_clean_defaults";

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    try {
      if (key === STORAGE_KEY_RECIPES) {
        const arr = JSON.parse(value);
        if (Array.isArray(arr) && arr.length > 20) {
          localStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
        }
      }
    } catch (e) {}
  }
}

class RecipeStore {
  constructor() {
    this.listeners = [];
    this.init();
  }

  async init() {
    if (localStorage.getItem("flavorcraft_version") !== DATA_VERSION) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initialUsers));
      safeSetStorage(STORAGE_KEY_RECIPES, JSON.stringify(initialRecipes));
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(initialReviews));
      localStorage.setItem(STORAGE_KEY_INTERACTIONS, JSON.stringify(initialInteractions));
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(initialActivities));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(initialSettings));
      localStorage.setItem("flavorcraft_version", DATA_VERSION);
    }

    await this.syncFromServer();

    setInterval(() => {
      this.syncFromServer();
    }, 2000);

    if (isFirebaseConnected && db) {
      try {
        await this.syncFromFirestore();
      } catch (e) {}
    }
  }

  async syncFromServer() {
    try {
      const resp = await fetch("/api/state");
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data) return;

      let deletedIds = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem("flavorcraft_deleted_recipe_ids") || "[]");
      } catch (e) {}

      if (Array.isArray(data.deleted_recipe_ids)) {
        let changed = false;
        for (const did of data.deleted_recipe_ids) {
          if (!deletedIds.includes(did)) {
            deletedIds.push(did);
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem("flavorcraft_deleted_recipe_ids", JSON.stringify(deletedIds));
        }
      }

      let hasNewData = false;

      if (Array.isArray(data.recipes)) {
        const cleanServerRecipes = data.recipes.filter((r) => !deletedIds.includes(r.recipe_id || r.id));
        const currentSerialized = localStorage.getItem(STORAGE_KEY_RECIPES) || "[]";
        const newSerialized = JSON.stringify(cleanServerRecipes);
        if (currentSerialized !== newSerialized) {
          safeSetStorage(STORAGE_KEY_RECIPES, newSerialized);
          hasNewData = true;
        }
        if (cleanServerRecipes.length !== data.recipes.length) {
          this.syncToServer();
        }
      }

      if (Array.isArray(data.reviews)) {
        const currentRev = localStorage.getItem(STORAGE_KEY_REVIEWS) || "[]";
        const newRev = JSON.stringify(data.reviews);
        if (currentRev !== newRev) {
          localStorage.setItem(STORAGE_KEY_REVIEWS, newRev);
          hasNewData = true;
        }
      }

      if (Array.isArray(data.interactions)) {
        const currentInter = localStorage.getItem(STORAGE_KEY_INTERACTIONS) || "[]";
        const newInter = JSON.stringify(data.interactions);
        if (currentInter !== newInter) {
          localStorage.setItem(STORAGE_KEY_INTERACTIONS, newInter);
          hasNewData = true;
        }
      }

      if (Array.isArray(data.activities)) {
        const currentAct = localStorage.getItem(STORAGE_KEY_ACTIVITIES) || "[]";
        const newAct = JSON.stringify(data.activities);
        if (currentAct !== newAct) {
          localStorage.setItem(STORAGE_KEY_ACTIVITIES, newAct);
          hasNewData = true;
        }
      }

      if (Array.isArray(data.users) && data.users.length > 0) {
        const localUsers = this.getUsers();
        const userMap = new Map();
        for (const u of data.users) userMap.set(u.uid || u.id, u);
        for (const u of localUsers) {
          const id = u.uid || u.id;
          if (!userMap.has(id)) userMap.set(id, u);
        }
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(Array.from(userMap.values())));
      }

      if (hasNewData) {
        for (const listener of this.listeners) {
          listener("server_synced", data.recipes);
        }
      }
    } catch (e) {}
  }

  async syncFromFirestore() {
    try {
      const recipesSnap = await getDocs(collection(db, "recipes"));
      if (!recipesSnap.empty) {
        const cloudRecipes = [];
        recipesSnap.forEach((d) => cloudRecipes.push({ id: d.id, ...d.data() }));
        if (cloudRecipes.length > 0) {
          safeSetStorage(STORAGE_KEY_RECIPES, JSON.stringify(cloudRecipes));
        }
      }

      const usersSnap = await getDocs(collection(db, "users"));
      if (!usersSnap.empty) {
        const cloudUsers = [];
        usersSnap.forEach((d) => cloudUsers.push({ id: d.id, ...d.data() }));
        if (cloudUsers.length > 0) {
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(cloudUsers));
        }
      }

      const reviewsSnap = await getDocs(collection(db, "reviews"));
      if (!reviewsSnap.empty) {
        const cloudReviews = [];
        reviewsSnap.forEach((d) => cloudReviews.push({ id: d.id, ...d.data() }));
        if (cloudReviews.length > 0) {
          localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(cloudReviews));
        }
      }
    } catch (e) {}
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify(event, payload) {
    for (const listener of this.listeners) {
      listener(event, payload);
    }
    this.syncToServer();
  }

  async syncToServer() {
    try {
      let deletedIds = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem("flavorcraft_deleted_recipe_ids") || "[]");
      } catch (e) {}

      const state = {
        users: this.getUsers(),
        recipes: this.getRecipes().filter((r) => !deletedIds.includes(r.recipe_id || r.id)),
        reviews: this.getReviews().filter((r) => !deletedIds.includes(r.recipe_id)),
        interactions: this.getInteractions(),
        activities: this.getActivities(),
        settings: this.getSettings(),
        deleted_recipe_ids: deletedIds
      };
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state)
      });
    } catch (e) {}
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || "[]");
  }

  getUserById(id) {
    if (!id) return null;
    const users = this.getUsers();
    const found = users.find((u) => u.id === id || u.uid === id);
    if (found) return found;

    const recipes = this.getRecipes();
    const r = recipes.find((item) => (item.author_uid === id || item.author_id === id) && item.author_name);
    if (r && r.author_name) {
      return {
        uid: id,
        id: id,
        display_name: r.author_name,
        name: r.author_name,
        role: "user",
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
      };
    }
    return null;
  }

  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  addUser(userData) {
    const users = this.getUsers();
    const newUid = userData.uid || userData.id || "usr-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newUser = {
      uid: newUid,
      id: newUid,
      display_name: (userData.display_name || userData.name || "").trim(),
      name: (userData.display_name || userData.name || "").trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password || "password123",
      role: userData.role || "user",
      avatar_url: userData.avatar_url || userData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      avatar: userData.avatar_url || userData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    if (isFirebaseConnected && db) {
      try {
        setDoc(doc(db, "users", newUid), newUser);
      } catch (e) {}
    }

    this.addActivity(newUid, `Chef registered: ${newUser.display_name} (${newUser.role})`);
    this.notify("users_changed", newUser);
    return newUser;
  }

  updateUser(id, partialData) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id || u.uid === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...partialData };
    if (partialData.display_name) users[index].name = partialData.display_name;
    if (partialData.name) users[index].display_name = partialData.name;
    if (partialData.avatar_url) users[index].avatar = partialData.avatar_url;
    if (partialData.avatar) users[index].avatar_url = partialData.avatar;

    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    if (isFirebaseConnected && db) {
      try {
        updateDoc(doc(db, "users", id), partialData);
      } catch (e) {}
    }

    this.notify("users_changed", users[index]);
    return users[index];
  }

  deleteUser(id) {
    let users = this.getUsers();
    const targetUser = users.find((u) => u.id === id || u.uid === id);
    if (!targetUser) return false;

    users = users.filter((u) => u.id !== id && u.uid !== id);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    if (isFirebaseConnected && db) {
      try {
        deleteDoc(doc(db, "users", id));
      } catch (e) {}
    }

    this.addActivity(id, `Chef account removed: ${targetUser.display_name || targetUser.name}`);
    this.notify("users_changed", { deletedId: id });
    return true;
  }

  getRecipes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_RECIPES) || "[]");
  }

  getApprovedRecipes() {
    return this.getRecipes().filter((r) => r.status === "approved");
  }

  getUserRecipes(userId) {
    const user = this.getUserById(userId);
    const altId = user ? (user.uid || user.id) : null;
    return this.getRecipes().filter((r) => {
      const aUid = r.author_uid || r.author_id;
      return aUid === userId || (altId && aUid === altId);
    });
  }

  getRecipeById(id) {
    const recipes = this.getRecipes();
    return recipes.find((r) => r.recipe_id === id || r.id === id) || null;
  }

  async addRecipe(recipeData) {
    const recipes = this.getRecipes();
    const newId = "rec-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const authorUid = recipeData.author_uid || recipeData.author_id || ("guest-" + Date.now().toString(36));
    const authorName = (recipeData.author_name || "").trim() || "Guest Chef";
    let photoUrl = recipeData.image_url || (Array.isArray(recipeData.photos) && recipeData.photos.length > 0 ? recipeData.photos[0] : recipeData.photos);
    if (!photoUrl) {
      photoUrl = await searchOnlineDishPhoto(recipeData.title);
    }
    if (!photoUrl) {
      photoUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
    }

    if (photoUrl && typeof photoUrl === "string" && photoUrl.startsWith("data:image")) {
      try {
        const resp = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: photoUrl })
        });
        if (resp.ok) {
          const udata = await resp.json();
          if (udata && udata.url) {
            photoUrl = udata.url;
          }
        }
      } catch (upErr) {}
    }

    let ingredients = [];
    if (Array.isArray(recipeData.ingredients)) {
      ingredients = recipeData.ingredients;
    } else if (typeof recipeData.ingredients === "string" && recipeData.ingredients.trim()) {
      ingredients = recipeData.ingredients.split("\n").map((i) => i.trim()).filter(Boolean);
    }

    let instructions = "";
    if (Array.isArray(recipeData.instructions)) {
      instructions = recipeData.instructions.join("\n");
    } else if (recipeData.instructions && recipeData.instructions.trim()) {
      instructions = recipeData.instructions.trim();
    } else {
      instructions = "Cook with passion and serve warm.";
    }

    const title = (recipeData.title || "Delicious Heritage Dish").trim();
    const description = recipeData.description ? recipeData.description.trim() : instructions.substring(0, 160) + "...";

    const newRecipe = {
      recipe_id: newId,
      id: newId,
      author_uid: authorUid,
      author_id: authorUid,
      author_name: authorName,
      title: title,
      description: description,
      prep_time: Number(recipeData.prep_time || 20),
      ingredients: ingredients,
      instructions: instructions,
      image_url: photoUrl,
      photos: [photoUrl],
      status: recipeData.status || "approved",
      rejection_reason: null,
      average_rating: 5.0,
      review_count: 0,
      created_at: new Date().toISOString()
    };

    recipes.unshift(newRecipe);
    safeSetStorage(STORAGE_KEY_RECIPES, JSON.stringify(recipes));

    if (isFirebaseConnected && db) {
      try {
        setDoc(doc(db, "recipes", newId), newRecipe).catch(() => {});
      } catch (e) {}
    }

    this.addActivity(authorUid, `${authorName} shared '${newRecipe.title}'`);
    this.notify("recipes_changed", newRecipe);
    return newRecipe;
  }

  async updateRecipe(id, partialData) {
    const recipes = this.getRecipes();
    const index = recipes.findIndex((r) => r.recipe_id === id || r.id === id);
    if (index === -1) return null;

    if (partialData.image_url && typeof partialData.image_url === "string" && partialData.image_url.startsWith("data:image")) {
      try {
        const resp = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: partialData.image_url })
        });
        if (resp.ok) {
          const udata = await resp.json();
          if (udata && udata.url) {
            partialData.image_url = udata.url;
            partialData.photos = [udata.url];
          }
        }
      } catch (upErr) {}
    }

    recipes[index] = { ...recipes[index], ...partialData };
    if (partialData.image_url) {
      recipes[index].photos = [partialData.image_url];
    }
    if (partialData.photos && Array.isArray(partialData.photos) && partialData.photos.length > 0) {
      recipes[index].image_url = partialData.photos[0];
    }
    if (partialData.author_uid) recipes[index].author_id = partialData.author_uid;
    if (partialData.author_id) recipes[index].author_uid = partialData.author_id;

    safeSetStorage(STORAGE_KEY_RECIPES, JSON.stringify(recipes));

    if (isFirebaseConnected && db) {
      try {
        updateDoc(doc(db, "recipes", id), partialData).catch(() => {});
      } catch (e) {}
    }

    this.notify("recipes_changed", recipes[index]);
    return recipes[index];
  }

  async approveRecipe(recipeId, adminUid = "usr-1") {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return null;

    const updated = await this.updateRecipe(recipeId, {
      status: "approved",
      rejection_reason: null
    });

    const admin = this.getUserById(adminUid);
    const adminName = admin ? (admin.display_name || admin.name) : "Admin";
    this.addActivity(adminUid, `${adminName} approved recipe '${recipe.title}'`);
    return updated;
  }

  async rejectRecipe(recipeId, reason, adminUid = "usr-1") {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return null;

    const updated = await this.updateRecipe(recipeId, {
      status: "rejected",
      rejection_reason: String(reason).trim()
    });

    const admin = this.getUserById(adminUid);
    const adminName = admin ? (admin.display_name || admin.name) : "Admin";
    this.addActivity(adminUid, `${adminName} returned '${recipe.title}' for revision: ${reason}`);
    return updated;
  }

  async resubmitRecipe(recipeId, updateData, userUid) {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return null;

    const updated = await this.updateRecipe(recipeId, {
      ...updateData,
      status: "approved",
      rejection_reason: null
    });

    const user = this.getUserById(userUid);
    const userName = user ? (user.display_name || user.name) : "Chef";
    this.addActivity(userUid, `${userName} updated recipe '${recipe.title}'`);
    return updated;
  }

  async setRecipeStatus(id, status, adminUserId = "usr-1") {
    if (status === "approved") {
      return await this.approveRecipe(id, adminUserId);
    } else if (status === "rejected") {
      return await this.rejectRecipe(id, "Requires revision to meet recipe guidelines.", adminUserId);
    } else {
      return await this.updateRecipe(id, { status: "pending" });
    }
  }

  async deleteRecipe(id, userId = null) {
    let recipes = this.getRecipes();
    const recipe = recipes.find((r) => r.recipe_id === id || r.id === id);
    if (!recipe) return false;

    let deletedIds = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem("flavorcraft_deleted_recipe_ids") || "[]");
    } catch (e) {}
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem("flavorcraft_deleted_recipe_ids", JSON.stringify(deletedIds));
    }

    let myUploads = [];
    try {
      myUploads = JSON.parse(localStorage.getItem("my_uploaded_recipe_ids") || "[]");
    } catch (e) {}
    myUploads = myUploads.filter((itemId) => itemId !== id);
    localStorage.setItem("my_uploaded_recipe_ids", JSON.stringify(myUploads));

    recipes = recipes.filter((r) => r.recipe_id !== id && r.id !== id);
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(recipes));

    let reviews = this.getReviews().filter((r) => r.recipe_id !== id);
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));

    if (userId) {
      const user = this.getUserById(userId);
      this.addActivity(userId, `${user ? (user.display_name || user.name) : "Chef"} removed recipe '${recipe.title}'`);
    }

    if (isFirebaseConnected && db) {
      try {
        deleteDoc(doc(db, "recipes", id)).catch(() => {});
      } catch (e) {}
    }

    try {
      await fetch(`/api/state?deleteId=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (e) {}

    await this.syncToServer();

    this.notify("recipes_changed", { deletedId: id });
    return true;
  }

  getReviews() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_REVIEWS) || "[]");
  }

  getReviewsByRecipe(recipeId) {
    return this.getReviews().filter((r) => r.recipe_id === recipeId);
  }

  getUserReviewForRecipe(recipeId, userUid) {
    const reviews = this.getReviews();
    return reviews.find((r) => r.recipe_id === recipeId && (r.author_uid === userUid || r.user_id === userUid)) || null;
  }

  async addReview(recipeId, authorUid, rating, commentText) {
    const reviews = this.getReviews();
    const existing = reviews.find((r) => r.recipe_id === recipeId && (r.author_uid === authorUid || r.user_id === authorUid));
    if (existing) {
      throw new Error("You have already submitted a review for this recipe. Use the edit button to update your review.");
    }

    const newId = "rev-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newReview = {
      review_id: newId,
      id: newId,
      recipe_id: recipeId,
      author_uid: authorUid,
      user_id: authorUid,
      rating: Number(rating),
      value: String(commentText).trim(),
      comment_text: String(commentText).trim(),
      created_at: new Date().toISOString(),
      edited_at: null
    };

    reviews.unshift(newReview);
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));

    this.syncReviewToInteractions(newReview);

    if (isFirebaseConnected && db) {
      try {
        setDoc(doc(db, "reviews", newId), newReview).catch(() => {});
      } catch (e) {}
    }

    await this.recalculateRecipeRating(recipeId);

    const author = this.getUserById(authorUid);
    const recipe = this.getRecipeById(recipeId);
    const authorName = author ? (author.display_name || author.name) : "Chef";
    const recipeTitle = recipe ? recipe.title : "Recipe";

    this.addActivity(authorUid, `${authorName} reviewed '${recipeTitle}' (${rating} stars)`);
    this.notify("reviews_changed", newReview);
    return newReview;
  }

  async updateReview(reviewId, rating, commentText, userUid, isAdmin = false) {
    const reviews = this.getReviews();
    const index = reviews.findIndex((r) => r.review_id === reviewId || r.id === reviewId);
    if (index === -1) throw new Error("Review not found.");

    const target = reviews[index];
    if (!isAdmin && target.author_uid !== userUid && target.user_id !== userUid) {
      throw new Error("Unauthorized to edit this review.");
    }

    target.rating = Number(rating);
    target.comment_text = String(commentText).trim();
    target.value = String(commentText).trim();
    target.edited_at = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));

    this.syncReviewToInteractions(target);

    if (isFirebaseConnected && db) {
      try {
        updateDoc(doc(db, "reviews", reviewId), {
          rating: target.rating,
          comment_text: target.comment_text,
          value: target.value,
          edited_at: target.edited_at
        }).catch(() => {});
      } catch (e) {}
    }

    await this.recalculateRecipeRating(target.recipe_id);
    this.notify("reviews_changed", target);
    return target;
  }

  async deleteReview(reviewId, userUid, isAdmin = false) {
    let reviews = this.getReviews();
    const target = reviews.find((r) => r.review_id === reviewId || r.id === reviewId);
    if (!target) return false;

    if (!isAdmin && target.author_uid !== userUid && target.user_id !== userUid) {
      throw new Error("Unauthorized to delete this review.");
    }

    reviews = reviews.filter((r) => r.review_id !== reviewId && r.id !== reviewId);
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));

    this.removeReviewFromInteractions(reviewId);

    if (isFirebaseConnected && db) {
      try {
        await deleteDoc(doc(db, "reviews", reviewId));
      } catch (e) {}
    }

    await this.recalculateRecipeRating(target.recipe_id);
    this.notify("reviews_changed", { deletedId: reviewId, recipe_id: target.recipe_id });
    return true;
  }

  async recalculateRecipeRating(recipeId) {
    const recipeReviews = this.getReviewsByRecipe(recipeId);
    const count = recipeReviews.length;
    let avg = 0;
    if (count > 0) {
      const sum = recipeReviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
      avg = Number((sum / count).toFixed(1));
    }

    await this.updateRecipe(recipeId, {
      average_rating: avg,
      review_count: count
    });
  }

  syncReviewToInteractions(review) {
    const interactions = this.getInteractions();
    const idx = interactions.findIndex((i) => i.id === review.review_id || i.id === review.id);
    const interObj = {
      id: review.review_id || review.id,
      recipe_id: review.recipe_id,
      user_id: review.author_uid || review.user_id,
      type: "comment",
      value: review.comment_text,
      rating: review.rating,
      timestamp: review.created_at,
      edited_at: review.edited_at
    };

    if (idx !== -1) {
      interactions[idx] = interObj;
    } else {
      interactions.unshift(interObj);
    }
    localStorage.setItem(STORAGE_KEY_INTERACTIONS, JSON.stringify(interactions));
  }

  removeReviewFromInteractions(reviewId) {
    let interactions = this.getInteractions();
    interactions = interactions.filter((i) => i.id !== reviewId);
    localStorage.setItem(STORAGE_KEY_INTERACTIONS, JSON.stringify(interactions));
  }

  getInteractions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_INTERACTIONS) || "[]");
  }

  getInteractionsByRecipe(recipeId) {
    return this.getInteractions().filter((item) => item.recipe_id === recipeId);
  }

  getUserInteractions(userId) {
    const user = this.getUserById(userId);
    const altId = user ? (user.uid || user.id) : null;
    return this.getInteractions().filter((item) => item.user_id === userId || (altId && item.user_id === altId));
  }

  async addInteraction(recipeId, userId, type, value) {
    if (type === "comment" || type === "rating") {
      const existing = this.getUserReviewForRecipe(recipeId, userId);
      if (existing) {
        if (type === "rating") {
          return await this.updateReview(existing.review_id || existing.id, Number(value), existing.comment_text, userId);
        } else {
          return await this.updateReview(existing.review_id || existing.id, existing.rating, String(value), userId);
        }
      } else {
        const rating = type === "rating" ? Number(value) : 5;
        const text = type === "comment" ? String(value) : "Kitchen rating";
        return await this.addReview(recipeId, userId, rating, text);
      }
    }

    const interactions = this.getInteractions();
    const newId = "int-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newInteraction = {
      id: newId,
      recipe_id: recipeId,
      user_id: userId,
      type: type,
      value: value,
      timestamp: new Date().toISOString()
    };

    interactions.unshift(newInteraction);
    localStorage.setItem(STORAGE_KEY_INTERACTIONS, JSON.stringify(interactions));
    this.notify("interactions_changed", newInteraction);
    return newInteraction;
  }

  async deleteInteraction(id) {
    await this.deleteReview(id, null, true);
    return true;
  }

  getRecipeRatingStats(recipeId) {
    const recipeReviews = this.getReviewsByRecipe(recipeId);
    if (recipeReviews.length === 0) {
      return {
        averageRating: 5.0,
        count: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const sum = recipeReviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
    const average = (sum / recipeReviews.length).toFixed(1);
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (const r of recipeReviews) {
      const val = Math.round(Number(r.rating || 5));
      if (distribution[val] !== undefined) {
        distribution[val]++;
      }
    }

    return {
      averageRating: parseFloat(average),
      count: recipeReviews.length,
      distribution
    };
  }

  getActivities() {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY_ACTIVITIES) || "[]");
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  addActivity(userId, actionDescription) {
    const activities = this.getActivities();
    const newId = "act-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newActivity = {
      id: newId,
      user_id: userId,
      action_description: actionDescription,
      timestamp: new Date().toISOString()
    };

    activities.unshift(newActivity);
    if (activities.length > 50) {
      activities.pop();
    }
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));

    if (isFirebaseConnected && db) {
      try {
        setDoc(doc(db, "activities", newId), newActivity);
      } catch (e) {}
    }

    this.notify("activity_added", newActivity);
    return newActivity;
  }

  getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || JSON.stringify(initialSettings));
  }

  updateSettings(newSettings) {
    const updated = { ...this.getSettings(), ...newSettings };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));

    if (isFirebaseConnected && db) {
      try {
        setDoc(doc(db, "settings", "global_config"), updated);
      } catch (e) {}
    }

    this.notify("settings_changed", updated);
    return updated;
  }

  resetAllData() {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initialUsers));
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(initialRecipes));
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(initialReviews));
    localStorage.setItem(STORAGE_KEY_INTERACTIONS, JSON.stringify(initialInteractions));
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(initialActivities));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(initialSettings));
    this.notify("data_reset", null);
  }
}

export const store = new RecipeStore();
if (typeof window !== "undefined") {
  window.store = store;
}

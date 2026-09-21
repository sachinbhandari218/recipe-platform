import {
  auth as firebaseAuth,
  db,
  isFirebaseConnected,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "./firebaseConfig.js";
import { store } from "./store.js";
import { showToast } from "./toast.js";

const AUTH_STORAGE_KEY = "flavorcraft_auth_session";

function formatAuthErrorMessage(error) {
  if (!error) return "Authentication failed. Please try again.";
  const code = error.code || "";
  if (code === "auth/email-already-in-use") {
    return "This email is already in use by another chef account.";
  }
  if (code === "auth/wrong-password") {
    return "Incorrect password. Please verify your credentials.";
  }
  if (code === "auth/user-not-found") {
    return "No chef account found with this email address.";
  }
  if (code === "auth/invalid-email") {
    return "The provided email address is not properly formatted.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (code === "auth/invalid-credential") {
    return "Invalid login credentials. Please check your email and password.";
  }
  if (code === "auth/too-many-requests") {
    return "Access to this account has been temporarily disabled due to many failed login attempts.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Please check your internet connection and try again.";
  }
  return error.message || "Authentication failed. Please verify your credentials.";
}

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.init();
  }

  init() {
    this.loadCachedSession();

    if (isFirebaseConnected && firebaseAuth) {
      try {
        onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            await this.syncUserFromFirestore(user);
          } else if (!this.currentUser) {
            this.handleLoggedOutState();
          }
        });
      } catch (e) {}
    }
  }

  loadCachedSession() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      this.currentUser = null;
    }
  }

  async syncUserFromFirestore(firebaseUser) {
    let profileData = null;
    if (db) {
      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          profileData = userDoc.data();
        }
      } catch (e) {}
    }

    if (!profileData) {
      const localMatch = store.getUserByEmail(firebaseUser.email);
      profileData = localMatch || {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        display_name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
        name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
        email: firebaseUser.email,
        role: firebaseUser.email.includes("admin") ? "admin" : "user",
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
        created_at: new Date().toISOString()
      };
    }

    const displayName = profileData.display_name || profileData.name || firebaseUser.displayName || "Chef";
    const avatarUrl = profileData.avatar_url || profileData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

    this.currentUser = {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      display_name: displayName,
      name: displayName,
      email: firebaseUser.email,
      role: profileData.role || (firebaseUser.email.includes("admin") ? "admin" : "user"),
      avatar_url: avatarUrl,
      avatar: avatarUrl,
      created_at: profileData.created_at || new Date().toISOString()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    this.notify();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  isAdmin() {
    if (!this.currentUser) return false;
    return this.currentUser.role === "admin" || this.isOwner();
  }

  isUser() {
    return this.currentUser !== null && this.currentUser.role === "user";
  }

  onAuthChange(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    let fbError = null;

    if (isFirebaseConnected && firebaseAuth) {
      try {
        const userCred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        await this.syncUserFromFirestore(userCred.user);
        store.addActivity(this.currentUser.uid || this.currentUser.id, `${this.currentUser.display_name || this.currentUser.name} signed into Online Recipe Sharing Platform`);
        showToast(`Welcome back, ${this.currentUser.display_name || this.currentUser.name}! Authenticated as ${this.currentUser.role.toUpperCase()}.`, "success");
        return true;
      } catch (err) {
        fbError = err;
      }
    }

    const localUser = store.getUserByEmail(cleanEmail);
    if (!localUser) {
      if (fbError) {
        showToast(formatAuthErrorMessage(fbError), "error");
      } else {
        showToast("No chef account found with this email address.", "error");
      }
      return false;
    }

    if (localUser.password !== password) {
      showToast("Incorrect password. Please verify your credentials.", "error");
      return false;
    }

    const displayName = localUser.display_name || localUser.name || "Chef";
    const avatarUrl = localUser.avatar_url || localUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

    this.currentUser = {
      uid: localUser.uid || localUser.id,
      id: localUser.uid || localUser.id,
      display_name: displayName,
      name: displayName,
      email: localUser.email,
      role: localUser.role,
      avatar_url: avatarUrl,
      avatar: avatarUrl,
      created_at: localUser.created_at || new Date().toISOString()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    store.addActivity(this.currentUser.uid, `${displayName} signed into Online Recipe Sharing Platform`);
    showToast(`Welcome back, ${displayName}! Authenticated as ${this.currentUser.role.toUpperCase()}.`, "success");
    this.notify();
    return true;
  }

  async register(name, email, password, role = "user") {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      showToast("Please complete all registration fields.", "error");
      return false;
    }

    if (password.length < 6) {
      showToast("Password is too weak. Please use at least 6 characters.", "error");
      return false;
    }

    const existingLocal = store.getUserByEmail(cleanEmail);
    if (existingLocal) {
      showToast("This email is already in use by another chef account.", "error");
      return false;
    }

    let newUid = "usr-" + Date.now().toString(36);
    let avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

    if (isFirebaseConnected && firebaseAuth) {
      try {
        const userCred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        newUid = userCred.user.uid;

        if (db) {
          try {
            setDoc(doc(db, "users", newUid), {
              uid: newUid,
              id: newUid,
              display_name: cleanName,
              name: cleanName,
              email: cleanEmail,
              role: role,
              avatar_url: avatarUrl,
              avatar: avatarUrl,
              created_at: new Date().toISOString()
            }).catch(() => {});
          } catch (e) {}
        }
      } catch (fbError) {
        if (fbError.code === "auth/email-already-in-use") {
          showToast("This email is already in use by another chef account.", "error");
          return false;
        }
        if (fbError.code === "auth/weak-password") {
          showToast("Password is too weak. Please use at least 6 characters.", "error");
          return false;
        }
      }
    }

    const newUser = store.addUser({
      uid: newUid,
      id: newUid,
      display_name: cleanName,
      name: cleanName,
      email: cleanEmail,
      password: password,
      role: role,
      avatar_url: avatarUrl,
      avatar: avatarUrl,
      created_at: new Date().toISOString()
    });

    this.currentUser = {
      uid: newUid,
      id: newUid,
      display_name: cleanName,
      name: cleanName,
      email: cleanEmail,
      role: role,
      avatar_url: avatarUrl,
      avatar: avatarUrl,
      created_at: new Date().toISOString()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    showToast(`Welcome to Online Recipe Sharing Platform, ${cleanName}! Your chef account is ready.`, "success");
    this.notify();
    return true;
  }

  async logout() {
    if (this.currentUser) {
      const currentId = this.currentUser.uid || this.currentUser.id;
      const displayName = this.currentUser.display_name || this.currentUser.name;
      store.addActivity(currentId, `${displayName} signed out`);
    }

    if (isFirebaseConnected && firebaseAuth) {
      try {
        await signOut(firebaseAuth);
      } catch (e) {}
    }

    this.handleLoggedOutState();
    showToast("You have been signed out.", "info");
  }

  handleLoggedOutState() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notify();
  }

  quickLoginAs(role) {
    const users = store.getUsers();
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      return this.login(targetUser.email, targetUser.password || "admin");
    }
    showToast(`No demo ${role} account available.`, "warning");
    return false;
  }

  isOwner() {
    if (!this.currentUser) return false;
    if (this.currentUser.role === "admin") return true;
    const name = (this.currentUser.display_name || this.currentUser.name || "").toLowerCase();
    const email = (this.currentUser.email || "").toLowerCase();
    return name.includes("sachin") || email.includes("sachin") || email === "admin@recipes.com";
  }

  canEditRecipe(recipe) {
    if (!recipe) return false;
    if (this.isOwner()) return true;
    const recId = recipe.recipe_id || recipe.id;
    let myUploads = [];
    try {
      myUploads = JSON.parse(localStorage.getItem("my_uploaded_recipe_ids") || "[]");
    } catch (e) {}
    if (myUploads.includes(recId)) return true;
    if (!this.currentUser) return false;
    const uid = this.currentUser.uid || this.currentUser.id;
    if (recipe.author_uid === uid || recipe.author_id === uid) return true;
    const authorName = (recipe.author_name || "").toLowerCase().trim();
    const myName = (this.currentUser.display_name || this.currentUser.name || "").toLowerCase().trim();
    if (authorName && myName && authorName === myName) return true;
    return false;
  }

  canDeleteRecipe(recipe) {
    if (!recipe) return false;
    if (this.isOwner()) return true;
    if (this.currentUser && this.currentUser.role === "admin") return true;
    const recId = recipe.recipe_id || recipe.id;
    let myUploads = [];
    try {
      myUploads = JSON.parse(localStorage.getItem("my_uploaded_recipe_ids") || "[]");
    } catch (e) {}
    if (myUploads.includes(recId)) return true;
    if (!this.currentUser) return false;
    const uid = this.currentUser.uid || this.currentUser.id;
    if (recipe.author_uid === uid || recipe.author_id === uid) return true;
    const authorName = (recipe.author_name || "").toLowerCase().trim();
    const myName = (this.currentUser.display_name || this.currentUser.name || "").toLowerCase().trim();
    if (authorName && myName && authorName === myName) return true;
    return false;
  }

  async loginWithGoogle(customProfile = null) {
    let email = "sachin.bhandari@gmail.com";
    let name = "Sachin Bhandari (Owner)";
    let avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

    if (customProfile) {
      if (typeof customProfile === "string") {
        email = customProfile.trim().toLowerCase();
        name = email.split("@")[0];
      } else {
        email = (customProfile.email || email).trim().toLowerCase();
        name = (customProfile.name || customProfile.display_name || name).trim();
        avatar = customProfile.avatar || customProfile.avatar_url || avatar;
      }
    }

    const lowerName = name.toLowerCase();
    const lowerEmail = email.toLowerCase();
    const isOwnerAccount = lowerName.includes("sachin") || lowerEmail.includes("sachin") || lowerEmail === "admin@recipes.com";
    const role = isOwnerAccount ? "admin" : "user";
    if (isOwnerAccount && !name.toLowerCase().includes("sachin")) {
      name = "Sachin Bhandari (Owner)";
    }

    let existing = store.getUserByEmail(email);
    let uid = existing ? (existing.uid || existing.id) : ("goog-" + Date.now().toString(36));

    if (!existing) {
      existing = store.addUser({
        uid: uid,
        id: uid,
        display_name: name,
        name: name,
        email: email,
        password: "google_oauth_session",
        role: role,
        avatar_url: avatar,
        avatar: avatar,
        provider: "google",
        created_at: new Date().toISOString()
      });
    } else {
      if (isOwnerAccount && existing.role !== "admin") {
        store.updateUser(existing.uid || existing.id, { role: "admin" });
      }
    }

    this.currentUser = {
      uid: existing.uid || existing.id || uid,
      id: existing.uid || existing.id || uid,
      display_name: existing.display_name || existing.name || name,
      name: existing.display_name || existing.name || name,
      email: existing.email || email,
      role: isOwnerAccount ? "admin" : (existing.role || role),
      avatar_url: existing.avatar_url || existing.avatar || avatar,
      avatar: existing.avatar_url || existing.avatar || avatar,
      provider: "google",
      created_at: existing.created_at || new Date().toISOString()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    store.addActivity(this.currentUser.uid, `${this.currentUser.name} signed in with Google Account (${this.currentUser.role.toUpperCase()})`);
    showToast(`Signed in with Google as ${this.currentUser.name}!`, "success");
    this.notify();
    return true;
  }

  updateCurrentUser(userObj) {
    if (!userObj) return;
    this.currentUser = { ...this.currentUser, ...userObj };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    this.notify();
  }

  async updateProfile(updates) {
    if (!this.currentUser) return;
    const currentId = this.currentUser.uid || this.currentUser.id;

    const partial = {};
    if (updates.name || updates.display_name) {
      partial.display_name = updates.display_name || updates.name;
      partial.name = partial.display_name;
    }
    if (updates.email) {
      partial.email = updates.email.trim().toLowerCase();
    }
    if (updates.avatar || updates.avatar_url) {
      partial.avatar_url = updates.avatar_url || updates.avatar;
      partial.avatar = partial.avatar_url;
    }
    if (updates.password) {
      partial.password = updates.password;
    }

    store.updateUser(currentId, partial);

    this.currentUser = {
      ...this.currentUser,
      ...partial
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    this.notify();

    if (isFirebaseConnected && db) {
      try {
        updateDoc(doc(db, "users", currentId), partial).catch(() => {});
      } catch (e) {}
    }
  }
}

export const auth = new AuthManager();
if (typeof window !== "undefined") {
  window.auth = auth;
}

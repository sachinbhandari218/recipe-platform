import { auth } from "../auth.js";
import { showToast } from "../toast.js";

let authMode = "login";
let showGooglePicker = false;

export function openAuthModal(mode = "login") {
  authMode = mode;
  showGooglePicker = false;
  let container = document.getElementById("auth-modal-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "auth-modal-container";
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <div id="auth-modal" class="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-pop-in relative">
        <button id="btn-close-auth-modal" class="absolute top-5 right-5 p-1 rounded-lg text-stone-400 hover:text-stone-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div class="text-center mb-5">
          <div class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <h3 class="text-2xl font-serif font-bold text-stone-900" id="auth-modal-title">Sign In or Join</h3>
          <p class="text-xs text-stone-500 mt-1">Online Recipe Sharing Platform</p>
        </div>

        <div id="google-auth-section" class="mb-4">
          <button
            type="button"
            id="btn-auth-google"
            class="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 shadow-sm hover:shadow transition-all flex items-center justify-center space-x-3 group"
          >
            <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.35 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div id="google-picker-container" class="hidden mb-5 bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-stone-200">
            <span class="text-xs font-bold uppercase tracking-wider text-stone-700">Google Account Sign-In</span>
            <button type="button" id="btn-close-google-picker" class="text-xs text-stone-400 hover:text-stone-700">Cancel</button>
          </div>

          <div class="space-y-2">
            <button
              type="button"
              id="btn-google-sachin-owner"
              class="w-full flex items-center space-x-3 p-2.5 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 transition-colors text-left"
            >
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80" class="w-9 h-9 rounded-full object-cover border border-amber-400" />
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold text-stone-900 truncate">Sachin Bhandari (Owner)</div>
                <div class="text-[11px] text-amber-800 truncate">sachin.bhandari@gmail.com</div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900 border border-amber-300">Owner</span>
            </button>
          </div>

          <div class="pt-2 border-t border-stone-200">
            <span class="text-[11px] font-semibold text-stone-500 block mb-2">Or enter any Google account name & email:</span>
            <form id="form-google-custom" class="space-y-2">
              <input
                type="text"
                id="input-google-custom-name"
                placeholder="Your Name (e.g. Rahul Sharma)"
                required
                class="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 bg-white"
              />
              <input
                type="email"
                id="input-google-custom-email"
                placeholder="your.email@gmail.com"
                required
                class="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 bg-white"
              />
              <button
                type="submit"
                class="w-full py-2 rounded-xl font-bold text-xs bg-stone-900 hover:bg-black text-white transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <span>Sign In with this Google Account</span>
              </button>
            </form>
          </div>
        </div>

        <div class="flex items-center my-4">
          <div class="flex-grow border-t border-stone-200"></div>
          <span class="flex-shrink mx-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider">or with email</span>
          <div class="flex-grow border-t border-stone-200"></div>
        </div>

        <div class="flex border-b border-stone-200 mb-5">
          <button id="tab-auth-login" class="flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all ${authMode === "login" ? "border-b-2 border-orange-600 text-orange-700" : "text-stone-400 hover:text-stone-700"}">
            Sign In
          </button>
          <button id="tab-auth-register" class="flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all ${authMode === "register" ? "border-b-2 border-orange-600 text-orange-700" : "text-stone-400 hover:text-stone-700"}">
            Register
          </button>
        </div>

        <div id="auth-form-container">
        </div>

        <div class="mt-6 pt-4 border-t border-stone-100">
          <span class="text-xs font-bold uppercase tracking-wider text-stone-400 block text-center mb-2.5">1-Click Fast Sign In</span>
          <div class="grid grid-cols-2 gap-2">
            <button id="btn-demo-owner" type="button" class="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors flex items-center justify-center space-x-1">
              <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              <span>Owner (Sachin)</span>
            </button>
            <button id="btn-demo-user" type="button" class="px-3 py-2 rounded-xl text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 transition-colors flex items-center justify-center space-x-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span>Demo User</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  attachAuthModalEvents(container);
  renderAuthForm(container);
}

export function closeAuthModal() {
  const container = document.getElementById("auth-modal-container");
  if (container) {
    container.innerHTML = "";
  }
}

function renderAuthForm(container) {
  const formContainer = container.querySelector("#auth-form-container");
  if (!formContainer) return;

  if (authMode === "login") {
    formContainer.innerHTML = `
      <form id="form-login" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Email Address</label>
          <input
            type="email"
            id="login-email"
            value="admin@recipes.com"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-stone-50/50"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Password</label>
          <input
            type="password"
            id="login-password"
            value="admin"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-stone-50/50"
          />
        </div>

        <button
          type="submit"
          class="w-full py-3 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 transition-all transform hover:-translate-y-0.5"
        >
          Sign In to Account
        </button>
      </form>
    `;

    formContainer.querySelector("#form-login").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = formContainer.querySelector("#login-email").value.trim();
      const password = formContainer.querySelector("#login-password").value;
      const success = await auth.login(email, password);
      if (success) {
        closeAuthModal();
      }
    });
  } else {
    formContainer.innerHTML = `
      <form id="form-register" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Full Name</label>
          <input
            type="text"
            id="register-name"
            placeholder="Aarav Sharma"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-stone-50/50"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Email Address</label>
          <input
            type="email"
            id="register-email"
            placeholder="aarav@recipes.com"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-stone-50/50"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Password</label>
          <input
            type="password"
            id="register-password"
            placeholder="Create password"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-stone-50/50"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">Role Assignment</label>
          <select id="register-role" class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-stone-50/50">
            <option value="user">User (Community Chef)</option>
            <option value="admin">Admin (Platform Moderator)</option>
          </select>
        </div>

        <button
          type="submit"
          class="w-full py-3 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 transition-all transform hover:-translate-y-0.5"
        >
          Create New Account
        </button>
      </form>
    `;

    formContainer.querySelector("#form-register").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = formContainer.querySelector("#register-name").value.trim();
      const email = formContainer.querySelector("#register-email").value.trim();
      const password = formContainer.querySelector("#register-password").value;
      const role = formContainer.querySelector("#register-role").value;

      const success = await auth.register(name, email, password, role);
      if (success) {
        closeAuthModal();
      }
    });
  }
}

function attachAuthModalEvents(container) {
  const closeBtn = container.querySelector("#btn-close-auth-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeAuthModal);
  }

  const modal = container.querySelector("#auth-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeAuthModal();
    });
  }

  const btnAuthGoogle = container.querySelector("#btn-auth-google");
  const googlePicker = container.querySelector("#google-picker-container");
  const btnCloseGooglePicker = container.querySelector("#btn-close-google-picker");
  const btnGoogleSachin = container.querySelector("#btn-google-sachin-owner");
  const formGoogleCustom = container.querySelector("#form-google-custom");

  if (btnAuthGoogle && googlePicker) {
    btnAuthGoogle.addEventListener("click", () => {
      googlePicker.classList.toggle("hidden");
    });
  }

  if (btnCloseGooglePicker && googlePicker) {
    btnCloseGooglePicker.addEventListener("click", () => {
      googlePicker.classList.add("hidden");
    });
  }

  if (btnGoogleSachin) {
    btnGoogleSachin.addEventListener("click", async () => {
      await auth.loginWithGoogle({
        email: "sachin.bhandari@gmail.com",
        name: "Sachin Bhandari (Owner)",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
      });
      closeAuthModal();
    });
  }

  if (formGoogleCustom) {
    formGoogleCustom.addEventListener("submit", async (e) => {
      e.preventDefault();
      const customName = container.querySelector("#input-google-custom-name").value.trim();
      const customEmail = container.querySelector("#input-google-custom-email").value.trim();
      if (!customName || !customEmail) {
        showToast("Please enter your Google name and email.", "error");
        return;
      }
      await auth.loginWithGoogle({
        email: customEmail,
        name: customName
      });
      closeAuthModal();
    });
  }

  const tabLogin = container.querySelector("#tab-auth-login");
  const tabRegister = container.querySelector("#tab-auth-register");
  const title = container.querySelector("#auth-modal-title");

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener("click", () => {
      authMode = "login";
      tabLogin.className = "flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 border-orange-600 text-orange-700";
      tabRegister.className = "flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all text-stone-400 hover:text-stone-700";
      if (title) title.textContent = "Sign In to Online Recipe Sharing Platform";
      renderAuthForm(container);
    });

    tabRegister.addEventListener("click", () => {
      authMode = "register";
      tabRegister.className = "flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 border-orange-600 text-orange-700";
      tabLogin.className = "flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all text-stone-400 hover:text-stone-700";
      if (title) title.textContent = "Create Chef Account";
      renderAuthForm(container);
    });
  }

  const demoOwnerBtn = container.querySelector("#btn-demo-owner");
  if (demoOwnerBtn) {
    demoOwnerBtn.addEventListener("click", async () => {
      await auth.loginWithGoogle({
        email: "sachin.bhandari@gmail.com",
        name: "Sachin Bhandari (Owner)",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
      });
      closeAuthModal();
    });
  }

  const demoUserBtn = container.querySelector("#btn-demo-user");
  if (demoUserBtn) {
    demoUserBtn.addEventListener("click", () => {
      auth.quickLoginAs("user");
      closeAuthModal();
    });
  }
}

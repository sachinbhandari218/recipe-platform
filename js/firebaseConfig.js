import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-flavorcraft-live-mock-api-key-2026",
  authDomain: "flavorcraft-recipes.firebaseapp.com",
  projectId: "flavorcraft-recipes",
  storageBucket: "flavorcraft-recipes.appspot.com",
  messagingSenderId: "982341908234",
  appId: "1:982341908234:web:e78b23f982a1789c0"
};

let app = null;
let authInstance = null;
let dbInstance = null;
let storageInstance = null;
let isFirebaseConnected = false;

try {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app);
  isFirebaseConnected = true;
} catch (e) {
  isFirebaseConnected = false;
}

export {
  app,
  authInstance as auth,
  dbInstance as db,
  storageInstance as storage,
  isFirebaseConnected,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  ref,
  uploadBytes,
  getDownloadURL
};

export function compressImage(file, maxWidth = 1200, maxHeight = 900, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export async function uploadRecipeImage(file, userId, preloadedDataUrl = null) {
  if (!file && !preloadedDataUrl) return null;

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File too large. Maximum size is 10MB.");
    }
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file format. Please upload a JPEG or PNG image.");
    }
  }

  const optimizedData = preloadedDataUrl || (file ? await compressImage(file) : null);

  if (storageInstance && isFirebaseConnected && file) {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `recipes/${userId || "community"}/${Date.now()}_${cleanFileName}`;
      const imageRef = ref(storageInstance, storagePath);

      const uploadPromise = (async () => {
        const snapshot = await uploadBytes(imageRef, file, {
          contentType: file.type
        });
        return await getDownloadURL(snapshot.ref);
      })();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 1200);
      });

      const downloadURL = await Promise.race([uploadPromise, timeoutPromise]);
      if (downloadURL) return downloadURL;
    } catch (err) {}
  }

  return optimizedData;
}

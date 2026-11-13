import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const config = window.RETTMAX_FIREBASE_CONFIG || {};
const link = document.querySelector(".auth-link");
const configured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

if (link && configured) {
  const auth = getAuth(initializeApp(config));
  const updateLink = (user) => {
    link.textContent = user ? "Mein Konto" : "Anmelden";
    link.setAttribute("aria-label", user ? "Mein RettMax-Konto öffnen" : "Anmelden oder registrieren");
  };

  onAuthStateChanged(auth, updateLink);

  // Re-check when the overview is restored from the browser's back/forward cache.
  window.addEventListener("pageshow", () => updateLink(auth.currentUser));
  window.addEventListener("focus", () => updateLink(auth.currentUser));
}

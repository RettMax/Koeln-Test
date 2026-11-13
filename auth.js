import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const config = window.RETTMAX_FIREBASE_CONFIG || {};
const hasConfig = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const auth = hasConfig ? getAuth(initializeApp(config)) : null;

const form = document.getElementById("authForm");
const status = document.getElementById("authStatus");
const title = document.getElementById("authTitle");
const intro = document.getElementById("authIntro");
const nameField = document.getElementById("nameField");
const nameInput = document.getElementById("displayName");
const confirmField = document.getElementById("confirmField");
const confirmInput = document.getElementById("confirmPassword");
const passwordHint = document.getElementById("passwordHint");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submitAuth");
const switchPrompt = document.getElementById("switchPrompt");
const switchButton = document.getElementById("switchMode");
const resetButton = document.getElementById("resetPassword");
const configNotice = document.getElementById("authConfigNotice");
const sessionPanel = document.getElementById("authSession");
const authForm = document.getElementById("authForm");
const verificationNotice = document.getElementById("verificationNotice");
const resendButton = document.getElementById("resendVerification");
let mode = "login";

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = "auth-status" + (kind ? " " + kind : "");
}

function renderMode() {
  const registering = mode === "register";
  title.textContent = registering ? "Konto erstellen" : "Willkommen bei RettMax";
  intro.textContent = registering
    ? "Erstelle dein persönliches RettMax-Konto."
    : "Melde dich mit deinem RettMax-Konto an.";
  nameField.hidden = !registering;
  nameInput.hidden = !registering;
  nameInput.required = registering;
  confirmField.hidden = !registering;
  confirmInput.hidden = !registering;
  confirmInput.required = registering;
  passwordHint.hidden = !registering;
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  passwordInput.minLength = registering ? 12 : 1;
  submitButton.textContent = registering ? "Konto erstellen" : "Anmelden";
  switchPrompt.textContent = registering ? "Du hast schon ein Konto?" : "Noch kein Konto?";
  switchButton.textContent = registering ? "Anmelden" : "Konto erstellen";
  resetButton.hidden = registering;
  setStatus("");
}

function showSession(user) {
  if (!user) {
    sessionPanel.hidden = true;
    authForm.hidden = false;
    verificationNotice.hidden = true;
    return;
  }
  document.getElementById("authUserEmail").textContent = user.email || "E-Mail nicht verfügbar";
  document.getElementById("authUserId").textContent = "Benutzer-ID: " + user.uid;
  verificationNotice.hidden = user.emailVerified;
  sessionPanel.hidden = false;
  authForm.hidden = true;
  resetButton.hidden = true;
  switchPrompt.hidden = true;
  switchButton.hidden = true;
  title.textContent = user.emailVerified ? "Du bist angemeldet" : "Bitte bestätige deine E-Mail";
  intro.textContent = user.emailVerified
    ? "Dein RettMax-Konto ist aktiv."
    : "Wir haben einen Bestätigungslink an deine E-Mail-Adresse gesendet.";
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "Für diese E-Mail-Adresse gibt es bereits ein Konto. Melde dich an.",
    "auth/invalid-credential": "E-Mail-Adresse oder Passwort ist nicht korrekt.",
    "auth/invalid-email": "Bitte gib eine gültige E-Mail-Adresse ein.",
    "auth/weak-password": "Das Passwort ist zu schwach. Verwende mindestens 12 Zeichen.",
    "auth/too-many-requests": "Zu viele Versuche. Bitte warte kurz und versuche es erneut.",
    "auth/network-request-failed": "Keine Verbindung zu Firebase. Bitte prüfe deine Internetverbindung.",
    "auth/unauthorized-domain": "Diese Website-Domain ist in Firebase noch nicht für Anmeldung freigegeben.",
    "auth/operation-not-allowed": "E-Mail-/Passwort-Anmeldung ist in Firebase nicht aktiviert. Aktiviere sie unter Authentication → Sign-in method.",
    "auth/admin-restricted-operation": "Diese Registrierungsart ist in Firebase deaktiviert. Aktiviere E-Mail/Passwort unter Authentication → Sign-in method.",
    "auth/invalid-api-key": "Der Firebase API-Key in auth-config.js ist ungültig.",
    "auth/project-not-found": "Das Firebase-Projekt in auth-config.js wurde nicht gefunden. Prüfe projectId.",
    "auth/app-not-authorized": "Diese Web-App ist für das Firebase-Projekt nicht autorisiert. Prüfe die Web-App-Konfiguration.",
    "auth/configuration-not-found": "Firebase Authentication ist für dieses Projekt noch nicht eingerichtet."
  };
  if (messages[error.code]) return messages[error.code];
  console.error("Firebase Auth Fehler:", error);
  return error.code
    ? "Die Anmeldung ist fehlgeschlagen (Firebase-Fehlercode: " + error.code + ")."
    : "Die Anmeldung ist fehlgeschlagen. Öffne die Browser-Konsole für Details.";
}

switchButton.addEventListener("click", () => {
  mode = mode === "login" ? "register" : "login";
  renderMode();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");
  if (!auth) {
    setStatus("Firebase ist noch nicht konfiguriert.", "error");
    return;
  }

  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value;
  submitButton.disabled = true;
  submitButton.textContent = "Einen Moment …";

  try {
    if (mode === "register") {
      if (password.length < 12) throw { code: "auth/weak-password" };
      if (password !== confirmInput.value) {
        setStatus("Die Passwörter stimmen nicht überein.", "error");
        return;
      }
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = nameInput.value.trim();
      if (displayName) await updateProfile(credential.user, { displayName });
      await sendEmailVerification(credential.user);
      await credential.user.reload();
      showSession(auth.currentUser);
      setStatus("Konto erstellt. Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach.", "success");
      form.reset();
    } else {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      showSession(credential.user);
      setStatus(credential.user.emailVerified
        ? "Du bist angemeldet."
        : "Bitte bestätige zuerst deine E-Mail-Adresse. Du kannst dir den Link erneut senden lassen.", "success");
    }
  } catch (error) {
    setStatus(friendlyError(error), "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = mode === "register" ? "Konto erstellen" : "Anmelden";
  }
});

resetButton.addEventListener("click", async () => {
  setStatus("");
  if (!auth) {
    setStatus("Firebase ist noch nicht konfiguriert.", "error");
    return;
  }
  const email = document.getElementById("email").value.trim();
  if (!email) {
    setStatus("Gib zuerst deine E-Mail-Adresse ein.", "error");
    document.getElementById("email").focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    setStatus("Falls ein Konto zu dieser Adresse gehört, erhältst du eine E-Mail zum Zurücksetzen des Passworts.", "success");
  } catch (error) {
    setStatus(friendlyError(error), "error");
  }
});

resendButton.addEventListener("click", async () => {
  if (!auth?.currentUser) return;
  try {
    await sendEmailVerification(auth.currentUser);
    setStatus("Der Bestätigungslink wurde erneut gesendet.", "success");
  } catch (error) {
    setStatus(friendlyError(error), "error");
  }
});

document.getElementById("signOutButton").addEventListener("click", async () => {
  if (!auth) return;
  try {
    await signOut(auth);
    mode = "login";
    switchPrompt.hidden = false;
    switchButton.hidden = false;
    resetButton.hidden = false;
    renderMode();
  } catch (error) {
    setStatus(friendlyError(error), "error");
  }
});

if (!hasConfig) configNotice.hidden = false;
if (auth) onAuthStateChanged(auth, showSession);
renderMode();

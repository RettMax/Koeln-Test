(() => {
  const config = window.RETTMAX_AUTH_CONFIG || {};
  const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const client = hasConfig && window.supabase
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

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
      return;
    }
    document.getElementById("authUserEmail").textContent = user.email || "E-Mail nicht verfügbar";
    document.getElementById("authUserId").textContent = "Benutzer-ID: " + user.id;
    sessionPanel.hidden = false;
    authForm.hidden = true;
    resetButton.hidden = true;
    switchPrompt.hidden = true;
    switchButton.hidden = true;
    title.textContent = "Du bist angemeldet";
    intro.textContent = "Dein RettMax-Konto ist aktiv.";
  }

  switchButton.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    renderMode();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");
    if (!client) {
      setStatus("Die Authentifizierung ist noch nicht konfiguriert.", "error");
      return;
    }

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    submitButton.disabled = true;
    submitButton.textContent = "Einen Moment …";

    try {
      if (mode === "register") {
        if (password.length < 12) throw new Error("Das Passwort muss mindestens 12 Zeichen lang sein.");
        if (password !== confirmInput.value) throw new Error("Die Passwörter stimmen nicht überein.");
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: nameInput.value.trim() },
            emailRedirectTo: window.location.origin + window.location.pathname
          }
        });
        if (error) throw error;
        if (data.session) {
          showSession(data.user);
          setStatus("Dein Konto wurde erstellt.", "success");
        } else {
          setStatus("Fast geschafft: Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach.", "success");
          form.reset();
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showSession(data.user);
        setStatus("Du bist angemeldet.", "success");
      }
    } catch (error) {
      setStatus(error.message || "Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = mode === "register" ? "Konto erstellen" : "Anmelden";
    }
  });

  resetButton.addEventListener("click", async () => {
    setStatus("");
    if (!client) {
      setStatus("Die Authentifizierung ist noch nicht konfiguriert.", "error");
      return;
    }
    const email = document.getElementById("email").value.trim();
    if (!email) {
      setStatus("Gib zuerst deine E-Mail-Adresse ein.", "error");
      document.getElementById("email").focus();
      return;
    }
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) setStatus(error.message, "error");
    else setStatus("Falls ein Konto zu dieser Adresse gehört, erhältst du eine E-Mail zum Zurücksetzen des Passworts.", "success");
  });

  document.getElementById("signOutButton").addEventListener("click", async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) {
      setStatus(error.message, "error");
      return;
    }
    sessionPanel.hidden = true;
    authForm.hidden = false;
    resetButton.hidden = false;
    switchPrompt.hidden = false;
    switchButton.hidden = false;
    title.textContent = "Willkommen bei RettMax";
    intro.textContent = "Melde dich an oder erstelle ein Konto, um dein persönliches RettMax-Profil einzurichten.";
    renderMode();
  });

  if (!client) configNotice.hidden = false;
  if (client) {
    client.auth.getSession().then(({ data }) => showSession(data.session?.user || null));
    client.auth.onAuthStateChange((_event, session) => showSession(session?.user || null));
  }
  renderMode();
})();

// Accounts + cloud copy of the plan (Supabase). The app is local-first: this module only
// mirrors the plan to one row per person, and does nothing when config.js is left empty.
window.Sync = (() => {
  const cfg = window.PLANNER_CONFIG || {};
  const Cap = window.Capacitor;
  const P = Cap?.Plugins || {};
  const native = !!Cap?.isNativePlatform?.();
  const platform = Cap?.getPlatform?.() || "web";
  const enabled = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient);
  const META = "countdown-planner.sync";

  let sb = null, user = null, status = enabled ? "signedout" : "off", lastSync = 0, lastError = "";
  let timer = null, busy = false, queued = null;
  const subs = new Set();

  const info = () => ({ enabled, status, user, lastSync, lastError });
  const emit = () => subs.forEach(f => { try { f(info()); } catch (e) { console.error(e); } });
  const setStatus = s => { status = s; emit(); };
  const meta = () => { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch (e) { return {}; } };
  const setMeta = m => { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} };

  function providers() {
    const list = (cfg.providers || ["email"]).filter(p => ["email", "google", "apple"].includes(p));
    // App Store guideline 4.8: a third-party login on iOS needs Sign in with Apple beside it.
    if (platform === "ios" && list.includes("google") && !list.includes("apple")) return list.filter(p => p !== "google");
    return list;
  }
  const redirectUrl = () => native ? `${cfg.appScheme}://auth` : location.origin + location.pathname;

  function init(onSignedIn) {
    if (!enabled) return;
    sb = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: !native },
    });
    sb.auth.onAuthStateChange((evt, session) => {
      const was = user?.id;
      user = session?.user || null;
      if (!user) { status = "signedout"; }
      else if (status === "signedout") { status = "syncing"; }
      emit();
      // Supabase calls must not be awaited inside this callback.
      if (user && user.id !== was) setTimeout(() => onSignedIn(user, evt), 0);
    });
    if (native && P.App) {
      // Sign-in links (email link, Google, Apple) come back as <appScheme>://auth?code=…
      P.App.addListener("appUrlOpen", ({ url }) => handleReturnUrl(url));
      // …including when the link launched the app from fully closed.
      P.App.getLaunchUrl?.().then(r => r?.url && handleReturnUrl(r.url)).catch(() => {});
    }
    window.addEventListener("online", () => { if (user && queued) flush(); });
  }

  let handledCode = "";
  async function handleReturnUrl(url) {
    if (!url || !url.startsWith(cfg.appScheme + "://")) return;
    try {
      const u = new URL(url.replace(/#/, "?"));
      const err = u.searchParams.get("error_description");
      if (err) throw new Error(err.replace(/\+/g, " "));
      const code = u.searchParams.get("code");
      if (code && code !== handledCode) {
        handledCode = code;
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) throw error;
      }
    } catch (e) {
      console.warn("[sign-in]", e.message);
      lastError = /verifier/i.test(e.message || "") ? "Open the sign-in link on the same device where you asked for it." : /expired|invalid/i.test(e.message || "") ? "That sign-in link has expired or was already used. Please try again." : "Sign-in didn't finish. Please try again.";
      emit();
    } finally { P.Browser?.close?.().catch(() => {}); }
  }

  async function sendCode(email) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirectUrl() } });
    if (error) throw error;
  }
  async function verifyCode(email, token) {
    const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
  }
  async function oauth(provider) {
    if (native) {
      const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: redirectUrl(), skipBrowserRedirect: true } });
      if (error) throw error;
      if (P.Browser) await P.Browser.open({ url: data.url, presentationStyle: "popover" });
      else location.href = data.url;
    } else {
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: redirectUrl() } });
      if (error) throw error;
    }
  }
  async function signOut() {
    clearTimeout(timer); queued = null;
    await sb.auth.signOut().catch(() => {});
    user = null; setMeta({}); setStatus("signedout");
  }
  async function deleteAccount() {
    const { error } = await sb.rpc("delete_my_account");
    if (error) throw error;
    await signOut();
  }

  async function pull() {
    const { data, error } = await sb.from("plans").select("data,updated_at").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return data ? { state: data.data, at: Date.parse(data.updated_at) } : null;
  }
  async function push(state) {
    const at = state.updatedAt || Date.now();
    const { error } = await sb.from("plans").upsert({ user_id: user.id, data: state, updated_at: new Date(at).toISOString() });
    if (error) throw error;
    markSynced(at);
  }
  function markSynced(at) { setMeta({ uid: user?.id, syncedAt: at }); lastSync = Date.now(); lastError = ""; }
  function syncedAt() { const m = meta(); return user && m.uid === user.id ? m.syncedAt : null; }

  function schedule(state) {
    if (!user) return;
    queued = state;
    clearTimeout(timer);
    setStatus(navigator.onLine ? "pending" : "offline");
    timer = setTimeout(flush, 900);
  }
  async function flush() {
    if (!user || !queued) return;
    if (busy) { clearTimeout(timer); timer = setTimeout(flush, 500); return; }
    if (!navigator.onLine) { setStatus("offline"); return; }
    busy = true;
    const s = queued; queued = null;
    setStatus("syncing");
    try { await push(s); setStatus(queued ? "pending" : "synced"); }
    catch (e) { queued = queued || s; console.warn("[sync]", e.message); setStatus(navigator.onLine ? "error" : "offline"); }
    busy = false;
    if (queued) { clearTimeout(timer); timer = setTimeout(flush, 2500); }
  }

  return {
    enabled, native, platform, providers, init, sendCode, verifyCode, oauth, signOut, deleteAccount,
    pull, push, schedule, flush, markSynced, syncedAt, setStatus, info,
    user: () => user, hasQueued: () => !!queued,
    on: f => { subs.add(f); return () => subs.delete(f); },
  };
})();

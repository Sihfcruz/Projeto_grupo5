const KEY = "nomade.session.v1";
export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}
export function saveSession(value) {
  sessionStorage.setItem(KEY, JSON.stringify(value));
}
export function clearSession() {
  sessionStorage.removeItem(KEY);
}
export function isDemo() {
  return getSession()?.mode === "demo";
}
export function requireSession() {
  const session = getSession();
  if (!session || (session.mode !== "demo" && !session.acessToken)) {
    location.replace("login.html");
    return false;
  }
  return true;
}

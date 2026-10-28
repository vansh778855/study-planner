// Apply the saved theme before first paint so there is no flash.
try { const t = JSON.parse(localStorage.getItem("countdown-planner.ui") || "{}").theme; if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; } catch (e) {}

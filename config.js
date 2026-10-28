// Sign-in and sync settings. Leave supabaseUrl empty to ship the app without accounts:
// everything still works and the plan stays on the device.
// The anon key is a public key designed to live in apps; your data is protected by the
// row-level security rules in supabase/schema.sql. Never put the service_role key here.
window.PLANNER_CONFIG = {
  supabaseUrl: "https://mavamnumfjhzsfybjokn.supabase.co",           // Supabase > Project Settings > Data API
  supabaseAnonKey: "sb_publishable_XbeJevyrQ7UrQcBvDoRqpg_KUzLmPi3",  // the publishable (public) key, never the secret one

  // Sign-in methods to show: "email" (sign-in link, or a 6-digit code once your email template has {{ .Token }}), "google", "apple".
  // Google and Apple need their provider switched on in Supabase > Authentication > Sign In / Providers first.
  // On iPhone/iPad, Google is hidden unless "apple" is also listed (App Store guideline 4.8).
  providers: ["email", "google"],

  // Must match "appId" in capacitor.config.json. Native sign-in returns to <appScheme>://auth
  appScheme: "com.countdownplanner.app",
};

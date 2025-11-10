import { StackClientApp } from "@stackframe/react";

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID!,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY!,
  tokenStore: "cookie",
  // optionnel si tu utilises un endpoint custom :
  // baseUrl: import.meta.env.VITE_STACK_API_URL,
  urls: {
    // nécessaire pour OAuth (Google/GitHub...) dans une SPA
    oauthCallback: window.location.origin + "/oauth",
  },
});

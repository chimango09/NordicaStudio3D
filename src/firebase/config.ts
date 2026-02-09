// This configuration is used for local development. For production deployments on
// platforms like Vercel, it is strongly recommended to use environment variables.

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCicVY86SFVNs3YRL_AljyB5zWblm9OIOI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-4994824897-767df.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-4994824897-767df",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:809219262327:web:4d7121cfc2123b5264c372",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "809219262327",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

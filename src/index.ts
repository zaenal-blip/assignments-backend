import { App } from "./app.js";

const appInstance = new App();
export const app = appInstance.app;

// Only start the server locally or on standard node environments (not Vercel Serverless)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  appInstance.start();
}

export default app;

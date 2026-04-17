import { App } from "../src/app.js";

let app;
try {
  const appInstance = new App();
  app = appInstance.app;
  console.log("App initialized successfully");
} catch (error) {
  console.error("Failed to initialize app:", error);
  // Re-throw to make sure Vercel sees the failure
  throw error;
}

export default app;

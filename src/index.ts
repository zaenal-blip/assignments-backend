import { App } from "./app.js";

const appInstance = new App();

// This file is strictly used for local development (npm run dev)
// and production self-hosting (npm run start).
// It runs the process persistently on the specified port.
appInstance.start();

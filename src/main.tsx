import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import "./entitlement-gate";
import { initApp } from "./initApp";

// Initialize application
initApp();

createRoot(document.getElementById("root")!).render(<App />);

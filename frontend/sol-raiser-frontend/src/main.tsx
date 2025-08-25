import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import './index.css'
import App from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <App />
  </StrictMode>
);

// Patch BigInt so we can log it using JSON.stringify without errors
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

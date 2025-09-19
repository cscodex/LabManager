import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Conditionally import Replit plugins only in development
async function getReplitPlugins() {
  if (process.env.NODE_ENV === "production") {
    return [];
  }

  try {
    const [runtimeErrorOverlay, cartographer] = await Promise.all([
      import("@replit/vite-plugin-runtime-error-modal").then(m => m.default()),
      process.env.REPL_ID !== undefined
        ? import("@replit/vite-plugin-cartographer").then(m => m.cartographer())
        : null
    ]);

    return [runtimeErrorOverlay, cartographer].filter(Boolean);
  } catch (error) {
    console.warn("Replit plugins not available, skipping...");
    return [];
  }
}

export default defineConfig(async () => {
  const replitPlugins = await getReplitPlugins();

    return {
      plugins: [
        react(),
        ...replitPlugins,
      ],
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "shared"),
          "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        },
      },
      root: path.resolve(import.meta.dirname, "client"),
      build: {
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true,
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"],
        },
      },
    };
  });

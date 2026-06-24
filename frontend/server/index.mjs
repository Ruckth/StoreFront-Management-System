import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { UploadThingError } from "uploadthing/server";
import { createRouteHandler, createUploadthing } from "uploadthing/express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 4173);

function envValue(name) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

const apiBaseUrl = (
  envValue("API_BASE_URL") ??
  envValue("VITE_API_BASE_URL") ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

const app = express();
const upload = createUploadthing();

async function requireSeller(authorization) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new UploadThingError({
      code: "FORBIDDEN",
      message: "Login as a seller before uploading product images.",
    });
  }

  const response = await fetch(`${apiBaseUrl}/auth/me/`, {
    headers: { Authorization: authorization },
  });

  if (!response.ok) {
    throw new UploadThingError({
      code: "FORBIDDEN",
      message: "Your login session could not be verified.",
    });
  }

  const user = await response.json();
  if (user?.role !== "seller") {
    throw new UploadThingError({
      code: "FORBIDDEN",
      message: "Only seller accounts can upload product images.",
    });
  }

  return { userId: user.id, role: user.role };
}

const uploadRouter = {
  productImage: upload({
    image: {
      maxFileCount: 1,
      maxFileSize: "10MB",
    },
  })
    .middleware(async ({ req }) => {
      return requireSeller(req.headers.authorization);
    })
    .onUploadComplete(({ file, metadata }) => ({
      fileKey: file.key,
      userId: metadata.userId,
    })),
};

app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
    config: {
      callbackUrl: envValue("UPLOADTHING_CALLBACK_URL"),
      token: envValue("UPLOADTHING_TOKEN"),
    },
  }),
);

if (isProduction) {
  const distDir = path.join(rootDir, "dist");
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    appType: "spa",
    root: rootDir,
    server: { middlewareMode: true },
  });
  app.use(vite.middlewares);
  app.get(/.*/, async (req, res, next) => {
    try {
      const template = fs.readFileSync(path.join(rootDir, "index.html"), "utf-8");
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`StoreFront frontend server listening on http://0.0.0.0:${port}`);
});

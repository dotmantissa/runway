import type { IncomingMessage, ServerResponse } from "node:http";
import { waitUntil } from "@vercel/functions";
import { createApp } from "./app.js";

let application: ReturnType<typeof createApp> | undefined;
export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  application ??= createApp({
    worker: false,
    serveStatic: false,
    background: waitUntil,
  })
    .then(async (app) => {
      await app.ready();
      return app;
    })
    .catch((error) => {
      application = undefined;
      throw error;
    });
  try {
    const app = await application;
    app.server.emit("request", request, response);
  } catch {
    response.statusCode = 503;
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    response.end(
      JSON.stringify({
        error: {
          code: "STARTUP_UNAVAILABLE",
          message:
            "Runway could not connect to its persistent store. Try again shortly.",
        },
      }),
    );
  }
}

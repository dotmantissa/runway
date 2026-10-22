import { createApp } from "./app.js";
import { config } from "./config.js";
const app = await createApp();
await app.listen({ port: config.port, host: "0.0.0.0" });
console.log(`Runway API listening on http://localhost:${config.port}`);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });

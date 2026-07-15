// Elysia wiring: auth qua x-api-key → gate → response. Đây là "mặt tiền" mỏng.
import { Elysia, t } from "elysia";
import { appByKey, handle, metrics, type GateError } from "./gateway";

new Elysia()
  // Auth: app chỉ cầm gateway key, không thấy key provider.
  .derive(({ headers, set }) => {
    const app = appByKey(headers["x-api-key"] ?? "");
    if (!app) {
      set.status = 401;
      throw new Error("invalid or missing x-api-key");
    }
    return { app };
  })
  .post(
    "/v1/chat",
    async ({ app, body, set }) => {
      try {
        return await handle(app, body.messages);
      } catch (e) {
        const err = e as GateError;
        set.status = err.status ?? 500;
        return { error: err.message ?? String(e) };
      }
    },
    { body: t.Object({ messages: t.Array(t.Object({ role: t.String(), content: t.String() })) }) }
  )
  // Dashboard-lite: cost/token/fallback per app cho toàn công ty.
  .get("/metrics", () => metrics())
  .listen(Number(process.env.PORT ?? 4000));

console.log(`LLM gateway on :${process.env.PORT ?? 4000}`);

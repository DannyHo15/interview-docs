// Lõi gateway: registry app, rate-limit + quota, provider fallback, cost + metrics.
// ponytail: mọi state để in-memory. Prod thay bằng Redis (limit) + Postgres (usage/audit).
import { generateText, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { rateLimit, type Window } from "./ratelimit";

// ---- 1. Registry app + secret tập trung -----------------------------------
// ponytail: hardcode ở đây cho ví dụ; prod nạp từ secret store / DB, có RBAC.
export type AppConfig = {
  id: string;
  name: string;
  rpm: number; // request / phút
  monthlyTokenBudget: number; // quota token / tháng
};

const APPS: Record<string, AppConfig> = {
  "key-team-a": { id: "team-a", name: "Support Bot", rpm: 60, monthlyTokenBudget: 5_000_000 },
  "key-team-b": { id: "team-b", name: "Docs Search", rpm: 20, monthlyTokenBudget: 1_000_000 },
};

export const appByKey = (key: string): AppConfig | undefined => APPS[key];

// ---- 2. Rate-limit (fixed window / phút) — tách ra ratelimit.ts để test độc lập
const windows = new Map<string, Window>();

// ---- 3. Cost tracking + metrics per app -----------------------------------
// Giá minh hoạ (USD / 1M token, gộp in+out cho gọn). Cập nhật theo bảng giá thật.
const PRICE_PER_MTOK: Record<string, number> = { "gemini-2.0-flash": 0.1, "gpt-4o-mini": 0.3 };
const estimateCost = (model: string, tokens: number) =>
  (tokens / 1_000_000) * (PRICE_PER_MTOK[model] ?? 0);

type Usage = { requests: number; tokens: number; costUsd: number; fallbacks: number; errors: number };
const usage = new Map<string, Usage>();
const bump = (id: string, patch: Partial<Usage>) => {
  const u = usage.get(id) ?? { requests: 0, tokens: 0, costUsd: 0, fallbacks: 0, errors: 0 };
  usage.set(id, {
    requests: u.requests + (patch.requests ?? 0),
    tokens: u.tokens + (patch.tokens ?? 0),
    costUsd: u.costUsd + (patch.costUsd ?? 0),
    fallbacks: u.fallbacks + (patch.fallbacks ?? 0),
    errors: u.errors + (patch.errors ?? 0),
  });
};
export const metrics = () => Object.fromEntries(usage);

// ---- 4. Provider chain + fallback -----------------------------------------
const CHAIN = [
  { model: "gemini-2.0-flash", run: (m: ModelMessage[]) => generateText({ model: google("gemini-2.0-flash"), messages: m }) },
  { model: "gpt-4o-mini", run: (m: ModelMessage[]) => generateText({ model: openai("gpt-4o-mini"), messages: m }) },
];

const withTimeout = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

// ---- 5. Gate chính: kiểm limit/quota → gọi provider có fallback → đo -------
export type GateError = { status: number; message: string };

export async function handle(app: AppConfig, messages: ModelMessage[]) {
  const now = Date.now();

  // rate limit
  const rl = rateLimit(windows.get(app.id), app.rpm, now);
  windows.set(app.id, rl.win);
  if (!rl.allowed) throw { status: 429, message: `rate limit ${app.rpm}/min` } as GateError;

  // quota
  if ((usage.get(app.id)?.tokens ?? 0) >= app.monthlyTokenBudget)
    throw { status: 402, message: "monthly token budget exceeded" } as GateError;

  // provider fallback chain
  let lastErr: unknown;
  for (let i = 0; i < CHAIN.length; i++) {
    const p = CHAIN[i];
    const t0 = Date.now();
    try {
      const res = await withTimeout(p.run(messages), 20_000);
      const tokens = res.usage?.totalTokens ?? 0;
      bump(app.id, {
        requests: 1,
        tokens,
        costUsd: estimateCost(p.model, tokens),
        fallbacks: i > 0 ? 1 : 0,
      });
      log({ app: app.id, provider: p.model, tokens, ms: Date.now() - t0, ok: true, fallback: i > 0 });
      return { provider: p.model, text: res.text, tokens };
    } catch (e) {
      lastErr = e;
      log({ app: app.id, provider: p.model, ms: Date.now() - t0, ok: false, error: String(e) });
      // ponytail: fallback mọi lỗi. Prod: chỉ fallback lỗi tạm (5xx/429/timeout), không fallback lỗi input.
    }
  }
  bump(app.id, { errors: 1 });
  throw { status: 502, message: `all providers failed: ${lastErr}` } as GateError;
}

// ---- 6. Observability -----------------------------------------------------
// ponytail: 1 dòng JSON/stdout. Prod: đẩy sang tracing (OTel) + log store.
const log = (o: Record<string, unknown>) => console.log(JSON.stringify({ t: new Date().toISOString(), ...o }));

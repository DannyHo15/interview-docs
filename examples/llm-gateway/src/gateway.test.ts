// Check tối thiểu cho phần "money path" của gateway: rate-limit window.
// Chạy: bun test
import { expect, test } from "bun:test";
import { rateLimit } from "./ratelimit";

test("cho qua tới đúng rpm rồi chặn", () => {
  let win;
  const now = 1000;
  for (let i = 0; i < 3; i++) ({ win } = rateLimit(win, 3, now)); // 3 request đầu OK
  const blocked = rateLimit(win, 3, now);
  expect(blocked.allowed).toBe(false); // request thứ 4 trong window → chặn
});

test("reset khi qua window mới", () => {
  let { win } = rateLimit(undefined, 1, 1000);
  expect(rateLimit(win, 1, 1000).allowed).toBe(false); // hết hạn ngạch phút này
  expect(rateLimit(win, 1, 61_001).allowed).toBe(true); // sang phút sau → mở lại
});

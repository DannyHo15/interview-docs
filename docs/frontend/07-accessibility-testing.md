# 🧪 07 — Accessibility & Testing (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp. Gắn use-case thực tế từ CV: **LoLamBenhAn** (form a11y), **EVN GENCO3** (Ant Design a11y), **Avatar48** (test component), **GenCodify** (Yjs collab test).

---

## 1. Semantic HTML — tại sao quan trọng? 🔥

**Ngắn:** Semantic HTML dùng tag mô tả **ý nghĩa** (`<nav>`, `<article>`, `<button>`, `<header>`) thay vì `<div>` mù. Browser + screen reader + SEO đều hiểu.

| Non-semantic | Semantic |
|---|---|
| `<div onclick>` | `<button>` |
| `<div class="header">` | `<header>` |
| `<span class="nav">` | `<nav>` |
| `<div class="list-item">` | `<li>` trong `<ul>` |

**Đào sâu:**
- Screen reader (NVDA, VoiceOver) navigate theo **landmark** (header, nav, main, footer, aside).
- `<button>` native: focusable, Enter/Space trigger, keyboard access. `<div onclick>` thì KHÔNG → phải thêm `tabindex`, `role`, `keydown` handler.
- HTML5 outline: `<section>`, `<article>` với `<heading>` tạo document structure.
- ARIA **không thay thế** semantic — chỉ bổ sung. Nguyên tắc: "No ARIA is better than bad ARIA".

**Gotcha:** Dùng `<div onClick>` thay `<button>` → người dùng keyboard không click được, screen reader không nhận. Đây là bug a11y phổ biến nhất.

**Follow-up:** Khi nào dùng ARIA? → Khi không có semantic tag phù hợp (custom widget như combobox, tab). Khi có tag → dùng tag.

**Use-case:** **EVN GENCO3** Ant Design Pro render semantic tag chuẩn (Menu, Table); **LoLamBenhAn** form dùng `<form>`, `<label>`, `<fieldset>` đúng chuẩn.

```tsx
// ❌ Anti-pattern
<div onClick={submit} className="btn">Save</div>

// ✅ Semantic
<button type="submit" onClick={submit}>Save</button>
```

---

## 2. ARIA roles — khi nào dùng, dùng thế nào?

**Ngắn:** ARIA (Accessible Rich Internet Applications) = attribute bổ sung semantic cho custom widget. `role`, `aria-label`, `aria-expanded`, `aria-hidden`, `aria-live`.

| Attribute | Khi nào |
|---|---|
| `role="button"` | Custom click element (tránh nếu dùng `<button>`) |
| `aria-label="Close"` | Button chỉ có icon (không text) |
| `aria-expanded="false"` | Toggle button state |
| `aria-hidden="true"` | Decorative (icon, separator) — ẩn khỏi reader |
| `aria-live="polite"` | Toast/notification — thông báo khi thay đổi |
| `aria-describedby` | Link input với hint text |

**Đào sâu:**
- **First rule of ARIA:** Don't use ARIA. Nếu HTML tag đủ, dùng tag.
- `aria-live="polite"` (chờ reader idle) vs `"assertive"` (ngắt ngay) — polite thường đủ.
- `aria-hidden` ẩn khỏi AT nhưng VẪN visible thị giác — cẩn thận sighted keyboard user.
- Combobox pattern phức tạp: `role="combobox"`, `aria-controls`, `aria-activedescendant`, arrow key navigation.
- WAI-ARIA Authoring Practices (APG) là reference cho widget pattern.

**Gotcha:** `aria-hidden="true"` trên focusable element → sighted user tab được nhưng reader không đọc → bế tắc. Check `:focus-visible`.

**Follow-up:** Làm modal a11y? → `role="dialog"`, `aria-modal="true"`, focus trap, restore focus khi close, Esc đóng.

```tsx
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon aria-hidden="true" />
</button>

<div role="alert" aria-live="assertive">{errorMessage}</div>
```

---

## 3. Keyboard navigation & focus management 🔥

**Ngắn:** Mọi tương tác phải làm được bằng keyboard. Tab qua focusable element theo order, focus visible, focus trap trong modal.

| Yếu tố | Yêu cầu |
|---|---|
| Focus order | Theo visual flow (DOM order thường tự nhiên) |
| `:focus-visible` | Outline rõ ràng, không remove |
| Skip link | "Skip to content" đầu page |
| Modal | Focus trap, restore focus khi close |
| Dropdown | Arrow key navigate, Esc close |

**Đào sâu:**
- `tabindex="0"`: focusable theo flow. `tabindex="-1"`: focusable bằng JS (`el.focus()`) nhưng không qua Tab. `tabindex="1+"`: **anti-pattern** — phá order tự nhiên.
- `:focus` vs `:focus-visible`:后者 chỉ hiện khi keyboard focus (không phải mouse) — tránh ring khó chịu khi click.
- Focus trap trong modal: Tab ở last element → focus first; Shift+Tab ở first → last.
- `autofocus` HTML attribute hoặc React `autoFocus` — nhưng cẩn thận với SSR.
- Restore focus: lưu `document.activeElement` trước khi mở modal, `.focus()` lại khi close.

**Gotcha:** `outline: none` mà không thay bằng focus style thay thế → keyboard user không biết đang ở đâu. Top 10 a11y bug.

**Follow-up:** Làm toast a11y? → `role="status"` + `aria-live="polite"`, tự dismiss, không steal focus.

```tsx
// Focus trap đơn giản
const dialogRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const previouslyFocused = document.activeElement as HTMLElement;
  dialogRef.current?.focus();
  return () => previouslyFocused?.focus();
}, []);
```

---

## 4. Color contrast & WCAG — chuẩn nào?

**Ngắn:** WCAG (Web Content Accessibility Guidelines) yêu cầu **contrast ratio** tối thiểu để text đọc được. AA = 4.5:1 (text), AAA = 7:1.

| Text size | AA | AAA |
|---|---|---|
| Normal (< 18px / 14px bold) | 4.5:1 | 7:1 |
| Large (≥ 18px / 14px bold) | 3:1 | 4.5:1 |
| UI component / icon | 3:1 | — |

**Đào sâu:**
- Contrast ratio = (L1 + 0.05) / (L2 + 0.05) với L = relative luminance.
- WCAG 3.0 (draft) dùng APCA (Advanced Perceptual Contrast Algorithm) — chính xác hơn cho dark mode.
- Tool: Chrome DevTools → Lighthouse, axe DevTools, Stark (Figma).
- Color blind (8% nam): không chỉ dựa màu — thêm icon/text. `prefers-contrast: more` media query.
- Dark mode thường fail contrast vì người thiết kế invert mà không tính lại.

**Gotcha:** Placeholder text contrast thường fail AA (gray nhạt). Dùng hint text bên dưới thay placeholder cho instruction.

**Follow-up:** Làm chart colorblind-safe? → Palette ColorBrewer / Viridis, không dùng red-green. Test với simulator.

**Use-case:** **EVN GENCO3** chart dùng palette colorblind-safe; **LoLamBenhAn** form hint text thay placeholder.

---

## 5. Form & label accessibility — làm đúng?

**Ngắn:** Mỗi input cần `<label>` liên kết (`for` → `id`), error message rõ ràng, required attribute, group liên quan bằng `<fieldset>`.

**Đào sâu:**
- `<label htmlFor="email">` + `<input id="email">` → click label focus input, reader đọc label trước.
- `aria-required="true"` hoặc HTML5 `required`.
- Error: `aria-describedby="email-error"` link đến `<p id="email-error">`. `aria-invalid="true"` khi error.
- `autocomplete="email"` giúp browser fill — tốt cho UX + a11y.
- Group radio/checkbox: `<fieldset><legend>Gender</legend>` → reader đọc legend cho mỗi option.

**Gotcha:** Placeholder **không thay thế** label. Reader bỏ qua placeholder, contrast fail AA.

**Follow-up:** React Hook Form + Zod → hiển thị error a11y thế nào? → `aria-invalid={!!errors.email}`, `aria-describedby`.

**Use-case:** **LoLamBenhAn** dùng React Hook Form + Zod + `aria-describedby` cho error realtime.

```tsx
<label htmlFor="email" className="block">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-err' : undefined}
/>
{errors.email && (
  <p id="email-err" role="alert" className="text-red-500">
    {errors.email.message}
  </p>
)}
```

---

## 6. Jest — test runner cơ bản? 🔥

**Ngắn:** Jest = test runner + assertion + mock + coverage all-in-one. Default cho React (trước Vitest).

| Tính năng | Jest API |
|---|---|
| Test case | `test()`, `it()` |
| Group | `describe()` |
| Assertion | `expect(x).toBe(y)` |
| Mock function | `jest.fn()`, `jest.spyOn()` |
| Mock module | `jest.mock('axios')` |
| Setup/teardown | `beforeEach`, `afterEach`, `beforeAll` |
| Async | `async/await`, `resolves`/`rejects` |
| Snapshot | `toMatchSnapshot()` |
| Coverage | `jest --coverage` |

**Đào sâu:**
- `jest.fn()` tạo mock function không có impl. `jest.fn(impl)` có impl. `.mockReturnValue()`, `.mockResolvedValue()`.
- `jest.mock('module', () => ({...}))` replace toàn bộ module. Hoisting — chạy trước import.
- `jest.spyOn(obj, 'method')` wrap method gốc, vẫn call được `.mockImplementation()`.
- Timer mock: `jest.useFakeTimers()` cho setTimeout/setInterval.
- Vitest: alternative hiện đại (ESM-first, nhanh hơn, Vite-native).

**Gotcha:** `jest.mock` factory **không** access outer scope variable (hoisting) → dùng `jest.mock(name, () => {...}, { virtual: true })` hoặc prefix `mock` cho variable name.

**Follow-up:** Test async error? → `await expect(fn()).rejects.toThrow()` hoặc `expect(fn()).rejects.toEqual(...)`.

**Use-case:** **Avatar48** test React Query hook với `jest.mock('@tanstack/react-query')`.

```ts
// Mock module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get.mockResolvedValue({ data: { id: 1 } });

// Test async
test('loads user', async () => {
  const user = await getUser(1);
  expect(user.id).toBe(1);
  expect(mockedAxios.get).toHaveBeenCalledWith('/users/1');
});
```

---

## 7. React Testing Library — query priority? 🔥

**Ngắn:** RTL test component **như user dùng** — query theo text, label, role thay vì implementation detail (className, test-id). Triết lý: "The more your tests resemble the way your software is used, the more confidence they give you."

| Query | Ưu tiên | Ví dụ |
|---|---|---|
| `getByRole` | 1 — cao nhất | `getByRole('button', { name: /submit/i })` |
| `getByLabelText` | 2 — form | `getByLabelText('Email')` |
| `getByPlaceholderText` | 3 | |
| `getByText` | 4 | `getByText('Hello')` |
| `getDisplayValue` | 5 — form filled | |
| `getByAltText` | 6 — image | |
| `getByTitle` | 7 | |
| `getByTestId` | Cuối cùng — escape hatch | `getByTestId('user-card')` |

**Đào sâu:**
- `getBy` throw nếu 0 hoặc nhiều match. `queryBy` return null nếu không có (cho `expect(...).not.toBeInTheDocument()`). `findBy` = async, trả Promise (cho element xuất hiện sau khi load).
- `*AllBy*` variant cho nhiều match (`getAllByRole('listitem')`).
- `userEvent` (v2) > `fireEvent` — simulate user thật (hover, type, tab). Luôn ưu tiên.
- `waitFor`, `findBy` cho async. Né `act()` warning bằng cách await `findBy`.
- `within()` scope query trong element.

**Gotcha:** Dùng `container.querySelector('.btn')` = implementation detail test. Nếu đổi className → test fail dù UI OK.

**Follow-up:** Test component mở modal sau click? → `await screen.findByRole('dialog')` (findBy vì modal render async sau state update).

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submit form', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.type(screen.getByLabelText(/email/i), 'a@b.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByText(/success/i)).toBeInTheDocument();
});
```

---

## 8. Mock API & module — chiến lược?

**Ngắn:** Test không gọi API thật (slow, flaky, network). Mock 3 cấp: (1) function, (2) module, (3) network (MSW).

| Mock cách | Tool | Khi nào |
|---|---|---|
| Mock function | `jest.fn()` | Callback, dependency injection |
| Mock module | `jest.mock('axios')` | Replace toàn bộ module |
| MSW (Mock Service Worker) | `msw` | Intercept fetch/axios ở network layer |
| Mock hook | `jest.mock('@/hooks/useUser')` | Skip React Query setup |

**Đào sâu:**
- **MSW**: intercept request ở Service Worker layer — test gần production nhất, dùng được cho both unit + E2E.
- React Query test: wrap `QueryClientProvider` với `QueryClient` mới mỗi test, set `retry: false`.
- Axios mock adapter (`axios-mock-adapter`): legacy, MSW dần thay thế.
- Mock global: `setupFiles` trong Jest config cho polyfill, localStorage.
- Don't mock what you don't own — wrap third-party trong adapter rồi mock adapter.

**Gotcha:** Mock mà không restore (`jest.restoreAllMocks()`) → leak sang test khác. Luôn `afterEach(() => jest.resetAllMocks())`.

**Follow-up:** Test TanStack Query error state? → Mock `queryFn` reject, `await screen.findByText(/error/i)`.

**Use-case:** **GenCodify** test Yjs collab bằng mock CRDT provider; **EVN GENCO3** mock TanStack Query cho service layer.

```ts
// MSW handler
import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/api/users', () => HttpResponse.json([{ id: 1 }])),
];

// Jest setup
import { setupServer } from 'msw/node';
const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 9. Playwright/Cypress E2E — khác nhau, khi nào?

**Ngắn:** E2E test mô phỏng user thật qua browser. **Cypress** = popular, dev-friendly, Chrome only (trước bản mới). **Playwright** = Microsoft, multi-browser, fast.

| | Cypress | Playwright |
|---|---|---|
| Browser | Chromium (Firefox/WebKit mới) | Chromium/Firefox/WebKit |
| Language | JS/TS | JS/TS/Python/.NET/Java |
| Parallel | Cần dashboard ($$) | Built-in |
| Speed | Chậm hơn | Nhanh hơn |
| Multi-tab | Khó | ✅ Native |
| Debug | UI mode tuyệt vời | Trace viewer |
| Popularity 2024 | Cao | Vượt Cypress (trend) |

**Đào sâu:**
- Playwright auto-wait: `await page.click('#btn')` chờ visible + enabled + stable. Cypress cũng auto-wait.
- Selector strategy: `getByRole`, `getByText`, `getByTestId` (avoid CSS selector brittle).
- Visual regression: Percy, Playwright snapshot. Catch UI drift.
- CI: Playwright chạy headless, sharding cho parallel.
- Test pyramid: E2E ít nhất (chậm, flaky), unit nhiều nhất (nhanh).

**Gotcha:** E2E flaky vì network/animation. Fix: stable test data, disable animation (`prefers-reduced-motion`), wait specific selector không phải `sleep`.

**Follow-up:** Khi nào dùng E2E? → Critical path: login, checkout, signup. Không test edge case bằng E2E.

**Use-case:** **Avatar48** Playwright cho flow connect wallet → swap; **LoLamBenhAn** Playwright cho flow tạo bệnh án multi-step.

```ts
// Playwright
test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByText(/welcome/i)).toBeVisible();
});
```

---

## 10. TDD red-green-refactor — workflow?

**Ngắn:** TDD = viết test FAIL trước (red) → code tối thiểu pass (green) → refactor sạch (refactor). Vòng lặp ngắn 30s-5ph.

| Phase | Hành động |
|---|---|
| 🔴 Red | Viết test mô tả behavior mong muốn → fail (chưa có code) |
| 🟢 Green | Viết code tối thiểu để test pass (ugly OK) |
| 🔵 Refactor | Dọn code (extract function, rename) — test vẫn pass |

**Đào sâu:**
- Lợi ích: design API từ góc nhìn caller, regression safety net, documentation sống.
- NOT golden hammer — TDD tốt cho logic rõ ràng, KHÔNG tốt cho: exploratory UI, spike/research,third-party integration.
- Outside-in (London school): test outer behavior trước, mock dependency. Inside-out (Chicago): test unit nhỏ trước.
- Coverage ≠ quality. 100% coverage vẫn có bug (test sai, missing case).

**Gotcha:** TDD không phải "viết hết test rồi code". Mỗi vòng 1 test + 1 implementation nhỏ.

**Follow-up:** Khi nào bỏ TDD? → Prototype, R&D, lần đầu làm feature chưa rõ spec. Viết E2E sau khi stable.

**Use-case:** **AI Communication** backend TDD cho service layer (Bun + Elysia); **GenCodify** TDD cho CRDT sync logic.

---

## 11. Test cái gì vs không test?

**Ngắn:** Test **behavior & business logic**, không test implementation detail.

| ✅ Nên test | ❌ Không nên test |
|---|---|
| Business logic (calculate, transform) | Library internal (React render) |
| Component behavior (click → action) | CSS/style (trừ visual regression) |
| Edge case (empty, error, boundary) | Third-party code đã test sẵn |
| User flow (login, checkout) | Implementation detail (private function) |
| Public API contract | Code coverage số (target vô nghĩa) |

**Đào sâu:**
- Test pyramid: 70% unit, 20% integration, 10% E2E. Hoặc trophy (Kent C. Dodds): nhiều integration hơn.
- **Test behavior không test implementation**: nếu refactor code (không đổi behavior) mà test fail → test sai.
- Coverage 80% là đủ cho hầu hết project. 100% tốn effort, đôi khi counter-productive.
- Snapshot test: test output ổn định — tốt cho UI, tệ cho logic.
- Smoke test: app load + render route chính không crash — baseline.

**Gotcha:** Test "những gì khó tái hiện trong QA" — race condition, edge case. Không test "hello world render".

**Follow-up:** Làm sao biết test tốt? → Xóa code, test có fail? Nếu không → test vô dụng. Mutate code xem test có catch.

---

## 12. Snapshot testing pitfalls & code coverage meaning

**Ngắn:** **Snapshot test** freeze output, so sánh diff. **Coverage** = % code chạy qua khi test — metric tham khảo, không phải chất lượng.

**Snapshot pitfalls:**
- ❌ Snapshot lớn → dev blind update (`-u`) mà không review → mất giá trị.
- ❌ Snapshot test component phức tạp → brittle, false positive.
- ✅ Snapshot tốt cho: stable output (theme config, serialized structure), nhỏ.
- ✅ Review snapshot diff trong PR — đó là lúc hữu ích.

**Coverage:**
- Line/branch/function/statement coverage — branch coverage quan trọng nhất (cả if và else).
- 100% coverage ≠ no bug. Coverage đo "chạy qua", không đo "test đúng".
- Code chưa test = blind spot. Test như đèn pha — chiếu nơi sai giúp thấy bug.

**Đào sâu:**
- Mutation testing (Stryker): inject bug vào code → xem test có catch không. Metric chất lượng thật.
- `istanbul ignore` cho code không cần test (generated, config).
- CI fail coverage drop (e.g. `< 80%`) — gate quality.

**Gotcha:** Snapshot bị "scare" update — mọi người luôn `--updateSnapshot` mà không check → test vô dụng.

**Follow-up:** Coverage cao mà bug vẫn xuất hiện? → Coverage metric miss. Check test quality: mutation testing, edge case review.

```tsx
// Snapshot hữu ích — stable output
expect(themeTokens).toMatchSnapshot();

// Snapshot hại — brittle component
expect(render(<ComplexDashboard />).asFragment()).toMatchSnapshot();
// → mỗi refactor đều update, mất giá trị
```

---

🔗 [Quay lại README frontend](./index.md)

# 🎨 05 — Styling & CSS (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp. Gắn use-case: **TypingAstro** (React Native + NativeWind), **AI Communication** (Tailwind extension), **EVN GENCO3** (Ant Design Pro), **Avatar48** (Next.js + shadcn/ui), **GenCodify** (CraftJS builder).

---

## 1. CSS Box Model là gì? 🔥

**Ngắn:** Mọi element là hộp chữ nhật gồm 4 lớp (từ trong ra): `content` → `padding` → `border` → `margin`. Kích thước thực tế phụ thuộc `box-sizing`.

| `box-sizing` | Width tính | Khi nào dùng |
|---|---|---|
| `content-box` (default) | Chỉ content (thêm padding/border sẽ phình to) | Legacy, hiếm dùng |
| `border-box` | Content + padding + border | **Luôn dùng** — dễ tính layout |

**Đào sâu:**
- `margin` không có background, có **margin collapse** (dọc) — 2 margin kề nhau lấy số lớn hơn, không cộng.
- `padding` ăn background, không collapse.
- Reset chuẩn: `*, *::before, *::after { box-sizing: border-box; }` (có sẵn trong Tailwind Preflight).
- `outline` khác `border`: không chiếm không gian, không thay đổi layout — lý do cho focus ring.

**Gotcha:** `width: 100%` + `padding` → tràn container nếu dùng `content-box`. Fix `border-box`.

**Follow-up:** Margin collapse khi nào KHÔNG xảy ra? → Khi có `flex`/`grid` container, `overflow: hidden`, `position: absolute`, hoặc padding/border chen giữa.

```css
/* Reset chuẩn */
html { box-sizing: border-box; }
*, *::before, *::after { box-sizing: inherit; }
```

---

## 2. Flexbox vs CSS Grid — khi nào dùng cái nào? 🔥

**Ngắn:** Cả hai đều layout module. **Flexbox** = 1 chiều (row HOẶC column), content-first. **Grid** = 2 chiều (rows AND columns), layout-first.

| Tiêu chí | Flexbox | Grid |
|---|---|---|
| Chiều | 1D | 2D |
| Tư duy | Content-first (size theo content) | Layout-first (size theo grid tracks) |
| Phù hợp | Nav bar, button groups, align items | Dashboard, card grid, page layout |
| Wrap | `flex-wrap` khó kiểm soát | `grid-template-*` chính xác |
| Browser | Rất tốt | Tốt (IE11 partial) |

**Đào sâu:**
- Flexbox: `justify-content` (main axis), `align-items` (cross axis), `flex: 1 1 0` (grow shrink basis).
- `flex: 1` ≠ `flex-grow: 1`. `flex: 1` = `1 1 0%` (basis 0 → chia đều).
- Grid: `fr` unit (fraction), `minmax()`, `auto-fit` vs `auto-fill` (khác nhau khi ít items).
- `gap` hoạt động ở cả hai (thay thế `margin` thủ công).

**Gotcha:** `min-width: auto` mặc định khiến flex item không shrink dưới content size → text tràn. Fix: `min-width: 0` hoặc `overflow: hidden`.

**Follow-up:** Làm responsive card grid không media query? → `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`.

**Use-case:** **EVN GENCO3** dashboard dùng Grid cho layout tổng (sidebar + content + header), Flexbox cho navbar và button row.

---

## 3. CSS Specificity — tính thế nào khi conflict? 🔥

**Ngắn:** Specificity là điểm số quyết định rule nào thắng khi nhiều selector trùng target. Thang (id > class > element).

| Loại | Ví dụ | Điểm (a,b,c) |
|---|---|---|
| Inline style | `style="..."` | (1,0,0,0) — cao nhất |
| ID | `#header` | (0,1,0,0) |
| Class/attr/pseudo-class | `.nav`, `[type]`, `:hover` | (0,0,1,0) |
| Element/pseudo-element | `div`, `::before` | (0,0,0,1) |
| Universal `*`, combinators | | (0,0,0,0) |

**Đào sâu:**
- Tính từ trái sang phải, so sánh từng cột. `#a.b.c` (1,3,0) thắng `.a.b.c.d.e` (0,5,0).
- `!important` phá vỡ specificity — né trừ khi override library.
- Inline style thắng mọi selector thường → React `style={{}}` mạnh hơn CSS file.
- Specificity **không kế thừa** — mỗi element tính riêng.

**Gotcha:** Order trong file chỉ quyết định khi **specificity bằng nhau**. Higher specificity luôn thắng dù viết trước.

**Follow-up:** Override style từ third-party (Ant Design)? → Tăng specificity (lồng selector) hoặc dùng `:where()` để giảm specificity của chính mình.

```css
/* (0,2,0) — thắng .ant-btn (0,1,0) */
.ant-card .ant-btn { color: red; }

/* :where() = 0 specificity, không tăng điểm */
:where(.card, #main) .btn { } /* vẫn (0,1,0) */
```

---

## 4. position: static / relative / absolute / fixed / sticky khác nhau thế nào?

**Ngắn:** `position` quyết định element đặt ở đâu trong document flow.

| Value | Flow | Offset relative to | Scroll theo |
|---|---|---|---|
| `static` (default) | In flow | — | Yes |
| `relative` | In flow (giữ chỗ) | Chính nó (vị trí gốc) | Yes |
| `absolute` | Out of flow | Nearest positioned ancestor | Yes |
| `fixed` | Out of flow | Viewport (hoặc ancestor có transform) | No |
| `sticky` | In flow đến threshold | Nearest scroll container | Hybrid |

**Đào sâu:**
- `absolute` cần ancestor có `position` khác `static`. Không có → default đến `<html>`.
- `sticky` cần `top`/`bottom` threshold để kích hoạt, và parent **không** có `overflow: hidden`.
- `fixed` + ancestor có `transform`/`filter`/`will-change` → fixed relative đến ancestor đó (gotcha phổ biến).
- `z-index` chỉ hoạt động khi `position` khác `static` (hoặc có `isolation`).

**Gotcha:** Sticky không hoạt động? Kiểm tra ancestor có `overflow: hidden/auto` → sticky chết.

**Follow-up:** Làm dropdown menu đóng khi click ngoài? → `position: absolute` + click outside detector (hoặc `useRef` check).

**Use-case:** **EVN GENCO3** multi-tab keep-alive dùng `position` cho tab bar; **Avatar48** dùng `sticky` header cho TradingView chart.

---

## 5. Responsive: Media Query vs Container Query — chọn cái nào? 🔥

**Ngắn:** **Media query** = dựa trên **viewport size**. **Container query** = dựa trên **container cha size** — component tự responsive độc lập.

| Tiêu chí | Media Query | Container Query |
|---|---|---|
| Dựa vào | Viewport (`@media (min-width: 768px)`) | Container (`@container (min-width: 400px)`) |
| Component reusable? | Không (phụ thuộc viewport) | **Có** (độc lập) |
| Support | Universal | Modern browsers (2023+) |
| Use case | Page layout breakpoints | Card/sidebar component |

**Đào sâu:**
- Container query cần `container-type: inline-size` ở ancestor.
- Design system component (như Ant Design) càng nên dùng container query — component không biết nó nằm đâu.
- Mobile-first: viết CSS nhỏ trước, `min-width` tăng dần.
- Breakpoints phổ biến: `sm 640`, `md 768`, `lg 1024`, `xl 1280` (Tailwind default).

**Gotcha:** Media query không giúp khi component nằm ở sidebar hẹp của desktop wide → container query giải quyết.

**Follow-up:** Tailwind responsive prefix (`md:`) là media query. Container query trong Tailwind: `@container` + `@md:` (Tailwind v3.4+).

```css
.card-wrapper { container-type: inline-size; }
@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 1fr 2fr; }
}
```

---

## 6. Tailwind utility-first — pros/cons, variants, @apply?

**Ngắn:** Tailwind = CSS framework utility-first. Viết style trực tiếp trong markup (`className="flex gap-4 p-4"`), không cần đổi context sang CSS file.

| Pros | Cons |
|---|---|
| Không nghĩ tên class | HTML xú dài (`flex items-center gap-2 px-4...`) |
| Bundle nhỏ (PurgeCSS) | Learning curve prefix |
| Consistent design tokens | Khó custom ngoài design system |
| Dark mode / responsive dễ | Review diff khó đọc |

**Đào sâu:**
- **Variants:** `hover:`, `focus:`, `md:`, `dark:`, `group-hover:`, `peer-checked:` — compose được.
- `@apply` trong CSS file để reuse utility (cho component library). Lạm dụng → mất tinh thần utility-first.
- `config.theme.extend` mở rộng tokens (color, spacing) thay vì override.
- Tailwind v4 dùng CSS-first config (`@theme` directive), engine nhanh hơn (Oxide).
- **NativeWind** (React Native): dịch Tailwind classes → RN StyleSheet. Cú pháp y Tailwind nhưng chạy native.

**Gotcha:** `peer` vs `group`: `group` = ancestor ảnh hưởng descendant, `peer` = sibling ảnh hưởng sibling (cùng parent).

**Follow-up:** Khi nào KHÔNG dùng Tailwind? → Project lớn có team design riêng, cần CSS architecture tách biet.

**Use-case:** **AI Communication** (Tailwind extension), **TypingAstro** (NativeWind RN), **Avatar48** (Tailwind + shadcn/ui).

```tsx
// NativeWind — chạy native
<View className="flex-1 items-center bg-blue-500 dark:bg-blue-900" />

// peer variant
<input id="x" type="checkbox" />
<label htmlFor="x" className="peer-checked:text-green-500">Done</label>
```

---

## 7. CSS-in-JS vs CSS Modules vs Tailwind — so sánh? 🔥

**Ngắn:** 3 hướng tổ chức CSS trong JS app.

| Tiêu chí | CSS-in-JS (styled-components, Emotion) | CSS Modules | Tailwind |
|---|---|---|---|
| Scope | Auto-unique class | Auto-unique class (`*.module.css`) | Utility (global) |
| Runtime cost | Có (trừ zero-runtime như Linaria) | Không | Không |
| Dynamic style | Dễ (`${props => ...}`) | Cần inline | Cần conditional class |
| Theming | Built-in (ThemeProvider) | CSS variables | Config + dark: |
| Bundle size | Lớn hơn (runtime) | Nhỏ | Nhỏ nhất (purge) |
| SSR | Cần setup (Next.js App Router phức tạp) | Tốt | Tốt |

**Đào sâu:**
- CSS-in-JS thất thế ở React Server Components (RSC) — runtime không chạy server. → styled-components mất ưu thế ở Next.js 13+.
- CSS Modules: scope local mặc định, `:global()` để thoát.
- Tailwind + `cva` (class-variance-authority) → variant pattern giống styled-components nhưng zero-runtime.
- shadcn/ui dùng Tailwind + CSS variables + CVA — pattern hiện đại 2024-2025.

**Gotcha:** styled-components trong Next.js App Router cần `'use client'` — mất lợi thế SSR.

**Follow-up:** Làm theming dark/light? → CSS variables + `data-theme` attribute (đổi 1 attribute, không re-render React).

**Use-case:** **Avatar48** (Tailwind + shadcn/ui), **EVN GENCO3** (CSS Modules + Ant Design less), **GenCodify** (CraftJS dynamic style).

```css
/* CSS Module tự scope */
.button { background: blue; }  /* → .Button_button__a1b2c */
:global(.reset) { }  /* thoát scope */
```

---

## 8. Theming với CSS Variables — ưu điểm?

**Ngắn:** `--var: value` custom property. Cho phép định nghĩa token 1 chỗ, tham chiếu ở nhiều nơi, override runtime (không cần rebuild).

**Đào sâu:**
- CSS variables **live** trong DOM — JS có thể đọc/sửa (`getComputedStyle`, `element.style.setProperty`).
- Cascade & inherit theo DOM tree → theming theo component subtree.
- Dark mode: define ở `:root` + override ở `[data-theme="dark"]`.
- shadcn/ui dùng HSL variables: `--primary: 222 47% 11%` → dễ thao tác opacity.
- Không chạy trong media query preprocessor — value tính runtime.

**Gotcha:** CSS variables **không** có ở `@keyframes` một số browser cũ, và fallback syntax cồng kềnh (`var(--x, fallback)`).

**Follow-up:** Multi-tenant theming (mỗi tenant 1 brand color)? → Set CSS variable runtime theo tenant config, không cần rebuild.

```css
:root {
  --primary: 222 47% 11%;
  --radius: 0.5rem;
}
[data-theme="dark"] {
  --primary: 210 40% 98%;
}
.btn { background: hsl(var(--primary) / 0.9); }
```

```ts
// JS đổi theme runtime
document.documentElement.style.setProperty('--primary', '210 40% 98%');
```

---

## 9. z-index & stacking context — tại sao z-index: 9999 không nằm trên top?

**Ngắn:** `z-index` chỉ hoạt động **trong cùng stacking context**. Element cha tạo context mới → con không vượt qua anh em của cha.

**Đào sâu:**
- Tạo stacking context mới khi: `position` khác `static` + `z-index` khác `auto`, OR `opacity < 1`, OR `transform`, OR `filter`, OR `will-change`, OR `isolation: isolate`.
- Trong cùng context: z-index lớn hơn nằm trên; bằng nhau → order DOM thắng.
- Modal/dropdown nên render qua **Portal** (đẩy ra root DOM) để thoát stacking context cha.
- `isolation: isolate` tạo context mà không cần hack z-index.

**Gotcha:** `transform: translateX(0)` ở ancestor vô tình tạo stacking context → con z-index cao vẫn nằm dưới modal ở root.

**Follow-up:** Làm dropdown trong card có `transform` không bị che? → Portal ra body, hoặc `isolation: isolate` ở root.

**Use-case:** **EVN GENCO3** dùng Portal cho Ant Design Drawer/Modal; **Avatar48** modal TradingView cần Portal thoát chart container.

---

## 10. CSS Reset vs Normalize — khác gì?

**Ngắn:** Cả 2 uniform cross-browser. **Reset** = xóa hết default style (aggressive). **Normalize** = giữ style hợp lý, fix inconsistency.

| | Reset | Normalize |
|---|---|---|
| Triết lý | Xóa sạch (margin=0, list-style=none...) | Chuẩn hóa về consistent |
| Verbose | Ít (~10 dòng) | Nhiều hơn (~300 dòng) |
| Khi nào | Cần full control | Muốn sensible default |

**Đào sâu:**
- Modern: dùng **Preflight** của Tailwind (dựa trên modern-normalize) — có sẵn khi cài Tailwind.
- `*` selector reset có hit performance nhẹ nhưng negligible ở app hiện đại.
- Normalize fix cross-browser: `button` background, `svg` overflow, `progress` display...

**Gotcha:** Reset làm `button` mất style → phải restyle lại. Quên → button tr như text.

**Follow-up:** Tailwind Preflight làm gì? → Reset margin, box-sizing, list style, image display, form element inherit font.

---

## 11. Dark mode implementation — các cách?

**Ngắn:** 3 cách chính: (1) `[data-theme]` attribute + CSS variables, (2) `prefers-color-scheme` media query, (3) Tailwind `dark:` variant.

| Cách | Toggle user | Auto theo OS | FOUC? |
|---|---|---|---|
| `data-theme` attribute | ✅ Manual | ❌ (cần JS detect) | Có nếu SSR |
| `prefers-color-scheme` | ❌ (chỉ theo OS) | ✅ | Không |
| Tailwind `dark:` (class) | ✅ | Tùy config | Có nếu SSR |

**Đào sâu:**
- Tailwind `darkMode: 'class'` → toggle `<html class="dark">`. Hybrid `'class' | 'media'` khó — chọn 1.
- **FOUC (Flash of Unstyled Content):** theme flicker khi load. Fix: inline script ở `<head>` set class trước React hydrate.
- next-themes: giải quyết FOUC + SSR + persist localStorage.
- Lưu ý contrast WCAG AA (4.5:1) khi design dark — không chỉ invert màu.

**Gotcha:** `prefers-color-scheme` không cho user override → dùng class strategy để user chọn.

**Follow-up:** Làm dark mode tôn trọng OS NHƯNG cho user override? → Detect OS default, sau khi user toggle → save preference, ưu tiên user.

```tsx
// Tailwind config
darkMode: 'class'  // hoặc 'media'

// Sử dụng
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

```html
<!-- FOUC fix ở <head> -->
<script>
  const t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.classList.add('dark');
</script>
```

---

🔗 [Quay lại README frontend](./index.md)

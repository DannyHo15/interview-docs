# 🐛 7 — Debugging & Testing (DevTools, Sentry, Jest, Detox, Profiling)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp. Gắn với TypingAstro (Sentry crash monitoring, source maps, Jest).

---

## 1. RN DevTools — DevMenu, Metro 'j', Flipper còn dùng không? 🔥

**Ngắn:** **DevMenu** (shake device → "Debug", "Reload", "Toggle Inspector"). **Metro** = bundler + DevServer, nhấn `j` mở web debugger (Chrome DevTools-like, từ RN 0.76+). **Flipper** = tool Facebook cũ, **đã deprecated** từ RN 0.74 — thay bằng RN DevTools.

| Tool | Status | Dùng cho |
|---|---|---|
| Metro `j` (RN DevTools) | Active, chính thức | Console, Network, Element inspector, Perf monitor |
| React DevTools | Active | Component tree, props/state |
| Flipper | Deprecated RN 0.74+ | Thay bằng RN DevTools plugin |
| Chrome Remote Debug (legacy) | Legacy, slow | Hermes.disable() → Chrome |

**Đào sâu:**
- RN 0.79 + Hermes mặc định → debugger dùng Hermes engine, nhanh hơn Chrome remote debug.
- Metro `j` mở tab web: Elements (Inspector), Network (fetch/XHR), Console, Source (breakpoint), Profiler.
- DevMenu shortcut: iOS simulator `Cmd+D`, Android emulator `Cmd+M` (Mac) / `Ctrl+M` (Win).
- "Toggle Inspector" = pick element xem style, giống React DevTools nhưng inline device.

**Gotcha:** Chrome Remote Debug (legacy) trên Hermes tắt → debugger slow/janky vì serialize bridge. Nên xài RN DevTools mới.

**Gotcha:** Production build KHÔNG có DevMenu (dev = false tự remove) → không debug được trực tiếp, phải Sentry/log.

**Follow-up:** Làm sao inspect network request của TypingAstro? → Metro `j` → Network tab; hoặc chặn qua axios interceptor log ra console.

---

## 2. React DevTools & Profiler — dùng để tối ưu gì? 🔥

**Ngắn:** React DevTools (`npx react-devtools`) → component tree, props/state, hooks. **Profiler** tab → record interaction → xem component render bao lâu, gây re-render bởi commit nào.

| Tính năng | Lợi ích |
|---|---|
| Component tree | Navigate structure, check props |
| State inspector | Edit state live |
| Profiler "Record" | Flamegraph render time |
| "Why did this render?" | Causality — props/state/context đổi |

**Đào sâu:**
- Profiler flamegraph: mỗi commit, bar dài = render chậm. Hover xem component nào render + thời gian.
- "Why did this render?" (RN 0.76+ Profiler) → biết chính xác prop nào đổi gây re-render.
- Combine với `React.memo`, `useMemo`, `useCallback` để skip render.

**Gotcha:** DevTools Profiler **chậm hơn production** (~10x) vì instrumentation. Đừng optimize dựa trên số ms tuyệt đối, chỉ nhìn relative.

**Gotcha:** `React.Profiler` API require `onRender` callback — chỉ dùng dev, bỏ production để tránh overhead.

**Follow-up:** TypingAstro có screen Qimen chart phức tạp (nhiều component) — làm sao biết render chậm? → Profiler record → scroll → xem component nào render lại không cần thiết → wrap `memo` hoặc tách context.

```tsx
// Wrap component để log render
<React.Profiler id="ChartScreen" onRender={(id, phase, actualDuration) => {
  console.log(`${id} ${phase}: ${actualDuration}ms`);
}}>
  <ChartScreen />
</React.Profiler>
```

---

## 3. Sentry crash monitoring + source maps — setup thế nào? 🔥

**Ngắn:** Sentry = error tracking service, tự động capture unhandled exception native + JS. **Source maps** map minified stack trace (production) về code gốc để đọc được `at ChartScreen.tsx:42`.

| | Không source map | Có source map |
|---|---|---|
| Stack trace | `at a.b.c (main.jsbundle:1:23456)` | `at renderChart (ChartScreen.tsx:42)` |
| Debug | Close to impossible | Trivial |

**Đào sâu:**
- `@sentry/react-native` init trong `App.tsx` với `dsn`, `environment`, `release`.
- Upload source map mỗi release: `eas build` hook hoặc CI script `sentry-cli sourcemaps upload --release xyz`.
- Hermes sourcemap: bật `hermesEnabled: true` + giữ `.hbundle.map` upload Sentry.
- `beforeSend` hook: scrub PII (email, token) trước khi gửi.
- Performance monitoring: Sentry trace + `@sentry/react-native`'s `NavigationIntegration` cho React Navigation.

**Đào sâu thêm:**
- Release health: crash-free users %, session, adoption.
- Breadcrumbs: auto track navigation, fetch, console → context trước khi crash.
- Event grouping: fingerprint để group crash cùng root cause.

**Gotcha:** Quên upload source map cho 1 version → tất cả crash version đó unreadable. Sentry chặn toàn bộ raw source khỏi public.

**Gotcha:** Bật `SENTRY_AUTH_TOKEN` trong EAS secrets, không commit vào git.

**Gotcha:** OTA update (EAS Update) phải upload sourcemap cùng bundle mới → Sentry match được.

**Follow-up:** TypingAstro bắt buộc Sentry trên 3 env (dev/staging/prod) với DSN khác nhau? → Có thể cùng project + tag `environment`, hoặc tách project prod riêng để tránh noise.

```ts
// App.tsx
import * as Sentry from '@sentry/react-native';
Sentry.init({
  dsn: __DEV__ ? '' : 'https://...@sentry.io/...',
  environment: process.env.APP_ENV,
  release: `typingastro@${AppConstants.version}`,
  tracesSampleRate: 0.2, // 20% performance
  beforeSend(event) {
    if (event.request?.headers?.authorization) delete event.request.headers.authorization;
    return event;
  },
});
// Wrap root
export default Sentry.wrap(App);
```

---

## 4. Jest + React Native Testing Library — viết test thế nào? 🔥

**Ngắn:** **Jest** = test runner JS. **React Native Testing Library (RNTL)** = render component React Native, query theo role/text/a11y, simulate event. Philosophies: "test behavior, not implementation".

| Concept | Công cụ |
|---|---|
| Render | `render(<Comp />)` |
| Query | `getByText`, `getByRole`, `getByTestId` |
| Assert | `expect(...).toBe...` |
| User event | `fireEvent.press(btn)` |
| Async | `waitFor`, `findBy...` |

**Đào sâu:**
- Jest config: `preset: 'react-native'`, transform TS qua `ts-jest` hoặc babel-jest.
- Mock native module: `jest.setup.ts` mock `react-native-iap`, `expo-secure-store`, etc.
- Query preference: `getByRole('button', { name: /submit/i })` →_accessible → catch a11y bug luôn.
- `userEvent` (RNTL v12+) thay `fireEvent` — realistic hơn (blur, focus, typing sequence).
- Snapshot test: cho UI ổn định, cautious vì brittle.

**Đào sâu thêm:**
- `findBy...` = async + retry (vd đợi fetch resolve).
- `act()` warning: wrap state update trong `act()` hoặc dùng `waitFor`.
- Coverage: `--coverage` flag, target 60–80% cho modules core.

**Gotcha:** Test chạy với mock Metro config ≠ runtime thật → native module không mock = test fail "cannot find module".

**Gotcha:** Snapshot bloat — 1 thay đổi UI nhỏ → snapshot fail, dev blindly `--updateSnapshot` mà không review → test vô nghĩa.

**Follow-up:** TypingAstro test gì? → Service layer (use case Qimen compute) — pure logic, dễ test. Repository mock MMKV/SecureStore. UI test chỉ cho critical flow (purchase button, unlock biometric).

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UnlockScreen } from './UnlockScreen';

it('shows error when biometric fail', async () => {
  jest.spyOn(bio, 'authenticateAsync').mockResolvedValue({ success: false, error: 'lockout' });
  render(<UnlockScreen />);
  fireEvent.press(screen.getByRole('button', { name: /unlock/i }));
  expect(await screen.findByText(/try again/i)).toBeOnTheScreen();
});
```

---

## 5. Mock native module trong Jest — pattern chuẩn?

**Ngắn:** Khi test component dùng native module (`react-native-iap`, `expo-secure-store`), Jest không load native → phải mock. 2 cách: `jest.mock('lib', () => factory)` hoặc `__mocks__/` folder.

**Đào sâu:**
- Global mock trong `jest.setup.js`: `jest.mock('react-native-iap', () => ({ initConnection: jest.fn(), getSubscriptions: jest.fn(), ... }))`.
- Per-test override: `getSubscriptions.mockResolvedValueOnce([...])`.
- `jest.spyOn` cho function cụ thể nếu chỉ cần change 1 method.
- Mock `expo-modules-core` cần `NativeModules.Unimodules` hoặc jest-preset `jest-expo`.

**Gotcha:** Async native method phải return `Promise` (mock resolvedValue, not returnValue).

**Gotcha:** Mock singleton (vd `FirebaseAuth.getInstance()`) cần mock chainable: `jest.fn().mockReturnValue({ currentUser: ... })`.

**Follow-up:** Mock file lớn → tách `__mocks__/react-native-iap.js` rồi `jest.mock('react-native-iap')` auto-pickup.

```ts
// __mocks__/react-native-iap.ts
export const initConnection = jest.fn().mockResolvedValue(true);
export const getSubscriptions = jest.fn().mockResolvedValue([
  { productId: 'com.typingastro.pro_monthly', price: '$4.99' },
]);
export const requestSubscription = jest.fn();
export const endConnection = jest.fn();
// jest.config.js: moduleNameMapper không cần, jest.mock auto resolve __mocks__
```

---

## 6. Detox (E2E) — khi nào cần, setup thế nào?

**Ngắn:** **Detox** = E2E testing RN (grey-box, chạy trên simulator/emulator thật). Test full flow user: launch app → tap → assert. Chậm nhưng bắt bug integration mà unit test bỏ sót.

| | Unit (Jest) | Component (RNTL) | E2E (Detox) |
|---|---|---|---|
| Scope | 1 function | 1 component | Toàn app |
| Speed | ms | 10–100ms | 5–30s/test |
| Confidence | Low | Medium | High |

**Đào sâu:**
- Detox build 2 binary: `android.app` (release) và `android.test` (test runner).
- `device.launchApp()`, `element(by.id('login-btn')).tap()`, `expect(element(by.text('Welcome'))).toBeVisible()`.
- Mock backend qua mock server (MSW) hoặc staging API.
- Maestro (mobile.dev) — alternative mới, simpler YAML syntax.

**Đào sâu thêm:**
- Detox flakiness: mạng slow, animation → `waitFor(element).toBeVisible().withTimeout(5000)`.
- CI: chỉ chạy E2E trên PR lớn / nightly (chậm, tốn resource).

**Gotcha:** Detox yêu cầu release build (dev build có DevMenu = fail selector).

**Gotcha:** Animation disable `disableXMLReporting`, `--cleanup` cho CI.

**Follow-up:** TypingAstro E2E smoke test gì? → Login → unlock biometric → view today chart → tap purchase → cancel. Đủ cover main happy path.

```js
// e2e/launch.spec.js
describe('Launch', () => {
  beforeAll(async () => { await device.launchApp(); });
  it('shows home', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
    await element(by.id('chart-card')).tap();
    await waitFor(element(by.text('Today'))).toBeVisible().withTimeout(5000);
  });
});
```

---

## 7. Memory leak hunting — JS + native? 🔥

**Ngắn:** Memory leak = object không được GC vì có reference giữ. RN có 2 layer: **JS leak** (closure, listener, timer) và **native leak** (JNI ref, observer, retain cycle).

| Loại | Triệu chứng | Công cụ |
|---|---|---|
| JS leak | JS heap tăng dần | Chrome Memory snapshot, Hermes heap |
| Native leak | Native RSS tăng, không phải JS | Xcode Instruments (Allocations/Leaks), Android Memory Profiler |
| Listener leak | Crash/aneurysm sau nhiều navigate | React DevTools, manual audit |

**Đào sâu:**
- JS leak phổ biến:
  - `setInterval`/`setTimeout` không clear trong `useEffect` cleanup.
  - `addEventListener` không `removeEventListener`.
  - Subscription (Firebase, NetInfo, MMKV listener) không unsub.
  - Closure giữ state cũ → component unmount nhưng callback vẫn fire.
- Native leak:
  - `RCTEventEmitter` retain listener sau unmount.
  - Custom native module giữ `ReactContext` strong ref.
  - Circular ref ObjC (block retain self) → Instruments Leaks detect.

**Đào sâu thêm:**
- Chrome Memory snapshot: heap snapshot trước/sau action → compare "retained objects".
- Hermes CPU profiler: `Hermes.sampleCallStacksThrottled` → export `.cpuprofile` → DevTools Performance.
- Android Studio Memory Profiler: dump Java/Kotlin heap, find Activity leak (LeakCanary runtime alert).
- Xcode Instruments → "Allocations" / "Leaks" template → record, navigate app, xem mark generation.

**Gotcha:** `console.log` trong production giữ argument trong closure → leak nhẹ. Babel plugin `babel-plugin-transform-remove-console` strip trong prod.

**Gotcha:** `setInterval` giữ reference tới state cũ → setState on unmounted warning. Fix: cleanup trong `useEffect(() => () => clearInterval(id), [])`.

**Follow-up:** TypingAstro nghi leak khi? → User mở app nhiều lần → RAM tăng dần, đặc biệt sau khi xem nhiều chart (image cache). Audit Image cache (`expo-image` cache policy), chart library instance.

```tsx
// Leak pattern & fix
useEffect(() => {
  const unsub = messaging().onMessage(handler);  // leak nếu không cleanup
  const timer = setInterval(tick, 1000);
  return () => { unsub(); clearInterval(timer); }; // ✅ cleanup
}, []);
```

---

## 8. Profiling — Hermes CPU profiler, Xcode Instruments, Android Profiler?

**Ngắn:** 3 công cụ profiling chính cho RN:
- **Hermes CPU profiler**: JS-side CPU, function call time.
- **Xcode Instruments** (iOS): native CPU, alloc, leak, time profiler.
- **Android Studio CPU Profiler**: Java/Kotlin + native call sample.

| Tool | Layer | Use case |
|---|---|---|
| Hermes profiler | JS | Slow JS, render chậm |
| Instruments Time Profiler | iOS native | Native module chậm |
| Android CPU Profiler | Android native | JNI, view measure chậm |
| Systrace/Perfetto | System | Frame drop, jank |

**Đào sâu:**
- Hermes sampling: bật trong DevMenu "Enable Sampling Profiler" → `HermesSamplingProfiler.enabled` → dump `.cpuprofile` → mở Chrome DevTools Performance.
- Xcode Instruments → "Time Profiler" template → record flow → xem call tree, focus on `CPU Time` hot path.
- Android Studio → Profiler → CPU → "Sample Java/Kotlin Methods" hoặc "Trace System Calls".
- Perfetto (`ui.perfetto.dev`): trace system-level, xem render thread, frame drop, IOC.

**Đào sâu thêm:**
- Jank = frame drop >16ms (60fps). Trace xem "JS thread" hay "UI thread" bottleneck.
- Hermes sample rate trade-off: high = accurate, slow; low = fast, miss short function.

**Gotcha:** Profile build ≠ production performance. Build release mode (`--profile production` hoặc `dev=false`) cho số liệu gần thực.

**Gotcha:** Profiling instrumentation có overhead → đừng optimize dựa trên số liệu tuyệt đối, chỉ compare relative.

**Follow-up:** TypingAstro chart render jank → check gì trước? → 1) JS thread heavy compute (Qimen algorithm) → move sang worker / memoize. 2) Re-render không cần thiết → Profiler "why did this render".

---

## 9. Nguyên nhân crash phổ biến trong RN?

**Ngắn:** Top crash RN:
1. **Native module null/undefined** — gọi method khi chưa init hoặc platform không support.
2. **Bridge serialization fail** — object quá sâu, circular, non-serializable.
3. **OOM (Out of Memory)** — image cache, list lớn không virtualize, leak.
4. **State update after unmount** — async callback setState component đã unmount.
5. **Permission/API mismatch** — gọi iOS-only API trên Android hoặc ngược lại.
6. **Native exception** — C++/ObjC/Java crash (segfault, NSException).

**Đào sâu:**
- List lớn không dùng `FlatList`/`FlashList` → render toàn bộ → jank + OOM.
- Image full-res không resize → memory spike → iOS kill app (jetsam).
- `Platform.OS === 'ios'` check thiếu → native call Android-only → crash.
- New Architecture (Fabric) migrate nửa vời → mismatch type → crash.

**Gotcha:** Crash chỉ reproduce trên device thật (simulator OK) thường là memory/perf issue — simulator không giới hạn RAM.

**Gotcha:** Release build Proguard/R8 strip class dùng reflection (`@JsonClass`, Gson model) → `ClassNotFoundException` runtime. Keep rule!

**Follow-up:** Sentry TypingAstro bắt crash grouping → top issue thường là gì? → Khi deploy, theo dõi crash-free users phải > 99.5%. Dưới → priority fix.

---

## 10. Debug production build — làm sao khi user crash?

**Ngắn:** Production build không có DevMenu/console. Debug dựa vào: **Sentry/crash reporter** (stack trace + breadcrumb), **remote feature flag**, **log file** (optional).

**Đào sâu:**
- Sentry attach `extra` context (user ID, env, route, last action), screenshot (optional), device info.
- "Reproduce" Sentry event: dùng stack trace + breadcrumb để tái hiện flow.
- Custom log: viết ra file (`expo-file-system`) + upload lên server khi user báo bug (opt-in privacy).
- Beta channel: ship fix qua EAS Update (JS only bug) trong vài giờ, không cần store review.

**Đào sâu thêm:**
- Sentry user feedback widget: catch subjective bug description kèm event.
- Source map upload đúng `release` tag → map chính xác version user chạy.

**Gotcha:** User trên old version (chưa update) vẫn crash → Sentry event đó fix rồi nhưng vẫn report → check `release` field filter.

**Gotcha:** OTA fix chỉ apply nếu native không đổi. Native crash → buộc store update → chậm (Apple review 1–2 ngày).

**Follow-up:** TypingAstro hot fix lỗi UI text — cách nhanh nhất? → `eas update --branch production` (JS only) → user nhận update trong 30s lần mở app tới.

```ts
// Custom breadcrumb khi suspicious flow
import * as Sentry from '@sentry/react-native';
Sentry.addBreadcrumb({ category: 'iap', message: 'requestSubscription start', level: 'info' });
// sau khi fail
Sentry.captureException(err, { tags: { flow: 'purchase' }, extra: { sku } });
```

---

## 11. Logging strategy trong RN?

**Ngắn:** 3 layer log: dev (`console.log`, strip prod), production error (Sentry captureException), production info (backend log qua API hoặc analytics event).

**Đào sâu:**
- Babel plugin strip `console.log` ở production (`transform-remove-console`), giữ `console.error/warn`.
- Sentry breadcrumb cho navigation/fetch auto-attach → không cần log tay.
- Log levels: `debug` (dev), `info` (analytics), `warn` (recoverable), `error` (Sentry).
- PII scrub: không log email/phone/token. Sentry `beforeSend` strip headers.

**Gotcha:** `console.log` object lớn trong loop → chậm dev, leak memory nhẹ prod (nếu không strip).

**Gotcha:** LogAnalytics event spam → Firebase quota / cost. Batch + sample khi cần.

**Follow-up:** TypingAstro log strategy? → Dev console.log (strip prod). Production: Sentry error + Firebase Analytics event (purchase, unlock, view_chart) cho product insight. Server-side log cho IAP verify trace.

---

## 12. Test pyramid & chiến lược test cho RN app?

**Ngắn:** Test pyramid cho RN:
- **Unit (nhiều)**: pure function, hook, service — Jest.
- **Component (vừa)**: 1 component, mock dep — RNTL.
- **Integration (ít)**: nhiều component + store + navigation — RNTL + mocked store.
- **E2E (rất ít)**: full flow user — Detox/Maestro.

| Layer | % Effort | Coverage target |
|---|---|---|
| Unit | 60–70% | 80%+ |
| Component | 20% | Critical UI |
| Integration | 5% | Core flow |
| E2E | 5% | Smoke + critical path |

**Đào sâu:**
- Test theo Clean Architecture (TypingAstro): entity + usecase = pure JS, dễ unit test 90%+. Repository = mock MMKV/SecureStore/Firebase. Presentation = RNTL test.
- Coverage ≠ quality. Test hành vi ("output đúng khi input X"), không test implementation ("gọi hàm Y 2 lần").
- Flaky test:ネットwork, timer → mock `jest.useFakeTimers`, `axios-mock-adapter`.

**Đào sâu thêm:**
- Snapshot cho stable UI (theme), không abuse.
- Visual regression (Storybook + Chromatic) cho design system.
- Mutation testing (Stryker) — measure test quality (kill mutant).

**Gotcha:** 100% coverage = 0% bug? KHÔNG. Edge case, integration bug vẫn có. Coverage metric chỉ để reject code có < 40%.

**Gotcha:** Test quá chặt (test từng dòng implement) → refactor cực khó, test break liên tục. Test contract/behavior.

**Follow-up:** TypingAstro với Clean Architecture — test layer nào trước? → 1) Usecase compute Qimen (pure, tối quan trọng) 90%+. 2) Repository interface với mock. 3) UI test critical screen (Unlock, IAP). E2E smoke chỉ login → chart.

```ts
// Usecase test (pure logic)
import { computeQimenChart } from './computeQimenChart';
describe('computeQimenChart', () => {
  it('returns correct palace for known datetime', () => {
    const result = computeQimenChart({ year: 2026, month: 7, day: 1, hour: 12 });
    expect(result.centralPalace).toBe('Kan');
    expect(result.palaces).toHaveLength(9);
  });
  it('throws on invalid hour', () => {
    expect(() => computeQimenChart({ ..., hour: 25 })).toThrow();
  });
});
```

---

🔗 [Quay lại README react-native](./index.md)

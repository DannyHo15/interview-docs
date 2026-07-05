# ⚡ 03 — Performance (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.
> 🎯 Gắn với **TypingAstro**: charts, long lists, Reanimated, Hermes prod build.

---

## 1. RN render phases (render → reconcile → commit)? 🔥

**Ngắn:** RN render 3 phase giống React DOM:
1. **Render** (JS thread) — chạy component function, tính VDOM.
2. **Reconcile** (JS thread) — diff old vs new VDOM, ra set thay đổi.
3. **Commit** (UI/native thread) — gửi thay đổi sang native, native render.

**Đào sâu:**
- **New Architecture (Fabric)** — commit chạy trên **C++ → UI thread**, có thể đồng bộ, layout chạy concurrent.
- **Old Architecture (Bridge)** — commit gửi qua bridge async, batch → có latency.
- **JS thread** tính VDOM + diff → nếu nặng (list 10k) → block → drop frame.
- **Reconcile** React Fiber → có thể pause/resume (time-slicing), nhưng RN chưa full concurrent.

**Gotcha:**
- Render phase pure (no side effect) → mới có thể pause. Side effect trong render → bug.
- `useMemo`/`useCallback`/`React.memo` skip phase 1+2 nếu props reference unchanged.
- **Follow-up:** *"Làm sao đo từng phase?"* → React DevTools Profiler (render phase), Perf Monitor (FPS JS vs UI thread).

---

## 2. JS thread vs UI thread — ai làm gì? 🔥

**Ngắn:**
- **JS thread** — chạy JS: React render, hooks, business logic, event handler, fetch.
- **UI thread** (main iOS / Android) — native render, animation (native), gesture, layout Yoga.

**Đào sâu:**
| Loại | Thread | Block → hậu quả |
|------|--------|------------------|
| React render | JS | Drop frame, lag |
| `setState` cascade | JS | Jank |
| Native layout (Yoga) | UI/C++ | Drop frame native |
| Animated legacy | JS | Animation giật |
| Reanimated worklet | **UI** | Mượt |
| HTTP / IO | Native bg | Không block |
| Crypto / parse lớn | JS | Block UI reaction |

- **Jank** = khi JS thread > 16ms (1 frame @60fps) → animation/gesture lag.
- **Reanimated** move animation sang UI thread → JS thread có thể blocked mà animation vẫn mượt.

**Gotcha:**
- **Dev mode** JS chậm 5-10x → luôn test perf ở **prod build** (Hermes).
- TypingAstro: chart compute → tách ra worker / precompute, không để trên JS thread khi scroll.
- **Follow-up:** *"FPS UI thread OK mà JS lag?"* → animation JS-driven giật, native animation OK; cần offload.

---

## 3. Cái gì block JS thread → jank?

**Ngắn:** Bất kỳ JS op nào > 16ms (60fps) trong frame budget → drop frame → jank.

**Đào sâu — thủ phạm phổ biến:**
- **JSON.parse/stringify** object lớn (API response 1MB+).
- **Deep clone** (`structuredClone`, lodash `cloneDeep`) object lớn.
- **Crypto** thuần JS (bcrypt, AES) → dùng native.
- **Render list lớn** không virtualize.
- **Reconcile nặng** — component tree sâu, không memo.
- **Sync loop** (filter/map/reduce trên 10k item mỗi render).
- **Console.log** object lớn (dev mode).

**Cách xử:**
- Offload sang native (JSI lib, Reanimated worklet).
- `InteractionManager.runAfterInteractions` — defer heavy sau animation.
- **Web Worker** không có trong RN → dùng library native hoặc `react-native-multithreading` (JSI thread).
- Pagination / lazy load → giảm data xử lý 1 lần.

**Gotcha:**
- `JSON.parse` 5MB response **đồng bộ** → block 100-500ms → dùng streaming parser hoặc native.
- TypingAstro parse **Qimen chart data** (JSON phức tạp) → cache parsed, không parse mỗi render.
- **Follow-up:** *"Đo JS thread load thế nào?"* → Perf Monitor (in-app FPS), Hermes profiler, Flipper Performance.

---

## 4. FlatList vs FlashList (virtualization, keyExtractor, getItemLayout)? 🔥

**Ngắn:**
- **FlatList** (RN built-in) — virtualize, recycle limited, có overhead.
- **FlashList** (Shopify) — drop-in replacement, **recycled cell** tốt hơn, perf 5-10x, ít config.

**Đào sâu — virtualization:**
- Chỉ render **visible + buffer** item → memory constant, không phải N.
- `keyExtractor` — key stable (không index) → React identify item khi reorder.
- `getItemLayout` — đo trước item height → skip measurement → jump-to-index nhanh.
- FlashList **recycle cell** (reuse component instance, swap data) → không unmount/remount.

| | FlatList | FlashList |
|---|----------|-----------|
| Recycle | Hạn chế | ✅ Strong |
| Config | Nhiều props | Ít (`estimatedItemSize`) |
| Perf | OK | ⚡ Better |
| Drop-in | — | ✅ Thay thế trực tiếp |
| `estimatedItemSize` | — | Bắt buộc (bảo perf) |

**Gotcha:**
- FlatList thiếu `estimatedItemSize` → phải đo từng item → scroll lag lần đầu.
- Item component **PHẢI** pure + callback memoize → không thì recycle re-render all.
- FlashList **item phải deterministic height** hoặc set `estimatedItemSize` gần đúng.
- TypingAstro dùng FlashList cho **chart cell list** (cell phức tạp, nhiều component) → scroll mượt.
- **Follow-up:** *"Khi nào dùng ScrollView thay FlatList?"* — \&lt;50 item, không cần virtualize, simpler.

---

## 5. Memoization trong RN (`memo`, `useMemo`, `useCallback`)?

**Ngắn:**
- **`React.memo(Component)`** — skip re-render nếu props shallow-equal.
- **`useMemo`** — cache value (object/array) giữa render.
- **`useCallback`** — cache function reference.

**Đào sâu:**
```tsx
const ChartCell = React.memo(({ chart, onPress }) => { ... });

const Parent = () => {
  const charts = useMemo(() => heavyFilter(rawData), [rawData]);
  const handlePress = useCallback((id) => nav.navigate('Detail', { id }), [nav]);
  return <FlashList data={charts} renderItem={({ item }) =>
    <ChartCell chart={item} onPress={handlePress} />} />;
};
```
- **Memo không free** — có cost compare → chỉ dùng khi:
  - Component render nặng.
  - List item (re-render nhiều lần).
  - Pass callback/object cho memoized child.

**Gotcha:**
- **Inline object/function** (`onPress={() => ...}`) → phá `React.memo` (props luôn khác) → wrap `useCallback`.
- `useMemo` deps sai → stale value → bug khó debug.
- Đo trước khi memoize (Profiler) → premature optimization tệ.
- **Follow-up:** *"Khi nào KHÔNG memo?"* → component cheap (Text), render không thường xuyên.

---

## 6. Reanimated — UI thread worklet, runOnUI? 🔥

**Ngắn:** **Reanimated** = animation/gesture lib chạy trên **UI thread** qua **worklet** (JS function được "compile" sang C++ chạy native) → không cần bridge, mượt 60fps.

**Đào sâu:**
```tsx
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnUI, runOnJS
} from 'react-native-reanimated';

const offset = useSharedValue(0);
const animStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],  // worklet, chạy UI thread
}));

// runOnUI — chạy hàm trên UI thread
runOnUI(() => { 'worklet'; offset.value = withSpring(100); })();

// runOnJS — gọi từ worklet về JS thread
runOnJS(callback)(result);
```
- **Worklet** đánh dấu `'worklet';` đầu hàm → Reanimated extract, serialize, chạy C++ UI thread.
- **SharedValue** — value chia sẻ JS ↔ UI thread, không cần bridge.
- **Gesture Handler** integration → gesture xử lý UI thread, animation liền mạch.

**Gotcha:**
- Worklet **không truy cập** JS scope closures (module, class instance) → phải `runOnJS` hoặc shared value.
- Console.log trong worklet không ra → dùng `runOnJS(console.log)`.
- Reanimated 3 dùng JSI + C++ → nhanh hơn Reanimated 1, không cần bridge.
- TypingAstro: chart pan/zoom gesture → Reanimated worklet, mượt khi scroll chart dài.
- **Follow-up:** *"Worklet vs JS animation khác gì?"* → JS animation qua bridge async, drop frame; worklet native sync.

---

## 7. Animated API vs Reanimated?

**Ngắn:**
- **Animated API** (RN built-in) — 2 mode: JS-driven (gây jank) và `useNativeDriver` (native, nhưng limited — chỉ transform/opacity).
- **Reanimated** — full UI thread, custom animation, gesture, không limited.

**Đào sâu:**
| | Animated (native driver) | Animated (JS) | Reanimated |
|---|---------------------------|---------------|------------|
| Thread | Native | JS | Native (worklet) |
| Props | Transform, opacity only | All | All |
| Perf | Mượt | Jank | Mượt |
| Gesture | Hạn chế | JS | Native (Gesture Handler) |
| Bundle | Built-in | Built-in | Lib ngoài |

- `useNativeDriver: true` — Animated serialize animation gửi sang native → chạy native, nhưng chỉ transform/opacity.

**Gotcha:**
- Animated `width/height` với `useNativeDriver: true` → **crash** (không support) → dùng Reanimated.
- Reanimated 3 bundle size +300KB → trade-off cho perf.
- **Follow-up:** *"Khi nào Animated đủ?"* → animation đơn giản (fade, slide), không gesture → Animated native driver OK.

---

## 8. InteractionManager dùng để làm gì?

**Ngắn:** `InteractionManager.runAfterInteractions(callback)` — defer heavy work **sau khi** animation/gesture hoàn tất → không jank.

**Đào sâu:**
```tsx
useEffect(() => {
  const handle = InteractionManager.runAfterInteractions(() => {
    setReady(true);  // render heavy sau khi nav transition xong
    parseChartData();  // heavy compute
  });
  return () => handle.cancel();
}, []);
```
- RN track "interaction" (animation, gesture) → callback chạy khi không còn interaction.
- Dùng cho: heavy init sau navigation, fetch + parse lớn.

**Gotcha:**
- InteractionManager chỉ defer, **không parallel** — vẫn JS thread, chỉ là timing.
- Reanimated worklet **mạnh hơn** — chạy native song song JS.
- **Follow-up:** *"Tại sao không setTimeout?"* → setTimeout không biết khi nào animation xong; InteractionManager sync với animation.

---

## 9. Offload heavy computation (JSI, native module)?

**Ngắn:** JS single-threaded → heavy compute block → offload sang:
- **JSI lib native** (MMKV, sqlite, crypto) — sync nhưng C++ nhanh.
- **Native module** (Java/ObjC) — async via bridge/JSI.
- **`react-native-multithreading`** — JSI spawn thread, chạy JS song song.

**Đào sâu:**
- Crypto (bcrypt, hashing) → `react-native-quick-crypto` (JSI, fast).
- DB → `react-native-quick-sqlite` (JSI, sync, fast).
- Image processing → `react-native-image-resizer`, `react-native-vision-camera`.
- Pure heavy compute (chart calc, matrix) → precompute + cache, hoặc native module.

**Gotcha:**
- Native module async → phải await, nhưng không block JS thread.
- TypingAstro: tính **Qimen chart** (nhiều phép tính calendar/8 char) → precompute + cache theo ngày, không tính lại mỗi render.
- **Follow-up:** *"Worker thread trong RN?"* → RN không có Web Worker native; dùng JSI multithreading lib hoặc offload native.

---

## 10. List scroll perf?

**Ngắn:** Scroll perf = giữ 60fps khi scroll list → cần: virtualization + memo item + getItemLayout + giảm work mỗi frame.

**Đào sâu — checklist:**
- ✅ **Virtualize** — FlatList/FlashList, không ScrollView.
- ✅ **`keyExtractor`** stable (không index).
- ✅ **`getItemLayout`** nếu height cố định → skip measurement.
- ✅ **`React.memo`** item + `useCallback` callbacks.
- ✅ **`removeClippedSubviews`** (Android) — unmount off-screen.
- ✅ **`windowSize`** tune (default 21 → giảm nếu item nặng).
- ✅ **Image** trong item — resize, FastImage cache.
- ✅ **Avoid inline function/object** trong renderItem.
- ✅ **Heavy item** → defer với `InteractionManager` nếu load async.

**Gotcha:**
- `<Image>` không specify `width/height` → native đo → jank; dùng FastImage hoặc prefetch.
- Image lớn (4000x3000) render thumbnail → resize cache (server hoặc `react-native-image-resizer`).
- **Follow-up:** *"Scroll giật lần đầu, sau OK?"* → thiếu `getItemLayout`/`estimatedItemSize` → phải đo → cache sau.

---

## 11. Image perf (resize, FastImage)?

**Ngắn:**
- Built-in `<Image>` — decode native, nhưng **no cache control**, async.
- **FastImage** (`react-native-fast-image`) — wrap **Glide (Android) / SDWebImage (iOS)**, cache, priority, prefetch.

**Đào sâu:**
- **Resize** — server trả thumbnail đúng size (VD 200x200 cho list, không 4000x3000).
- **Cache** — FastImage cache disk + memory → load lần 2 instant.
- **Prefetch** — `FastImage.preload([...])` → load trước khi scroll.
- **`fadeDuration`** — fast fade tránh flash.

**Gotcha:**
- `<Image>` cache trên iOS tệ → re-download mỗi lần → dùng FastImage cho list ảnh.
- Base64 image trong list → decode JS, chậm → dùng URL + FastImage.
- TypingAstro: **chart visualization** render vector (SVG / Skia) → không tải raster, crisp mọi DPI.
- **Follow-up:** *"Khi nào built-in Image đủ?"* — single image, không cần cache (avatar tĩnh).

---

## 12. Hermes perf; dev vs prod build?

**Ngắn:**
- **Hermes** prod — AOT bytecode, GC tối ưu, **đẹp hơn JSC 30-50%** startup/memory.
- **Dev build** — Metro bundler hot reload, JS không precompile, **chậm 5-10x** prod.

**Đào sâu:**
- Dev mode: React DevTools, warnings, slow path (`PropTypes` check, deep compare).
- Prod build: minify, tree-shake, Hermes precompile bytecode, no warning.
- **Measure**: `npx react-native-bundle-visualizer` check bundle size.

**Gotcha:**
- **Không đo perf ở dev** — luôn build prod (`eas build --profile production` hoặc `react-native run-android --variant=release`).
- Prod build không có devtools → debug khó → dùng **staging build** (prod-like + devtools).
- TypingAstro: EAS build 3 env (dev/staging/prod) → staging test perf trước prod release.
- **Follow-up:** *"Bundle size lớn giảm thế nào?"* — code-split dynamic import, lib thay nhẹ (moment → date-fns), tree-shake.

---

🔗 [Quay lại README react-native](./index.md)

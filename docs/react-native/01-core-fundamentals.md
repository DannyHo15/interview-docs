# 🧱 01 — Core Fundamentals (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. Kiến trúc RN cũ (Bridge) vs mới (Fabric + TurboModules)? 🔥

**Ngắn:**
- **Cũ (Bridge):** JS thread ↔ Native thread giao tiếp qua **asynchronous JSON bridge** — serialize/deserialize, batch, không đồng bộ.
- **Mới (New Architecture / Fabric + TurboModules):** JSI trực tiếp, **đồng bộ** gọi native, render thuần UI thread.

**Đào sâu — trade-off:**
| Tiêu chí | Bridge (cũ) | Fabric + TurboModules (mới) |
|----------|-------------|------------------------------|
| Communication | Async, JSON serialize | **JSI** đồng bộ, direct call |
| Latency | Cao (batch + serialize) | Thấp (C++ direct) |
| Render | Main thread (iOS) | UI thread riêng, layout concurrent |
| Layout | Yoga trên shadow thread | Yoga trên **C++**, cắt 1 thread |
| Type safety | Không | **Codegen** generate TS/Java/ObjC |
| Event | Async, có thể drop frame | Sync, prioritized |

- **Bridge** sinh ra vì JS (JS engine) và native (ObjC/Java) chạy **2 process khác nhau** → phải bridge.
- **Fabric** = renderer mới (replacing UIManager), **TurboModules** = native module mới (lazy load, sync).
- **Bật New Architecture** (RN 0.76+): `android/gradle.properties` + `iOS/RCTAppDelegate`, Expo 53+ hỗ trợ.

**Gotcha:**
- Bridge **không bị xóa hoàn toàn ngay** — migration dần. RN 0.74+ khuyến nghị new arch, 0.76 default-on.
- TypingAstro (RN 0.79) dùng new arch → cần check third-party lib đã support chưa (`react-native-iap`, `reanimated` đã support đầy đủ).
- **Follow-up:** *"Tại sao cũ lại async?"* → vì JS single-threaded + native main thread không được block → buộc async qua queue.
- **Follow-up:** *"JSI đồng bộ có block JS thread?"* → native call nhanh (C++ direct), không block; nếu native op nặng thì vẫn phải tự offload.

---

## 2. JSI là gì? Khác Bridge thế nào? 🔥

**Ngắn:** **JSI (JavaScript Interface)** = layer C++ cho phép JS engine (Hermes/JSC/V8) **gọi trực tiếp** C++/native object qua **reference**, không serialize, có thể **đồng bộ** hoặc async.

**Đào sâu:**
- JS engine **hold reference** tới C++ object (`jsi::Object`), gọi method như JS method thường.
- **Không còn JSON marshal** → faster, có thể truyền `ArrayBuffer`, function, callback native ↔ JS 2 chiều.
- Nền tảng cho **Reanimated 3, MMKV, react-native-sqlite-storage, react-native-vision-camera** (lib JSI-native).
- **Bridge** vẫn dùng cho back-compat (legacy module).

**Gotcha:**
- JSI lib **không chạy trên web** (RN Web không có C++ host) → nếu Expo Web thì check.
- **Debug** JSI khó hơn — Chrome devtools không thấy native call, dùng Hermes inspector / Flipper.
- **Follow-up:** *"Ví dụ lib JSI thực tế?"* → MMKV (sync read/write storage), Reanimated worklet chạy UI thread.
- TypingAstro dùng **MMKV** → được lợi trực tiếp từ JSI (sync, không async/await như AsyncStorage).

---

## 3. Hermes engine là gì? Tại sao dùng? 🔥

**Ngắn:** **Hermes** = JS engine tối ưu cho RN, phát triển bởi Meta, **AOT bytecode** thay vì JIT, **start nhanh, ít memory, TTI thấp**.

**Đào sâu — tại sao:**
| Tiêu chí | Hermes | JSC (cũ iOS) | V8 |
|----------|--------|---------------|-----|
| Startup (TTI) | ⚡ Nhanh (bytecode precompiled) | Chậm (parse source) | Trung bình |
| Memory | Thấp hơn ~30–50% | Cao | Cao |
| Bytecode | ✅ AOT precompile | ❌ Parse runtime | JIT |
| Debug | ✅ Hermes inspector, Flipper | Safari only | Chrome |
| iOS | RN 0.70+ default | Mặc định cũ | — |
| Android | RN 0.70+ default | — | Optional |

- **Bytecode** được precompile lúc build (`hermesc`) → app install là chạy luôn, không parse JS.
- **GC tối ưu** (Mark-sweep, generational) → ít jank hơn.
- **Debug:** `npx react-native doctor`, Flipper, Chrome devtools protocol.

**Gotcha:**
- Hermes **không có JIT** → CPU-bound code (crypto, loop nặng) đôi khi **chậm hơn** V8. Nhưng app RN đa số I/O + render → lợi lớn.
- **eval() hạn chế** trong Hermes (no `new Function` runtime eval).
- TypingAstro bật Hermes → Sentry phải upload **source map Hermes** riêng (`.hbc` symbolication).
- **Follow-up:** *"Khi nào KHÔNG dùng Hermes?"* → lib legacy phụ thuộc JSC-specific behavior, hoặc web target.

---

## 4. RN vs React DOM (không có DOM, native components)?

**Ngắn:**
- **React DOM** render → `document.createElement` (DOM node).
- **RN** render → **native component** (`View` → `UIView` iOS / `android.view.ViewGroup`), không có DOM, không CSS, không `document`/`window`.

**Đào sâu:**
- Primitives của RN: `View`, `Text`, `Image`, `ScrollView`, `TextInput`… map sang native.
- Không có `<div>`, `<span>`, `<p>` — phải dùng `<View>`, `<Text>`.
- **Text bắt buộc** trong `<Text>`** — `<View>chữ</View>` sẽ crash hoặc không hiển thị.
- Styling qua `StyleSheet` (giống CSS-in-JS, nhưng subset — không có `display: grid`, pseudo-class…).
- **Accessibility** map sang native A11y (`accessibilityLabel`, `accessibilityRole`).

**Gotcha:**
- Web lib (DOM-based) **không chạy** trong RN — phải tìm RN equivalent.
- **`onClick`** không có, dùng `onPress` (`TouchableOpacity`, `Pressable`).
- **Follow-up:** *"Làm sao reuse code web/RN?"* → tách logic ra plain TS module, UI riêng; hoặc dùng **react-native-web** (RN render ra web).

---

## 5. View / Text / StyleSheet — tại sao không inline style object? 🔥

**Ngắn:** `StyleSheet.create()` tạo style object **được cache + bridge 1 lần**, thay vì tạo object mới mỗi render (inline `style={{...}}`).

**Đào sâu:**
```tsx
// ❌ Tạo object mới mỗi render → bridge gửi lại style
<View style={{ flex: 1, backgroundColor: 'red' }} />

// ✅ Cache 1 lần qua StyleSheet
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'red' },
});
<View style={styles.container} />
```
- Mỗi object mới → **reference khác** → native side phải diff & update.
- `StyleSheet.create` chuyển style sang **internal ID** → gửi ID, native cache → ít payload.
- Style array (`style={[styles.a, styles.b]}`) → merge, nhưng tạo array mới → cũng có overhead nhẹ.

**Gotcha:**
- Conditional style (`style={[styles.a, isHot && styles.b]}`) tạo array mới → vẫn OK nhưng dùng `useMemo` nếu phức tạp.
- **NativeWind** (TypingAstro) compile `className` → `StyleSheet.create` lúc build → vẫn tối ưu, không inline.
- **Follow-up:** *"Tại sao không phải perf issue lớn?"* → vì style object nhỏ, nhưng trong list 1000 item thì accumulate → jank.

---

## 6. Flexbox trong RN (default column, Yoga engine)?

**Ngắn:** RN dùng **Flexbox** (giống CSS), nhưng **`flexDirection` mặc định `column`** (CSS default `row`), render bởi **Yoga** (C++ layout engine, cross-platform).

**Đào sâu:**
| Thuộc tính | RN default | CSS default |
|------------|-----------|-------------|
| `flexDirection` | **`column`** | `row` |
| `display` | always `flex` (no `block`) | `block` |
| `alignItems` | `stretch` | `stretch` |
| `justifyContent` | `flex-start` | `flex-start` |

- **Yoga** tính layout 1 lần → pass sang native (pixel-perfect iOS/Android).
- `flex: 1` = `flexGrow: 1, flexShrink: 1, flexBasis: 0` (khác CSS `flex: 1` = `1 1 0%`).
- **Không có** `display: grid` trong RN → phải dùng Flex lồng hoặc absolute.

**Gotcha:**
- **`flex: 1`** trong ScrollView **phải có** content height, không sẽ collapse.
- `position: 'absolute'` trong Flexbox → break flow, dùng `zIndex` cẩn thận (iOS/Android khác nhau).
- **Follow-up:** *"Tại sao default column?"* → mobile UI đa số vertical scroll → hợp lý hơn row.

---

## 7. Platform.OS & platform-specific code?

**Ngắn:** `Platform.OS` trả về `'ios' | 'android'` (không có `'web'` trừ RN Web), dùng để viết code khác nhau giữa platform.

**Đào sâu:**
```tsx
// Conditional
{Platform.OS === 'ios' && <BlurView />}
// File extension: Component.ios.tsx / Component.android.tsx → RN auto pick
// Platform.select
const padding = Platform.select({ ios: 30, android: 24 });
```
- **File extension** (`*.ios.tsx`, `*.android.tsx`) → build tool tự chọn, code sạch hơn `Platform.OS`.
- `Platform.Version` (Android API level, iOS version số).

**Gotcha:**
- Không lạm dụng — splits code, khó maintain. Ưu tiên component native đã wrapper (SafeAreaView, Pressable ripple).
- TypingAstro handle **notch/safe area** qua `react-native-safe-area-context`, không phải if/else platform.
- **Follow-up:** *"Khi nào dùng file extension vs Platform.OS?"* → extension khi khác hoàn toàn (native module), `Platform.OS` khi khác nhỏ (style).

---

## 8. SafeAreaView dùng lúc nào?

**Ngắn:** **SafeAreaView** padding top/bottom để tránh **notch, home indicator, status bar** (iPhone X+, Android gesture bar).

**Đào sâu:**
- RN built-in `SafeAreaView` (legacy, chỉ iOS).
- **`react-native-safe-area-context`** (recommend) — cross-platform, hooks (`useSafeAreaInsets`), provider.
```tsx
<SafeAreaProvider>
  <SafeAreaView style={{ flex: 1 }}>
    <App />
  </SafeAreaView>
</SafeAreaProvider>
```
- `useSafeAreaInsets()` → lấy `{ top, bottom, left, right }` để custom padding.

**Gotcha:**
- **Modal full screen** vẫn cần SafeArea (modal cover status bar).
- **KeyboardAvoidingView** phải compose với SafeArea để không double-pad.
- **Follow-up:** *"Tại sao không dùng fixed `paddingTop: 44`?"* → device khác nhau (iPad, dynamic island), phải tính runtime.

---

## 9. FlatList / SectionList vs ScrollView — khi nào dùng cái nào? 🔥

**Ngắn:**
- **ScrollView** render **toàn bộ** item ngay → tốt cho ít item (\&lt;50).
- **FlatList** **virtualize** — chỉ render item trong viewport + vài buffer → list lớn (100–10k).
- **SectionList** = FlatList + group theo section (header).

**Đào sâu — virtualization:**
| | ScrollView | FlatList |
|---|-----------|----------|
| Render | All at once | Visible + buffer |
| Memory | Cao (N items) | Thấp (constant) |
| Perf | Tệ khi N lớn | Tốt khi N lớn |
| Use case | Form, settings, \&lt;50 item | Feed, list data, search results |

- **FlatList props quan trọng:**
  - `keyExtractor` — key stable, không index (reorder → bug).
  - `getItemLayout` — skip measurement, jump-to-index cực nhanh.
  - `initialNumToRender`, `maxToRenderPerBatch`, `windowSize` — tune perf.
  - `removeClippedSubviews` — unmount off-screen item (Android).

**Gotcha:**
- FlatList item **phải pure** (`React.memo`) + callback `useCallback` — nếu không, scroll → re-render all → jank.
- **`getItemLayout`** bắt buộc nếu list item height cố định → `scrollToIndex` hoạt động.
- **FlashList** (Shopify) → drop-in replacement, faster ( recycled cell, better recycling), ít config hơn.
- TypingAstro dùng FlashList cho **Qimen chart list** (nhiều cell phức tạp) → perf tốt hơn FlatList.
- **Follow-up:** *"FlatList chậm scroll, fix thế nào?"* → memo item + getItemLayout + giảm windowSize + dùng FlashList.

---

## 10. Expo managed vs bare CLI? 🔥

**Ngắn:**
- **Expo managed** — không có native folder (`ios/`, `android/`), Expo build cloud, dev qua Expo Go.
- **Bare CLI / prebuild** — có native folder, build local hoặc EAS, full native control.

**Đào sâu:**
| | Expo Managed | Bare / Prebuild |
|---|--------------|------------------|
| Native folder | ❌ | ✅ `ios/`, `android/` |
| Native module | Cần config plugin | Sửa native trực tiếp |
| Build | EAS Build (cloud) | Local / EAS |
| Dev | Expo Go / Dev Client | Dev Client / simulator |
| Native upgrade | Expo SDK upgrade | `rn-diff-purge` manual |

- **Expo prebuild** (Expo 50+) = best of both: config trong `app.json/app.config.js` → generate native folder → có thể eject + custom native.
- **EAS Build** build cloud (free tier) → không cần Xcode/Android Studio.
- **EAS Update** = CodePush alternative (OTA JS update).

**Gotcha:**
- **Expo Go** không chạy được native module custom → phải **Dev Client** (custom Expo Go).
- TypingAstro dùng **Expo 53 prebuild + EAS Build** (dev/staging/prod) → vừa tiện vừa native control (cho `react-native-iap`, Sentry).
- **Follow-up:** *"Khi nào phải eject/prebuild?"* → lib cần native config mà Expo plugin không có (custom IAP, biometric native bridge).

---

## 11. Cái gì chạy JS thread, cái gì chạy native thread? 🔥

**Ngắn:**
- **JS thread** — chạy JS code: React render, business logic, hooks, event handler.
- **Native (UI) thread** — render native view, animation, gesture, layout (Yoga có thể chạy riêng).
- **Bridge/JSI** — giao tiếp giữa 2 thread.

**Đào sâu:**
| Loại | Thread | Ví dụ |
|------|--------|-------|
| React render | JS | `setState`, hooks, reconcile |
| Layout | Native (Yoga C++) | Tính flexbox |
| Native render | UI thread (main iOS) | `UIView` draw |
| Animated (legacy) | JS → jank | `Animated.timing` |
| **Reanimated worklet** | **UI thread** | `useAnimatedStyle`, gesture |
| HTTP / IO | Native (background) | `fetch`, file system |
| Heavy compute (JS) | JS → block → jank | JSON parse lớn, crypto |

**Gotcha:**
- **JS thread block** (compute nặng) → animation, gesture (JS-driven) lag → jank.
- Giải: offload sang native (Reanimated worklet, JSI lib) hoặc `InteractionManager.runAfterInteractions`.
- TypingAstro render **chart phức tạp** (Qimen) → tách compute ra worker / pre-compute, không block JS.
- **Follow-up:** *"JS thread FPS bao nhiêu OK?"* → 60 FPS (16ms/frame budget), nếu JS > 16ms → drop frame.

---

🔗 [Quay lại README react-native](./index.md)

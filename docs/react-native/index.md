# 📱 React Native Interview — Bộ câu hỏi kinh điển

> Bộ tài liệu luyện phỏng vấn **React Native (Mid → Mid-Senior)**, **song ngữ Việt–Anh**
> (giải thích tiếng Việt, **giữ thuật ngữ kỹ thuật tiếng Anh**: bridge, render, hooks, Hermes, JSI, worklet, Fabric…).
> Súc tích, thực chiến, gắn với **TypingAstro** — project React Native chính của Hồ Thành Danh.

> 🎯 **Reference chính:** **TypingAstro** — app Qimen Dunjia metaphysics (iOS/Android).
> Stack: **React Native 0.79 · Expo 53 (EAS build) · TypeScript · Zustand · NativeWind · MMKV · Firebase
> (Auth + App Check + Analytics) · react-native-iap · Sentry · biometric auth · i18next**.
> Architecture: **Clean Architecture** (entity / repo / usecase / infra / presentation).

---

## 📂 Cấu trúc thư mục

```
react-native/
├── README.md                       ← bạn đang ở đây (catalog + lộ trình ôn)
├── 01-core-fundamentals.md         ← Bridge vs Fabric, JSI, Hermes, View/Text, FlatList, Expo…
├── 02-navigation-state.md          ← React Navigation, params, Zustand, MMKV persist, deep linking…
├── 03-performance.md               ← Render phases, JS vs UI thread, FlashList, Reanimated, jank…
├── 04-architecture-clean-code.md   ← Clean Architecture, DI, dependency rule, feature folders…
├── 05-native-build-deploy.md       ← EAS build, multi-env, CodePush, Hermes bundle, App Store…
├── 06-device-integrations.md       ← IAP, biometric, Firebase, permissions, push notif, Sentry…
└── 07-debugging-testing.md         ← Flipper/React DevTools, Sentry, Jest, Detox, perf profiling…
```

---

## 📋 Catalog câu hỏi kinh điển (theo chủ đề)

### 🧱 1. Core Fundamentals — [`01-core-fundamentals.md`](./01-core-fundamentals.md)
- Kiến trúc RN cũ (**Bridge**) vs mới (**Fabric + TurboModules**)? 🔥
- **JSI** là gì? Khác Bridge thế nào? 🔥
- **Hermes** engine là gì? Tại sao dùng? 🔥
- **RN vs React DOM** (không có DOM, native components)?
- **View / Text / StyleSheet** — tại sao không inline style object? 🔥
- **Flexbox** trong RN (default `column`, Yoga engine)?
- **Platform.OS** & platform-specific code?
- **SafeAreaView** dùng lúc nào?
- **FlatList / SectionList vs ScrollView** — khi nào dùng cái nào? 🔥
- **Expo managed** vs **bare CLI**? 🔥
- Cái gì chạy **JS thread**, cái gì chạy **native thread**? 🔥

### 🧭 2. Navigation & State — [`02-navigation-state.md`](./02-navigation-state.md)
- **React Navigation**: stack / tab / drawer — khác biệt? 🔥
- Truyền **params** giữa screens — khi nào **không nên** truyền data lớn? 🔥
- **Deep linking** hoạt động thế nào?
- **Nested navigators** — pitfall gì?
- **State persistence** với **MMKV**? 🔥
- **Zustand** trong RN — tại sao không Context? 🔥
- **Context vs Zustand** — re-render khác nhau ra sao?
- **Persist auth state** & rehydration?
- **Focus / blur** lifecycle trong navigation?
- Gesture / navigation performance?

### ⚡ 3. Performance — [`03-performance.md`](./03-performance.md)
- **RN render phases** (render → reconcile → commit)? 🔥
- **JS thread vs UI thread** — ai làm gì? 🔥
- Cái gì **block JS thread** → jank?
- **FlatList vs FlashList** (virtualization, keyExtractor, getItemLayout)? 🔥
- **Memoization** trong RN (`memo`, `useMemo`, `useCallback`)?
- **Reanimated** — UI thread worklet, `runOnUI`? 🔥
- **Animated API** vs **Reanimated**?
- **InteractionManager** dùng để làm gì?
- Offload heavy computation (JSI, native module)?
- **Image perf** (resize, FastImage)?
- Hermes vs JSC — perf khác biệt?
- Dev vs **prod build** — perf khác nhau thế nào?

### 🏛️ 4. Architecture & Clean Code — [`04-architecture-clean-code.md`](./04-architecture-clean-code.md)
- **Clean Architecture** trong RN (entity/usecase/repo/infra/presentation) — **TẠI SAO**? 🔥
- **Dependency rule** (phụ thuộc hướng trong)?
- **Folder structure** chuẩn clean arch thế nào?
- **Dependency Injection** trong RN? 🔥
- Tách **business logic** khỏi UI thế nào?
- **Unit-testable** use cases — làm sao?
- **Swappable data source** (REST ↔ Mock ↔ Firebase)?
- **Error handling** strategy xuyên suốt các layer?
- **Feature-based** vs **layer-based** folders?
- **State & navigation** nằm ở đâu trong clean arch? 🔥

### 🔧 5. Native, Build & Deploy — [`05-native-build-deploy.md`](./05-native-build-deploy.md)
- **EAS Build** (Expo Application Services) là gì? 🔥
- Multi-env (**dev / staging / prod**) với EAS?
- **Hermes** bundle & prebuilt?
- **CodePush / EAS Update** (OTA) hoạt động thế nào?
- iOS: Provisioning profile, certificate, App Store Connect?
- Android: keystore, signing, Play Console, AAB vs APK?
- Native module khi nào phải **config native** (pod install / Gradle)?
- **App Store / Play Store** review process & reject reasons phổ biến?

### 📡 6. Device Integrations — [`06-device-integrations.md`](./06-device-integrations.md)
- **react-native-iap** — IAP subscription flow? 🔥
- iOS StoreKit vs Android Billing — khác biệt?
- **Biometric auth** (FaceID / TouchID / Fingerprint)?
- **Firebase Auth** + **App Check** — tại sao cần App Check?
- **Permissions** (iOS Info.plist / Android manifest)?
- **Push notification** (APNs / FCM)?
- **Firebase Analytics** events tracking?
- **Sentry** crash monitoring & source map upload?

### 🐛 7. Debugging & Testing — [`07-debugging-testing.md`](./07-debugging-testing.md)
- **Flipper** / **React DevTools** / **Reactotron**?
- **Sentry** cấu hình đúng (release, source map, scope)?
- **Jest** test component / hook / use case?
- **Detox** / **Maestro** E2E?
- **Performance profiling** (Hermes profiler, systrace)?
- Debug **crash trên production** (symbolication, stack trace)?
- Test **IAP** ở dev / sandbox?

---

## 🗺️ Lộ trình ôn (Study Roadmap)

### Level 1 — Must-know (ôn đầu tiên, 1–2 tuần)
`01 Core Fundamentals` → `02 Navigation & State` → `03 Performance`
> Đây là thứ **chắc chắn được hỏi** ở mọi vòng kỹ thuật RN.
> Phải trả lời流畅 được: Bridge/Fabric, JSI, Hermes, FlatList, Zustand, re-render.

### Level 2 — Senior (tuần 3–4)
`04 Architecture` → `05 Native/Build/Deploy` → `06 Device Integrations` → `07 Debugging/Testing`
> Thường hỏi cho **mid-senior**, liên quan hệ thống thực tế và deploy.
> Clean Architecture là **điểm sáng CV** (TypingAstro) → phải explain được rành rẽ.

### Level 3 — Bonus / theo stack
- **Expo EAS** deep-dive (channel, profile, update, rollout).
- **New Architecture** migration (Fabric + TurboModules + JSI).
- **MMKV** vs AsyncStorage vs SQLite — khi nào dùng cái nào.
- **Internationalization** với **i18next** (TypingAstro đa ngôn ngữ).

---

## ✍️ Mẹo trả lời câu hỏi React Native

1. **Bắt đầu bằng 1 câu định nghĩa gọn** (elevator answer) → rồi mới đào sâu.
   VD: *"Hermes là JS engine tối ưu cho RN, AOT bytecode, ít memory, start nhanh."* → rồi mới nói về precompile, GC, debug.
2. **So sánh = bảng / trade-off**: khi hỏi "A vs B", luôn nêu **khi nào dùng A, khi nào dùng B** + nhược điểm.
3. **Gắn với TypingAstro**: dùng trải nghiệm thực tế —
   *"Ở TypingAstro tôi dùng Zustand + MMKV để persist auth state, rehydration < 5ms vì MMKV sync native."*
   → điểm cộng cực lớn, interviewer thấy bạn có project thật.
4. **Không dịch thuật ngữ**: bridge, render, worklet, JSI, Fabric, Hermes… **giữ nguyên tiếng Anh**.
5. **Follow-up**: interviewer thường đào sâu ("vậy nếu list 10k item thì sao?") — chuẩn bị sẵn gotcha (cuối mỗi câu).
6. **Performance question** = luôn nói đến **JS thread vs UI thread**, ai làm gì, ai bottleneck.

---

📚 **Tài liệu tham khảo:**
- [React Native official docs](https://reactnative.dev/docs/getting-started) — bắt buộc.
- [React Navigation docs](https://reactnavigation.org/docs/getting-started) — navigation bible.
- [Reanimated docs](https://docs.swmansion.com/react-native-reanimated/) — animation/手势.
- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) — gốc clean arch.
- [FlashList — Shopify](https://shopify.github.io/flash-list/docs/) — list perf.
- [Hermes engine](https://hermesengine.dev/) — JS engine internals.

---

🔗 [Quay lại README chính](../index.md) · 📂 [Backend](../backend/index.md) · 🎨 [Frontend](../frontend/index.md) · 🏛️ [System Design](../system-design/index.md)

# 🧭 02 — Navigation & State (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.
> 🎯 Gắn với **TypingAstro**: Zustand + MMKV + React Navigation + Firebase Auth.

---

## 1. React Navigation: stack / tab / drawer — khác biệt? 🔥

**Ngắn:**
- **Stack Navigator** — route xếp chồng (push/pop), có back, transition slide.
- **Tab Navigator** — switch giữa tab, giữ state mỗi tab.
- **Drawer Navigator** — menu trượt từ cạnh.

**Đào sâu — khi nào dùng:**
| | Stack | Tab | Drawer |
|---|-------|-----|--------|
| UX | Drill-down (detail) | Top-level section | Menu phụ |
| State | Mỗi route mount mới | Tab giữ state khi switch | Drawer mount lazy |
| Memory | Tăng theo depth | Tăng theo số tab | Trung bình |
| Transition | Slide / modal | Fade / slide | Drawer overlay |

- Thường **combine**: Tab ở root, mỗi tab chứa Stack riêng.
- `createNativeStackNavigator` (native stack) → dùng native iOS/Android nav, perf tốt hơn JS stack.

**Gotcha:**
- **Native stack** default RN 0.70+ → transition mượt hơn, dùng native behavior (iOS swipe back).
- Tab có `unmountOnBlur` nếu muốn unmount screen khi switch (tiết kiệm memory).
- TypingAstro: **Tab (Home / Destiny / Planning / Feng Shui) + Stack** trong mỗi tab cho detail.
- **Follow-up:** *"Làm sao giữ state khi switch tab?"* → Tab native giữ mặc định, không cần config.

---

## 2. Truyền params giữa screens — khi nào không nên truyền data lớn? 🔥

**Ngắn:** Truyền params qua `navigation.navigate('Detail', { id })` — **chỉ nên truyền serializable nhỏ** (id, string, number).

**Đào sâu:**
```tsx
// ✅ Tốt: chỉ ID
navigation.navigate('ChartDetail', { chartId: '123' });

// ❌ Tệ: object lớn, function, class instance
navigation.navigate('Detail', { chart: hugeObject, onPress: () => {} });
```
- Params được **serialize** (qua bridge/state) → object lớn chậm, function/class **không serialize được** → bug.
- Params **không persist** khi app kill (trừ khi config persist) → reload app mất.
- Pattern chuẩn: truyền **ID** → screen detail **fetch từ store/DB** bằng ID.

**Gotcha:**
- Truyền function callback → memory leak + không chạy sau navigation deep.
- **Deep linking** đến screen có param → param phải là **string** (URL friendly).
- TypingAstro: truyền `chartId` → `useChart(chartId)` từ Zustand, không truyền cả chart object.
- **Follow-up:** *"Vậy data lớn để đâu?"* → global store (Zustand/Redux), screen lấy qua ID.

---

## 3. Deep linking hoạt động thế nào?

**Ngắn:** Deep link = URL (`typingastro://chart/123` hoặc `https://typingastro.app/chart/123`) mở app đến screen cụ thể.

**Đào sâu:**
- **Scheme** (`typingastro://`) — custom URL scheme, mở app từ app khác.
- **Universal Links (iOS) / App Links (Android)** — `https://` domain, mở app nếu đã install, fallback web.
- **React Navigation `linking` config** — map prefix + path → screen name + parse params.
```ts
const linking = {
  prefixes: ['typingastro://', 'https://typingastro.app'],
  config: { screens: { ChartDetail: 'chart/:chartId' } },
};
```
- Native config: iOS `Info.plist` (scheme + apple-app-site-association), Android `AndroidManifest.xml` (intent-filter) hoặc Expo `app.json`.

**Gotcha:**
- **Universal Links** yêu cầu `apple-app-site-association` JSON trên domain (HTTPS) → verify ownership.
- Test: `npx uri-scheme open typingastro://chart/123 --ios`.
- **Follow-up:** *"Deep link khi app đang kill?"* → app khởi động, React Navigation parse initial URL → navigate tới screen.

---

## 4. Nested navigators — pitfall gì?

**Ngắn:** Nested = navigator chứa navigator (VD: Tab trong Stack, hoặc Stack trong Tab).

**Đào sâu:**
- Mỗi navigator có **state riêng** (history, focus) → params không cross navigator tự nhiên.
- Navigate cross navigator:
```tsx
// Từ Tab screen → Stack screen ở tab khác
navigation.navigate('HomeTab', { screen: 'Detail', params: { id } });
```
- `useNavigation(parent)` — access navigator cha nếu cần.

**Gotcha:**
- **Header lồng nhau** — cả Tab + Stack có header → double header. Ẩn 1 bên (`headerShown: false`).
- `navigation.goBack()` trong nested chỉ pop navigator hiện tại, không cross.
- **Type safety** — phải declare `ParamList` cho mỗi navigator, compose type.
- **Follow-up:** *"Khi nào nest vs tách?"* → nest khi UX flow liên quan (tab trong modal), tách khi độc lập.

---

## 5. State persistence với MMKV? 🔥

**Ngắn:** React Navigation state (route history) có thể **persist** → reload app giữ nguyên màn hình đang mở, dùng **MMKV** (JSI, sync) thay vì AsyncStorage.

**Đào sâu:**
```ts
const NAV_KEY = 'NAV_STATE';
const navigationState = MMKV.getString(NAV_KEY);

const persist = (state) => MMKV.set(NAV_KEY, JSON.stringify(state));

<NavigationContainer
  initialState={navigationState ? JSON.parse(navigationState) : undefined}
  onStateChange={persist}
/>;
```
- **MMKV** sync (JSI) → rehydration **< 5ms**, không block splash.
- **AsyncStorage** async → phải await trước khi render NavigationContainer → splash lâu hơn.
- Chỉ persist **structure** (route name + params), không persist component state.

**Gotcha:**
- **Versioning** — khi đổi navigation structure (rename screen), state cũ mismatch → wrap với `NavigationContainer` + reset nếu version mismatch.
- **Sensitive params** (token) trong nav state → careful với MMKV encryption (`MMKV_encrypted`).
- TypingAstro dùng MMKV cho cả **Zustand persist + navigation state** → boot nhanh, UX liền mạch.
- **Follow-up:** *"Tại sao không AsyncStorage?"* → async, chậm hơn 30x, không JSI.

---

## 6. Zustand trong RN — tại sao không Context? 🔥

**Ngắn:** **Zustand** = state store nhỏ gọn, **không Provider**, dùng hook `useStore(selector)`, **selective subscription** → ít re-render hơn Context.

**Đào sâu:**
| | React Context | Zustand |
|---|---------------|---------|
| Provider | Cần wrap tree | ❌ Không cần |
| Re-render | Tất cả consumer khi value change | **Chỉ consumer selector** |
| Boilerplate | Nhiều (`createContext`, `Provider`, `useContext`) | Ít (`create()` + hook) |
| Middleware | Tự viết | `persist`, `devtools`, `immer` built-in |
| Perf | Tệ khi store lớn | Tốt (shallow compare selector) |

- Zustand selector: `useAuthStore(s => s.user)` → chỉ re-render khi `user` thay.
- **`persist` middleware** tích hợp sẵn MMKV/AsyncStorage.

**Gotcha:**
- Context value là object mới mỗi render → tất cả consumer re-render dù 1 field đổi (trừ khi split context hoặc `useMemo` value).
- Zustand selector trả object → dùng `shallow` từ `zustand/shallow` để compare shallow.
- TypingAstro: Zustand cho **auth, chart cache, settings** → re-render surgical, không cascade.
- **Follow-up:** *"Redux sao không?"* → Redux boilerplate nặng, perf tốt nhưng overkill cho app vừa; Zustand đủ.

---

## 7. Context vs Zustand — re-render khác nhau ra sao?

**Ngắn:**
- **Context**: bất kỳ `value` prop đổi → **mọi consumer** re-render (trừ khi memoize).
- **Zustand**: chỉ consumer mà **selector return value đổi** (shallow compare) mới re-render.

**Đào sâu:**
```tsx
// Context — đổi 1 field → all consumers re-render
const [state, setState] = useState({ user, theme });
<AuthContext.Provider value={state}>  // object mới mỗi setState
  <User />   // re-render
  <Theme />  // cũng re-render dù chỉ user đổi
</AuthContext.Provider>

// Zustand — chỉ consumer selector đổi
useAuthStore(s => s.user);     // chỉ re-render khi user đổi
useAuthStore(s => s.theme);    // chỉ re-render khi theme đổi
```
- Context optimizations: **split context** (AuthContext, ThemeContext), hoặc `useContextSelector` (3rd party).
- Zustand dùng **external store** → React chỉ re-render component subscribe field đó.

**Gotcha:**
- Context **tốt cho** low-frequency update (theme, locale, auth init).
- Zustand/Redux **tốt cho** high-frequency (cart, form, live data).
- **Follow-up:** *"Context có thể perf tốt không?"* → có, nếu value reference stable (`useMemo`) + split theo concern.

---

## 8. Persist auth state & rehydration?

**Ngắn:** Lưu auth state (token, user) vào persistent storage (MMKV/SecureStorage) → reload app tự login, **rehydrate trước khi render main app**.

**Đào sâu:**
```ts
// Zustand persist
const useAuthStore = create(persist(
  (set) => ({ user: null, token: null, login: ... }),
  { name: 'auth', storage: createJSONStorage(() => MMKV) }
));

// App root
const isLoading = useAuthStore(s => !s._hasHydrated);
if (isLoading) return <SplashScreen />;
return <App />;
```
- **`persist` middleware** set `_hasHydrated: true` sau khi load xong → render main app.
- Token nhạy cảm → **Keychain (iOS) / Keystore (Android)** thay vì MMKV plain (`react-native-keychain`, `expo-secure-store`).
- **Firebase Auth** tự persist internal → nghe `onAuthStateChanged` để biết login status.

**Gotcha:**
- **Race condition**: render main app trước khi auth rehydrate → flash login screen rồi chuyển → dùng `_hasHydrated` flag.
- Token expired → refresh token flow trước khi vào app (`axios interceptor` + retry).
- TypingAstro: Firebase Auth + App Check, rehydrate via `onAuthStateChanged`, MMKV cache user profile.
- **Follow-up:** *"App Check để làm gì?"* → verify request từ app thật (attestation), chặn fake client gọi Firebase.

---

## 9. Focus / blur lifecycle trong navigation?

**Ngắn:** React Navigation không dùng React `componentDidMount` cho lifecycle focus — dùng **`useFocusEffect`** hoặc **`navigation.addListener('focus'/'blur')`**.

**Đào sâu:**
```tsx
// ✅ useFocusEffect — chạy khi screen focus
useFocusEffect(
  useCallback(() => {
    refetchChart();  // refresh data khi quay lại
    return () => unsubscribe();  // cleanup khi blur
  }, [])
);

// ✅ useIsFocused — boolean re-render
const isFocused = useIsFocused();
```
- `focus` = screen trở nên active (tab switch, stack pop back).
- `blur` = screen không còn active.
- Khác `useEffect` (chỉ chạy khi mount/unmount, không chạy khi focus lại).

**Gotcha:**
- `useFocusEffect` deps rỗng + fetch → fetch mỗi lần focus (good for refresh, bad nếu spam). Dùng `useCallback` + React Query `refetchOnFocus`.
- Quên cleanup subscription → leak memory.
- **Follow-up:** *"Khi nào dùng useFocusEffect vs useEffect?"* → focus effect khi cần refresh data khi quay lại tab/stack; useEffect cho init 1 lần.

---

## 10. Gesture / navigation performance?

**Ngắn:** Navigation transition + gesture (swipe back iOS) cần mượt → tránh block JS thread khi navigate.

**Đào sâu:**
- **Native stack** → transition chạy native, mượt hơn JS stack.
- **Heavy render ở screen đích** → transition lag → dùng `InteractionManager.runAfterInteractions` defer heavy.
```tsx
useEffect(() => {
  const handle = InteractionManager.runAfterInteractions(() => {
    setReady(true);  // render heavy sau khi transition xong
  });
  return () => handle.cancel();
}, []);
```
- **Gesture handler** dùng `react-native-gesture-handler` (native thread) thay vì JS `PanResponder`.

**Gotcha:**
- Preload data trước khi navigate (fetch ở list screen, cache → detail đọc cache).
- Reanimated + Gesture Handler integration → gesture chạy UI thread, không jank.
- TypingAstro: swipe gesture trên chart → Reanimated worklet + Gesture Handler native.
- **Follow-up:** *"iOS swipe back lag?"* → check screen đích có heavy compute trong render → defer hoặc memoize.

---

🔗 [Quay lại README react-native](./index.md)

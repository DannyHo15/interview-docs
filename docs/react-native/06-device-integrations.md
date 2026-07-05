# 📱 6 — Device Integrations (IAP, Biometric, Secure Storage, Firebase, Push)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp. Gắn với TypingAstro (`react-native-iap`, biometric, Firebase Auth + App Check).

---

## 1. react-native-iap — subscription vs one-time, khác biệt iOS/Android? 🔥

**Ngắn:** `react-native-iap` là lib wrap StoreKit (iOS) + BillingClient (Android). **One-time** = mua vĩnh viễn (unlock pro). **Subscription** = auto-renew (hàng tháng/năm), có grace period, family sharing, intro offer.

| | iOS (StoreKit 2) | Android (Billing 6+) |
|---|---|---|
| Product type | consumable, non-consumable, auto-renewable | one-time, rewards, subscriptions |
| Validation | server-side App Store Server API | server-side Play Developer API |
| Restore | `getAvailablePurchases()` | `getAvailablePurchases()` |
| Test | Sandbox / TestFlight | License testing / Internal testing |

**Đào sâu:**
- Subscription có `expiryDate`, `isExpired` — server phải track + verify mỗi lần app mở.
- iOS subscription group: user upgrade tier → prorate tự động. Android dùng `replaceSkProductOption` với `PRORATION_MODE`.
- Intro offer (free trial): iOS `introductoryPrice` JSON, Android có `freeTrialPeriod`.
- Cả 2 store **bắt buộc** restore purchase button nếu có non-consumable/subscription.

**Gotcha:** iOS sandbox test purchase KHÔNG trừ tiền thật, nhưng account sandbox có cycle rút ngắn (1 tháng = 5 phút) để test renewal.

**Gotcha:** Android Billing 6+ deprecated `inapp` cho subscription → phải dùng `subs` type rõ ràng.

**Follow-up:** TypingAstro dùng subscription — server validate receipt thế nào? → iOS: gửi `transaction.id` + `transaction.originalIdentifier` lên server → server gọi App Store Server API verify. Android: gửi `purchaseToken` → server gọi Play Developer API `purchases.subscriptions.get`.

```ts
// init + fetch subscription
import * as RNIap from 'react-native-iap';
await RNIap.initConnection();
const subs = await RNIap.getSubscriptions(['com.typingastro.pro_monthly']);
const purchase = await RNIap.requestSubscription({ sku: 'com.typingastro.pro_monthly' });
// → gửi purchase.purchaseToken / transactionId lên server verify
// → call RNIap.acknowledgePurchaseAndroid / finishTransactionIOS
```

---

## 2. Receipt validation — tại sao phải verify server-side? 🔥

**Ngắn:** Receipt = bằng chứng mua. Verify **server-side** vì client có thể bị tamper (jailbreak, Frida), và để source-of-truth duy nhất cho entitlement.

| Verify | Ưu điểm | Nhược điểm |
|---|---|---|
| Client-only | Đơn giản, không cần server | Dễ fake, không sync device |
| Server-side Apple/Google | Trust, revoke, family share | Phải maintain server + webhook |

**Đào sâu:**
- iOS StoreKit 2: receipt JWT-like, verify bằng App Store Server API v1 (`/verifyReceipt` deprecated → dùng `/transactions/...`).
- Android: `purchaseToken` unique per purchase, verify qua OAuth2 service account.
- Webhook: Apple `App Store Server Notifications V2`, Google `RTDN` (Real-time Developer Notifications) → server biết user renew/cancel/refund ngay.
- Lưu entitlement trong DB keyed theo `originalTransactionId` (iOS) / `purchaseToken` (Android).

**Gotcha:** Jailbroken device có thể inject fake receipt → nếu trust client 100% sẽ bị crack app. Luôn server verify + cache ngắn hạn (vd 24h) rồi re-verify.

**Follow-up:** User đổi điện thoại — làm sao giữ subscription? → Restore purchase → server lookup theo `originalTransactionId` (iOS) hoặc Google account (Android) → gán lại entitlement.

---

## 3. Biometric auth (FaceID/Fingerprint) — implement và fallback thế nào? 🔥

**Ngắn:** Dùng `expo-local-authentication` hoặc `react-native-biometrics`. Check `hasHardwareAsync()` → `supportedAuthenticationTypesAsync()` → `authenticateAsync()`. Fallback sang PIN/passcode khi biometric fail hoặc không có.

| Type | iOS | Android |
|---|---|---|
| Face | Face ID | Class 3 face (Pixel) |
| Fingerprint | Touch ID | Fingerprint |
| Iris | — | Galaxy iris |

**Đào sâu:**
- `securityLevel`: Android có Class 2 (weak) vs Class 3 (strong) — chỉ Class 3 nên dùng cho payment/sensitive.
- iOS: `authenticateAsync({ promptMessage, fallbackLabel })` tự động show "Enter Password" sau vài lần fail.
- Android: `BiometricPrompt` yêu cầu Activity (không phải RN modal) — lib wrap context đúng.
- Sau khi auth thành công → unlock app, không nên re-auth quá thường xuyên (mỗi 30s là phiền).

**Gotcha:** iOS simulator có "Face ID Enrolled" toggle để test; Android emulator phải setup fingerprint trong Settings.

**Gotcha:** User disable biometric ở system setting → `supportedAuthenticationTypesAsync` trả empty → phải fallback passcode trong app.

**Follow-up:** TypingAstro dùng biometric để mở khóa app Qimen — store gì sau khi auth? → Auth thành công mới giải mã secret key (lưu Keychain/Keystore), KHÔNG trust flag boolean vì dễ bypass.

```ts
import * as LocalAuth from 'expo-local-authentication';
async function unlock() {
  const has = await LocalAuth.hasHardwareAsync();
  if (!has) return fallbackPin();
  const types = await LocalAuth.supportedAuthenticationTypesAsync();
  const result = await LocalAuth.authenticateAsync({
    promptMessage: 'Mở khóa TypingAstro',
    fallbackLabel: 'Dùng mật khẩu',
    disableDeviceFallback: false,
  });
  if (result.success) decryptSecret();
  else fallbackPin();
}
```

---

## 4. Secure storage — Keychain/Keystore/SecureStore vs MMKV cho secret? 🔥

**Ngắn:**
- **Keychain (iOS)** / **Keystore (Android)** = hardware-backed encrypted storage, dùng cho secret (token, key).
- **expo-secure-store** / `react-native-keychain` = wrapper trên Keychain/Keystore.
- **MMKV** = cực nhanh nhưng **mã hóa tuỳ chọn**, không hardware-backed → KHÔNG dùng cho secret nhạy cảm.

| | Keychain/Keystore | MMKV | AsyncStorage |
|---|---|---|---|
| Hardware-backed | Có (Secure Enclave/TEE) | Không | Không |
| Encrypt | Auto (when device lock) | Optional (AES) | Không |
| Speed | Chậm (10–50ms) | Cực nhanh (\&lt;1ms) | Chậm |
| Use case | Token, private key | UI state, cache | Deprecated |

**Đào sâu:**
- `expo-secure-store`: `keychainAccessible` flag — `WHEN_UNLOCKED` (mặc định), `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` (xóa khi đổi passcode).
- iOS: Secure Enclave chỉ lưu EC P-256 key, không lưu data tùy ý → lib sinh key trong SE, encrypt data, store cipher ở Keychain.
- Android: Keystore có `setUserAuthenticationRequired(true)` → key chỉ dùng sau khi unlock biometric.
- MMKV tốt cho: theme, locale, cache UI, redux-persist. TypingAstro: Zustand persist → MMKV (state) + SecureStore (token).

**Gotcha:** AsyncStorage **không mã hóa**, plaintext SQLite file → không bao giờ lưu token/JWT ở đây. Đã có nhiều leak.

**Gotcha:** Jailbreak/Root → Keychain vẫn có thể dump (keychain-dumper). Defense in depth: encrypt payload thêm 1 lớp + server revoke.

**Follow-up:** Khi nào dùng SecureStore vs MMKV ở TypingAstro? → SecureStore: JWT refresh token, IAP receipt hash, biometric key. MMKV: theme, last chart, locale, zustand state.

```ts
import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV({ id: 'ui-cache' });
mmkv.set('theme', 'dark');

// secret
await SecureStore.setItemAsync('refreshToken', jwt, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
});
const token = await SecureStore.getItemAsync('refreshToken');
```

---

## 5. Firebase Auth + App Check — TẠI SAO cần App Check? 🔥

**Ngắn:** Firebase Auth = xác thực user (email/google/anonymous). **App Check** = xác thực **app** (chỉ app thật của bạn mới gọi được Firebase), chống abuse từ client fake/script.

| | Chống được | Không chống |
|---|---|---|
| Firebase Auth | User chưa login | User clone token dùng script |
| App Check | Script curl API với token | Server-to-server legit |

**Đào sâu:**
- App Check issue **attestation token** (DeviceCheck iOS / Play Integrity Android / reCAPTCHA Enterprise web) → Firebase backend verify trước khi cho phép request.
- Custom backend: forward token header `X-Firebase-AppCheck` → Admin SDK `getAppCheck().verifyToken()`.
- Enforcement: bắt đầu mode "log only" → quan sát fail rate → switch "enforce" cho Firestore/Storage/Functions/RTDB.
- TypingAstro: App Check cho Firestore (chỉ app thật mới đọc chart data), Functions (chỉ app thật mới gọi IAP verify endpoint).

**Gotcha:** Bật enforce mà quên register DeviceCheck/Play Integrity → app thật cũng bị block. Test trên TestFlight/internal track trước.

**Gotcha:** Debug token cho emulator/dev build — register trong Firebase Console nếu không attestation fail.

**Follow-up:** DeviceCheck vs App Attest iOS? → App Check dùng App Attest (mới, mạnh hơn) mặc định iOS 14+. DeviceCheck cho backward compat.

```ts
// App Check init (TypingAstro)
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
// native (React Native Firebase)
import appCheck from '@react-native-firebase/app-check';
await appCheck().initializeAppCheck({
  isTokenAutoRefreshEnabled: true,
  // debug provider cho dev
  // provider factory auto detect DeviceCheck/AppAttest/Play Integrity
});
// Gọi function: token auto-attach header
```

---

## 6. Push notifications — FCM/APNs flow và permissions?

**Ngắn:** iOS dùng **APNs** (Apple Push Notification service), Android dùng **FCM** (Firebase Cloud Messaging). RN: `@react-native-firebase/messaging` (wrap cả 2). Flow: Server → FCM/APNs → Device → App.

| Bước | iOS | Android |
|---|---|---|
| Permission | Request runtime (since iOS 10) | Implicit (declare manifest) Android 13+ also runtime |
| Token | APNs token → exchange FCM token | FCM token trực tiếp |
| Background | Silent push (content-available) | Data message |
| Token refresh | Khi reinstall / restore | Khi reinstall |

**Đào sâu:**
- iOS phải upload APNs Auth Key (.p8) lên Firebase Console để FCM route.
- `getAPNSToken()` (iOS) vs `getToken()` (FCM) — đăng ký token lên server map với user.
- Android 13+ (API 33) cần `POST_NOTIFICATIONS` runtime permission.
- Notification payload (title/body) vs data payload (custom key): data message reliably delivered background, notification hiển thị system tray.
- Topic messaging: subscribe nhiều user cùng 1 topic (`/topics/ promo`).

**Gotcha:** iOS simulator **KHÔNG nhận push** được (chỉ device thật). Test phải dùng device + TestFlight hoặc Adhoc.

**Gotcha:** Silent push iOS bị rate-limit ("low priority queue") nếu app không dùng năng lượng hợp lý (vd push quá thường xuyên).

**Follow-up:** TypingAstro push khi nào? → Reminder mở app hằng ngày (Qimen chart), IAP expiry warning, promotion. Server backend subscribe token vào topic `all_users` + per-user DM.

```ts
import messaging from '@react-native-firebase/messaging';
async function setupPush() {
  const auth = await messaging().requestPermission();
  if (auth === messaging.AuthorizationStatus.AUTHORIZED) {
    const token = await messaging().getToken();
    await api.registerPushToken(token);
  }
  messaging().onTokenRefresh(t => api.updatePushToken(t));
  messaging().setBackgroundMessageHandler(async remote => {
    // xử lý data message background
  });
}
```

---

## 7. Camera / Image picker & permissions?

**Ngắn:** `expo-image-picker` (chọn ảnh đơn giản), `expo-camera` (full camera control), `react-native-vision-camera` (pro, realtime frame). Permission runtime bắt buộc cả iOS (Info.plist `NSCameraUsageDescription`) lẫn Android (manifest + runtime).

**Đào sâu:**
- iOS: phải có usage description trong Info.plist, nếu không app crash khi gọi.
- Android 13+ (API 33) tách permission `READ_MEDIA_IMAGES` (chọn ảnh) vs `CAMERA`.
- `expo-image-picker` mở native picker → user chọn → return URI → upload server.
- Vision Camera: realtime frame processing (ML kit, barcode, face) với frame processor.

**Gotcha:** User deny permission lần đầu → lần sau request tự deny (Android "Ask every time"). Phải hướng user vào Settings.

**Gotcha:** URI ảnh tạm (cache) bị xóa sau restart — upload ngay hoặc copy sang document directory.

**Follow-up:** Khi nào dùng Vision Camera vs expo-camera? → expo-camera đủ cho chụp cơ bản; Vision Camera cho AR/filter/scan.

```ts
import * as ImagePicker from 'expo-image-picker';
const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
if (status !== 'granted') return;
const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
if (!result.canceled) uploadImage(result.assets[0].uri);
```

---

## 8. Network info & xử lý offline?

**Ngắn:** `@react-native-community/netinfo` detect online/offline, connection type (wifi/cellular). Combine với retry queue, optimistic UI, sync khi online lại.

**Đào sâu:**
- `NetInfo.addEventListener` listen realtime change.
- Offline-first pattern: write local (SQLite/MMKV) → queue → sync khi online.
- Conflict resolution: last-write-wins hoặc server-wins hoặc CRDT (hiếm).

**Gotcha:** `isConnected` true nhưng `isInternetReachable` false (vd wifi captive portal) — phải check cả 2.

**Follow-up:** TypingAstro offline? → App Qimen chart cho phép xem lịch sử cache (MMKV), IAP vẫn verify khi online lại.

```ts
import NetInfo from '@react-native-community/netinfo';
NetInfo.addEventListener(state => {
  store.setOnline(state.isConnected && state.isInternetReachable);
});
```

---

## 9. Background tasks — khi nào app chạy ngầm?

**Ngắn:** RN background hạn chế: iOS ~30s sau background, Android 8+ đã giới hạn. Dùng `expo-background-fetch`, `expo-task-manager`, hoặc native WorkManager (Android) / BGTaskScheduler (iOS).

| Type | iOS | Android |
|---|---|---|
| Background fetch (periodic) | BGTaskScheduler | WorkManager |
| Silent push | content-available push | Data message FCM |
| Long-running | Limited (audio/location/voip) | Foreground service |

**Đào sâu:**
- Background fetch iOS: minimum interval 15 phút, KHÔNG đảm bảo exact — OS quyết định.
- Android WorkManager: `OneTimeWorkRequest` / `PeriodicWorkRequest` với constraints (network, charging).
- Headless JS (`AppRegistry.registerHeadlessTask`) cho task JS chạy khi app killed (Android).

**Gotcha:** iOS kill app nếu task chạy quá 30s → phải finish nhanh, defer công việc nặng lên server + silent push.

**Follow-up:** TypingAstro có cần background? → Reminder notification hằng ngày dùng `Notifications.scheduleNotificationAsync` (local, không cần task) đơn giản hơn background fetch.

---

## 10. Lưu JWT/token ở đâu? Refresh strategy?

**Ngắn:** **Access token** (ngắn hạn, 15p–1h) — có thể lưu memory hoặc SecureStore. **Refresh token** (dài hạn) — **bắt buộc** SecureStore. Refresh proactive trước khi expire, retry 401.

**Đào sâu:**
- Axios interceptor: catch 401 → call refresh endpoint → retry original request với token mới.
- Queue request trong khi refresh đang chạy để không trigger nhiều refresh song song.
- Logout: clear cả access + refresh + push token + biometric key.

**Gotcha:** Refresh token rotation: server issue refresh mới mỗi lần → reuse old refresh = potential attack. Detect reuse → force logout.

**Gotcha:** Logout không xóa Firebase Auth state →下次 mở app auto login lại. Phải `firebase.auth().signOut()` + clear SecureStore.

**Follow-up:** App mở lại sau 1 tuần — auto login? → Check refresh token SecureStore → call refresh → nếu valid vào app, nếu fail ra login screen.

```ts
// Axios interceptor refresh
let refreshing = null;
api.interceptors.response.use(r => r, async err => {
  if (err.response?.status === 401 && !err.config._retry) {
    err.config._retry = true;
    refreshing ||= refreshToken();
    try {
      const newToken = await refreshing;
      refreshing = null;
      err.config.headers.Authorization = `Bearer ${newToken}`;
      return api(err.config);
    } catch { logout(); }
  }
  throw err;
});
```

---

## 11. Permission runtime — best practice xin permission?

**Ngắn:** iOS + Android 11+ (API 30) yêu cầu runtime permission cho sensitive (camera, location, notification, biometric). Pattern: **just-in-time** (xin đúng lúc cần) + giải thích trước (`modal/rationale`) → tăng conversion.

**Đào sâu:**
- Android: `shouldShowRequestPermissionRationale` = true nếu user deny 1 lần → show rationale UI.
- iOS: only 1 lần popup hệ thống, sau đó deny → phải hướng vào Settings.
- Combine multiple permission cùng lúc nếu liên quan (vd camera + micro khi record video).

**Gotcha:** Xin permission ngay app open (camera, location, notification) → user scare → deny. Xin đúng context (vd click "Scan QR" mới xin camera) → accept rate cao hơn.

**Follow-up:** TypingAstro xin những permission nào? → Notification (reminder), Biometric (unlock), có thể Camera (scan book Qimen). Không xin location/contacts — không cần, tránh review reject.

---

## 12. Deep linking & Universal Links / App Links?

**Ngắn:** Deep link = URL mở app (`typingastro://chart`). **Universal Links (iOS)** / **App Links (Android)** = HTTPS link mở app nếu installed, fallback web nếu chưa.

| | Custom scheme | Universal Links / App Links |
|---|---|---|
| URL | `typingastro://` | `https://typingastro.com/chart` |
| Trust | Bất kỳ app nào | Verified domain (apple-app-site-association / assetlinks.json) |
| Fallback | Error | Web |

**Đào sâu:**
- iOS: upload `apple-app-site-association` JSON lên `/.well-known/`, declare `associated-domains` capability.
- Android: `assetlinks.json` + intent filter `autoVerify=true`.
- Use case TypingAstro: email verify link → mở app thẳng vào verify screen; promo email → mở chart detail.

**Gotcha:** Universal Links không trigger khi user navigate trong cùng domain (click link trong Safari web) — Apple by design.

**Follow-up:** OTA update deep link routing? → React Navigation `Linking.parse()` + NavigationContainer `linking={{ prefixes, config }}`.

---

🔗 [Quay lại README react-native](./index.md)

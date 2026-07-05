# 🏛️ 04 — Architecture & Clean Code (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.
> 🎯 Gắn SÂU với **TypingAstro Clean Architecture** — điểm sáng CV.

---

## 1. Clean Architecture trong RN (entity/usecase/repo/infra/presentation) — TẠI SAO? 🔥

**Ngắn:** **Clean Architecture** (Robert C. Martin) chia code theo **layer同心圆**, **dependency rule hướng trong** — layer ngoài phụ thuộc layer trong, không ngược lại. Mục tiêu: **business logic độc lập** với UI, DB, framework.

**Đào sâu — 5 layer (áp dụng TypingAstro):**
| Layer | Vai trò | Ví dụ TypingAstro |
|-------|---------|--------------------|
| **Entity** | Domain model thuần (no framework) | `QimenChart`, `DestinyProfile`, `StrategyPlan` |
| **Use Case** | Business logic, application flow | `GenerateChartUseCase`, `AnalyzeDestinyUseCase` |
| **Repository (interface)** | Contract data access | `IChartRepository` (interface) |
| **Infrastructure** | Impl repo: REST, Firebase, MMKV | `FirebaseChartRepository`, `MMKVCacheRepo` |
| **Presentation** | UI, state, navigation | Screens, Zustand store, React Navigation |

**TẠI SAO:**
- **Testable** — use case test thuần TS, không cần emulator/Firebase.
- **Swappable** — đổi Firebase → REST API mà không động presentation/entity.
- **Independent** — UI RN có thể thay web (RN Web) mà business logic giữ nguyên.
- **Readable** — code tự document, onboarding nhanh.

**Gotcha:**
- **Overkill cho app nhỏ** — clean arch thêm boilerplate; TypingAstro hợp lý vì domain phức tạp (Qimen rules).
- **Dependency rule** phải enforce review — dễ "lén" import infra từ use case → phá kiến trúc.
- **Follow-up:** *"Bao nhiêu layer là đủ?"* — 3-5 layer tối practical; >5 = ceremony, \&lt;3 = không tách rành.
- **Follow-up:** *"Vậy MVC/MVVM không đủ?"* — MVC trộn logic, MVVM chỉ tách view-model, không tách data layer khỏi business.

---

## 2. Dependency rule (phụ thuộc hướng trong)?

**Ngắn:** **Dependency Inversion** — code phụ thuộc **abstraction** (interface), hướng **vào trong** (entity). Outer layer (infra) implement interface của inner layer (use case).

**Đào sâu:**
```
presentation ──▶ use case ──▶ entity
     │              │
     │              ▼ (interface)
     └──▶ infra ◀───┘
              (implements)
```
- **Entity** không biết gì ngoài chính nó (no import outer).
- **Use case** import entity + interface repo (KHÔNG import Firebase/REST).
- **Infra** implement interface repo → bị use case "gọi" qua interface.
- **Presentation** gọi use case, không gọi repo trực tiếp.

```ts
// entity/Chart.ts — pure, no framework
export class QimenChart { constructor(public readonly palaces: Palace[]) {} }

// usecase/GenerateChart.ts — import entity + interface
export class GenerateChartUseCase {
  constructor(private repo: IChartRepository) {}  // interface, not Firebase!
  execute(date: Date): QimenChart { ... }
}

// infra/FirebaseChartRepository.ts — implements
export class FirebaseChartRepository implements IChartRepository {
  async save(chart: QimenChart) { await firebase.firestore().set(...); }
}
```

**Gotcha:**
- Use case import `firebase` trực tiếp → **phá dependency rule** → khó test, khó swap.
- TypeScript `interface`/`type` chỉ là **contract compile-time**, runtime không có → cần DI container hoặc factory inject.
- **Follow-up:** *"Làm sao enforce rule?"* — ESLint `no-restricted-imports` chặn import infra từ use case, hoặc [Dependency Cruiser](https://github.com/sverweij/dependency-cruiser).

---

## 3. Folder structure chuẩn clean arch thế nào?

**Ngắn:** 2 cách phổ biến: **layer-based** (theo layer) hoặc **feature-based** (theo feature, mỗi feature có đủ layer).

**Đào sâu — feature-based (recommend cho app vừa):**
```
src/
├── features/
│   ├── chart/
│   │   ├── domain/             ← entity + use case + repo interface
│   │   │   ├── entities/QimenChart.ts
│   │   │   ├── repositories/IChartRepository.ts
│   │   │   └── usecases/GenerateChartUseCase.ts
│   │   ├── infrastructure/      ← impl repo (Firebase, MMKV)
│   │   │   └── FirebaseChartRepository.ts
│   │   └── presentation/        ← screens, components, store
│   │       ├── ChartDashboardScreen.tsx
│   │       └── store/chartStore.ts
│   ├── destiny/
│   └── planning/
├── shared/                      ← core, utils, types cross-feature
│   ├── di/                      ← DI container
│   ├── storage/                 ← MMKV wrapper
│   └── errors/
└── App.tsx
```

**So sánh:**
| | Layer-based | Feature-based |
|---|-------------|---------------|
| Cấu trúc | `src/entities/`, `src/usecases/` | `src/features/chart/domain/...` |
| Cohesion | Thấp (feature rải rác) | **Cao** (mọi thứ feature cùng folder) |
| Scale | Tệ khi nhiều feature | Tốt |
| Delete feature | Khó (touch nhiều folder) | Xoá 1 folder |

**Gotcha:**
- **Cross-feature dependency** — feature A dùng entity B → import `features/B/domain` hoặc promote lên `shared/`.
- Đừng over-folder — 2-3 file nhỏ gộp vào 1 file OK, không cần chia từng file.
- TypingAstro dùng **feature-based** — mỗi module (Chart, Destiny, Planning, FengShui) self-contained, dễ onboard.
- **Follow-up:** *"Khi nào chọn layer-based?"* — app đơn domain, ít feature, layer rõ ràng.

---

## 4. Dependency Injection trong RN? 🔥

**Ngắn:** **DI (Dependency Injection)** = cung cấp dependency (repo, service) từ ngoài vào use case/presentation qua **constructor/param**, không để use case tự `new` dependency. → Testable + swappable.

**Đào sâu:**
```ts
// ❌ Không DI — use case tự new repo → hard dependency
class GenerateChartUseCase {
  private repo = new FirebaseChartRepository();  // hard-coded
}

// ✅ DI — inject qua constructor
class GenerateChartUseCase {
  constructor(private repo: IChartRepository) {}
}

// Wire ở root (composition root)
const chartRepo = new FirebaseChartRepository();
const generateChart = new GenerateChartUseCase(chartRepo);
```

**Cách implement trong RN:**
1. **Manual composition root** — wire tay ở `App.tsx` / context.
2. **DI Container** — `tsyringe`, `InversifyJS`, `typed-inject` — register + resolve tự động.
3. **React Context** — provide use case qua context, screen `useInject`.

```ts
// shared/di/container.ts (tsyringe)
import { container } from 'tsyringe';
container.registerSingleton('IChartRepository', FirebaseChartRepository);
container.register(GenerateChartUseCase, { useFactory: c =>
  new GenerateChartUseCase(c.resolve('IChartRepository')) });

// screen
const generateChart = container.resolve(GenerateChartUseCase);
```

**Gotcha:**
- **Over-engineering** nếu dùng DI container phức tạp cho app nhỏ → manual composition root đủ.
- React Context DI → re-render risk nếu value đổi → memoize context value.
- **Follow-up:** *"Test use case thế nào?"* — inject **mock repo** → assert use case gọi repo đúng method với đúng param.

---

## 5. Tách business logic khỏi UI thế nào?

**Ngắn:** UI (presentation) chỉ lo **render + user event**; business logic (rule, calc, validation) nằm ở **use case / domain service**; data access ở **repo**.

**Đào sâu — dấu hiệu VI PHẠM:**
```tsx
// ❌ Logic trong component
const ChartScreen = () => {
  const [chart, setChart] = useState(null);
  useEffect(() => {
    const palaces = computePalaces(date);  // business logic in UI!
    const validated = validateChart(palaces);  // validation in UI!
    firebase.firestore().set({ chart: validated });  // data access in UI!
    setChart(validated);
  }, []);
};

// ✅ Tách
const ChartScreen = () => {
  const { mutate } = useGenerateChart();
  return <Button onPress={() => mutate(date)} />;
};
// useGenerateChart → GenerateChartUseCase → ChartRepository
```

**Quy tắc:**
- **Component** chỉ: render, sự kiện user, format display.
- **Hook** (`useXxx`) — orchestrate UI state, gọi use case.
- **Use case** — business rule.
- **Repo** — data I/O.

**Gotcha:**
- Validation form có thể ở UI (cheap, view-specific), nhưng **business validation** (rule Qimen) phải ở domain.
- Format date/number display OK ở UI, nhưng **calc ngày mùng 1 tháng nhuận** phải ở domain.
- **Follow-up:** *"Test component thế nào?"* — nếu logic tách ra use case, test use case thuần; component test chỉ UI render.

---

## 6. Unit-testable use cases — làm sao?

**Ngắn:** Use case có thể test ** thuần TS**, không cần emulator/Firebase, bằng cách inject **mock repo**.

**Đào sâu:**
```ts
// usecase
class GenerateChartUseCase {
  constructor(private repo: IChartRepository) {}
  async execute(date: Date): Promise<QimenChart> {
    if (date > new Date()) throw new ValidationError('future');
    const cached = await this.repo.findByDate(date);
    if (cached) return cached;
    const chart = computeChart(date);
    await this.repo.save(chart);
    return chart;
  }
}

// test (Jest)
describe('GenerateChartUseCase', () => {
  it('throws on future date', async () => {
    const mockRepo = { findByDate: jest.fn(), save: jest.fn() };
    const uc = new GenerateChartUseCase(mockRepo as any);
    await expect(uc.execute(futureDate)).rejects.toThrow(ValidationError);
  });

  it('returns cached chart', async () => {
    const cached = new QimenChart([]);
    const mockRepo = { findByDate: jest.fn().resolves(cached), save: jest.fn() };
    const uc = new GenerateChartUseCase(mockRepo as any);
    const result = await uc.execute(date);
    expect(result).toBe(cached);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
```

**Gotcha:**
- Test **chạy nhanh** (\&lt;10ms) vì không I/O — CI có thể chạy hàng trăm test.
- Test cover: happy path, edge case, error path (repo throw → use case handle đúng).
- **Follow-up:** *"Test component thế nào?"* — React Testing Library / `@testing-library/react-native`, render + assert.

---

## 7. Swappable data source (REST ↔ Mock ↔ Firebase)?

**Ngắn:** Vì use case phụ thuộc **interface repo** (không phải impl), có thể swap impl: prod dùng `FirebaseChartRepository`, dev/test dùng `MockChartRepository`, không đổi use case.

**Đào sâu:**
```ts
// Interface
interface IChartRepository {
  findByDate(date: Date): Promise<QimenChart | null>;
  save(chart: QimenChart): Promise<void>;
}

// 3 impl swappable
class FirebaseChartRepository implements IChartRepository { ... }
class RESTChartRepository implements IChartRepository { ... }
class MockChartRepository implements IChartRepository {
  async findByDate() { return new QimenChart([mockPalace]); }
}

// Wire theo env
const repo = __DEV__
  ? new MockChartRepository()
  : new FirebaseChartRepository();
const useCase = new GenerateChartUseCase(repo);
```

**Gotcha:**
- Interface phải cover mọi method cần — nếu.Firebase-specific method lọt vào interface → swap khó.
- **MMKV cache** có thể là repo wrapper — `CacheChartRepository` decorate `FirebaseChartRepository` (decorator pattern).
- TypingAstro: swap Firebase ↔ REST backend (khi migrate) mà không động use case → điểm cộng clean arch.
- **Follow-up:** *"Caching nằm ở đâu?"* — repo decorator (transparent với use case), hoặc use case tự gọi 2 repo.

---

## 8. Error handling strategy xuyên suốt các layer?

**Ngắn:** Mỗi layer có error type riêng, **wrap/rethrow** khi cross layer:
- **Infra** → throw technical error (`NetworkError`, `FirebaseError`).
- **Use case** → catch infra error, throw **domain error** (`ChartNotFound`, `InvalidDate`).
- **Presentation** → catch domain error, hiển thị user-friendly message.

**Đào sâu:**
```ts
// shared/errors
class DomainError extends Error { code: string; }
class ChartNotFound extends DomainError { code = 'CHART_NOT_FOUND'; }

// use case
async execute(id: string) {
  try {
    const chart = await this.repo.find(id);
    if (!chart) throw new ChartNotFound(id);
    return chart;
  } catch (e) {
    if (e instanceof DomainError) throw e;
    throw new ChartFetchFailed(id, e);  // wrap infra error
  }
}

// presentation
try {
  await generateChart.execute(id);
} catch (e) {
  if (e instanceof ChartNotFound) showEmptyState();
  else showErrorToast(t('errors.generic'));
}
```

**Gotcha:**
- **Don't swallow error** — `catch {}` rồi return null → debug nightmare.
- Sentry bắt error ở **global handler** (presentation root), kèm scope (user, route) để debug prod.
- TypingAstro: domain error map sang i18next key (`errors.chartNotFound`) → hiển thị đa ngôn ngữ.
- **Follow-up:** *"Error boundary RN?"* — React Error Boundary catch render error, hiển thị fallback, log Sentry.

---

## 9. Feature-based vs layer-based folders?

**Ngắn:** Xem lại câu 3 — **feature-based** = mỗi feature self-contained (domain/infra/presentation); **layer-based** = gộp theo layer (`src/entities`, `src/usecases`...).

**Đào sâu — trade-off:**
| | Feature-based | Layer-based |
|---|---------------|-------------|
| Cohesion | ✅ Cao | ❌ Thấp |
| Navigate | Dễ (mở 1 folder) | Phải search |
| Cross-feature | Import `features/B/domain` | Import `src/entities/B` |
| Scale (nhiều feature) | ✅ Tốt | ❌ Folder phình |
| Shared code | `shared/` rõ ràng | Trộn |
| Refactor delete | ✅ Xoá folder | ❌ Touch nhiều nơi |

**Gotcha:**
- **Hybrid** — feature-based cho business module, layer-based cho `shared/` (cross-cutting).
- Don't create folder cho 1 file — gộp nếu ít (VD 1 entity 1 file OK, không cần `entities/Chart/`).
- **Follow-up:** *"Monorepo feature-based?"* — yes, mỗi feature = package, share qua workspace.

---

## 10. State & navigation nằm ở đâu trong clean arch? 🔥

**Ngắn:** State (Zustand/Redux) và navigation thuộc **presentation layer** — chúng là **UI infrastructure**, không phải business logic.

**Đào sâu:**
```
presentation/
├── store/                ← Zustand stores (UI state: selected tab, form input)
│   ├── authStore.ts      ← auth state (token, user) — UI-facing
│   ├── chartStore.ts     ← chart list cache (display)
│   └── settingsStore.ts
├── navigation/           ← React Navigation config
└── screens/
```

**Phân biệt:**
- **UI state** (selected tab, form input, toast) → Zustand store.
- **Domain state** (chart đã generate) → entity trong use case result, không lưu store trừ khi cache display.
- **Auth state** → Zustand (token) + Firebase Auth (source of truth), store mirror cho UI nhanh.

**Gotcha:**
- **Don't put business rule trong store** — store chỉ holds state, gọi use case khi action.
  - ❌ `authStore.login` chứa validation rule.
  - ✅ `authStore.login` gọi `LoginUseCase.execute`, store chỉ set result.
- **Navigation logic** — keep trong hook (`useAuthNavigation` redirect theo auth state), không rải rác trong use case.
- TypingAstro: Zustand store ở presentation, gọi use case qua DI; **persist** (MMKV) chỉ cho UI state (theme, locale), không cho business cache (cache nằm repo).
- **Follow-up:** *"Cache data đâu, store hay repo?"* — repo (domain concern, swappable), store chỉ mirror cho display.

---

🔗 [Quay lại README react-native](./index.md)

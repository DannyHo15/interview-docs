# 🔡 04 — TypeScript (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. `type` vs `interface`? 🔥

**Ngắn:**
- `interface`: mô tả **object shape**, **extend** được (declaration merging), phù hợp API public / library.
- `type` alias: gán tên cho **bất kỳ** type (object, union, primitive, function), linh hoạt hơn.

| | `interface` | `type` |
|---|---|---|
| Object shape | ✅ | ✅ |
| Union/intersection | ❌ (dùng `extends`) | ✅ (`A \| B`, `A & B`) |
| Primitive alias | ❌ | ✅ (`type ID = string`) |
| Declaration merging | ✅ (cùng tên → gộp) | ❌ |
| Mở rộng | `extends` | `&` (intersection) |

**Đào sâu:**
- **Declaration merging**: 2 `interface User` cùng tên → tự gộp. Hữu ích cho lib augment (vd thêm field cho `Window`).
- `type` biểu diễn union phức tạp (`type State = 'idle' | 'loading' | 'done'`) — `interface` không làm được.
- **Performance**: TS compile `interface` nhanh hơn một chút với object lớn (TS cache), nhưng thực tế không đáng kể.

**Quy tắc thực chiến:**
- Library/API public → `interface` (người dùng có thể augment).
- Internal type phức tạp (union, mapped, conditional) → `type`.
- Đội có convention → theo convention.

**Gotcha:**
- `interface` extend type cũng được (`interface X extends Y {}`), và ngược lại.
- **EVN GENCO3** + **Avatar48 DApp**: dùng `interface` cho API contract (DTO từ NestJS), `type` cho union (status, action).
- **Follow-up:***"Khi nào nhất thiết interface?"* → khi cần **declaration merging** (augment module third-party) hoặc khi xuất type cho consumer lib.

---

## 2. Generics? 🔥

**Ngắn:** Generic cho viết **code tái sử dụng** với type là tham số — giữ type safety mà không cần `any`.

```tsx
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const n = first([1, 2, 3]);   // number
const s = first(['a', 'b']);  // string
```

**Đào sâu:**
- **Constraint** (`<T extends Shape>`): giới hạn T phải thoả `Shape`.
- **Default** (`<T = string>`): type mặc định nếu không chỉ định.
- **Inference**: TS tự suy `T` từ arg → không cần viết `first<number>([1,2])`.
- **Multi generic**: `<K, V>` cho Map.

```tsx
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
getProperty({ name: 'A', age: 1 }, 'name');  // string
```

**Gotcha:**
- Generic **không phải any** — TS vẫn check type. Đừng "escape hatch" bằng `<T = any>`.
- Generic trong component React: `function List<T>({ items, render }: { items: T[]; render: (x: T) => JSX.Element })`.
- **Avatar48 DApp** + **EVN**: `useQuery<TokensResponse>` (React Query) → data typed, tránh cast thủ công.
- **Follow-up:***"Generic vs function overloading?"* → overloading cho signature khác nhau (vd `fetch(id)` vs `fetch(ids[])`); generic cho cùng pattern với type khác.

---

## 3. Utility types (Partial/Pick/Omit/Record/ReturnType)?

**Ngắn:** Built-in type helper dùng mapped type:
- `Partial<T>` — tất cả field thành optional.
- `Required<T>` — tất cả field required.
- `Pick<T, K>` — chọn vài field.
- `Omit<T, K>` — bỏ vài field.
- `Record<K, V>` — `{ [k: K]: V }`.
- `ReturnType<F>` — type trả về của function.
- `Parameters<F>` — tuple các tham số.
- `Readonly<T>` — tất cả field readonly.

```tsx
type User = { id: number; name: string; email: string };

type UserPatch = Partial<User>;              // { id?: number; name?: string; email?: string }
type UserPreview = Pick<User, 'id' | 'name'>; // { id: number; name: string }
type UserCreate = Omit<User, 'id'>;           // { name: string; email: string }
type UserMap = Record<number, User>;          // { [k: number]: User }
```

**Đào sâu:**
- Tự viết utility: `type MyPartial<T> = { [K in keyof T]?: T[K] }`.
- `Awaited<Promise<T>>` → unwrap nested promise (dùng cho async function return type).

**Gotcha:**
- `Partial` không deep — `Partial<{ user: { name: string } }>` cho `user?: …` nhưng `name` vẫn required. Cần `DeepPartial` tự viết cho nested.
- **LoLamBenhAn** dynamic form: `Omit<Schema, 'id'>` cho create form, `Partial<Schema>` cho update — reuse 1 type.
- **Follow-up:***"Record vs Map?"* → Record là type compile-time; Map là runtime object với API. Record cho plain object key-value; Map khi cần iterate/insert order/any key type.

---

## 4. Type narrowing?

**Ngắn:** TS thu hẹp type dựa trên **type guard** (kiểm tra runtime) → truy cập field an toàn.

**Các cách narrow:**
```tsx
// typeof
if (typeof x === 'string') x.toUpperCase();

// instanceof
if (e instanceof Error) e.message;

// in (check field)
if ('name' in obj) obj.name;

// Equality
if (x === null) /* x: null */;

// User-defined type predicate
function isUser(x: unknown): x is User {
  return x != null && typeof x.name === 'string';
}
if (isUser(data)) data.name;  // User
```

**Đào sâu:**
- TS **flow analysis**: trong nhánh if, type narrow; ra ngoài → widen về cũ.
- `x is User` (type predicate) → extensible, dùng cho runtime validation kết hợp type.
- **Zod** / **io-ts** / **valibot** → runtime parse + trả type — kết hợp narrowing + validation.

**Gotcha:**
- Narrow mất sau function call — TS không theo dõi mutation. VD `arr.filter(Boolean)` → type vẫn `(T | null)[]` (cũ). Fix: `arr.filter((x): x is T => x != null)`.
- **Avatar48 DApp** (blockchain): response từ RPC là `unknown` → Zod parse → type-safe.
- **Follow-up:***"TypeScript vs runtime validation?"* → TS chỉ compile-time (xem câu 10); data từ API/network không được check → cần runtime validation (Zod).

---

## 5. Discriminated unions? 🔥

**Ngắn:** Union mà mỗi variant có **field chung (discriminant)** với giá trị khác → TS narrow dựa trên field đó.

```tsx
type Result =
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error }
  | { status: 'loading' };

function handle(r: Result) {
  switch (r.status) {
    case 'success': return r.data;       // narrowed: có data
    case 'error':   return r.error.message; // narrowed: có error
    case 'loading': return null;          // không có data/error
  }
}
```

**Đào sâu:**
- Discriminant thường là `type` / `kind` / `status` (string literal).
- **Exhaustiveness check**: thêm `default: const _: never = r;` → nếu thêm variant mới mà quên case → TS báo lỗi.
- Pattern này áp dụng cho **state machine** (Redux action, useReducer, xstate).

**Gotcha:**
- Discriminant **phải là literal type** (`'success'`), không phải `string` — nếu `status: string` thì TS không narrow được.
- **LoLamBenhAn** form: state form = discriminated union (`draft | submitting | submitted | error`) → handle mỗi state rõ ràng, không quên case.
- **Follow-up:***"Exhaustiveness là gì?"* → đảm bảo xử lý hết mọi case; dùng `never` để compiler bắt quên case khi union mở rộng.

---

## 6. `unknown` vs `any`? 🔥

**Ngắn:**
- `any`: **tắt** type check — assignable mọi nơi, không cảnh báo. Tránh tuyệt đối.
- `unknown`: **top type an toàn** — nhận mọi giá trị nhưng **phải narrow** trước khi dùng.

```tsx
// any — escape hatch
const a: any = JSON.parse(s);
a.foo.bar();   // ❌ runtime error, TS im

// unknown — bắt phải narrow
const u: unknown = JSON.parse(s);
u.foo;          // ❌ TS error
if (typeof u === 'object' && u !== null && 'foo' in u) {
  u.foo;        // ✅ safe
}
```

**Đào sâu:**
- `JSON.parse` trả `any` (theo chuẩn) — best practice cast sang `unknown` rồi validate.
- `catch (e)` mặc định `unknown` (TS 4.4+) — phải narrow để truy cập `e.message`.

**Gotcha:**
- `any` truyền nhiễm: gán `any` cho biến khác → biến kia cũng mất type → lan bug.
- Prefer `unknown` ở boundary (API, JSON, third-party) + Zod parse → type-safe.
- **Follow-up:***"Khi nào chấp nhận any?"* → migrate dần JS → TS, hoặc third-party lib k có type; tạo `// @ts-expect-error` có comment lý do.

---

## 7. `keyof` & `typeof`?

**Ngắn:**
- `typeof X`: lấy type của **giá trị** X (runtime → compile type).
- `keyof T`: union các **key** của type T.

```tsx
const config = { host: 'x', port: 3000 } as const;
type Config = typeof Config;            // { host: string; port: number }
type ConfigKey = keyof Config;          // 'host' | 'port'

function get<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }
```

**Đào sâu:**
- `typeof` hữu ích khi derive type từ constant/object → tránh duplicate.
- `keyof` kết hợp generic cho lookup an toàn (xem `getProperty` ở câu 2).

**Gotcha:**
- `as const` → biến thành **literal type** (`port: 3000` thay vì `number`). Cần khi muốn enum-like từ const.
- `keyof any` = `string | number | symbol` — type key hợp lệ.
- **EVN**: `typeof` để derive theme token từ JS object → CSS-in-JS type-safe.
- **Follow-up:***"typeof trong JS vs TS?"* → JS `typeof` trả string runtime (`'object'`); TS `typeof` lấy type compile. Khác hoàn toàn.

---

## 8. Enum pitfalls?

**Ngắn:** Enum TS có nhiều issue — cộng đồng recommend **union literal type** thay enum trừ khi cần reverse mapping.

**Vấn đề enum:**
- **Numeric enum không type-safe**: `enum E { A, B }` → `E.A` là số, có thể gán `let x: E = 5` (mặc dù 5 không có).
- **Reverse mapping** numeric enum tạo object 2 lần kích thước.
- **`const enum`**: bị deprecated tính năng, không interop tốt với babel/isolatedModules.
- Không tree-shake tốt.

**Thay thế:**
```tsx
// ❌ Enum
enum Status { Idle, Loading, Done }

// ✅ Union literal
type Status = 'idle' | 'loading' | 'done';

// ✅ Const object + typeof
const STATUS = { Idle: 'idle', Loading: 'loading', Done: 'done' } as const;
type Status = typeof STATUS[keyof typeof STATUS];
```

**Đào sâu:**
- Union literal tree-shake tốt, no runtime code.
- `as const` giữ literal type → compile-time check exhaustiveness.

**Gotcha:**
- **String enum** an toàn hơn numeric nhưng vẫn có runtime overhead.
- Nhiều style guide (TypeScript ESLint) cấm enum, bắt union.
- **Follow-up:***"Khi nào enum OK?"* → legacy code, hoặc khi cần reverse lookup (`Status[0]` → `'Idle'`).

---

## 9. `tsconfig` strict & các flag quan trọng?

**Ngắn:** `"strict": true` bật tất cả check nghiêm ngặt. Ngoài ra có flag riêng:

```json
{
  "compilerOptions": {
    "strict": true,                 // bật hết dưới
    "noUncheckedIndexedAccess": true, // arr[i] → T | undefined
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true  // rất strict
  }
}
```

**Flag strict bật:**
- `noImplicitAny` — cấm `any` ẩn (VD tham số không type).
- `strictNullChecks` — `null/undefined` không gán cho type khác → phải handle.
- `strictFunctionTypes`, `strictBindCallApply`, `alwaysStrict`, `useUnknownInCatchVariables`.

**Đào sâu:**
- `noUncheckedIndexedAccess` cực mạnh: `arr[0]` là `T | undefined` (vì index có thể out-of-bound) → bắt handle empty array.
- Project reference (`composite: true`) cho monorepo (Nx) → build incremental nhanh.

**Gotcha:**
- Bật strict từ đầu — migrate code JS → TS mà không strict sẽ trả nợ.
- `strictNullChecks` bắt buộc cho code production — không bật = `null` lan như virus.
- **Follow-up:***"strict chậm build?"* → strict check tốn một chút, nhưng bắt bug sớm → đáng. Dùng `incremental: true` + project reference để build nhanh.

---

## 10. Type erasure — type chỉ compile-time?

**Ngắn:** TS **xóa type** khi compile sang JS — type **không tồn tại runtime**. → Type chỉ check lúc build, **không validate runtime**.

```tsx
const x: number = JSON.parse('"abc"');  // TSOK (cast), runtime: x === 'abc' (string!)
```

**Hệ quả:**
- Data từ API/JSON/user input → type là **lời nói dối** nếu không validate runtime.
- Cần **runtime validation**: Zod, io-ts, valibot, class-validator (NestJS) → parse + trả type-safe.

```tsx
import { z } from 'zod';
const UserSchema = z.object({ id: z.number(), name: z.string() });
type User = z.infer<typeof UserSchema>;   // type from schema!

const data: unknown = await res.json();
const user = UserSchema.parse(data);      // throw nếu sai → user: User
```

**Đào sâu:**
- `interface` không emit code runtime → OK cho lib size.
- `enum`/`class` **có** emit runtime code.
- NestJS dùng **class-validator** + **DTO class** để validate ở controller boundary.

**Gotcha:**
- `as` chỉ là lời nói với TS, **không cast thật** runtime → `(x as User).name` vẫn crash nếu `x` không phải User.
- **Avatar48 DApp** + **EVN GENCO3** + **LoLamBenhAn**: response từ NestJS backend → validate bằng Zod/class-validator ở client → không tin type mà chưa validate.
- **Follow-up:***"Branded/opaque type là gì?"* → type đánh dấu để **phân biệt** 2 type cùng underlying (vd `UserId` vs `OrderId` đều `string` nhưng không gán chéo) → tránh bug nhầm ID. Implement:
```tsx
type Brand<T, B> = T & { __brand: B };
type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;
```

---

🔗 [Quay lại README frontend](./index.md)

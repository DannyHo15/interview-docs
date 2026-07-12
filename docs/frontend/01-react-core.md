# ⚛️ 01 — React Core (Câu hỏi kinh điển)

> Mỗi câu trình bày theo 3 lớp: **Định nghĩa ngắn gọn → Giải thích sâu → Bẫy & câu hỏi nối tiếp**. Ký hiệu 🔥 = câu cực hay gặp trong phỏng vấn.

---

## 1. Virtual DOM & Reconciliation là gì? 🔥

**Định nghĩa ngắn:**

- **Virtual DOM (VDOM)** là một bản sao của cây DOM, nhưng được biểu diễn dưới dạng các **object JavaScript** nằm trong bộ nhớ. React thao tác trên bản sao này trước, vì thao tác trên object JS rất nhanh, trong khi thao tác trực tiếp lên DOM thật thì chậm (mỗi lần đổi DOM có thể kích hoạt tính toán layout và vẽ lại màn hình).
- **Reconciliation** là thuật toán React dùng để **so sánh** cây VDOM cũ với cây VDOM mới, tìm ra phần khác biệt nhỏ nhất, rồi chỉ cập nhật đúng những node trên DOM thật đã thực sự thay đổi.

**Giải thích sâu:**

- Một node trong VDOM thực chất chỉ là một object đơn giản, ví dụ: `{ type: 'div', props: {…}, children: […] }`.
- Khi so sánh hai cây, React dùng một **heuristic có độ phức tạp O(n)** thay vì so sánh chính xác (vốn tốn O(n³)). Quy tắc chính: nếu hai node khác `type` thì React thay luôn toàn bộ nhánh con; nếu cùng `type` thì React chỉ so sánh props và cập nhật phần chênh lệch.
- Cần hiểu đúng bản chất: VDOM **không phải "nhanh hơn DOM"**. Nó chỉ là một lớp trung gian, giúp React gộp nhiều thay đổi lại (batch update) và tránh việc đọc/ghi DOM xen kẽ liên tục gây "layout thrashing".
- Từ React 16 trở đi, React thay cây VDOM đơn thuần bằng cấu trúc **Fiber** (xem câu 2) để có thể tạm dừng và tiếp tục quá trình render.

**Bẫy thường gặp:**

- Câu "VDOM luôn nhanh hơn thao tác DOM trực tiếp" là **sai**. Nếu chỉ cần đổi một node (ví dụ `el.textContent = …`), thao tác trực tiếp nhanh hơn. VDOM chỉ có lợi khi UI phức tạp và state thay đổi rải rác ở nhiều nơi.
- **Câu hỏi nối tiếp:** *"Tại sao Svelte và SolidJS không dùng VDOM mà vẫn nhanh?"* → Vì chúng phân tích ngay từ lúc **biên dịch (compile-time)** để biết chính xác chỗ nào sẽ thay đổi, nên cập nhật thẳng vào DOM mà không cần so sánh (diff) lúc chạy.

---

## 2. Kiến trúc Fiber hoạt động như thế nào?

**Định nghĩa ngắn:** Fiber là cấu trúc dữ liệu được giới thiệu từ React 16, dùng để biểu diễn cây component. Điểm quan trọng là nó cho phép React **tạm dừng rồi tiếp tục** quá trình render, nhờ đó bật được tính năng **concurrent** (render có thể bị ngắt giữa chừng).

**Giải thích sâu:**

- Mỗi component tương ứng với một **Fiber node**. Các node liên kết với nhau như một danh sách liên kết, mỗi node biết cha, node anh em kế bên (sibling), và node con của nó.
- Quá trình render được chia thành nhiều **đơn vị công việc nhỏ (unit of work)**. Nhờ vậy, React có thể **nhường quyền (yield)** lại cho trình duyệt giữa chừng để xử lý thao tác của người dùng, rồi quay lại làm tiếp.
- Render được chia làm 2 giai đoạn:
  - **Render phase** (có thể bị ngắt): React tính toán phần khác biệt. Giai đoạn này phải **thuần khiết (pure)**, tức là không được có side effect.
  - **Commit phase** (chạy đồng bộ, không bị ngắt): React áp phần khác biệt lên DOM thật, rồi chạy `useLayoutEffect`.
- `useEffect` chạy **sau khi commit xong**, và chạy bất đồng bộ.

**Bẫy thường gặp:**

- Render phase **có thể chạy lại nhiều lần** (ví dụ trong Strict Mode hoặc chế độ concurrent). Vì vậy, đặt side effect ngay trong thân hàm render sẽ gây **bug** (gọi API hai lần, tăng biến hai lần...). Hãy đưa side effect vào `useEffect` hoặc vào hàm xử lý sự kiện.
- **Câu hỏi nối tiếp:** *"Tại sao React cần tạm dừng render?"* → Để giữ UI mượt ở 60fps. Nếu một lần render nặng mất 100ms, luồng chính (main thread) bị chặn suốt 100ms đó, khiến thao tác nhập liệu bị giật. Fiber cho phép React nhường CPU giữa chừng.

---

## 3. Tại sao `key` lại quan trọng? 🔥

**Định nghĩa ngắn:** `key` giúp thuật toán reconciliation **nhận diện (identity)** mỗi phần tử qua các lần render, nhờ đó React biết chính xác item nào được thêm, sửa, hay xoá, thay vì phải render lại cả danh sách.

**Giải thích sâu:**

- Nếu không có `key` (hoặc dùng chỉ số `index` làm key), React mặc định **giữ nguyên phần tử theo vị trí**. Khi bạn xoá item đầu tiên, React sẽ **tái sử dụng** node của item đầu cho item thứ hai, chỉ đổi props. Hậu quả: **state bị lẫn lộn** — ví dụ ô input của dòng A lại hiển thị giá trị của dòng B.
- `key` cần **ổn định, duy nhất, và dự đoán được**. Tốt nhất là dùng `item.id`.
- Chỉ nên dùng `index` khi danh sách là **tĩnh** (không thêm, xoá, hay sắp xếp lại).

**Bẫy thường gặp:**

```tsx
// ❌ key={index}: khi đổi thứ tự, state của input nhảy lung tung
{items.map((it, i) => <Row key={i} value={it} />)}

// ✅ key={it.id}: React nhận diện đúng từng dòng
{items.map(it => <Row key={it.id} value={it} />)}
```

- **Ví dụ thực tế (dự án Avatar48 DApp):** danh sách lịch sử giao dịch được thêm liên tục từ WebSocket. Nếu dùng `index` làm key, mỗi dòng sẽ bị **mount lại (re-mount)**, khiến `useEffect` bên trong dòng đó chạy lại (vẽ lại biểu đồ mini, chạy lại animation) và gây **giật lag**. Đổi sang dùng `trade.id` thì React tái sử dụng được node cũ, hết lag.
- **Câu hỏi nối tiếp:** *"Key có cần duy nhất trên toàn ứng dụng không?"* → Không. `key` chỉ cần duy nhất **trong các phần tử anh em cùng một cha**.

---

## 4. Controlled vs Uncontrolled component? 🔥

**Định nghĩa ngắn:**

- **Controlled component:** giá trị của input được điều khiển bởi **React state** (thông qua cặp `value` + `onChange`). React là "nguồn chân lý duy nhất" (single source of truth).
- **Uncontrolled component:** input tự giữ giá trị trong DOM. React không quản lý, chỉ **đọc** giá trị khi cần qua `ref` (thường dùng `defaultValue` + `useRef`).

| | Controlled | Uncontrolled |
|---|---|---|
| Nguồn chân lý | React state | DOM |
| Validate / biến đổi giá trị | Dễ, làm được ngay mỗi lần gõ phím | Khó, thường phải đợi lúc submit |
| Hiệu năng | Re-render sau mỗi lần gõ phím | Không gây re-render |
| Khi nào dùng | Form cần validation theo thời gian thực | Form đơn giản, input file, tích hợp với thư viện ngoài React |

**Giải thích sâu:**

- **Ví dụ thực tế (dự án LoLamBenhAn — form bệnh án động):** dùng **React Hook Form + Zod**. React Hook Form về bản chất hoạt động theo kiểu **uncontrolled** (dùng `ref`), chỉ đọc giá trị khi submit hoặc khi gọi `getValues`. Nhờ vậy nó xử lý mượt với form có hơn 1000 field, vì **không re-render toàn bộ form sau mỗi lần gõ phím**.
- Nếu làm controlled thuần với 1000 field, mỗi lần gõ phím sẽ gọi `setState` và **render lại toàn bộ form**, gây lag nặng.

**Bẫy thường gặp:**

- Phân biệt `defaultValue` và `value`: nếu bạn truyền `value` mà quên `onChange`, React sẽ cảnh báo input này "chỉ đọc" (read-only).
- Input file (`<input type="file">`) **bắt buộc phải là uncontrolled**, vì lý do bảo mật, JavaScript không được phép gán giá trị file.
- **Câu hỏi nối tiếp:** *"Khi nào bắt buộc phải dùng controlled?"* → Khi giá trị input phụ thuộc vào state khác (ví dụ nút bấm bị disable dựa trên tính hợp lệ của form), hoặc khi cần định dạng lại giá trị ngay lúc người dùng đang gõ.

---

## 5. `useRef` & `forwardRef` dùng khi nào?

**Định nghĩa ngắn:**

- `useRef`: giữ một **giá trị có thể thay đổi (mutable)** mà **không kích hoạt re-render** khi giá trị đổi; hoặc dùng để tham chiếu tới một node DOM.
- `forwardRef`: cho phép component con **nhận ref** từ component cha và chuyển tiếp ref đó vào một node DOM bên trong nó.

**Giải thích sâu:**

- `useRef` khác `useState`: thay đổi `ref.current` **không gây re-render**. Vì vậy nó hợp để lưu cache, lưu id của timer, hoặc lưu giá trị để đọc lại sau này.
- Một pattern phổ biến: kết hợp `useRef` với `useEffect` (kèm cleanup) để gọi các **API mệnh lệnh (imperative)** như focus, scroll, hay đo kích thước.
- Kết hợp `forwardRef` với `useImperativeHandle` để tuỳ chỉnh những gì con muốn "phơi bày" ra cho cha gọi (ví dụ cho cha gọi được `ref.current.focus()`).
- **React 19:** `ref` có thể được truyền như một prop bình thường, không cần bọc bằng `forwardRef` nữa, nên đỡ code thừa.

```tsx
const Input = forwardRef<HTMLInputElement, Props>((props, ref) =>
  <input ref={ref} {...props} />
);
// Ở component cha:
// const ref = useRef();
// <Input ref={ref} />
```

**Bẫy thường gặp:**

- Đừng dùng `useRef` thay cho `useState` khi giá trị đó **cần hiển thị lên UI** — vì đổi ref không re-render, UI sẽ không cập nhật.
- Dạng `ref` là một callback (hàm) hữu ích khi bạn cần dọn dẹp (ví dụ huỷ một observer) lúc phần tử bị unmount.
- **Câu hỏi nối tiếp:** *"Làm sao lấy kích thước của một element?"* → Dùng `useRef` + `getBoundingClientRect()` trong `useLayoutEffect` (chạy đồng bộ trước khi trình duyệt vẽ), hoặc dùng `ResizeObserver` nếu kích thước thay đổi liên tục.

---

## 6. Synthetic Event của React vs native event?

**Định nghĩa ngắn:** React bọc event gốc của DOM thành một đối tượng **SyntheticEvent** — một lớp API thống nhất trên mọi trình duyệt, có cùng interface (`e.target`, `e.preventDefault()`, `e.stopPropagation()`).

**Giải thích sâu:**

- Từ React 17, React **không** còn gắn listener ở `document` nữa mà gắn ở **node gốc của app (root container)**. Thay đổi này giúp tránh xung đột thứ tự sự kiện khi trang có nhiều bản React hoặc dùng chung với thư viện khác.
- **Event pooling (chỉ ở React < 17):** đối tượng event được tái sử dụng để tiết kiệm bộ nhớ, nên sau khi callback chạy xong, `e` sẽ bị "làm rỗng" (phải gọi `e.persist()` nếu muốn dùng lại). **Từ React 17, cơ chế pooling bị bỏ**, nên không cần `persist()` nữa.
- Dùng `e.nativeEvent` khi cần truy cập vào event gốc của trình duyệt.

**Bẫy thường gặp:**

- Sự kiện của React lan (bubble) theo **cây React**, không theo cây DOM thật. Vì vậy nếu bạn gọi `stopPropagation` trên một native event (ví dụ gắn qua `addEventListener` trong `useEffect`), sự kiện React vẫn có thể tiếp tục chạy.
- **Câu hỏi nối tiếp:** *"Tại sao không tự gắn `addEventListener` mà lại dùng `onClick`?"* → Vì React chỉ gắn một listener duy nhất ở node gốc rồi tự phân phối sự kiện, tiết kiệm bộ nhớ hơn so với gắn listener cho từng phần tử.

---

## 7. Render phase vs Commit phase?

**Định nghĩa ngắn:**

- **Render phase:** React gọi hàm component để tính toán phần khác biệt của VDOM. Giai đoạn này **thuần khiết** và **có thể bị ngắt** (trong chế độ concurrent).
- **Commit phase:** React áp phần khác biệt lên DOM thật rồi chạy `useLayoutEffect` (đồng bộ), sau đó mới chạy `useEffect` (bất đồng bộ).

**Giải thích sâu:**

- Hàm setter của `useState` **không đổi state ngay lập tức** — nó chỉ lên lịch cho một lần render mới.
- Commit phase chạy **đồng bộ**, nên nếu nó làm việc nặng thì sẽ chặn việc vẽ màn hình và gây giật (jank).
- `useLayoutEffect` chạy **sau khi DOM đã thay đổi nhưng trước khi trình duyệt vẽ** — hợp khi cần đo layout rồi chỉnh lại ngay (ví dụ tính vị trí tooltip). `useEffect` chạy **sau khi đã vẽ xong**, nên không chặn việc hiển thị.

**Bẫy thường gặp:**

- Đặt side effect ngay trong render phase (ví dụ gọi setState trong thân hàm component) sẽ gây bug (thường là vòng lặp vô hạn).
- **Câu hỏi nối tiếp:** *"Khi nào dùng `useEffect`, khi nào dùng `useLayoutEffect`?"* → Đa số trường hợp dùng `useEffect`. Chỉ dùng `useLayoutEffect` khi bạn thấy hiện tượng **nhấp nháy (flicker)** — tức UI hiện ra một nhịp rồi mới bị effect chỉnh lại layout.

---

## 8. React 18 concurrent (`useTransition` / `useDeferredValue`)? 🔥

**Định nghĩa ngắn:** Chế độ concurrent cho phép React **ngắt quá trình render giữa chừng**, để ưu tiên các cập nhật gấp (như gõ input) hơn các cập nhật nặng (như render danh sách 10.000 dòng).

**Giải thích sâu:**

- `useTransition`: đánh dấu một cập nhật là **ưu tiên thấp**. Nó trả về `[isPending, startTransition]`, trong đó `isPending` cho biết cập nhật nền có đang chạy hay không.
- `useDeferredValue`: **trì hoãn** một giá trị. React sẽ render trước với giá trị cũ, rồi render lại với giá trị mới sau, khi rảnh.
- Ứng dụng điển hình: một **ô tìm kiếm** lọc 10.000 phần tử. Ký tự người dùng gõ được cập nhật ngay (ưu tiên cao), còn việc lọc danh sách chạy ở nền (trì hoãn).

```tsx
const [isPending, startTransition] = useTransition();
const [query, setQuery] = useState('');
const [deferredQ, setDeferredQ] = useState('');

function onChange(e) {
  setQuery(e.target.value);                              // gấp: render ngay
  startTransition(() => setDeferredQ(e.target.value));   // ưu tiên thấp: chạy nền
}
// Danh sách lọc theo deferredQ, nhờ đó ô input không bị giật
```

**Bẫy thường gặp:**

- `useTransition` **không phải phép màu** — nó chỉ sắp xếp lại thứ tự ưu tiên, chứ tổng khối lượng công việc vẫn như cũ. Nếu render mỗi item đã nặng thì vẫn chậm. Cần kết hợp thêm `memo` và virtualization.
- **Câu hỏi nối tiếp:** *"Khác gì so với virtualization?"* → Virtualization giảm **số lượng node DOM** thực sự được vẽ; concurrent thì giảm **độ ưu tiên** của công việc render. Với danh sách cực lớn, nên dùng **cả hai**.

---

## 9. Automatic batching, Portal, Error Boundary, Strict Mode?

**Định nghĩa ngắn (4 khái niệm nhỏ):**

- **Automatic batching (React 18):** React gộp nhiều lần `setState` thành **một lần re-render duy nhất** — kể cả khi các setState nằm trong `setTimeout`, trong promise, hay trong event handler gốc. (React 17 chỉ gộp được trong các event handler của React.)
- **Portal:** render các phần tử con vào **một node DOM ở nơi khác** (thường là `document.body`). Dùng cho modal/tooltip để tránh bị cha có `overflow: hidden` hoặc `z-index` cắt mất.
- **Error Boundary:** một class component có `componentDidCatch` + `getDerivedStateFromError`, dùng để bắt lỗi render của các component con và hiển thị giao diện dự phòng. **Hook không hỗ trợ** error boundary, nên phải dùng class hoặc thư viện ngoài.
- **Strict Mode:** một công cụ chỉ chạy ở môi trường dev, nó **cố tình gọi render và effect hai lần** để giúp phát hiện side effect bị đặt nhầm trong render hoặc trong hàm lẽ ra phải thuần khiết.

**Giải thích sâu:**

- Automatic batching giúp nhiều lần `setState` liên tiếp chỉ tạo **một lần re-render**, nhờ đó đỡ giật.
- Với Portal, dù node DOM nằm tách ra chỗ khác, nhưng trong **cây React nó vẫn là con** — nên sự kiện vẫn lan theo cây React (ví dụ `onClick` trong modal vẫn kích hoạt handler của cha).
- Trong Strict Mode, `useEffect` chạy theo trình tự mount → unmount → mount, giúp bạn kiểm tra xem hàm cleanup có được viết đúng không.

**Bẫy thường gặp:**

- Strict Mode **chỉ chạy đôi ở dev**, còn production thì không. Đừng "sửa" hiện tượng chạy hai lần bằng cách thêm cờ đánh dấu.
- Modal render qua portal mà có bẫy focus (focus trap) thì vẫn phải tự quản lý `aria` và điều hướng bằng bàn phím cho đúng.
- **Câu hỏi nối tiếp:** *"Tại sao effect chạy hai lần?"* → React cố tình giả lập một vòng unmount rồi mount lại để phát hiện các rò rỉ do quên cleanup (quên huỷ subscribe, quên abort fetch...).

---

## 10. Prop drilling và cách giải quyết?

**Định nghĩa ngắn:** Prop drilling là việc phải truyền một prop **xuyên qua nhiều tầng component** chỉ để đưa nó tới nơi thực sự cần dùng. Cách này khiến code khó bảo trì và khó refactor.

**Các cách giải quyết:**

1. **Context API** — chia sẻ state cho cả một nhánh cây component, không cần truyền prop qua từng tầng.
2. **Global store** (Zustand / Redux / Jotai) — bất kỳ component nào cũng lấy được state.
3. **Composition** (dùng `children`, render props, slot pattern) — đẩy phần cần dùng prop xuống trực tiếp thay vì truyền xuyên qua các tầng trung gian.
4. **React Query / server cache** — dành riêng cho dữ liệu lấy từ server (loại state này không nên tự quản lý thủ công).

**Giải thích sâu:**

- Context có nhược điểm: khi giá trị của nó đổi, **mọi component đang tiêu thụ (consumer) đều re-render**. Vì vậy nên **tách nhỏ context** (context cho theme riêng, cho user riêng) để giảm phạm vi ảnh hưởng.
- Zustand cho phép dùng **selector** (`useStore(s => s.user)`), nhờ đó component chỉ re-render khi đúng phần `user` thay đổi, chứ không phải khi bất kỳ phần nào của store đổi.

**Bẫy thường gặp:**

- Đừng vội thêm Redux/Zustand khi prop chỉ đi qua 2 tầng — nhiều khi dùng composition (`children`) là gọn hơn.
- **Ví dụ thực tế (dự án EVN GENCO3):** dashboard hơn 25 module. Dùng **Zustand** cho state toàn cục (thông tin user, theme, trạng thái tab), kết hợp Context tách nhỏ cho phân quyền (RBAC) theo từng module. Nhờ đó tránh việc re-render toàn bộ app mỗi khi đổi tab.
- **Câu hỏi nối tiếp:** *"Khi nào chọn Redux thay vì Zustand?"* → Redux mạnh khi cần bộ **DevTools và middleware phức tạp**, cần điều phối luồng bất đồng bộ kiểu thunk/saga, hoặc khi cả team đã quen. Các trường hợp còn lại thì Zustand gọn nhẹ hơn.

---

🔗 [Quay lại README frontend](./index.md)

# 🔄 08 — Data Fetching Patterns (Câu hỏi kinh điển)

> 5 kỹ thuật **lấy dữ liệu nâng cao** hay gặp ở vòng Mid–Senior: **khử trùng lặp request, cập nhật lạc quan, streaming UI, stale-while-revalidate, và polling thông minh**.
>
> Mỗi câu trình bày theo 3 lớp: **Định nghĩa ngắn → Giải thích sâu → Bẫy & câu hỏi nối tiếp**. Ký hiệu 🔥 = câu cực hay gặp. Các ví dụ gắn với dự án thật: **Avatar48** (React Query + WebSocket cho luồng giá), **EVN GENCO3** (TanStack Query cho dashboard 25 module), **AI Communication** (Vercel AI SDK streaming), **LoLamBenhAn** (WebSocket có tự kết nối lại).
>
> 💡 **Mấu chốt:** cả 5 kỹ thuật này thư viện React Query / SWR đều **làm sẵn**. Người phỏng vấn muốn xem bạn hiểu **bản chất** (tự viết tay được), chứ không chỉ biết gọi API của thư viện.

---

## 1. Request Deduplication (khử trùng lặp request) là gì? 🔥

**Định nghĩa ngắn:** Khi nhiều component cùng gọi **một request giống nhau** trong cùng một khoảng thời gian ngắn, ta chỉ gửi **một request thật lên mạng**, và tất cả cùng nhận chung một kết quả. Mục đích là tránh làm phiền server khi nhiều component mount cùng lúc.

| Trường hợp | Không khử trùng lặp | Có khử trùng lặp |
|---|---|---|
| 5 component cùng dùng `useUser()` | 5 request | 1 request |
| Strict Mode (dev mount 2 lần) | 2 request | 1 request |
| Bấm nút fetch 2 lần liên tiếp | 2 request | 1 request (dùng lại cái đang chạy) |

**Giải thích sâu:**

- Ý tưởng cốt lõi: **lưu lại cái promise đang chạy** theo một khóa (key). Request thứ hai cùng khóa sẽ **lấy lại promise cũ** thay vì tạo fetch mới. Khi promise hoàn tất (thành công hoặc lỗi), ta xóa nó khỏi bộ nhớ để lần gọi tiếp theo là một fetch mới thật sự.
- React Query tự khử trùng lặp các request diễn ra **trong cùng một khoảng render (cùng một tick)**. Thư viện SWR khử trùng lặp dựa trên **khóa cache toàn cục**.
- Khác với **cache**: cache lưu dữ liệu **đã lấy xong**; còn khử trùng lặp là gộp các request **đang chạy dở** lại với nhau.

```ts
// ponytail: bộ nhớ promise đang chạy tối giản, không có thời hạn — đủ cho việc khử trùng lặp thuần
const inflight = new Map<string, Promise<unknown>>();

function dedupedFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inflight.has(key)) return inflight.get(key) as Promise<T>;
  const p = fn().finally(() => inflight.delete(key)); // xóa khi xong, kể cả khi lỗi
  inflight.set(key, p);
  return p;
}

// 3 component gọi gần nhau → chỉ 1 request thật
dedupedFetch('user:1', () => fetch('/api/user/1').then(r => r.json()));
```

**Bẫy thường gặp:**

- **Xung đột (race condition) nếu xóa cache sai thời điểm:** phải xóa trong `.finally()` (chạy cho cả trường hợp thành công lẫn lỗi), **không** xóa trong `.then()`. Nếu xóa trong `.then()`, khi request lỗi thì nó sẽ kẹt lại mãi trong bộ nhớ, khiến mọi request sau đó nhận về cùng một promise đã lỗi cũ.
- Trong **Strict Mode ở môi trường dev**, React cố tình mount component 2 lần, nên nếu không khử trùng lặp thì mỗi component gọi API 2 lần khi dev.
- **Ví dụ EVN GENCO3:** dashboard 25 module, nhiều widget cùng query khóa `['kpis', date]`. TanStack Query khử trùng lặp nên cả trang chỉ tốn một request phục vụ chung.
- **Câu hỏi nối tiếp:** *"Khử trùng lặp khác cache thế nào?"* → Khử trùng lặp là gộp các request **đang chạy** (dùng chung một promise); cache là trả về dữ liệu **đã có sẵn** mà không cần gọi mạng. Hai thứ thường dùng cùng nhau.
- **Câu hỏi nối tiếp:** *"Khi nào KHÔNG nên khử trùng lặp?"* → Khi request cần dữ liệu **luôn mới** (ví dụ mutation POST, thanh toán). Chỉ nên khử trùng lặp cho **GET không gây tác dụng phụ** (idempotent).

---

## 2. Optimistic Update (cập nhật lạc quan)? 🔥

**Định nghĩa ngắn:** Cập nhật giao diện **ngay lập tức** như thể request đã thành công (không chờ server trả lời). Nếu sau đó request thất bại thì **hoàn tác (rollback)** về trạng thái cũ. Người dùng có cảm giác thao tác "nhanh tức thì".

**Giải thích sâu:** Ba bước với `useMutation` của React Query:

1. **`onMutate`**: cập nhật cache **trước** khi request đi, để giao diện re-render ngay. Đồng thời lưu lại trạng thái cũ vào `context` để có cái mà hoàn tác.
2. **`onError`**: nếu request lỗi, khôi phục lại trạng thái cũ đã lưu trong `context`.
3. **`onSettled`**: dù thành công hay lỗi, cũng đánh dấu query cần làm mới (invalidate) để đồng bộ lại với dữ liệu thật trên server.

```tsx
useMutation({
  mutationFn: (liked: boolean) => api.likePost(id, liked),
  onMutate: async (liked) => {
    await queryClient.cancelQueries({ queryKey: ['post', id] });   // dừng refetch đang chạy
    const prev = queryClient.getQueryData(['post', id]);            // lưu ảnh chụp để hoàn tác
    queryClient.setQueryData(['post', id], (old) => ({ ...old, liked }));
    return { prev };                                                 // truyền sang onError
  },
  onError: (_e, _v, ctx) => {
    if (ctx?.prev) queryClient.setQueryData(['post', id], ctx.prev); // hoàn tác
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['post', id] }),
});
```

**Bẫy thường gặp:**

- **Chỉ nên dùng khi khá chắc chắn request sẽ thành công** — như bấm like, bật/tắt công tắc, tick checkbox, tự lưu bản nháp. **Không dùng** cho: tạo đơn hàng, chuyển tiền, thanh toán — những việc phải đợi server xác nhận, vì hiển thị sai là mất tiền.
- **Ví dụ Avatar48 DApp (swap token trên sàn OKX DEX):** KHÔNG cập nhật lạc quan cho việc swap (phải đợi xác nhận trên blockchain); nhưng vẫn cập nhật lạc quan cho **phần giao diện phụ** (disable nút, hiện loading ngay) để trải nghiệm mượt mà không hiển thị nội dung sai.
- **Phải hủy các query đang chạy** trước khi ghi cache. Nếu không, một lần refetch nền đang chạy có thể **ghi đè** lên cập nhật lạc quan của bạn (đây là một dạng xung đột).
- **Câu hỏi nối tiếp:** *"Nếu 2 người cùng cập nhật một lúc thì sao?"* → Cập nhật lạc quan giả định mình thắng; nếu server từ chối (lỗi 409, lệch phiên bản) thì hoàn tác và báo xung đột. Việc này cần **khóa lạc quan (optimistic locking)** ở backend, thường qua ETag hoặc số phiên bản.
- **Câu hỏi nối tiếp:** *"Lạc quan (optimistic) khác thận trọng (pessimistic) thế nào?"* → Thận trọng là chờ server trả lời rồi mới cập nhật giao diện (an toàn nhưng chậm); lạc quan là cập nhật trước, hoàn tác nếu sai (nhanh nhưng có rủi ro nhấp nháy khi phải hoàn tác). Chọn cái nào tùy mức độ quan trọng của thao tác.

---

## 3. Streaming UI? 🔥

**Định nghĩa ngắn:** Render giao diện **theo từng phần ngay khi dữ liệu tới**, không chờ tải xong hết mới hiển thị. Có hai ngữ cảnh: **(a) streaming khi render phía server** (server gửi dần HTML / React component) và **(b) streaming token của AI** (chatbot hiện chữ ra dần từng chữ).

| Loại | Cơ chế | Ví dụ |
|---|---|---|
| **Streaming phía server (SSR)** | Server đẩy HTML từng đoạn (chunk) kèm fallback của `<Suspense>` | Next.js `loading.tsx`, React Server Components |
| **Streaming của AI** | Đọc `ReadableStream` / SSE, ghép token dần | Vercel AI SDK `useChat` |

**Giải thích sâu:**

- **Streaming phía server (SSR / RSC):** React 18 trở lên có `renderToReadableStream`. Server gửi phần khung HTML trước; phần cần dữ liệu chậm thì được bọc trong `<Suspense>` để hiện nội dung fallback trước, khi dữ liệu sẵn sàng thì nội dung thật được chèn vào. Người dùng thấy trang hiện ra **dần dần**, không bị màn hình trắng.
- **Streaming của AI:** mô hình ngôn ngữ (LLM) trả về từng token một. Ta dùng `ReadableStream` để đọc luồng `text/event-stream` (một chuẩn đẩy dữ liệu một chiều gọi là SSE — Server-Sent Events), và ghép thêm token vào state mỗi khi có token mới tới. Vercel AI SDK gói sẵn qua `useChat()` / `streamText()`.

```tsx
// (a) Streaming phía server — dùng ranh giới Suspense
<Suspense fallback={<Spinner />}>
  <SlowChart />     {/* hiện Spinner trước, thay bằng nội dung thật khi dữ liệu sẵn sàng */}
</Suspense>

// (b) Streaming token của AI — tự đọc luồng SSE (để hiểu bản chất)
const res = await fetch('/api/chat', { method: 'POST', body: ... });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
let text = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  text += decoder.decode(value, { stream: true });   // ghép từng đoạn tới
  setText(text);                                       // re-render dần → hiệu ứng "gõ chữ"
}
text += decoder.decode(); setText(text);  // xả bộ đệm byte cuối (ký tự nhiều byte bị cắt ngang chunk cuối)
```

**Bẫy thường gặp:**

- **Streaming không phải WebSocket.** Streaming phía server dùng cơ chế truyền dữ liệu theo đoạn của HTTP (một chiều, chỉ từ server về client trong một response). WebSocket là kênh hai chiều. Đừng nhầm hai thứ này khi phỏng vấn.
- **Ví dụ AI Communication (chính service này):** dùng `streamText()` của Vercel AI SDK với nhà cung cấp GPT/Gemini để đẩy token về client qua `useChat`. Cần đặt header `Content-Type: text/event-stream` và không được đệm (buffer) response, nếu không token sẽ về một cục thay vì nhỏ giọt.
- **SEO:** nội dung nằm trong `<Suspense>` vẫn được công cụ tìm kiếm lập chỉ mục (vì cuối cùng vẫn được chèn vào DOM), khác với render hoàn toàn ở client.
- **Câu hỏi nối tiếp:** *"Streaming hay polling cho AI?"* → Streaming chỉ mở một kết nối và đẩy token dần (độ trễ thấp, cảm giác thời gian thực); polling là gọi request lặp lại (đơn giản hơn nhưng tốn kém hơn). Chat AI luôn dùng streaming.
- **Câu hỏi nối tiếp:** *"Hủy luồng giữa chừng thế nào?"* → Dùng `AbortController` kèm `reader.cancel()`. Đừng quên dọn dẹp trong `useEffect`, nếu không luồng sẽ rò rỉ khi component bị unmount.

---

## 4. Stale-While-Revalidate (hiện dữ liệu cũ trong lúc làm mới)? 🔥

**Định nghĩa ngắn:** Hiển thị **dữ liệu cũ trong cache (stale)** ngay lập tức để giao diện hiện tức thì, đồng thời **fetch lại ngầm ở nền (revalidate)**, khi xong thì **âm thầm thay** bằng dữ liệu mới. Người dùng không phải thấy màn hình loading lần thứ hai.

**Ba trạng thái của dữ liệu:**

| Trạng thái | Ý nghĩa | Hành vi |
|---|---|---|
| **Fresh (tươi)** | Vừa fetch, còn "mới" | Dùng cache, **không** fetch lại |
| **Stale (cũ)** | Đã hết `staleTime` nhưng còn trong cache | Hiện cache cũ + **fetch lại ở nền** |
| **Bị thu hồi (GC)** | Đã hết `gcTime`, bị xóa khỏi bộ nhớ | Hiện loading + fetch mới |

**Giải thích sâu:**

- **`staleTime` (mili-giây):** khoảng thời gian dữ liệu được coi là còn tươi. Trong khoảng này, thư viện không fetch lại.
- **`gcTime` (trước đây gọi là `cacheTime`):** khoảng thời gian giữ cache lại **sau khi không còn component nào dùng** nó. Hết khoảng này thì cache bị xóa khỏi bộ nhớ (GC = garbage collection, thu gom rác).
- Khi `staleTime` hết, dữ liệu trở thành cũ (stale). Lúc này thư viện sẽ fetch lại khi có một trong các sự kiện: **component mount, tab được focus lại, mạng kết nối lại, hoặc đến kỳ theo interval** — nhưng trong lúc chờ, nó **vẫn hiển thị dữ liệu cũ**.

```tsx
const { data } = useQuery({
  queryKey: ['price', token],
  queryFn: fetchPrice,
  staleTime: 10_000,    // 10s đầu: coi là tươi, không fetch lại
  gcTime: 5 * 60_000,   // 5 phút sau khi không dùng: xóa cache
  refetchOnWindowFocus: true,  // focus lại tab → fetch lại nếu dữ liệu đã cũ
});
// Lần mount thứ hai: hiện giá cũ ngay, fetch ngầm ở nền, rồi thay êm không thấy loading
```

**Bẫy thường gặp:**

- **Hay nhầm `staleTime` với `gcTime`:** `staleTime` quyết định "khi nào dữ liệu bị coi là cũ" (để quyết có fetch lại không); `gcTime` quyết định "khi nào xóa dữ liệu khỏi bộ nhớ". Mặc định của React Query là `staleTime: 0` (luôn coi là cũ, nên luôn fetch lại ở nền khi mount) và `gcTime: 5 phút`.
- **Ví dụ Avatar48 DApp:** giá token đặt `staleTime: 10s` + fetch lại ở nền khi focus, nên người dùng thấy giá ngay (từ cache), 10s sau mới fetch mới; đồng thời kết hợp **WebSocket đẩy** cho phần thời gian thực (stale-while-revalidate lo lần tải đầu và kéo dữ liệu, WebSocket lo phần đẩy real-time).
- **Ví dụ EVN GENCO3:** dashboard KPI đặt `staleTime: 30s` để tránh spam API mỗi lần đổi tab; kèm `refetchInterval: 60s` cho dữ liệu "gần thời gian thực".
- **Câu hỏi nối tiếp:** *"SWR khác React Query thế nào?"* → SWR (thư viện của Vercel) nhẹ hơn, ít cấu hình hơn; React Query (TanStack) mạnh hơn về mutation, DevTools, và tải vô hạn (infinite). Cả hai **cùng chung mô hình stale-while-revalidate** bên dưới.
- **Câu hỏi nối tiếp:** *"Khi nào KHÔNG dùng stale-while-revalidate?"* → Khi dữ liệu **phải chính xác tuyệt đối ngay lúc render** (số dư tài khoản, giá ngay trước khi xác nhận swap). Lúc đó cần fetch cưỡng bức / invalidate, không được tin vào cache cũ.

---

## 5. Smart Polling (polling thông minh)? 🔥

**Định nghĩa ngắn:** Lặp lại request theo chu kỳ để giả lập thời gian thực — nhưng "thông minh" ở chỗ **không poll một cách mù quáng**, mà biết **dừng khi tab bị ẩn, giãn nhịp khi lỗi, có giới hạn, và tối ưu chu kỳ**.

**Polling ngây thơ vs polling thông minh:**

| | Polling ngây thơ (`setInterval`) | Polling thông minh |
|---|---|---|
| Khi tab bị ẩn | Vẫn spam API | **Tạm dừng** (theo dõi sự kiện `visibilitychange`) |
| Khi lỗi liên tiếp | Vẫn poll đúng chu kỳ | **Giãn nhịp tăng dần (exponential backoff)** |
| Giới hạn | Vô hạn | **Thử tối đa N lần** rồi dừng |
| Kích hoạt | Chỉ theo thời gian | Poll + **fetch lại khi focus / kết nối lại** |

**Giải thích sâu:**

- React Query: dùng `refetchInterval` (chu kỳ poll) + `refetchIntervalInBackground: false` (chỉ poll khi tab đang hiển thị) + `retry` (tự động giãn nhịp khi lỗi).
- **Giãn nhịp tăng dần (backoff):** khi request lỗi, tăng dần chu kỳ (1s → 2s → 4s → 8s...) thay vì cố poll liên tục, để giảm tải cho server khi nó đang gặp sự cố.
- **Nhận biết tab ẩn/hiện:** khi người dùng chuyển sang tab khác thì tạm dừng; khi quay lại thì tiếp tục và fetch ngay, nhờ đó không lãng phí request vô ích.

```tsx
useQuery({
  queryKey: ['order', orderId],
  queryFn: fetchOrder,
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    if (status === 'done' || status === 'failed') return false;  // ✋ dừng khi đã xong
    if (query.state.status === 'error') return 5000;             // giãn nhịp khi lỗi (fetchStatus không có 'error')
    return 2000;                                                  // bình thường poll mỗi 2s
  },
  refetchIntervalInBackground: false,  // không poll khi tab bị ẩn
});
```

**Bẫy thường gặp:**

- **Khi nào dùng polling, khi nào dùng WebSocket/SSE:** polling đơn giản, chạy trên HTTP, không cần hạ tầng đặc biệt, hợp với dữ liệu cập nhật thưa (10s trở lên). Còn thời gian thực chặt chẽ (chat, luồng giá) thì dùng WebSocket/SSE. **Avatar48** dùng WebSocket cho giá (độ trễ vài mili-giây), **không** dùng polling.
- **Ví dụ LoLamBenhAn:** nếu WebSocket bị rớt thì **tạm chuyển sang polling** (mỗi 3–5s) đồng thời tự kết nối lại WebSocket, để giao diện không bị "đứng hình" khi socket gặp sự cố.
- **Quên dọn `setInterval`** sẽ gây rò rỉ và request vẫn bay đi sau khi component đã unmount. React Query tự dọn; còn nếu tự viết thì phải clear trong phần return của `useEffect`.
- **Câu hỏi nối tiếp:** *"Polling gây tải lớn, giảm thế nào?"* → Dùng chu kỳ thích ứng (poll nhanh khi sắp hoàn thành, chậm lại khi rảnh), dùng ETag / mã 304 (server trả về "chưa đổi" rất nhẹ), và request có điều kiện (`If-Modified-Since`).
- **Câu hỏi nối tiếp:** *"Polling, long polling, và SSE khác nhau ra sao?"* → Polling là client hỏi lại theo chu kỳ; long polling là server giữ kết nối mở cho đến khi có dữ liệu mới; SSE là server chủ động đẩy một chiều qua HTTP. Độ trễ và độ phức tạp tăng dần theo thứ tự đó.

---

## 🧠 Tổng hợp — khi nào dùng kỹ thuật nào?

| Tình huống | Kỹ thuật |
|---|---|
| Nhiều component cùng cần một dữ liệu | **Khử trùng lặp request** |
| Like / bật-tắt / tự lưu (rủi ro thấp) | **Cập nhật lạc quan** |
| Thanh toán / đơn hàng / chuyển tiền (rủi ro cao) | ❌ Không lạc quan, phải đợi server |
| Chatbot AI / phản hồi từ LLM | **Streaming UI** (theo token) |
| Trang tải dữ liệu chậm, muốn thấy trước | **Streaming UI** (dùng Suspense) |
| Muốn hiện tức thì từ cache + làm mới ngầm | **Stale-while-revalidate** |
| Thời gian thực "gần đúng" (không cần WebSocket) | **Polling thông minh** |
| Thời gian thực chặt chẽ (chat, giá) | WebSocket/SSE (không phải polling) |

> 🔑 **Điều quan trọng nhất cho phỏng vấn:** cả 5 kỹ thuật này React Query / TanStack Query **đã làm sẵn** (tự khử trùng lặp, cập nhật lạc quan qua `onMutate`, fetch lại ngầm chính là stale-while-revalidate, `refetchInterval` chính là polling). Nhưng người phỏng vấn sẽ hỏi **bản chất** — "tự viết khử trùng lặp thế nào?", "tại sao cần lưu context để hoàn tác?", "streaming khác WebSocket ở đâu?". Hãy hiểu cơ chế, đừng chỉ học thuộc API.

🔗 [Quay lại README frontend](./index.md)

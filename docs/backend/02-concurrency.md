# ⚙️ 02 — Concurrency (Câu hỏi kinh điển)

> Mỗi câu: **định nghĩa ngắn → đào sâu → gotcha/follow-up**. 🔥 = cực hay gặp.

---

## 1. Process vs Thread? 🔥

**Ngắn:**
- **Process:** một **chương trình đang chạy**, có **bộ nhớ độc lập** (address space riêng). Giao tiếp giữa process (IPC) tốn kém. Tạo process = nặng.
- **Thread:** đơn vị thực thi **bên trong process**, **chia sẻ bộ nhớ** với các thread khác cùng process. Tạo/switch nhẹ hơn process.

**Đào sâu:**
| | Process | Thread |
|---|---------|--------|
| Bộ nhớ | Độc lập | **Chia sẻ** heap |
| Tạo/switch | Nặng (ms) | Nhẹ (µs) |
| IPC | Cần (pipe, socket, shared mem) | Trực tiếp qua biến chung → dễ **race condition** |
| Crash | 1 process chết không ảnh hưởng process khác | 1 thread crash → cả process chết |
| Scale | Tuần tự, an toàn | Đồng thời cao nhưng phức tạp |

**Gotcha:**
- Nginx/Postgres dùng **multi-process** (an toàn, isolate); Java/Node worker, web server dùng **multi-thread**.
- **"Chia sẻ bộ nhớ"** = lợi thế (nhanh) **lẫn nguy hiểm** (race condition, deadlock) → cần synchronization.

---

## 2. Race condition là gì? Cách phòng tránh? 🔥

**Ngắn:** Khi ≥2 thread truy cập **biến chung**, ít nhất 1 là **ghi**, và **không đồng bộ** → kết quả phụ thuộc **thứ tự** thực thi → không deterministic.

**Ví dụ (counter++):**
```
counter = 0
Thread A: đọc 0 → +1 → ghi 1
Thread B: đọc 0 (trước khi A ghi) → +1 → ghi 1   // ❌ mất 1 increment
```
`counter++` không atomic = read-modify-write 3 bước.

**Cách phòng tránh:**
- **Mutex / Lock:** đảm bảo chỉ 1 thread vào critical section cùng lúc.
- **Atomic operations:** `atomic_inc`, compare-and-swap (CAS) — lock-free.
- **Immutability** (functional style) — không thay đổi → không race.
- **Thread-local / message passing** (Go channel) — tránh chia sẻ mutable state.

**Gotcha:**
- Race condition **khó tái hiện** → test có khi pass, prod fail. Dùng tool như **ThreadSanitizer (TSan)** để phát hiện.
- Follow-up: *"Vậy dùng lock lúc nào cũng tốt?"* → lock = chậm + gây deadlock. Ưu tiên **lock-free** (atomic) khi có thể.

---

## 3. Deadlock là gì? 4 điều kiện Coffman? Cách phòng tránh? 🔥

**Ngắn:** ≥2 thread **chờ lẫn nhau** giữ resource → không ai tiến → **kẹt vĩnh viễn**.

**4 điều kiện Coffman (cần đủ để deadlock):**
1. **Mutual exclusion** — resource không chia sẻ được lúc đó.
2. **Hold and wait** — giữ resource A, chờ resource B.
3. **No preemption** — không thể cưỡng ép tước resource.
4. **Circular wait** — chuỗi chờ vòng: T1 chờ T2 chờ … chờ T1.

**Cách phòng tránh (phá vỡ 1 điều kiện):**
- **Lock ordering** — luôn xin lock theo cùng **thứ tự** → phá *circular wait* (cách phổ biến nhất).
- **Lock timeout** — xin lock quá lâu → bỏ + retry.
- **Try-lock + backoff**.
- **Tránh hold-and-wait** — xin tất cả lock cùng lúc, hoặc không giữ lock khi chờ.

**Gotcha:**
- Deadlock **không throw**, chỉ **treo** → khó debug. Logging + dump thread state để chẩn đoán.
- Follow-up: *"Khác deadlock với livelock?"* — livelock: thread vẫn chạy nhưng không tiến (đỡ nhau qua lại mãi).

---

## 4. Mutex vs Semaphore vs Monitor?

- **Mutex (Mutual Exclusion):** lock nhị phân (0/1), **chỉ thread đã lock mới được unlock** (ownership). → Bảo vệ **1 resource** (critical section).
- **Semaphore:** bộ đếm; `wait()` giảm, `signal()` tăng. Cho phép **N thread** vào cùng lúc. **Counting semaphore** (N>1) điều tiết pool (vd 5 connection). Không có ownership.
- **Monitor:** ** abstraction cấp cao** = mutex + condition variable + data gói trong object. Dễ dùng hơn mutex raw (Java `synchronized`, Python `Lock` + `Condition`).

**Gotcha:**
- **Binary semaphore ≠ mutex:** semaphore không có ownership → thread khác có thể unlock → dễ bug. Mutex an toàn hơn cho mutual exclusion.
- Follow-up: *"Semaphore dùng để làm gì ngoài lock?"* → signaling giữa thread (producer-consumer: semaphore đếm item trong queue).

---

## 5. Concurrency vs Parallelism?

- **Concurrency:** **xử lý nhiều việc** cùng lúc (có thể luân phiên qua lại) — *cấu trúc* chương trình, giải quyết **đợi I/O**. VD: 1 đầu bếp nấu nhiều món xen kẽ.
- **Parallelism:** **thực thi nhiều việc đồng thời** về vật lý (nhiều core) — *thực thi*, giải quyết **CPU-bound**. VD: nhiều đầu bếp nấu song song.

**Đào sâu:**
- Async/await = concurrency (1 thread xử lý nhiều I/O). Multithreading trên multi-core = parallelism.
- Node.js **single-threaded** nhưng **concurrent** qua event loop → tốt I/O, tệ CPU-bound (dùng **worker threads**).

**Gotcha:** Câu này interviewer hay hỏi để xem bạn phân biệt đúng — đừng dùng lẫn lộn.

---

## 6. Async/Await & Event Loop (Node/Bun) hoạt động thế nào? 🔥

**Ngắn:** Node/Bun chạy **1 main thread** với **event loop**. I/O (network, file, DB) **không block** — delegated cho OS/libuv, main thread tiếp tục xử lý callback khác. Khi I/O xong → callback vào queue → event loop nhặt chạy.

**Các thành phần:**
- **Call stack:** thực thi đồng bộ.
- **libuv thread pool** (mặc định 4 thread): xử lý I/O nặng / CPU-ish (fs, crypto).
- **Callback / Microtask / Macrotask queues:** `Promise` (microtask, ưu tiên) vs `setTimeout`/I/O (macrotask).

**Ví dụ:**
```ts
console.log('1');               // sync
setTimeout(() => log('3'), 0);  // macrotask
Promise.resolve().then(() => log('2'));  // microtask
console.log('4');
// Output: 1 4 2 3  (microtask trước macrotask)
```

**Đào sâu:**
- **Async không tạo thread mới** — chỉ tái cấu trúc code qua callback/Promise, chạy trên cùng main thread.
- **Blocking main thread** (CPU-heavy đồng bộ, `JSON.stringify` khổng lồ, sync `fs`) → block event loop → **toàn app chậm**.

**Gotcha:**
- **CPU-bound** (image processing, crypto nặng, parse lớn) → dùng **worker threads** / đưa ra service riêng, **không** để trên main thread.
- **Beware unhandled promise rejection** & **memory leak** (closure giữ tham chiếu, quên clear interval).
- Follow-up: *"Vậy Node dùng cho app CPU-heavy được không?"* → được nhưng phải offload sang worker hoặc dùng Go/Rust/Java cho phần đó.

---

## 7. Thread Pool? Cấu hình sao cho đúng?

**Ngắn:** Tập hợp **worker thread được tạo sẵn**, tái sử dụng thay vì tạo mới mỗi task → tránh chi phí tạo/hủy thread.

**Tại sao cần:** Tạo thread = tốn memory + time; pool reuse → ổn định throughput, tránh **thrift** tạo thread ồ ạt khi burst.

**Cấu hình (rule of thumb):**
- **CPU-bound** task → pool size ≈ **số core** (nhiều hơn = chỉ context switch, không nhanh hơn).
- **I/O-bound** task → pool size **lớn hơn nhiều** (vì thread hay chờ I/O), có thể hàng trăm.

**Gotcha:**
- **Pool quá lớn** = memory + context switch + resource (DB connection) cạn kiệt.
- **Pool quá nhỏ** = task xếp hàng, latency cao.
- Java ForkJoinPool, Go goroutine (scheduler thay pool thủ công), Rust tokio — mỗi runtime xử lý khác.

---

## 8. Context switching tốn kém thế nào?

**Ngắn:** OS **lưu trạng thái** thread đang chạy (register, stack pointer, cache) và **phục hồi** thread khác = **context switch**. Tốn ~ **µs** + **làm hỏng CPU cache** (cache miss).

**Đào sâu:**
- Thread **blocking** (đợi I/O) → OS switch sang thread khác → lãng phí nếu chỉ để chờ.
- Async/event loop **tránh context switch** vì 1 thread → cache ấm → **thông lượng cao** cho I/O-heavy.
- Quá nhiều thread = **thrashing** (chỉ lo switch, không làm việc).

**Gotcha:** Đây là **lý do Node (1 thread) vẫn nhanh hơn multi-thread cho I/O** — không tốn switch. Nhưng CPU-bound thì multi-core parallel mới赢.

---
🔗 [Quay lại README backend](./index.md)

# 06 — Bit Manipulation & Math

> Ít gặp hơn trong fullstack interview, nhưng cần biết các operation cơ bản.

---

## 1. Bitwise Operations

| Operation | Ký hiệu | Ý nghĩa |
|-----------|---------|---------|
| AND | `&` | Cả 2 bit đều 1 → 1 |
| OR | `\|` | Ít nhất 1 bit 1 → 1 |
| XOR | `^` | Khác nhau → 1 |
| NOT | `~` | Đảo bit |
| Left shift | `<<` | Nhân 2 |
| Right shift | `>>` | Chia 2 (giữ dấu) |

### Câu hỏi kinh điển
- **Single Number** — XOR tất cả phần tử.
- **Number of 1 Bits**
- **Power of Two** — `n & (n - 1) === 0` với n > 0.
- **Counting Bits**
- **Reverse Bits**

### Mẹo XOR
```typescript
// a ^ a = 0
// a ^ 0 = a
// a ^ b ^ a = b
function singleNumber(nums: number[]): number {
  return nums.reduce((acc, n) => acc ^ n, 0);
}
```

### Power of two
```typescript
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}
```

---

## 2. Math cơ bản

### GCD / LCM
```typescript
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}
```

### Prime check
```typescript
function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}
```

### Câu hỏi kinh điển
- **Fizz Buzz**
- **Palindrome Number**
- **Plus One**
- **Happy Number**
- **Factorial Trailing Zeroes**

---

## 📝 Checklist tự đánh giá

- [ ] Biết 5 bitwise operations cơ bản.
- [ ] Single number bằng XOR.
- [ ] Power of two bằng `n & (n-1)`.
- [ ] GCD bằng Euclidean algorithm.

# Hướng dẫn cập nhật số vòng tuyển dụng khi edit job post

## 📋 Tổng quan

Khi người dùng cập nhật job post và thay đổi số vòng tuyển dụng (`roundCount`), hệ thống cần xử lý các trường hợp sau:

1. **Tăng số vòng** (ví dụ: từ 2 vòng → 4 vòng)
2. **Giảm số vòng** (ví dụ: từ 4 vòng → 2 vòng)
3. **Giữ nguyên số vòng** (không thay đổi)

## 🔍 Phân tích logic hiện tại

### Khi tạo job mới (`create-post.page.ts`):
```typescript
// Form có field: roundCount
const createJobRequest: CreateJobRequest = {
  // ... các field khác
  roundCount: parseInt(formValue.roundCount) || 1,
};

// Backend tạo job và trả về jobId + roundCount
// Sau đó navigate đến configure-rounds để cấu hình chi tiết
```

### Khi edit job (`edit-post.page.ts`):
```typescript
// Logic hiện tại (dòng 317-331):
const roundCount = formValue.recruitmentRound || 1;
let rounds: JobRoundDTO[] | undefined = undefined;

// Nếu roundCount thay đổi, tạo rounds mới
if (this.jobData && roundCount !== this.jobData.roundCount) {
  rounds = [];
  for (let i = 0; i < roundCount; i++) {
    rounds.push({
      roundIndex: i,
      roundName: `Vòng ${i + 1}`,  // ⚠️ Tên mặc định, mất thông tin rounds cũ
      isConfirmed: false,           // ⚠️ Reset về false, mất trạng thái cũ
    });
  }
}
```

## ⚠️ Vấn đề với logic hiện tại

1. **Mất thông tin rounds cũ**: Khi tăng/giảm số vòng, tất cả rounds được tạo mới với tên mặc định "Vòng 1", "Vòng 2", ...
2. **Mất cấu hình**: `isConfirmed` luôn reset về `false`, mất trạng thái xác nhận của rounds cũ
3. **Không giữ lại rounds hiện có**: Nếu tăng từ 2 → 4 vòng, rounds 1 và 2 nên được giữ lại, chỉ thêm rounds 3 và 4

## ✅ Hướng dẫn cải thiện

### Cách 1: Giữ lại rounds cũ, chỉ thêm/xóa rounds mới (Khuyến nghị)

```typescript
async onSubmit() {
  // ... validation code ...

  const roundCount = formValue.recruitmentRound || 1;
  let rounds: JobRoundDTO[] | undefined = undefined;
  
  // Nếu roundCount thay đổi
  if (this.jobData && roundCount !== this.jobData.roundCount) {
    const currentRounds = this.jobData.rounds || [];
    const oldRoundCount = this.jobData.roundCount || 0;
    
    rounds = [];
    
    if (roundCount > oldRoundCount) {
      // Trường hợp TĂNG số vòng
      // 1. Giữ lại tất cả rounds cũ
      currentRounds.forEach((round, index) => {
        rounds.push({
          roundIndex: index,
          roundName: round.roundName || `Vòng ${index + 1}`,
          isConfirmed: round.isConfirmed || false,
        });
      });
      
      // 2. Thêm rounds mới
      for (let i = oldRoundCount; i < roundCount; i++) {
        rounds.push({
          roundIndex: i,
          roundName: `Vòng ${i + 1}`,
          isConfirmed: false,
        });
      }
    } else if (roundCount < oldRoundCount) {
      // Trường hợp GIẢM số vòng
      // Chỉ giữ lại số rounds bằng roundCount mới
      for (let i = 0; i < roundCount; i++) {
        const existingRound = currentRounds[i];
        rounds.push({
          roundIndex: i,
          roundName: existingRound?.roundName || `Vòng ${i + 1}`,
          isConfirmed: existingRound?.isConfirmed || false,
        });
      }
    }
  }
  // Nếu roundCount không đổi, rounds = undefined (giữ nguyên rounds hiện tại)

  const updateJobRequest: UpdateJobRequest = {
    // ... các field khác
    rounds: rounds,
  };

  // Gọi API update
  this.jobPostService.updateJobPost(this.jobId, updateJobRequest).subscribe({
    // ... handle response
  });
}
```

### Cách 2: Luôn gửi tất cả rounds (đơn giản hơn)

```typescript
async onSubmit() {
  // ... validation code ...

  const roundCount = formValue.recruitmentRound || 1;
  const currentRounds = this.jobData?.rounds || [];
  
  // Luôn build lại rounds array từ rounds hiện tại
  const rounds: JobRoundDTO[] = [];
  
  for (let i = 0; i < roundCount; i++) {
    const existingRound = currentRounds[i];
    rounds.push({
      roundIndex: i,
      roundName: existingRound?.roundName || `Vòng ${i + 1}`,
      isConfirmed: existingRound?.isConfirmed || false,
    });
  }

  const updateJobRequest: UpdateJobRequest = {
    // ... các field khác
    rounds: rounds,
  };

  // Gọi API update
  this.jobPostService.updateJobPost(this.jobId, updateJobRequest).subscribe({
    // ... handle response
  });
}
```

### Cách 3: Chỉ cập nhật khi thay đổi (Tối ưu nhất)

```typescript
async onSubmit() {
  // ... validation code ...

  const roundCount = formValue.recruitmentRound || 1;
  const currentRounds = this.jobData?.rounds || [];
  const oldRoundCount = this.jobData?.roundCount || 0;
  
  let rounds: JobRoundDTO[] | undefined = undefined;
  
  // Chỉ build rounds nếu roundCount thay đổi
  if (roundCount !== oldRoundCount) {
    rounds = [];
    
    // Giữ lại rounds cũ (nếu có)
    const roundsToKeep = Math.min(roundCount, oldRoundCount);
    for (let i = 0; i < roundsToKeep; i++) {
      const existingRound = currentRounds[i];
      rounds.push({
        roundIndex: i,
        roundName: existingRound?.roundName || `Vòng ${i + 1}`,
        isConfirmed: existingRound?.isConfirmed || false,
      });
    }
    
    // Thêm rounds mới nếu tăng
    if (roundCount > oldRoundCount) {
      for (let i = oldRoundCount; i < roundCount; i++) {
        rounds.push({
          roundIndex: i,
          roundName: `Vòng ${i + 1}`,
          isConfirmed: false,
        });
      }
    }
    // Nếu giảm, rounds đã được cắt ở trên
  }
  // Nếu không đổi, rounds = undefined (backend giữ nguyên)

  const updateJobRequest: UpdateJobRequest = {
    // ... các field khác
    rounds: rounds,
  };

  // Gọi API update
  this.jobPostService.updateJobPost(this.jobId, updateJobRequest).subscribe({
    // ... handle response
  });
}
```

## 🎯 Khuyến nghị

**Sử dụng Cách 3** vì:
- ✅ Tối ưu: Chỉ gửi rounds khi thay đổi
- ✅ Giữ lại thông tin rounds cũ (tên, trạng thái)
- ✅ Xử lý đúng cả 2 trường hợp tăng và giảm
- ✅ Backend không cần xử lý khi rounds = undefined

## 📝 Lưu ý quan trọng

1. **Backend behavior**: Cần xác nhận với backend:
   - Khi `rounds` = `undefined` → Backend có giữ nguyên rounds hiện tại không?
   - Khi `rounds` = `[]` → Backend có xóa tất cả rounds không?
   - Khi `rounds` có giá trị → Backend có replace toàn bộ rounds không?

2. **Validation**: Nên thêm validation:
   - `roundCount >= 1`
   - Cảnh báo nếu giảm số vòng (có thể mất dữ liệu)

3. **User Experience**: Có thể thêm:
   - Confirmation dialog khi giảm số vòng
   - Preview rounds sẽ bị xóa (nếu có)

## 🔄 Flow hoàn chỉnh

```
User thay đổi recruitmentRound
    ↓
Validate roundCount (>= 1)
    ↓
So sánh với jobData.roundCount
    ↓
┌─────────────────┬─────────────────┐
│  Tăng số vòng   │  Giảm số vòng   │
│  (2 → 4)        │  (4 → 2)        │
├─────────────────┼─────────────────┤
│ 1. Giữ rounds 1,2│ 1. Giữ rounds 1,2│
│ 2. Thêm rounds 3,4│ 2. Xóa rounds 3,4│
└─────────────────┴─────────────────┘
    ↓
Build rounds array
    ↓
Gửi UpdateJobRequest
    ↓
Backend cập nhật
    ↓
Reload job data để hiển thị kết quả
```

## 📌 Code mẫu hoàn chỉnh

Xem file: `edit-post.page.ts` - method `onSubmit()` (dòng 264-376)

Cần cập nhật phần logic rounds (dòng 317-331) theo một trong 3 cách trên.






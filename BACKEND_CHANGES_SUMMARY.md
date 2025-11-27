# Tóm tắt thay đổi Backend - API GET /api/forms/job/{jobId}

## Mục đích
Thêm endpoint mới để lấy tất cả forms (templates) của một job, được nhóm theo rounds. Endpoint này sẽ được sử dụng bởi frontend để cấu hình rounds với template names chính xác.

## API Endpoint
```
GET /api/forms/job/{jobId}
```

### Response Format
```json
{
    "forms": [
        {
            "id": 16,
            "businessId": 1,
            "formName": "Rejection Notification - Encouraging (Copy)",
            "roundId": 4,
            "roundName": "Vòng 1",
            "type": "fail",
            "createdAt": "2025-11-27T10:58:24",
            "updatedAt": "2025-11-27T10:58:24"
        },
        {
            "id": 15,
            "businessId": 1,
            "formName": "Pass Notification - Standard (Copy)",
            "roundId": 4,
            "roundName": "Vòng 1",
            "type": "pass",
            "createdAt": "2025-11-27T10:58:24",
            "updatedAt": "2025-11-27T10:58:24"
        }
    ],
    "total": 2
}
```

## Các file cần thay đổi

### 1. FormRepository.java
**File:** `src/main/java/com/example/BE/repositories/FormRepository.java`

**Thay đổi:** Thêm method mới để query forms theo jobId

```java
/**
 * Tìm tất cả forms theo job_id (thông qua rounds)
 * Dùng để lấy tất cả forms (templates) của một job
 */
@EntityGraph(attributePaths = {"business", "round"})
@Query("SELECT f FROM Form f WHERE f.round.job.id = :jobId ORDER BY f.round.roundIndex ASC, f.type ASC")
List<Form> findByJobId(@Param("jobId") Long jobId);
```

**Vị trí:** Thêm vào cuối class, trước dấu `}`

---

### 2. IFormService.java
**File:** `src/main/java/com/example/BE/service/IFormService.java`

**Thay đổi:** Thêm method signature mới

```java
/**
 * Lấy tất cả forms (templates) của một job theo jobId
 * Trả về forms được nhóm theo rounds
 */
FormListResponse getFormsByJobId(String email, Long jobId);
```

**Vị trí:** Thêm vào cuối interface, trước dấu `}`

---

### 3. FormService.java
**File:** `src/main/java/com/example/BE/service/impl/FormService.java`

**Thay đổi 1:** Thêm import và inject JobPostRepository

**Import:**
```java
import com.example.BE.repositories.JobPostRepository;
```

**Inject dependency:**
```java
private final FormRepository formRepository;
private final BusinessRepository businessRepository;
private final JobPostRepository jobPostRepository;  // THÊM DÒNG NÀY
private final JobRoundRepository jobRoundRepository;
private final EmailTemplateRepository emailTemplateRepository;
```

**Thay đổi 2:** Thêm implementation method

```java
@Override
@Transactional(readOnly = true)
public FormListResponse getFormsByJobId(String email, Long jobId) {
    Business business = getBusinessByEmail(email);
    
    // Kiểm tra job thuộc về business hiện tại
    jobPostRepository.findByIdAndBusinessId(jobId, business.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
    
    // Lấy forms theo jobId (thông qua rounds)
    List<Form> forms = formRepository.findByJobId(jobId);
    
    // Map sang FormResponse
    List<FormResponse> formResponses = forms.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    
    return new FormListResponse(formResponses, formResponses.size());
}
```

**Vị trí:** Thêm vào cuối class, trước dấu `}`

---

### 4. FormController.java
**File:** `src/main/java/com/example/BE/controller/FormController.java`

**Thay đổi:** Thêm endpoint mới

```java
/**
 * GET /api/forms/job/{job_id} - Lấy tất cả forms (templates) của một job
 * Trả về forms được nhóm theo rounds
 */
@GetMapping("/job/{job_id}")
public ResponseEntity<FormListResponse> getFormsByJobId(
        Authentication authentication,
        @PathVariable("job_id") Long jobId) {
    String email = getEmailFromAuthentication(authentication);
    FormListResponse response = formService.getFormsByJobId(email, jobId);
    return ResponseEntity.ok(response);
}
```

**Vị trí:** Thêm sau method `deleteForm`, trước method `getEmailFromAuthentication`

---

## Chi tiết implementation

### Security
- Endpoint yêu cầu authentication (JWT token)
- Kiểm tra job thuộc về business của user hiện tại
- Trả về 404 nếu job không tồn tại hoặc không thuộc về business

### Query Logic
- Query forms thông qua relationship: `Form -> Round -> Job`
- Sắp xếp theo `roundIndex` (ASC) và `type` (ASC) để đảm bảo thứ tự nhất quán
- Sử dụng `@EntityGraph` để fetch `business` và `round` tránh N+1 query

### Response
- Trả về `FormListResponse` với danh sách `FormResponse`
- Mỗi `FormResponse` bao gồm:
  - `id`: Form ID
  - `businessId`: Business ID
  - `formName`: Tên form/template
  - `roundId`: ID của round (null nếu là template chung)
  - `roundName`: Tên của round (null nếu là template chung)
  - `type`: Loại form (pass, fail, apply_confirm)
  - `createdAt`, `updatedAt`: Timestamps

## Testing

### Test Case 1: Lấy forms của job hợp lệ
```
GET /api/forms/job/6
Headers: Authorization: Bearer {token}
Expected: 200 OK với danh sách forms
```

### Test Case 2: Job không tồn tại
```
GET /api/forms/job/999
Headers: Authorization: Bearer {token}
Expected: 404 Not Found
```

### Test Case 3: Job không thuộc về business hiện tại
```
GET /api/forms/job/{jobId_of_other_business}
Headers: Authorization: Bearer {token}
Expected: 404 Not Found
```

### Test Case 4: Job không có forms
```
GET /api/forms/job/{jobId_without_forms}
Headers: Authorization: Bearer {token}
Expected: 200 OK với forms: [], total: 0
```

## Lưu ý
- Đảm bảo `JobPostRepository` đã có method `findByIdAndBusinessId`
- Đảm bảo `FormResponse` DTO đã có đầy đủ các field: `roundId`, `roundName`
- Endpoint này chỉ trả về forms có `roundId` (templates per round), không bao gồm templates chung (roundId = null)

## Dependencies
- `JobPostRepository` - Đã có sẵn trong project
- `FormRepository` - Đã có sẵn
- `BusinessRepository` - Đã có sẵn
- `FormListResponse` DTO - Đã có sẵn
- `FormResponse` DTO - Đã có sẵn



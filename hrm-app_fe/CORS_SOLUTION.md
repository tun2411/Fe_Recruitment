# 🔧 Giải pháp Fix Lỗi CORS - 2 Cách

## ❌ Lỗi hiện tại

Frontend đang chạy trên port `63265` và bị chặn bởi CORS khi gọi API từ `http://localhost:8080`.

## ✅ Giải pháp 1: Sử dụng Angular Proxy (Nhanh nhất - Cho Development)

### Đã cấu hình sẵn:
- ✅ File `proxy.conf.json` đã được tạo
- ✅ `angular.json` đã được cập nhật để sử dụng proxy
- ✅ `environment.ts` đã được cập nhật để dùng relative path

### Cách sử dụng:

1. **Dừng dev server hiện tại** (nếu đang chạy)
   - Nhấn `Ctrl + C` trong terminal

2. **Restart dev server với proxy**
   ```bash
   cd "D:\HRM PROJECT\HRM PROJECT\hrm-app_fe"
   npm start
   ```

3. **Test lại**
   - Mở browser: http://localhost:4200
   - Thử đăng nhập
   - ✅ Lỗi CORS sẽ biến mất!

### Cách hoạt động:
- Frontend gọi: `http://localhost:4200/api/auth/login`
- Angular proxy tự động forward đến: `http://localhost:8080/api/auth/login`
- Không có CORS vì cùng origin (cùng localhost:4200)

---

## ✅ Giải pháp 2: Cấu hình CORS trên Spring Boot (Đúng cách - Cho Production)

### Bước 1: Tạo CORS Config trong Spring Boot

Tạo file: `src/main/java/com/yourpackage/config/CorsConfig.java`

```java
package com.yourpackage.config; // ⚠️ ĐỔI TÊN PACKAGE!

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:4200",
                    "http://localhost:63265",  // ⚠️ Port hiện tại của bạn
                    "http://127.0.0.1:4200",
                    "http://127.0.0.1:63265"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",
            "http://localhost:63265",  // ⚠️ Port hiện tại của bạn
            "http://127.0.0.1:4200",
            "http://127.0.0.1:63265"
        ));
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
```

### Bước 2: Nếu dùng Spring Security

Thêm vào `SecurityConfig`:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated()
        );
    return http.build();
}

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    // Code như trên
}
```

### Bước 3: Restart Spring Boot

```bash
# Dừng và chạy lại Spring Boot application
```

### Bước 4: Cập nhật environment.ts

Nếu dùng CORS (không dùng proxy), đổi lại:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api', // Full URL
};
```

---

## 🎯 So sánh 2 cách

| Tiêu chí | Proxy (Cách 1) | CORS (Cách 2) |
|----------|----------------|---------------|
| **Độ khó** | ⭐ Dễ (đã cấu hình sẵn) | ⭐⭐ Cần chỉnh backend |
| **Tốc độ** | ⚡ Nhanh (restart frontend) | 🐌 Chậm hơn (restart backend) |
| **Development** | ✅ Hoàn hảo | ✅ Tốt |
| **Production** | ❌ Không dùng được | ✅ Bắt buộc |
| **Port thay đổi** | ✅ Tự động | ❌ Phải cấu hình lại |

---

## 🚀 Khuyến nghị

### Cho Development (Bây giờ):
✅ **Dùng Proxy (Cách 1)** - Đã cấu hình sẵn, chỉ cần restart frontend!

### Cho Production:
✅ **Dùng CORS (Cách 2)** - Cấu hình đúng trên backend

---

## 📝 Checklist

### Nếu dùng Proxy:
- [x] File `proxy.conf.json` đã tạo
- [x] `angular.json` đã cấu hình proxy
- [x] `environment.ts` đã dùng relative path
- [ ] Restart dev server: `npm start`
- [ ] Test đăng nhập

### Nếu dùng CORS:
- [ ] Tạo `CorsConfig.java` trong Spring Boot
- [ ] Cập nhật allowedOrigins với port 63265
- [ ] Nếu dùng Security, cấu hình CORS trong SecurityConfig
- [ ] Restart Spring Boot
- [ ] Cập nhật `environment.ts` về full URL
- [ ] Test đăng nhập

---

## 🔍 Kiểm tra

Sau khi áp dụng một trong hai cách:

1. **Mở Browser DevTools** (F12)
2. **Vào tab Network**
3. **Thử đăng nhập**
4. **Kiểm tra request**:
   - ✅ Status: 200 OK
   - ✅ Không còn lỗi CORS trong Console
   - ✅ Response có dữ liệu

---

## ⚠️ Lưu ý quan trọng

1. **Chỉ dùng MỘT trong hai cách**:
   - Nếu dùng Proxy → `apiUrl: '/api'`
   - Nếu dùng CORS → `apiUrl: 'http://localhost:8080/api'`

2. **Port thay đổi**:
   - Angular dev server có thể chạy trên port khác nhau
   - Nếu dùng CORS, cần cập nhật allowedOrigins mỗi khi port thay đổi
   - Proxy tự động xử lý, không cần quan tâm port

3. **Production**:
   - Proxy chỉ hoạt động với `ng serve`
   - Production build phải dùng CORS

---

## 🎉 Kết quả mong đợi

Sau khi fix:
- ✅ Không còn lỗi CORS trong Console
- ✅ API request thành công (200 OK)
- ✅ Login hoạt động bình thường
- ✅ Nhận được token và user info

Chúc bạn fix thành công! 🚀


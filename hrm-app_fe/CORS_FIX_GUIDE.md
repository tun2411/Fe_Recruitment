# 🔧 Hướng dẫn Fix Lỗi CORS

## ❌ Lỗi hiện tại

```
Access to XMLHttpRequest at 'http://localhost:8080/api/auth/login' 
from origin 'http://localhost:60969' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Nguyên nhân**: Backend Spring Boot chưa cấu hình CORS để cho phép frontend gọi API.

## ✅ Giải pháp: Cấu hình CORS trên Spring Boot

### Cách 1: Sử dụng @CrossOrigin Annotation (Đơn giản nhất)

#### Bước 1: Thêm annotation vào Controller

```java
package com.yourpackage.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Your login logic here
        return ResponseEntity.ok(loginResponse);
    }
}
```

**Lưu ý**: Nếu frontend chạy trên port khác (ví dụ: 60969), thay đổi:
```java
@CrossOrigin(origins = "http://localhost:60969")
```

Hoặc cho phép tất cả origins (chỉ dùng cho development):
```java
@CrossOrigin(origins = "*")
```

---

### Cách 2: Cấu hình Global CORS (Khuyến nghị)

#### Bước 1: Tạo CORS Configuration Class

Tạo file: `src/main/java/com/yourpackage/config/CorsConfig.java`

```java
package com.yourpackage.config;

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
                .allowedOrigins("http://localhost:4200", "http://localhost:60969")
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
            "http://localhost:60969"
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

#### Bước 2: Cấu hình Security (Nếu dùng Spring Security)

Nếu bạn đang dùng Spring Security, cần thêm cấu hình:

```java
package com.yourpackage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // Tắt CSRF cho API
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",
            "http://localhost:60969"
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

---

### Cách 3: Sử dụng Filter (Cho trường hợp đặc biệt)

```java
package com.yourpackage.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;

        response.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
        } else {
            chain.doFilter(req, res);
        }
    }
}
```

---

## 🎯 Khuyến nghị

**Cho Development**: Sử dụng **Cách 2 (Global CORS)** vì:
- ✅ Áp dụng cho tất cả endpoints
- ✅ Dễ quản lý
- ✅ Có thể cấu hình nhiều origins
- ✅ Hỗ trợ credentials

**Cho Production**: 
- Chỉ cho phép domain cụ thể (không dùng `*`)
- Sử dụng HTTPS
- Cấu hình chặt chẽ hơn

---

## 🔍 Kiểm tra CORS đã hoạt động

### 1. Kiểm tra Response Headers

Mở Browser DevTools → Network tab → Chọn request → Xem Response Headers:

```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
```

### 2. Test với cURL

```bash
curl -X OPTIONS http://localhost:8080/api/auth/login \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Nếu thấy headers CORS trong response → ✅ Đã cấu hình đúng!

---

## 🐛 Troubleshooting

### Lỗi vẫn còn sau khi cấu hình

1. **Restart Spring Boot application**
   ```bash
   # Dừng và chạy lại Spring Boot
   ```

2. **Kiểm tra port frontend**
   - Frontend đang chạy trên port nào? (4200 hay 60969?)
   - Cập nhật `allowedOrigins` cho đúng port

3. **Kiểm tra Spring Security**
   - Nếu dùng Spring Security, đảm bảo đã cấu hình CORS trong SecurityConfig
   - Kiểm tra `.csrf().disable()` nếu cần

4. **Clear browser cache**
   - Hard refresh: `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)

### Lỗi: "Credentials flag is true, but Access-Control-Allow-Origin is *"

**Giải pháp**: Không thể dùng `*` khi `allowCredentials = true`

```java
// ❌ SAI
configuration.setAllowedOrigins(Arrays.asList("*"));
configuration.setAllowCredentials(true);

// ✅ ĐÚNG
configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
configuration.setAllowCredentials(true);
```

---

## 📝 Checklist

- [ ] Tạo CORS configuration class
- [ ] Cấu hình allowedOrigins (đúng port frontend)
- [ ] Cấu hình allowedMethods
- [ ] Cấu hình allowedHeaders
- [ ] Nếu dùng Spring Security, cấu hình CORS trong SecurityConfig
- [ ] Restart Spring Boot application
- [ ] Test lại từ frontend
- [ ] Kiểm tra Response Headers trong DevTools

---

## 🚀 Quick Fix (Tạm thời cho Development)

Nếu cần test ngay, có thể dùng cách này (chỉ cho development):

```java
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    // ...
}
```

**⚠️ Cảnh báo**: Không dùng `origins = "*"` trong production!

---

## ✅ Sau khi fix

Sau khi cấu hình CORS đúng, bạn sẽ thấy:
- ✅ Không còn lỗi CORS trong console
- ✅ API request thành công (200 OK)
- ✅ Response có headers CORS
- ✅ Login hoạt động bình thường

Chúc bạn fix thành công! 🎉


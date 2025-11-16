/**
 * CORS Configuration cho Spring Boot Backend
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Copy file này vào project Spring Boot của bạn
 * 2. Đặt trong package: com.yourpackage.config
 * 3. Đổi tên package cho đúng với project của bạn
 * 4. Restart Spring Boot application
 * 5. Test lại từ frontend
 */

package com.yourpackage.config; // ⚠️ ĐỔI TÊN PACKAGE NÀY!

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

    /**
     * Cấu hình CORS cho tất cả endpoints bắt đầu bằng /api
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // ⚠️ THAY ĐỔI CÁC ORIGINS NÀY THEO PORT FRONTEND CỦA BẠN
                .allowedOrigins(
                    "http://localhost:4200",  // Angular default port
                    "http://localhost:60969",  // Port hiện tại của bạn
                    "http://127.0.0.1:4200",
                    "http://127.0.0.1:60969"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600); // Cache preflight request trong 1 giờ
    }

    /**
     * Bean configuration cho CORS (dùng cho Spring Security nếu có)
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // ⚠️ THAY ĐỔI CÁC ORIGINS NÀY THEO PORT FRONTEND CỦA BẠN
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",
            "http://localhost:60969",
            "http://127.0.0.1:4200",
            "http://127.0.0.1:60969"
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


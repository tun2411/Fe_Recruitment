/**
 * CORS Configuration cho Spring Boot với Spring Security
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Copy file này vào project Spring Boot của bạn
 * 2. Đặt trong package: com.yourpackage.config
 * 3. Đổi tên package cho đúng với project của bạn
 * 4. Nếu đã có SecurityConfig, merge code này vào
 * 5. Restart Spring Boot application
 * 6. Test lại từ frontend
 */

package com.yourpackage.config; // ⚠️ ĐỔI TÊN PACKAGE NÀY!

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
            // Cấu hình CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Tắt CSRF cho API (hoặc cấu hình riêng nếu cần)
            .csrf(csrf -> csrf.disable())
            // Cấu hình authorization
            .authorizeHttpRequests(auth -> auth
                // Cho phép tất cả truy cập vào /api/auth/**
                .requestMatchers("/api/auth/**").permitAll()
                // Các endpoint khác cần authentication
                .anyRequest().authenticated()
            );
        
        return http.build();
    }

    /**
     * Cấu hình CORS cho Spring Security
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


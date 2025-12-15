# Hướng dẫn chạy và Build ứng dụng HRM+ trên Web

## 🚀 Chạy Development Server (Development Mode)

### Bước 1: Chạy server
```bash
cd "D:\HRM PROJECT\HRM PROJECT\hrm-app_fe"
npm start
```

Hoặc:
```bash
ng serve
```

### Bước 2: Truy cập ứng dụng
Sau khi server khởi động thành công, bạn sẽ thấy thông báo:
```
✔ Compiled successfully.
** Angular Live Development Server is listening on localhost:4200 **
```

Mở trình duyệt và truy cập:
- **URL**: http://localhost:4200
- **Hoặc**: http://127.0.0.1:4200

### Tính năng Development Server:
- ✅ **Hot Reload**: Tự động reload khi bạn thay đổi code
- ✅ **Source Maps**: Dễ dàng debug trong browser DevTools
- ✅ **Fast Refresh**: Thay đổi code sẽ hiển thị ngay lập tức

### Các tùy chọn khác:

**Chạy trên mạng local (để test trên điện thoại cùng WiFi):**
```bash
ng serve --host=0.0.0.0
```
Sau đó truy cập bằng IP của máy: `http://[IP-của-máy]:4200`

**Chạy trên port khác:**
```bash
ng serve --port 3000
```

**Mở tự động trong browser:**
```bash
ng serve --open
```

---

## 📦 Build Production (Để deploy lên server)

### Bước 1: Build production
```bash
npm run build
```

Hoặc build với cấu hình production:
```bash
ng build --configuration production
```

### Bước 2: Kết quả build
Sau khi build xong, các file sẽ được tạo trong thư mục:
```
hrm-app_fe/www/
```

### Bước 3: Deploy lên server

#### Cách 1: Deploy lên server static (Apache, Nginx, etc.)
1. Copy toàn bộ nội dung trong thư mục `www/`
2. Upload lên thư mục web root của server (ví dụ: `/var/www/html/` hoặc `C:\inetpub\wwwroot\`)
3. Cấu hình server để redirect tất cả routes về `index.html` (cho Angular routing)

**Cấu hình Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Cấu hình Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Cách 2: Deploy lên GitHub Pages, Netlify, Vercel, etc.
1. Build production như bước trên
2. Upload thư mục `www/` lên các platform này
3. Các platform này tự động hỗ trợ SPA routing

#### Cách 3: Test local với HTTP server
```bash
# Cài đặt http-server (nếu chưa có)
npm install -g http-server

# Vào thư mục build
cd www

# Chạy server
http-server -p 8080
```

Truy cập: http://localhost:8080

---

## 🔧 Cấu hình Environment

### Development Environment
File: `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
```

### Production Environment
File: `src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api',
};
```

**Lưu ý**: Nhớ cập nhật `apiUrl` trong `environment.prod.ts` với URL backend thực tế của bạn!

---

## 📱 Test Responsive trên Browser

### Chrome DevTools:
1. Mở Chrome DevTools (F12)
2. Click vào icon **Toggle device toolbar** (Ctrl+Shift+M)
3. Chọn thiết bị muốn test (iPhone, iPad, Android, etc.)
4. Refresh trang để xem responsive

### Các kích thước màn hình phổ biến:
- Mobile: 375px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

---

## 🐛 Troubleshooting

### Lỗi: "Port 4200 already in use"
```bash
# Tìm process đang dùng port 4200
netstat -ano | findstr :4200

# Hoặc chạy trên port khác
ng serve --port 3000
```

### Lỗi: "Cannot GET /route"
- Đây là lỗi routing của Angular SPA
- Cần cấu hình server để redirect về `index.html` (xem phần Deploy)

### Lỗi: "API connection failed"
- Kiểm tra backend có đang chạy không
- Kiểm tra CORS settings trên backend
- Kiểm tra `apiUrl` trong `environment.ts`

### Lỗi: "Module not found"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
```

---

## 📊 Kiểm tra Performance

### Build với analysis:
```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

### Lighthouse Audit:
1. Mở Chrome DevTools
2. Vào tab **Lighthouse**
3. Chọn các metrics muốn kiểm tra
4. Click **Generate report**

---

## 🎯 Quick Commands Reference

```bash
# Development
npm start                    # Chạy dev server
ng serve                     # Tương tự npm start
ng serve --open              # Chạy và mở browser tự động
ng serve --host=0.0.0.0      # Chạy trên mạng local

# Build
npm run build                # Build production
ng build                     # Build development
ng build --configuration production  # Build production

# Lint & Test
npm run lint                 # Kiểm tra code style
npm test                     # Chạy unit tests

# Clean
rm -rf www/                  # Xóa thư mục build (Windows: rmdir /s www)
```

---

## ✅ Checklist trước khi Deploy Production

- [ ] Cập nhật `apiUrl` trong `environment.prod.ts`
- [ ] Build production: `ng build --configuration production`
- [ ] Test app trên local với `http-server`
- [ ] Kiểm tra tất cả routes hoạt động đúng
- [ ] Test responsive trên nhiều thiết bị
- [ ] Kiểm tra performance với Lighthouse
- [ ] Cấu hình server để hỗ trợ SPA routing
- [ ] Cấu hình HTTPS (nếu cần)
- [ ] Cấu hình CORS trên backend
- [ ] Test authentication flow

---

## 🎉 Chúc bạn thành công!

Nếu có vấn đề gì, hãy kiểm tra:
1. Console trong browser DevTools (F12)
2. Terminal output khi chạy `npm start`
3. Network tab trong DevTools để xem API calls


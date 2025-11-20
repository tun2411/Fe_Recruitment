@echo off
REM Script để xóa và sync lại Android platform (Windows)
REM Sử dụng: reset-android.bat

echo 🔄 Đang reset Android platform...

REM Xóa thư mục android
if exist android (
    echo 📁 Xóa thư mục android...
    rmdir /s /q android
    echo ✅ Đã xóa thư mục android
) else (
    echo ℹ️  Thư mục android không tồn tại
)

REM Build lại Angular app
echo 🔨 Đang build Angular app...
call npm run build

if errorlevel 1 (
    echo ❌ Lỗi khi build Angular app
    exit /b 1
)

echo ✅ Build Angular app thành công

REM Add Android platform lại
echo 📱 Đang add Android platform...
call npx cap add android

if errorlevel 1 (
    echo ❌ Lỗi khi add Android platform
    exit /b 1
)

echo ✅ Đã add Android platform

REM Sync với Android
echo 🔄 Đang sync với Android...
call npx cap sync android

if errorlevel 1 (
    echo ❌ Lỗi khi sync Android
    exit /b 1
)

echo ✅ Đã sync Android thành công
echo.
echo 🎉 Hoàn tất! Bây giờ bạn có thể:
echo    npx cap open android

pause


#!/bin/bash

# Script để xóa và sync lại Android platform
# Sử dụng: bash reset-android.sh

echo "🔄 Đang reset Android platform..."

# Xóa thư mục android
if [ -d "android" ]; then
    echo "📁 Xóa thư mục android..."
    rm -rf android
    echo "✅ Đã xóa thư mục android"
else
    echo "ℹ️  Thư mục android không tồn tại"
fi

# Build lại Angular app
echo "🔨 Đang build Angular app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Lỗi khi build Angular app"
    exit 1
fi

echo "✅ Build Angular app thành công"

# Add Android platform lại
echo "📱 Đang add Android platform..."
npx cap add android

if [ $? -ne 0 ]; then
    echo "❌ Lỗi khi add Android platform"
    exit 1
fi

echo "✅ Đã add Android platform"

# Sync với Android
echo "🔄 Đang sync với Android..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Lỗi khi sync Android"
    exit 1
fi

echo "✅ Đã sync Android thành công"
echo ""
echo "🎉 Hoàn tất! Bây giờ bạn có thể:"
echo "   npx cap open android"


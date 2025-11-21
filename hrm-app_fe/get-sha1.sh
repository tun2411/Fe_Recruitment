#!/bin/bash

# Script để lấy SHA-1 fingerprint cho Android (Linux/Mac)
# Sử dụng: bash get-sha1.sh

echo "========================================"
echo "Lấy SHA-1 Fingerprint cho Android"
echo "========================================"
echo ""

echo "[1/2] Đang lấy SHA-1 từ debug keystore..."
echo ""

keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

echo ""
echo "========================================"
echo "Hướng dẫn:"
echo "1. Tìm dòng \"SHA1:\" trong kết quả trên"
echo "2. Copy SHA-1 fingerprint (dạng AA:BB:CC:DD:...)"
echo "3. Dùng SHA-1 này để tạo OAuth Client ID cho Android trong Google Console"
echo ""
echo "Xem file HUONG_DAN_TAO_ANDROID_CLIENT_ID.md để biết chi tiết"
echo "========================================"


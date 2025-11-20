package com.hrm.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Cấu hình WebView sau khi Bridge đã khởi tạo
        // Sử dụng post để đảm bảo WebView đã sẵn sàng
        getWindow().getDecorView().post(new Runnable() {
            @Override
            public void run() {
                // Đợi thêm một chút để đảm bảo Capacitor Bridge đã khởi tạo xong
                getWindow().getDecorView().postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        configureWebView();
                    }
                }, 200);
            }
        });
    }

    /**
     * Cấu hình WebView settings cho Google Sign-In
     * LƯU Ý: KHÔNG override WebViewClient/WebChromeClient vì sẽ conflict với Capacitor
     */
    private void configureWebView() {
        try {
            Bridge bridge = getBridge();
            if (bridge == null) {
                Log.w(TAG, "Bridge is null, cannot configure WebView");
                return;
            }

            WebView webView = bridge.getWebView();
            if (webView != null) {
                WebSettings webSettings = webView.getSettings();
                
                // Enable JavaScript (quan trọng cho Google Sign-In và Angular)
                webSettings.setJavaScriptEnabled(true);
                
                // Cho phép load content từ external domains (HTTPS và HTTP)
                webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                
                // Cho phép DOM storage (cần cho Google Sign-In)
                webSettings.setDomStorageEnabled(true);
                
                // Cho phép file access
                webSettings.setAllowFileAccess(true);
                webSettings.setAllowContentAccess(true);
                
                // Cho phép universal access từ file URLs
                webSettings.setAllowUniversalAccessFromFileURLs(true);
                webSettings.setAllowFileAccessFromFileURLs(true);
                
                // Cho phép database storage
                webSettings.setDatabaseEnabled(true);
                
                // Cho phép cache
                webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
                
                // Cho phép third-party cookies (cần cho Google Sign-In)
                android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
                cookieManager.setAcceptThirdPartyCookies(webView, true);
                cookieManager.setAcceptCookie(true);
                
                Log.d(TAG, "WebView configured successfully for Google Sign-In");
            } else {
                Log.w(TAG, "WebView is null, cannot configure");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring WebView", e);
        }
    }
}

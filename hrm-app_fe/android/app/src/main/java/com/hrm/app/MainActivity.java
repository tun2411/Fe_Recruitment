package com.hrm.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register GoogleAuth plugin explicitly for Capacitor 7
        // This ensures the plugin is properly initialized when using scopes
        this.registerPlugin(GoogleAuth.class);
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
                
                // Inject Google Sign-In script nếu chưa có
                // Đợi page load xong rồi inject script
                // Script đã được load từ index.html, nhưng inject thêm để đảm bảo
                webView.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        injectGoogleSignInScript(webView);
                    }
                }, 3000); // Đợi 3 giây để page và script từ index.html load xong
                
                Log.d(TAG, "WebView configured successfully for Google Sign-In");
            } else {
                Log.w(TAG, "WebView is null, cannot configure");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring WebView", e);
        }
    }

    /**
     * Inject Google Sign-In script vào WebView nếu chưa có
     * Sử dụng JavaScript để inject script, đảm bảo hoạt động trên Android WebView
     */
    private void injectGoogleSignInScript(WebView webView) {
        try {
            // Đơn giản hóa script injection để tránh lỗi syntax
            // Chỉ inject nếu script chưa tồn tại
            String checkScript = 
                "(function() {" +
                "  try {" +
                "    var hasScript = document.querySelector('script[src*=\"accounts.google.com/gsi/client\"]');" +
                "    var hasGoogle = window.google && window.google.accounts && window.google.accounts.id;" +
                "    if (!hasScript && !hasGoogle) {" +
                "      console.log('[MainActivity] Injecting Google Sign-In script...');" +
                "      var script = document.createElement('script');" +
                "      script.src = 'https://accounts.google.com/gsi/client';" +
                "      script.async = true;" +
                "      script.type = 'text/javascript';" +
                "      script.onload = function() { console.log('[MainActivity] Google Sign-In script loaded'); };" +
                "      script.onerror = function() { console.error('[MainActivity] Google Sign-In script failed to load'); };" +
                "      var head = document.head || document.getElementsByTagName('head')[0];" +
                "      if (head) { head.appendChild(script); }" +
                "    } else if (hasGoogle) {" +
                "      console.log('[MainActivity] Google Sign-In API already available');" +
                "    }" +
                "  } catch(e) { console.error('[MainActivity] Error:', e); }" +
                "})();";
            
            // Execute JavaScript trên WebView
            webView.evaluateJavascript(checkScript, null);
            
            Log.d(TAG, "Attempted to inject Google Sign-In script");
        } catch (Exception e) {
            Log.e(TAG, "Error injecting Google Sign-In script", e);
        }
    }
}

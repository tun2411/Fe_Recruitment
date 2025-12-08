# Hướng dẫn tích hợp SSE Notifications cho Frontend

## 📋 Tổng quan

Backend đã cung cấp SSE endpoint để push notifications real-time đến client:
- **Endpoint**: `GET /api/notifications/stream`
- **Authentication**: Yêu cầu JWT token trong header
- **Content-Type**: `text/event-stream`

## 🔧 Các bước triển khai

### 1. Vanilla JavaScript (HTML/JS thuần)

```javascript
// notificationService.js
class NotificationService {
    constructor(apiBaseUrl, getToken) {
        this.apiBaseUrl = apiBaseUrl;
        this.getToken = getToken; // Function trả về JWT token
        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // 3 seconds
    }

    /**
     * Kết nối đến SSE endpoint
     */
    connect(onNotification, onError) {
        const token = this.getToken();
        if (!token) {
            console.error('No token available for SSE connection');
            return;
        }

        // Tạo URL với token trong query parameter (vì EventSource không hỗ trợ headers)
        // Hoặc dùng fetch với ReadableStream (recommended)
        const url = `${this.apiBaseUrl}/notifications/stream`;
        
        // Sử dụng fetch API để có thể thêm Authorization header
        this.connectWithFetch(url, token, onNotification, onError);
    }

    /**
     * Kết nối SSE sử dụng Fetch API (hỗ trợ custom headers)
     */
    async connectWithFetch(url, token, onNotification, onError) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream',
                },
            });

            if (!response.ok) {
                throw new Error(`SSE connection failed: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            // Đọc stream
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('SSE stream closed');
                    this.handleReconnect(onNotification, onError);
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Giữ lại phần chưa hoàn chỉnh

                for (const line of lines) {
                    this.processSSELine(line, onNotification);
                }
            }
        } catch (error) {
            console.error('SSE connection error:', error);
            if (onError) onError(error);
            this.handleReconnect(onNotification, onError);
        }
    }

    /**
     * Xử lý từng dòng SSE
     */
    processSSELine(line, onNotification) {
        if (line.startsWith('event:')) {
            this.currentEvent = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    
                    if (this.currentEvent === 'notification') {
                        onNotification(parsed);
                    } else if (this.currentEvent === 'connected') {
                        console.log('SSE connected:', parsed);
                        this.reconnectAttempts = 0; // Reset reconnect counter
                    }
                } catch (e) {
                    // Nếu không phải JSON, xử lý như plain text
                    if (this.currentEvent === 'connected') {
                        console.log('SSE connected:', data);
                    }
                }
            }
        }
    }

    /**
     * Xử lý reconnect tự động
     */
    handleReconnect(onNotification, onError) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            this.connect(onNotification, onError);
        }, delay);
    }

    /**
     * Đóng kết nối
     */
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.reconnectAttempts = 0;
    }
}

// Sử dụng
const notificationService = new NotificationService(
    'http://localhost:8080/api',
    () => localStorage.getItem('accessToken') // Hoặc cách lấy token của bạn
);

// Kết nối và lắng nghe notifications
notificationService.connect(
    (notification) => {
        console.log('New notification:', notification);
        // Hiển thị notification trong UI
        showNotification(notification);
    },
    (error) => {
        console.error('SSE error:', error);
    }
);
```

### 2. React Hook

```jsx
// hooks/useNotificationSSE.js
import { useEffect, useRef, useState } from 'react';

export const useNotificationSSE = (apiBaseUrl, getToken) => {
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const readerRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    useEffect(() => {
        let isMounted = true;
        let abortController = new AbortController();

        const connect = async () => {
            try {
                const token = getToken();
                if (!token) {
                    console.error('No token available');
                    return;
                }

                const response = await fetch(`${apiBaseUrl}/notifications/stream`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'text/event-stream',
                    },
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`SSE connection failed: ${response.status}`);
                }

                const reader = response.body.getReader();
                readerRef.current = reader;
                const decoder = new TextDecoder();
                let buffer = '';
                let currentEvent = '';

                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        if (isMounted) {
                            setIsConnected(false);
                            handleReconnect();
                        }
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            currentEvent = line.substring(6).trim();
                        } else if (line.startsWith('data:')) {
                            const data = line.substring(5).trim();
                            if (data && currentEvent === 'notification') {
                                try {
                                    const notification = JSON.parse(data);
                                    if (isMounted) {
                                        setNotifications(prev => [notification, ...prev]);
                                    }
                                } catch (e) {
                                    console.error('Error parsing notification:', e);
                                }
                            } else if (data && currentEvent === 'connected') {
                                console.log('SSE connected');
                            }
                        }
                    }
                }
            } catch (error) {
                if (error.name !== 'AbortError' && isMounted) {
                    console.error('SSE error:', error);
                    setError(error.message);
                    setIsConnected(false);
                    handleReconnect();
                }
            }
        };

        const handleReconnect = () => {
            if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                console.error('Max reconnect attempts reached');
                return;
            }

            reconnectAttemptsRef.current++;
            const delay = reconnectDelay * reconnectAttemptsRef.current;

            reconnectTimeoutRef.current = setTimeout(() => {
                if (isMounted) {
                    connect();
                }
            }, delay);
        };

        connect();

        return () => {
            isMounted = false;
            abortController.abort();
            if (readerRef.current) {
                readerRef.current.cancel();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [apiBaseUrl, getToken]);

    return { notifications, isConnected, error };
};

// Sử dụng trong component
// App.jsx hoặc NotificationCenter.jsx
import React from 'react';
import { useNotificationSSE } from './hooks/useNotificationSSE';

const NotificationCenter = () => {
    const getToken = () => localStorage.getItem('accessToken');
    const { notifications, isConnected, error } = useNotificationSSE(
        'http://localhost:8080/api',
        getToken
    );

    return (
        <div>
            <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
            {error && <div>Error: {error}</div>}
            <div>
                <h3>Notifications ({notifications.length})</h3>
                {notifications.map(notif => (
                    <div key={notif.id} className="notification-item">
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <small>{new Date(notif.createdAt).toLocaleString()}</small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationCenter;
```

### 3. Vue 3 Composition API

```vue
<!-- composables/useNotificationSSE.js -->
import { ref, onMounted, onUnmounted } from 'vue';

export function useNotificationSSE(apiBaseUrl, getToken) {
    const notifications = ref([]);
    const isConnected = ref(false);
    const error = ref(null);
    let reader = null;
    let reconnectTimeout = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    const connect = async () => {
        try {
            const token = getToken();
            if (!token) {
                console.error('No token available');
                return;
            }

            const response = await fetch(`${apiBaseUrl}/notifications/stream`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream',
                },
            });

            if (!response.ok) {
                throw new Error(`SSE connection failed: ${response.status}`);
            }

            reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let currentEvent = '';

            isConnected.value = true;
            error.value = null;
            reconnectAttempts = 0;

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    isConnected.value = false;
                    handleReconnect();
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        currentEvent = line.substring(6).trim();
                    } else if (line.startsWith('data:')) {
                        const data = line.substring(5).trim();
                        if (data && currentEvent === 'notification') {
                            try {
                                const notification = JSON.parse(data);
                                notifications.value.unshift(notification);
                            } catch (e) {
                                console.error('Error parsing notification:', e);
                            }
                        } else if (data && currentEvent === 'connected') {
                            console.log('SSE connected');
                        }
                    }
                }
            }
        } catch (err) {
            console.error('SSE error:', err);
            error.value = err.message;
            isConnected.value = false;
            handleReconnect();
        }
    };

    const handleReconnect = () => {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            return;
        }

        reconnectAttempts++;
        const delay = reconnectDelay * reconnectAttempts;

        reconnectTimeout = setTimeout(() => {
            connect();
        }, delay);
    };

    const disconnect = () => {
        if (reader) {
            reader.cancel();
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }
    };

    onMounted(() => {
        connect();
    });

    onUnmounted(() => {
        disconnect();
    });

    return {
        notifications,
        isConnected,
        error,
        reconnect: connect,
        disconnect,
    };
}
```

```vue
<!-- NotificationCenter.vue -->
<template>
    <div class="notification-center">
        <div class="status">
            Status: {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
        </div>
        <div v-if="error" class="error">Error: {{ error }}</div>
        <div class="notifications">
            <h3>Notifications ({{ notifications.length }})</h3>
            <div
                v-for="notif in notifications"
                :key="notif.id"
                class="notification-item"
            >
                <h4>{{ notif.title }}</h4>
                <p>{{ notif.message }}</p>
                <small>{{ formatDate(notif.createdAt) }}</small>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useNotificationSSE } from '@/composables/useNotificationSSE';

const getToken = () => localStorage.getItem('accessToken');
const { notifications, isConnected, error } = useNotificationSSE(
    'http://localhost:8080/api',
    getToken
);

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
};
</script>
```

## 📱 Hiển thị Notification trong UI

### Toast Notification Component (React)

```jsx
// components/NotificationToast.jsx
import React, { useEffect, useState } from 'react';
import './NotificationToast.css';

const NotificationToast = ({ notification, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for animation
        }, 5000); // Auto close after 5 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        switch (notification.type) {
            case 'new_application':
                return '📝';
            case 'pass':
                return '✅';
            case 'fail':
                return '❌';
            case 'system':
                return 'ℹ️';
            default:
                return '🔔';
        }
    };

    return (
        <div className={`notification-toast ${isVisible ? 'show' : 'hide'}`}>
            <div className="notification-icon">{getIcon()}</div>
            <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
            </div>
            <button className="notification-close" onClick={onClose}>×</button>
        </div>
    );
};

export default NotificationToast;
```

```css
/* NotificationToast.css */
.notification-toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-bottom: 12px;
    min-width: 300px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
}

.notification-toast.hide {
    animation: slideOut 0.3s ease-in;
}

.notification-icon {
    font-size: 24px;
}

.notification-content {
    flex: 1;
}

.notification-title {
    font-weight: 600;
    margin-bottom: 4px;
    color: #333;
}

.notification-message {
    font-size: 14px;
    color: #666;
}

.notification-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 24px;
    height: 24px;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
```

## 🔐 Xử lý Authentication

**Lưu ý quan trọng**: EventSource API mặc định không hỗ trợ custom headers. Có 2 cách:

### Cách 1: Dùng Fetch API (Recommended)
Như các ví dụ trên, sử dụng `fetch()` với `ReadableStream` để có thể thêm Authorization header.

### Cách 2: Dùng token trong URL (Không khuyến khích)
```javascript
// Không an toàn, token sẽ hiển thị trong logs
const url = `${apiBaseUrl}/notifications/stream?token=${token}`;
const eventSource = new EventSource(url);
```

## ⚠️ Lưu ý quan trọng

1. **CORS**: Đảm bảo backend đã cấu hình CORS đúng (đã có trong WebConfig)
2. **Token Refresh**: Khi token hết hạn, cần reconnect với token mới
3. **Reconnection**: Luôn implement reconnection logic
4. **Memory Leaks**: Cleanup connections khi component unmount
5. **Error Handling**: Xử lý các trường hợp lỗi (network, auth, etc.)

## 🧪 Testing

```javascript
// Test SSE connection
const testSSE = async () => {
    const token = 'your-jwt-token';
    const response = await fetch('http://localhost:8080/api/notifications/stream', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
        },
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log(decoder.decode(value));
    }
};
```

## 📚 Tài liệu tham khảo

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [MDN: ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)

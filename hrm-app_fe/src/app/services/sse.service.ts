import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Service để quản lý kết nối Server-Sent Events (SSE)
 * Hỗ trợ auto-reconnect và error handling
 */
@Injectable({
  providedIn: 'root',
})
export class SSEService {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private abortController: AbortController | null = null;
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private isConnecting = false;

  private notificationSubject = new Subject<any>();
  public notifications$: Observable<any> = this.notificationSubject.asObservable();

  private connectionStatusSubject = new Subject<boolean>();
  public connectionStatus$: Observable<boolean> =
    this.connectionStatusSubject.asObservable();

  /**
   * Kết nối đến SSE endpoint
   * @param url SSE endpoint URL
   * @param token JWT token để authenticate
   */
  connect(url: string, token: string): void {
    if (this.isConnecting) {
      console.warn('[SSE] Already connecting, skipping...');
      return;
    }

    if (!token) {
      console.error('[SSE] No token provided');
      return;
    }

    this.isConnecting = true;
    this.abortController = new AbortController();

    this.connectWithFetch(url, token);
  }

  /**
   * Kết nối SSE sử dụng Fetch API (hỗ trợ custom headers)
   */
  private async connectWithFetch(url: string, token: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      this.connectionStatusSubject.next(true);
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      // Đọc stream
      while (true) {
        if (!this.reader) break;

        const { done, value } = await this.reader.read();

        if (done) {
          console.log('[SSE] Stream closed');
          this.connectionStatusSubject.next(false);
          this.handleReconnect(url, token);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Giữ lại phần chưa hoàn chỉnh

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data) {
              this.processSSELine(data, currentEvent);
            }
          }
        }
      }
    } catch (error: any) {
      this.isConnecting = false;
      if (error.name === 'AbortError') {
        console.log('[SSE] Connection aborted');
        return;
      }

      console.error('[SSE] Connection error:', error);
      this.connectionStatusSubject.next(false);
      this.handleReconnect(url, token);
    }
  }

  /**
   * Xử lý từng dòng SSE
   */
  private processSSELine(data: string, eventType: string): void {
    try {
      if (eventType === 'notification') {
        const notification = JSON.parse(data);
        this.notificationSubject.next(notification);
      } else if (eventType === 'connected') {
        console.log('[SSE] Connected:', data);
        try {
          const parsed = JSON.parse(data);
          console.log('[SSE] Connection info:', parsed);
        } catch (e) {
          // Nếu không phải JSON, chỉ log plain text
          console.log('[SSE] Connection message:', data);
        }
      }
    } catch (e) {
      console.error('[SSE] Error parsing SSE data:', e, 'Data:', data);
    }
  }

  /**
   * Xử lý reconnect tự động
   */
  private handleReconnect(url: string, token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(
      `[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect(url, token);
    }, delay);
  }

  /**
   * Đóng kết nối SSE
   */
  disconnect(): void {
    console.log('[SSE] Disconnecting...');

    // Cancel fetch request
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Cancel reader
    if (this.reader) {
      this.reader.cancel();
      this.reader = null;
    }

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.connectionStatusSubject.next(false);
  }

  /**
   * Reset reconnect attempts (khi reconnect thành công)
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }
}

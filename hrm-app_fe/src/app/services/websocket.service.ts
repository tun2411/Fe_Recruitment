// src/app/services/websocket.service.ts

import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import {
  BusinessService,
  BusinessResponse,
} from './business.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private client!: Client;
  private notifications = new BehaviorSubject<any[]>([]);
  notifications$ = this.notifications.asObservable();

  // CẬP NHẬT IP CỦA BẠN TẠI ĐÂY (chỉ cần sửa 1 lần)
  private readonly BACKEND_IP = '192.168.1.24'; // ← IP máy bạn (từ ipconfig)

  constructor(private businessService: BusinessService) {}

  // Tự động chọn URL đúng cho mọi môi trường
  private getWebSocketUrl(): string {
    if (Capacitor.isNativePlatform()) {
      // Đang chạy trên Android/iOS → dùng IP thật
      return `ws://${this.BACKEND_IP}:8080/ws`;
    } else {
      // Đang chạy trên trình duyệt (ionic serve)
      return `ws://${this.BACKEND_IP}:8080/ws`;
    }
  }

  /**
   * Gọi hàm này sau khi user đăng nhập.
   * Tự động lấy businessId thật từ backend và connect đúng channel.
   */
  async connect(): Promise<void> {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      'dummy';

    try {
      // Lấy business hiện tại từ backend
      const biz: BusinessResponse = await firstValueFrom(
        this.businessService.getCurrentBusiness()
      );
      const id = biz.id;

      const wsUrl = this.getWebSocketUrl();
      console.log(
        '%c[WebSocketService] Đang kết nối tới:',
        'color: cyan; font-weight: bold',
        wsUrl,
        'businessId =',
        id
      );

      this.client = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str: string) => {
          console.log('%c[STOMP] ' + str, 'color: #00bfff');
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = () => {
        console.log(
          '%c WebSocket ĐÃ KẾT NỐI THÀNH CÔNG!',
          'color: lime; font-size: 16px; font-weight: bold'
        );

        this.client.subscribe(
          `/topic/notifications/${id}`,
          (message: IMessage) => {
            try {
              const notif = JSON.parse(message.body);
              console.log(
                '%c Thông báo mới!',
                'color: gold; font-weight: bold',
                notif
              );
              this.notifications.next([
                ...this.notifications.value,
                notif,
              ]);
            } catch (e) {
              console.error('Lỗi parse JSON notification:', e);
            }
          }
        );
      };

      this.client.onStompError = (frame) => {
        console.error(
          '%c STOMP Error:',
          'color: red; font-weight: bold',
          frame.headers['message']
        );
        console.error('Detail:', frame);
      };

      this.client.onWebSocketError = (error) => {
        console.error('%c WebSocket Error:', 'color: red', error);
      };

      this.client.onWebSocketClose = (event) => {
        if (event.code === 1006) {
          console.warn(
            '%c WebSocket đóng bất thường (code 1006) – thường do sai URL hoặc CORS',
            'color: orange'
          );
        } else {
          console.log(
            '%c WebSocket đóng bình thường:',
            'color: gray',
            event
          );
        }
      };

      // Bắt đầu kết nối
      this.client.activate();
    } catch (error) {
      console.error(
        '[WebSocketService] Không lấy được business hiện tại, không thể connect WS:',
        error
      );
    }
  }

  disconnect(): void {
    if (this.client) {
      console.log(
        '%c Đang ngắt kết nối WebSocket...',
        'color: orange'
      );
      this.client.deactivate();
    }
  }
}

declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    transports?: string[];
    sessionId?: number | (() => number);
    timeout?: number;
  }

  class SockJS {
    constructor(url: string, _reserved?: any, options?: SockJSOptions);
    onopen: ((e: any) => void) | null;
    onmessage: ((e: any) => void) | null;
    onclose: ((e: any) => void) | null;
    onerror: ((e: any) => void) | null;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    readyState: number;
    protocol: string;
    url: string;
  }

  export = SockJS;
}

declare module '@stomp/stompjs' {
  export interface IMessage {
    body: string;
    headers: { [key: string]: string };
    command: string;
    ack?: () => void;
    nack?: () => void;
  }

  export interface IFrame {
    command: string;
    headers: { [key: string]: string };
    body: string;
  }

  export interface ClientConfig {
    brokerURL?: string;
    connectHeaders?: { [key: string]: string };
    reconnectDelay?: number;
    heartbeatIncoming?: number;
    heartbeatOutgoing?: number;
    debug?: (str: string) => void;
    onConnect?: () => void;
    onStompError?: (frame: IFrame) => void;
    onWebSocketClose?: () => void;
    onDisconnect?: () => void;
  }

  export class Client {
    constructor(config?: ClientConfig);
    configure(config: ClientConfig): void;
    activate(): void;
    deactivate(): void;
    subscribe(destination: string, callback: (message: IMessage) => void): any;
    publish(params: { destination: string; body: string; headers?: { [key: string]: string } }): void;
    
    // Callback properties
    onConnect?: () => void;
    onStompError?: (frame: IFrame) => void;
    onWebSocketError?: (event: any) => void;
    onWebSocketClose?: (event: any) => void;
    onDisconnect?: () => void;
  }

  export function over(socket: any): Client;
}

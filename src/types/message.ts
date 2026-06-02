export interface BaseMessage {
    id: number;
    port: string;
    left: number;
    type: 'text' | 'image' | 'gif';
    time: number;
    senderName?: string;
    top?: number;
}

export interface TextMessage extends BaseMessage {
    type: 'text';
    text: string;
}

export interface ImageMessage extends BaseMessage {
    type: 'image';
    url: string;
}

export interface GifMessage extends BaseMessage {
    type: 'gif';
    gifUrl: string;
}

export type Message = TextMessage | ImageMessage | GifMessage;

import type { Message } from '../types/message';

export const MESSAGE_SIZE: Record<Message['type'], { width: number; height: number }> = {
    text:  { width: 180, height: 40 },
    image: { width: 200, height: 150 },
    gif:   { width: 200, height: 150 },
};

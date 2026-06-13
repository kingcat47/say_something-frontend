import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import type { Message, TextMessage, ImageMessage, GifMessage } from '../types/message';
import { findPosition } from '../algorithms/poissonDisk';

let nextId = 0;

// ─────────────────────────────────────────────────────────────────
// [레거시] 순수 랜덤 배치 함수 - 비교/테스트 영상 촬영용으로 보존
//
// 사용 방법:
//   아래 getCoords 정의를 주석 처리하고,
//   대신 이 함수를 사용하도록 교체:
//
//   const getCoords = (_type: Message['type']) => generateCoordinates(sendModeType);
// ─────────────────────────────────────────────────────────────────
// function generateCoordinates(mode: 1 | 2 | 3) {
//     const isMobile = window.innerWidth <= 768;
//     const maxLeft = isMobile ? 70 : 80;
//     const mobileTopOffset = isMobile ? 250 : 100;
//
//     if (mode === 1) {
//         if (isMobile) return { left: Math.random() * maxLeft, top: Math.random() * (window.innerHeight - mobileTopOffset) };
//         return { left: Math.random() * maxLeft, top: window.innerHeight - 36 };
//     }
//     if (mode === 2) {
//         if (isMobile) return { left: 0, top: 36 + Math.random() * (window.innerHeight - mobileTopOffset - 36) };
//         return { left: 0, top: 36 + Math.random() * (window.innerHeight - 100 - 36) };
//     }
//     if (isMobile) return { left: Math.random() * maxLeft, top: Math.random() * (window.innerHeight - mobileTopOffset) };
//     return { left: Math.random() * maxLeft, top: Math.random() * (window.innerHeight - 100) };
// }

export function useMessages(selectedTab: string, sendModeType: 1 | 2 | 3) {
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        const getCoords = (type: Message['type']) => findPosition(
            messagesRef.current,
            type,
            sendModeType,
            window.innerWidth,
            window.innerHeight,
            window.innerWidth <= 768
        );

        socket.on('message', (msg: { port: string; text: string; senderName?: string }) => {
            const coords = getCoords('text');
            const newMsg: TextMessage = {
                id: nextId++,
                port: msg.port || '',
                type: 'text',
                text: msg.text,
                senderName: msg.senderName,
                left: coords.left,
                top: coords.top,
                time: Date.now(),
            };
            setMessages(prev => [...prev, newMsg]);
            if (selectedTab === 'send') {
                setTimeout(() => setMessages(prev => prev.filter(m => m.id !== newMsg.id)), 10000);
            }
        });

        socket.on('image', (data: { port: string; url: string; senderName?: string }) => {
            const coords = getCoords('image');
            const newMsg: ImageMessage = {
                id: nextId++,
                port: data.port || '',
                type: 'image',
                url: data.url,
                senderName: data.senderName,
                left: coords.left,
                top: coords.top,
                time: Date.now(),
            };
            setMessages(prev => [...prev, newMsg]);
            if (selectedTab === 'send') {
                setTimeout(() => setMessages(prev => prev.filter(m => m.id !== newMsg.id)), 10000);
            }
        });

        socket.on('gif', (data: { port: string; gifUrl: string; senderName?: string }) => {
            const coords = getCoords('gif');
            const newMsg: GifMessage = {
                id: nextId++,
                port: data.port || '',
                type: 'gif',
                gifUrl: data.gifUrl,
                senderName: data.senderName,
                left: coords.left,
                top: coords.top,
                time: Date.now(),
            };
            setMessages(prev => [...prev, newMsg]);
            if (selectedTab === 'send') {
                setTimeout(() => setMessages(prev => prev.filter(m => m.id !== newMsg.id)), 10000);
            }
        });

        return () => {
            socket.off('message');
            socket.off('image');
            socket.off('gif');
        };
    }, [selectedTab, sendModeType]);

    useEffect(() => {
        setMessages([]);
    }, [selectedTab]);

    useEffect(() => {
        setMessages([]);
    }, [sendModeType]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') {
                setMessages([]);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { messages };
}

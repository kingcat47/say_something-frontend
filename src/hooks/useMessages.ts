import { useState, useEffect } from 'react';
import { socket } from '../socket';
import type { Message, TextMessage, ImageMessage, GifMessage } from '../types/message';

let nextId = 0;

function generateCoordinates(mode: 1 | 2 | 3) {
    const isMobile = window.innerWidth <= 768;
    const maxLeft = isMobile ? 70 : 80;
    const mobileTopOffset = isMobile ? 250 : 100;

    if (mode === 1) {
        if (isMobile) return { left: Math.random() * maxLeft, top: Math.random() * (window.innerHeight - mobileTopOffset) };
        return { left: Math.random() * maxLeft, top: window.innerHeight - 36 };
    }
    if (mode === 2) {
        if (isMobile) return { left: 0, top: 36 + Math.random() * (window.innerHeight - mobileTopOffset - 36) };
        return { left: 0, top: 36 + Math.random() * (window.innerHeight - 100 - 36) };
    }
    if (isMobile) return { left: Math.random() * maxLeft, top: Math.random() * (window.innerHeight - mobileTopOffset) };
    return { left: Math.random() * maxLeft, top: Math.random() * (window.innerHeight - 100) };
}

export function useMessages(selectedTab: string, sendModeType: 1 | 2 | 3) {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        socket.on('message', (msg: { port: string; text: string; senderName?: string }) => {
            const coords = generateCoordinates(sendModeType);
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
            const coords = generateCoordinates(sendModeType);
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
            const coords = generateCoordinates(sendModeType);
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

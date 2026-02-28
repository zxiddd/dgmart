'use client';
import { useCallback, useRef, useEffect } from 'react';

export function useAudioAlert() {
    const audioRef = useRef(null);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
                const audio = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExEAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExIAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
                audioRef.current = audio;
            }
        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }, []);

    const playAlert = useCallback(() => {
        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;

                // Attempt to play. Browser autoplay policies might block this if the user hasn't interacted with the page yet.
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Audio playback prevented by browser policy:", error);
                    });
                }
            }
        } catch (e) {
            console.error("Failed to play audio alert:", e);
        }
    }, []);

    return { playAlert };
}

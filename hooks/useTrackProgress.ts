import { useEffect, useRef, useCallback } from 'react';
import { updateProgress } from '../services/localStorage';

export const useTrackProgress = (contentId: string, enabled: boolean) => {
    const progressRef = useRef(0);

    const saveProgress = useCallback((currentTime: number, duration?: number) => {
        if (currentTime <= 10) return;
        progressRef.current = currentTime;
        updateProgress(contentId, currentTime, duration);
    }, [contentId]);

    useEffect(() => {
        if (!enabled || !contentId) return;

        const interval = setInterval(() => {
            if (progressRef.current > 0) {
                updateProgress(contentId, progressRef.current);
            }
        }, 15000);

        const handleBeforeUnload = () => {
            if (progressRef.current > 0) {
                updateProgress(contentId, progressRef.current);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [contentId, enabled]);

    return { saveProgress };
};

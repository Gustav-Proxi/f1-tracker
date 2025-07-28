// lib/utils.ts

export const formatDuration = (seconds: number | number[] | null): string => {
    if (seconds === null) {
        return "N/A";
    }
    let actualSeconds: number;
    if (Array.isArray(seconds)) {
        actualSeconds = seconds[seconds.length - 1] as number; // Take the last qualifying time
        if (actualSeconds === null) return "N/A";
    } else {
        actualSeconds = seconds;
    }

    if (typeof actualSeconds !== 'number' || isNaN(actualSeconds)) {
        return "Invalid Duration";
    }

    const minutes = Math.floor(actualSeconds / 60);
    const remainingSeconds = actualSeconds % 60;

    if (minutes > 0) {
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
    } else {
        return `${remainingSeconds.toFixed(3)}`;
    }
};

// Add other utility functions here if needed
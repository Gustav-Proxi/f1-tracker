// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// This 'cn' function is a common utility for conditionally joining Tailwind CSS classes.
// It's widely used in shadcn/ui components.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Original Helper Functions Below ---

export const formatDuration = (seconds: number | number[] | string | null): string => {
    if (seconds === null || seconds === undefined) {
        return "N/A";
    }

    let actualSeconds: number;

    if (typeof seconds === 'string') {
        // Handle Ergast time format like "1:25.325" or "+20.886"
        if (seconds.startsWith('+')) {
            return seconds; // Return as is for gaps
        }
        try {
            const parts = seconds.split(':');
            if (parts.length === 2) {
                actualSeconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            } else {
                actualSeconds = parseFloat(seconds);
            }
        } catch (e) {
            return "Invalid Time";
        }
    } else if (Array.isArray(seconds)) {
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

// Helper to map Ergast driverId to OpenF1 driver_number (best effort)
export const getDriverNumberFromErgastId = (driverId: string): number | undefined => {
    const driverIdMap: { [key: string]: number } = {
        "hamilton": 44, "max_verstappen": 1, "leclerc": 16, "perez": 11, "sainz": 55,
        "russell": 63, "alonso": 14, "norris": 4, "bottas": 77, "ricciardo": 3,
        "gasly": 10, "stroll": 18, "hulkenberg": 27, "tsunoda": 22, "albon": 23,
        "zhou": 24, "kevin_magnussen": 20, "ocon": 31, "sargeant": 2, "piastri": 81,
        "ricciardo": 3, "vettel": 5, "raikkonen": 7, "giovinazzi": 99, "grosjean": 8,
        "kubica": 88, "kvyat": 26, // Add more as needed
    };
    return driverIdMap[driverId];
};

// Helper to map Ergast constructorId to OpenF1 team_name (best effort)
export const getTeamNameFromErgastId = (constructorId: string): string => {
    const constructorIdMap: { [key: string]: string } = {
        "mercedes": "Mercedes",
        "red_bull": "Red Bull Racing",
        "ferrari": "Ferrari",
        "mclaren": "McLaren",
        "aston_martin": "Aston Martin",
        "alpine": "Alpine",
        "williams": "Williams",
        "rb": "RB", // For Visa Cash App RB Formula One Team
        "sauber": "Sauber", // For Stake F1 Team Kick Sauber
        "haas": "Haas F1 Team",
        "alfa": "Alfa Romeo", // Historical
        "toro_rosso": "Toro Rosso", // Historical
        "renault": "Renault", // Historical
        "racing_point": "Racing Point", // Historical
        "force_india": "Force India", // Historical
        "sauber": "Sauber", // Historical
        "minardi": "Minardi", // Historical
        // Add more as needed
    };
    return constructorIdMap[constructorId] || constructorId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
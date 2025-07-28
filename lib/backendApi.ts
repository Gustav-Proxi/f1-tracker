// src/lib/backendApi.ts (Updated for FastF1 Position Data)
const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

// --- Data Interfaces (Match what OpenF1 returns via your Python backend) ---

// From OpenF1 /v1/meetings
export interface OpenF1Meeting {
    circuit_key: number;
    circuit_short_name: string;
    country_code: string;
    country_key: number;
    country_name: string;
    date_start: string; // ISO 8601 string
    date_end: string;   // ISO 8601 string
    gmt_offset: string;
    location: string;
    meeting_key: number;
    meeting_name: string;
    meeting_official_name: string;
    year: number;
}

// From OpenF1 /v1/sessions
export interface OpenF1Session {
    circuit_key: number;
    circuit_short_name: string;
    country_code: string;
    country_key: number;
    country_name: string;
    date_end: string;
    date_start: string;
    gmt_offset: string;
    location: string;
    meeting_key: number;
    session_key: number;
    session_name: string;
    session_type: string;
    year: number;
}

// From OpenF1 /v1/drivers
export interface OpenF1Driver {
    broadcast_name: string;
    country_code: string;
    driver_number: number;
    first_name: string;
    full_name: string;
    headshot_url: string;
    last_name: string;
    meeting_key: number;
    name_acronym: string;
    session_key: number;
    team_colour: string;
    team_name: string;
}

// From OpenF1 /v1/session_result (This will replace Ergast standings)
export interface OpenF1SessionResult {
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
    driver_number: number;
    duration: number | null; // OpenF1 sometimes gives number, or string if time
    gap_to_leader: number | string | null; // Can be number (seconds) or "+N LAP(S)" string
    number_of_laps: number;
    meeting_key: number;
    position: number;
    session_key: number;
}

// From OpenF1 /v1/laps
export interface OpenF1Lap {
    date_start: string;
    driver_number: number;
    duration_sector_1: number | null;
    duration_sector_2: number | null;
    duration_sector_3: number | null;
    i1_speed: number | null;
    i2_speed: number | null;
    is_pit_out_lap: boolean;
    lap_duration: number | null;
    lap_number: number;
    meeting_key: number;
    segments_sector_1: number[];
    segments_sector_2: number[];
    segments_sector_3: number[];
    session_key: number;
    st_speed: number | null;
}

// NEW: From FastF1 for Position Data
export interface FastF1PositionData {
    Date: string; // ISO 8601 string (Timestamp)
    X: number;
    Y: number;
    Z: number;
}


// --- Generic Fetcher for Your Backend API ---
async function fetchFromBackend<T>(path: string, revalidateTime: number = 600): Promise<T[]> {
  const url = `${BACKEND_API_BASE_URL}/${path}`;
  try {
    console.log("Fetching from backend URL:", url);
    const res = await fetch(url, { next: { revalidate: revalidateTime } });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend API Error for ${path}: ${res.status} - ${res.statusText}. Response: ${errorText}`);
      return [];
    }
    const data: T[] = await res.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch from backend ${path}:`, error);
    return [];
  }
}

// --- Backend API Functions (Frontend-facing, OpenF1-centric) ---

// Schedule/Meetings
export const getOpenF1Meetings = async (year: number) => {
   return fetchFromBackend<OpenF1Meeting>(`openf1/meetings/${year}`, 3600); // 1 hour revalidate
};

// Sessions within a Meeting
export const getOpenF1Sessions = async (meetingKey: number) => {
   return fetchFromBackend<OpenF1Session>(`openf1/sessions/${meetingKey}`, 60); // 1 minute revalidate
};

// Drivers
export const getOpenF1Drivers = async (sessionKey: number) => {
   return fetchFromBackend<OpenF1Driver>(`openf1/drivers/${sessionKey}`, 300); // 5 minutes revalidate
};

// Session Results (for per-session standings)
export const getOpenF1SessionResults = async (sessionKey: number) => {
    return fetchFromBackend<OpenF1SessionResult>(`openf1/session_results/${sessionKey}`, 60); // 1 minute revalidate
};

// Laps
export const getOpenF1Laps = async (sessionKey: number, driverNumber: number) => {
    return fetchFromBackend<OpenF1Lap>(`openf1/laps/${sessionKey}/${driver_number}`, 60); // 1 minute revalidate
};

// NEW: Position Data from FastF1
export const getFastF1PositionData = async (year: number, eventName: string, sessionName: string, driverId: string) => {
    return fetchFromBackend<FastF1PositionData>(`fastf1/position/${year}/${eventName}/${sessionName}/${driverId}`, 60); // 1 minute revalidate
};


// --- Prediction API Call (through your Next.js API route proxy) ---
export const getPredictions = async (predictionInputs: any[]): Promise<{ predictions: { driver_id_encoded: number, predicted_position: number }[] }> => {
    try {
        const res = await fetch('/api/predict', { // Call your Next.js API route proxy
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ predictionInputs }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Prediction request failed');
        }
        return res.json();
    } catch (error) {
        console.error('Frontend prediction call failed:', error);
        throw error;
    }
};
// src/app/components/PredictionForm.tsx
'use client'; // This makes it a client component

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Assuming you added this via shadcn-ui add label
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Driver, Constructor, ErgastQualifyingResult } from '@/lib/backendApi'; // Import types
import { getDriverNumberFromErgastId, getTeamNameFromErgastId } from '@/lib/utils';


// Simplified input for prediction. In a real scenario, you'd gather
// pre-race data for all drivers in the selected race.
interface PredictionInputFormProps {
    drivers: Driver[]; // Ergast drivers for mapping
    constructors: Constructor[]; // Ergast constructors for mapping
    qualifyingResults: ErgastQualifyingResult[]; // Ergast qualifying results
}

const PredictionForm: React.FC<PredictionInputFormProps> = ({ drivers, constructors, qualifyingResults }) => {
    const [loading, setLoading] = useState(false);
    const [predictions, setPredictions] = useState<{ driverId: string; predictedPosition: number }[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // State for a single driver's mock input (for demonstration)
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [gridPosition, setGridPosition] = useState<string>('');
    const [q3Time, setQ3Time] = useState<string>(''); // Q3 time from qualifying results

    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        setPredictions(null);

        // In a real scenario, you'd iterate through all participating drivers
        // and construct their feature vectors. This is a highly simplified mock.
        const inputFeatures: any[] = [];

        // For demonstration, let's try to predict for all drivers in the qualifying results
        // This assumes the Python model is trained to predict for multiple drivers at once
        // and that 'driver_id_encoded', 'constructor_id_encoded' map to your model's internal IDs.
        // This mapping is complex and usually done in the Python backend.

        if (qualifyingResults.length === 0 || drivers.length === 0 || constructors.length === 0) {
            setError("Please select a race with qualifying results and driver/constructor data to attempt a prediction.");
            setLoading(false);
            return;
        }

        for (const qr of qualifyingResults) {
            const driver = drivers.find(d => d.driverId === qr.Driver.driverId);
            const constructor = constructors.find(c => c.constructorId === qr.Constructor.constructorId);

            if (!driver || !constructor) {
                console.warn(`Missing data for driver ${qr.Driver.driverId} or constructor ${qr.Constructor.constructorId}. Skipping.`);
                continue;
            }

            // IMPORTANT: These encoded IDs (0, 1, 2...) MUST match how your Python model
            // encoded them during training. This is a major simplification for the demo.
            // In a real app, you'd send driverId/constructorId and let the backend handle encoding.
            const mockDriverEncodedId = getDriverNumberFromErgastId(driver.driverId) || 0; // Fallback
            const mockConstructorEncodedId = constructors.findIndex(c => c.constructorId === constructor.constructorId);
            if (mockConstructorEncodedId === -1) {
                // If constructor not found in the list, assign a default or skip
                console.warn(`Constructor ${constructor.constructorId} not found in constructor list. Skipping.`);
                continue;
            }

        inputFeatures.push({
            year: new Date().getFullYear(), // Current year for prediction
            round: 0, // Placeholder, actual round would be needed
            grid_position: parseInt(qr.position),
            laps_completed: 0, // Placeholder, not known pre-race
            points_earned: 0, // Placeholder, not known pre-race
            fastest_lap_rank: 0, // Placeholder, not known pre-race
            q1_seconds: qr.Q1 ? parseFloat(qr.Q1.replace(':', '.')) : 0, // Simplified time conversion
            q2_seconds: qr.Q2 ? parseFloat(qr.Q2.replace(':', '.')) : 0,
            q3_seconds: qr.Q3 ? parseFloat(qr.Q3.replace(':', '.')) : 0,
            driver_season_points_after_race: 0, // Placeholder, would be pre-race points
            driver_season_wins_after_race: 0, // Placeholder, would be pre-race wins
            constructor_season_points_after_race: 0, // Placeholder
            constructor_season_wins_after_race: 0, // Placeholder
            driver_id_encoded: mockDriverEncodedId, // This needs to be consistent with Python model's encoding
            constructor_id_encoded: mockConstructorEncodedId, // This needs to be consistent with Python model's encoding
            circuit_id_encoded: 0, // Placeholder, needs actual circuit encoding
            // Add other features your model expects, with mock/placeholder values
        });
    }

    if (inputFeatures.length === 0) {
        setError("Could not generate prediction inputs from available data. Ensure qualifying results are loaded.");
        setLoading(false);
        return;
    }

    try {
        const res = await fetch('/api/predict', { // Call your Next.js API route
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ predictionInputs: inputFeatures }),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API Error: ${res.status} - ${errText}`);
        }

        const data: { predictions: number[] } = await res.json();

        // Map predictions back to driver names
        const predictedResults = data.predictions.map((pos, index) => {
            const driverId = qualifyingResults[index]?.Driver?.driverId || `unknown_driver_${index}`;
            const driverName = drivers.find(d => d.driverId === driverId)?.GivenName + ' ' + drivers.find(d => d.driverId === driverId)?.FamilyName || driverId;
            return { driverId, driverName, predictedPosition: Math.round(pos) };
        }).sort((a, b) => a.predictedPosition - b.predictedPosition); // Sort by predicted position

        setPredictions(predictedResults);

    } catch (err: any) {
        console.error('Prediction failed:', err);
        setError(err.message || 'Failed to get predictions. Please try again.');
    } finally {
        setLoading(false);
    }
};

return (
    <div className="card p-6">
        <p className="text-gray-700 mb-4">
            This section demonstrates how a race outcome prediction model could be integrated.
            The model would typically use pre-race data (like qualifying results, driver/team form, weather)
            to predict final race positions or probabilities.
        </p>
        <p className="text-red-600 font-semibold mb-4">
            **Important:** This is a demonstration. The prediction inputs are currently mocked/simplified,
            and the Python backend for the actual ML model needs to be set up and deployed separately.
            The model's accuracy will depend heavily on the quality and quantity of training data and feature engineering.
        </p>

        <div className="flex flex-col space-y-4">
            <Button onClick={handlePredict} disabled={loading} className="w-full md:w-auto">
                {loading ? 'Predicting...' : 'Generate Race Prediction'}
            </Button>
        </div>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        {predictions && (
            <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Predicted Finishing Order:</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Pos</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {predictions.map((pred, index) => (
                                <tr key={pred.driverId}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pred.predictedPosition}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pred.driverName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                    (Predictions are illustrative and based on simplified inputs. Real-world F1 prediction is highly complex.)
                </p>
            </div>
        )}
    </div>
);
};

export default PredictionForm;
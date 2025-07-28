// src/app/api/predict/route.ts
import { NextRequest, NextResponse } from 'next/server';

// This URL should point to your deployed Python prediction API
const PYTHON_PREDICTION_API_URL = process.env.PYTHON_PREDICTION_API_URL || 'http://localhost:5000/predict_race_outcome';

export async function POST(req: NextRequest) {
  try {
    const { predictionInputs } = await req.json(); // Data from your frontend

    if (!predictionInputs) {
      return NextResponse.json({ error: 'Missing predictionInputs in request body' }, { status: 400 });
    }

    console.log('Forwarding prediction request to Python backend:', PYTHON_PREDICTION_API_URL);
    // Call your Python Flask/FastAPI backend
    const response = await fetch(PYTHON_PREDICTION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(predictionInputs), // Send the array of inputs
    });

    if (!response.ok) {
      const errorData = await response.text(); // Get raw text for better debugging
      console.error(`Python backend error: ${response.status} - ${response.statusText}`, errorData);
      return NextResponse.json({ error: `Prediction failed: Backend error (${response.status})` }, { status: response.status });
    }

    const result = await response.json();
    console.log('Prediction result from Python backend:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error calling prediction API:', error);
    return NextResponse.json({ error: 'Internal server error during prediction' }, { status: 500 });
  }
}
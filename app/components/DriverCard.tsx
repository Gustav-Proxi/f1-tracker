// src/app/components/DriverCard.tsx
import Image from 'next/image';
import React from 'react';
import { Driver } from '@/lib/backendApi'; // Updated import path

interface DriverCardProps {
  driver: Driver;
}

const DEFAULT_HEADSHOT = "https://placehold.co/100x100/e10600/ffffff?text=F1"; // More F1-themed placeholder

const DriverCard: React.FC<DriverCardProps> = ({ driver }) => {
  // Use OpenF1's team_colour if available, otherwise default or try to map from Ergast
  const teamColor = driver.team_colour ? `#${driver.team_colour}` : '#cccccc';

  // Prefer OpenF1 full_name, fallback to Ergast GivenName + FamilyName
  const displayName = driver.full_name || `${driver.GivenName || ''} ${driver.FamilyName || ''}`.trim();
  const displayTeam = driver.team_name || driver.Constructor?.Name || 'N/A';
  const displayNationality = driver.country_code || driver.Nationality || 'N/A';
  const displayNumber = driver.driver_number || driver.PermanentNumber || 'N/A';

  return (
    <div className="card flex flex-col items-center p-4 border border-gray-200"
         style={{ borderColor: teamColor, borderWidth: '3px' }}>
      <div className="relative w-24 h-24 mb-3">
        <Image
          src={driver.headshot_url || DEFAULT_HEADSHOT}
          alt={displayName}
          width={96}
          height={96}
          className="rounded-full object-cover border-2"
          style={{ borderColor: teamColor }}
          priority
          onError={(e) => {
            e.currentTarget.src = DEFAULT_HEADSHOT; // Fallback on error
          }}
        />
        {displayNumber !== 'N/A' && (
          <div className="absolute bottom-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center -mr-2 -mb-2">
            {displayNumber}
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 text-center mb-1">
        {displayName}
      </h3>
      <p className="text-sm text-gray-600">{displayTeam}</p>
      <p className="text-xs text-gray-500">{displayNationality}</p>
    </div>
  );
};

export default DriverCard;
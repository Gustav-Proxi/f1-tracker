// src/app/page.tsx (Updated for UI Robustness and Aesthetic)
import {
  getOpenF1Meetings, getOpenF1Sessions, getOpenF1Drivers, getOpenF1SessionResults, getOpenF1Laps, getFastF1PositionData,
  OpenF1Meeting, OpenF1Session, OpenF1Driver, OpenF1SessionResult, OpenF1Lap, FastF1PositionData
} from '@/lib/backendApi';
import DriverCard from './components/DriverCard';
import PredictionForm from './components/PredictionForm';
import { formatDuration } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

// This is a Server Component
export default async function HomePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const currentYear = new Date().getFullYear();
  const DEFAULT_YEAR = 2024;
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : DEFAULT_YEAR;
  const selectedTab = searchParams.tab || 'session_results';

  // Convert searchParams to a plain object for use in Link hrefs
  const currentSearchParams: { [key: string]: string } = {};
  for (const key in searchParams) {
    if (Object.prototype.hasOwnProperty.call(searchParams, key)) {
      const value = searchParams[key];
      if (typeof value === 'string') {
        currentSearchParams[key] = value;
      } else if (Array.isArray(value)) {
        currentSearchParams[key] = value[0] || '';
      }
    }
  }


  // --- PRIMARY DATA SOURCE: OpenF1 for ALL core data ---

  // 1. Get Meetings (Schedule/Events)
  const meetings: OpenF1Meeting[] = await getOpenF1Meetings(selectedYear);
  meetings.sort((a, b) => {
    const dateA = new Date(a.date_start).getTime();
    const dateB = new Date(b.date_start).getTime();
    return dateB - dateA;
  });

  const selectedMeetingName = searchParams.meeting;
  const currentMeeting = selectedMeetingName
    ? meetings.find(m => m.meeting_name === selectedMeetingName)
    : undefined;

  const latestCompletedMeeting = meetings.find(m => new Date(m.date_start) < new Date());
  const effectiveMeeting = currentMeeting || latestCompletedMeeting || meetings[0];

  const selectedMeetingKey = effectiveMeeting?.meeting_key;

  // 2. Get Sessions for the selected meeting
  let sessions: OpenF1Session[] = [];
  if (selectedMeetingKey) {
    sessions = await getOpenF1Sessions(selectedMeetingKey);
    sessions.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
  }

  const selectedSessionName = searchParams.session;
  const currentSession = selectedSessionName
    ? sessions.find((s:OpenF1Session) => s.session_name === selectedSessionName)
    : (sessions.find((s:OpenF1Session) => s.session_type === 'Race') || sessions[0]);

  const selectedSessionKey = currentSession?.session_key;

  // 3. Get Drivers for the selected session
  let drivers: OpenF1Driver[] = [];
  if (selectedSessionKey) {
    drivers = await getOpenF1Drivers(selectedSessionKey);
  }

  // 4. Get Session Results (for per-session standings)
  let sessionResults: OpenF1SessionResult[] = [];
  if (selectedSessionKey) {
    sessionResults = await getOpenF1SessionResults(selectedSessionKey);
  }

  // 5. Get Lap Data for selected driver
  let lapsData: OpenF1Lap[] = [];
  const selectedDriverNumber = searchParams.driver ? parseInt(searchParams.driver) : undefined;
  if (selectedSessionKey && selectedDriverNumber) {
    lapsData = await getOpenF1Laps(selectedSessionKey, selectedDriverNumber);
  }

  // 6. Get Position Data for selected driver (from FastF1 via backend)
  let positionData: FastF1PositionData[] = [];
  const fastF1EventName = effectiveMeeting?.meeting_name;
  const fastF1SessionName = currentSession?.session_name;
  const selectedDriverNameAcronym = drivers.find(d => d.driver_number === selectedDriverNumber)?.name_acronym;

  if (fastF1EventName && fastF1SessionName && selectedDriverNameAcronym) {
    positionData = await getFastF1PositionData(selectedYear, fastF1EventName, fastF1SessionName, selectedDriverNameAcronym);
  }


  // Helper to get driver details from the fetched OpenF1 drivers list
  const getDriverDetails = (driverNumber: number) => {
    const driver = drivers.find(d => d.driver_number === driverNumber);
    return {
      fullName: driver?.full_name || `Driver ${driverNumber}`,
      teamName: driver?.team_name || 'N/A',
      headshotUrl: driver?.headshot_url,
      teamColour: driver?.team_colour,
      countryCode: driver?.country_code,
      nameAcronym: driver?.name_acronym
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased">
      <header className="bg-gradient-to-r from-red-700 to-red-900 text-white p-4 text-center shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">F1 Grand Prix Hub 🏎️</h1>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Control Panel (Glassmorphism card) */}
        <div className="glass-card mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Select Race Data</h2>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-6" action="/" method="GET">
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-300 mb-1">Select Year</label>
              <Select name="year" defaultValue={selectedYear.toString()}>
                <SelectTrigger id="year-select" className="w-full text-white bg-gray-800/50 border-gray-700 focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select Year" className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {Array.from({ length: currentYear - 2016 }, (_, i) => currentYear - i).map(year => (
                    <SelectItem key={year} value={year.toString()} className="hover:bg-gray-700 data-[state=checked]:bg-red-700 data-[state=checked]:text-white">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="meeting-select" className="block text-sm font-medium text-gray-300 mb-1">Select Meeting (Event)</label>
              <Select name="meeting" defaultValue={selectedMeetingName || ''}>
                <SelectTrigger id="meeting-select" className="w-full text-white bg-gray-800/50 border-gray-700 focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select Meeting" className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {meetings.map(meeting => (
                    <SelectItem key={meeting.meeting_key} value={meeting.meeting_name!} className="hover:bg-gray-700 data-[state=checked]:bg-red-700 data-[state=checked]:text-white">
                      {meeting.meeting_name} ({meeting.circuit_short_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="session-select" className="block text-sm font-medium text-gray-300 mb-1">Select Session (Practice/Qualy/Race)</label>
              <Select name="session" defaultValue={selectedSessionName || ''}>
                <SelectTrigger id="session-select" className="w-full text-white bg-gray-800/50 border-gray-700 focus:ring-red-500 focus:border-red-500">
                  <SelectValue placeholder="Select Session" className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {sessions.map((session:OpenF1Session) => (
                    <SelectItem key={session.session_key} value={session.session_name!} className="hover:bg-gray-700 data-[state=checked]:bg-red-700 data-[state=checked]:text-white">
                      {session.session_name} ({session.session_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                Load Data
              </Button>
            </div>
          </form>
        </div>

        {effectiveMeeting && (
          <div className="glass-card mb-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              Event: {effectiveMeeting.meeting_official_name}
              {currentSession && ` - Session: ${currentSession.session_name}`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-800/30 rounded-lg backdrop-blur-sm border border-gray-700">
                <p className="text-sm text-gray-400">Circuit</p>
                <p className="text-lg font-semibold text-white">{effectiveMeeting.circuit_short_name}</p>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg backdrop-blur-sm border border-gray-700">
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-lg font-semibold text-white">{effectiveMeeting.location}, {effectiveMeeting.country_name}</p>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg backdrop-blur-sm border border-gray-700">
                <p className="text-sm text-gray-400">Date</p>
                <p className="text-lg font-semibold text-white">{format(new Date(effectiveMeeting.date_start), 'PPP')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for different data views */}
        <Tabs defaultValue={selectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 bg-gray-800/50 border border-gray-700 rounded-lg p-1 backdrop-blur-sm shadow-xl overflow-x-auto whitespace-nowrap">
            {/* Driver Standings and Constructor Standings will now be based on OpenF1's session_result */}
            <Link href={{ query: { ...currentSearchParams, tab: 'driver_standings' } }} passHref legacyBehavior>
              <TabsTrigger value="driver_standings" asChild className="hover:bg-red-700/30 data-[state=active]:bg-red-700 data-[state=active]:text-white transition-colors duration-200 text-gray-300">Driver Standings (Session)</TabsTrigger>
            </Link>
            <Link href={{ query: { ...currentSearchParams, tab: 'constructor_standings' } }} passHref legacyBehavior>
              <TabsTrigger value="constructor_standings" asChild className="hover:bg-red-700/30 data-[state=active]:bg-red-700 data-[state=active]:text-white transition-colors duration-200 text-gray-300">Constructor Standings (Session)</TabsTrigger>
            </Link>
            <Link href={{ query: { ...currentSearchParams, tab: 'session_results' } }} passHref legacyBehavior>
              <TabsTrigger value="session_results" asChild className="hover:bg-red-700/30 data-[state=active]:bg-red-700 data-[state=active]:text-white transition-colors duration-200 text-gray-300">Session Results (Raw)</TabsTrigger>
            </Link>
            <Link href={{ query: { ...currentSearchParams, tab: 'drivers_overview' } }} passHref legacyBehavior>
              <TabsTrigger value="drivers_overview" asChild className="hover:bg-red-700/30 data-[state=active]:bg-red-700 data-[state=active]:text-white transition-colors duration-200 text-gray-300">Drivers Overview</TabsTrigger>
            </Link>
            <Link href={{ query: { ...currentSearchParams, tab: 'lap_data' } }} passHref legacyBehavior>
              <TabsTrigger value="lap_data" asChild className="hover:bg-red-700/30 data-[state=active]:bg-red-700 data-[state=active]:text-white transition-colors duration-200 text-gray-300">Lap Data</TabsTrigger>
            </Link>
            <Link href={{ query: { ...currentSearchParams, tab: 'position_tracking' } }} passHref legacyBehavior>
              <TabsTrigger value="position_tracking" asChild className="hover:bg-red-700/30 data-[state=active]:bg-red-700 data-[state=active]:text-white transition-colors duration-200 text-gray-300">Position Tracking</TabsTrigger>
            </Link>
            <Link href={{ query: { ...currentSearchParams, tab: 'prediction' } }} passHref legacyBehavior>
              <TabsTrigger value="prediction" asChild className="hover:bg-red-700/30 data-[state=active]:bg-red-700 data-[state=active]:text-white transition-colors duration-200 text-gray-300">Race Prediction</TabsTrigger>
            </Link>
          </TabsList>

          {/* Driver Standings Tab */}
          <TabsContent value="driver_standings" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              Driver Standings for {effectiveMeeting?.meeting_name || 'Selected Event'} - {currentSession?.session_name || 'Selected Session'}
            </h2>
            <p className="text-sm text-gray-400 mb-4">Note: These standings are for the **selected session only**, not cumulative season points. Cumulative season standings are not directly available via OpenF1 API yet.</p>
            {sessionResults.length > 0 ? (
              <div className="glass-card overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pos</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Team</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Laps</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time/Gap</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/50 divide-y divide-gray-800">
                    {sessionResults.map((result) => {
                      const { fullName, teamName } = getDriverDetails(result.driver_number);
                      const timeOrGap = result.duration !== null ? result.duration : result.gap_to_leader;
                      const status = result.dnf ? 'DNF' : (result.dns ? 'DNS' : (result.dsq ? 'DSQ' : 'Finished'));
                      return (
                        <tr key={result.driver_number}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{result.position}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{fullName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{teamName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{result.number_of_laps}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDuration(timeOrGap)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-400 glass-card">No driver standings (session results) available for this selection.</p>
            )}
          </TabsContent>

          {/* Constructor Standings Tab (Needs custom aggregation from session results) */}
          <TabsContent value="constructor_standings" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              Constructor Standings for {effectiveMeeting?.meeting_name || 'Selected Event'} - {currentSession?.session_name || 'Selected Session'}
            </h2>
            <p className="text-sm text-gray-400 mb-4">Note: OpenF1 provides driver session results. Calculating constructor standings requires aggregating driver results by team. This feature is not yet implemented.</p>
            <p className="text-center text-gray-400 glass-card">Constructor standings data not directly available from OpenF1 API and requires aggregation.</p>
          </TabsContent>

          {/* Session Results (Raw) Tab */}
          <TabsContent value="session_results" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Session Results (Raw Data from OpenF1)</h2>
            {sessionResults.length > 0 ? (
              <div className="glass-card overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pos</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver Number</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Laps</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Gap to Leader</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">DNF</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">DSQ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/50 divide-y divide-gray-800">
                    {sessionResults.map((result) => (
                      <tr key={result.driver_number}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{result.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{result.driver_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{result.number_of_laps}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDuration(result.duration)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDuration(result.gap_to_leader)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{result.dnf ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{result.dsq ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-400 glass-card">No raw session results available for this session.</p>
            )}
          </TabsContent>

          {/* Drivers Overview Tab */}
          <TabsContent value="drivers_overview" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Drivers Overview</h2>
            {drivers.length > 0 ? (
              <div className="driver-card-grid">
                {drivers.map(driver => (
                  <DriverCard key={driver.driver_number} driver={driver} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 glass-card">No driver data available for this session.</p>
            )}
          </TabsContent>

          {/* Lap Data Tab */}
          <TabsContent value="lap_data" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Driver Lap Data</h2>
            <div className="glass-card p-6 mb-6">
              <form action="/" method="GET" className="flex flex-col sm:flex-row items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <input type="hidden" name="year" value={selectedYear} />
                <input type="hidden" name="meeting" value={effectiveMeeting?.meeting_name || ''} />
                <input type="hidden" name="session" value={currentSession?.session_name || ''} />
                <input type="hidden" name="tab" value="lap_data" />

                <div className="flex-1 w-full">
                  <label htmlFor="lap-driver-select" className="block text-sm font-medium text-gray-300 mb-2">Select Driver for Lap Data</label>
                  <Select name="driver" defaultValue={selectedDriverNumber?.toString() || ''}>
                    <SelectTrigger id="lap-driver-select" className="w-full text-white bg-gray-800/50 border-gray-700 focus:ring-red-500 focus:border-red-500">
                      <SelectValue placeholder="Select Driver" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      {drivers.map(driver => (
                        <SelectItem key={driver.driver_number} value={driver.driver_number.toString()} className="hover:bg-gray-700 data-[state=checked]:bg-red-700 data-[state=checked]:text-white">
                          {driver.full_name} (#{driver.driver_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md w-full sm:w-auto h-10">
                  Load Laps
                </Button>
              </form>
            </div>

              {selectedDriverNumber && lapsData.length > 0 ? (
                <div className="mt-6 glass-card overflow-x-auto">
                  <h3 className="text-xl font-semibold text-gray-100 mb-4">Laps for {getDriverDetails(selectedDriverNumber)?.fullName || selectedDriverNumber}</h3>
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lap</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">S1</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">S2</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">S3</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Speed Trap</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900/50 divide-y divide-gray-800">
                      {lapsData.map(lap => (
                        <tr key={lap.lap_number}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{lap.lap_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{formatDuration(lap.lap_duration)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDuration(lap.duration_sector_1)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDuration(lap.duration_sector_2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDuration(lap.duration_sector_3)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{lap.st_speed || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                effectiveMeeting && currentSession && <p className="text-center text-gray-400 glass-card mt-6">Select an event and session, then a driver above to view their lap data.</p>
              )}
          </TabsContent>

          {/* Position Tracking Tab */}
          <TabsContent value="position_tracking" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Position Tracking (from FastF1)</h2>
            <div className="glass-card p-6 mb-6">
              <form action="/" method="GET" className="flex flex-col sm:flex-row items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <input type="hidden" name="year" value={selectedYear} />
                <input type="hidden" name="meeting" value={effectiveMeeting?.meeting_name || ''} />
                <input type="hidden" name="session" value={currentSession?.session_name || ''} />
                <input type="hidden" name="tab" value="position_tracking" />

                <div className="flex-1 w-full">
                  <label htmlFor="pos-driver-select" className="block text-sm font-medium text-gray-300 mb-2">Select Driver for Position Tracking</label>
                  <Select name="driver" defaultValue={selectedDriverNumber?.toString() || ''}>
                    <SelectTrigger id="pos-driver-select" className="w-full text-white bg-gray-800/50 border-gray-700 focus:ring-red-500 focus:border-red-500">
                      <SelectValue placeholder="Select Driver" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      {drivers.map(driver => (
                        <SelectItem key={driver.driver_number} value={driver.driver_number.toString()} className="hover:bg-gray-700 data-[state=checked]:bg-red-700 data-[state=checked]:text-white">
                          {driver.full_name} (#{driver.driver_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md w-full sm:w-auto h-10">
                  Load Positions
                </Button>
              </form>
            </div>

            {selectedDriverNumber && positionData.length > 0 ? (
              <div className="mt-6 glass-card overflow-x-auto">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">Position Data for {getDriverDetails(selectedDriverNumber)?.fullName || selectedDriverNumber}</h3>
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp (UTC)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">X</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Y</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Z</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/50 divide-y divide-gray-800">
                    {positionData.map((pos, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{format(new Date(pos.Date), 'HH:mm:ss.SSS')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{pos.X.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{pos.Y.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{pos.Z.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-sm text-gray-400 mt-4">Note: X, Y, Z coordinates are relative to an arbitrary origin on the track. Z typically represents altitude.</p>
              </div>
            ) : (
              effectiveMeeting && currentSession && <p className="text-center text-gray-400 glass-card mt-6">Select an event and session, then a driver above to view their position data.</p>
            )}
          </TabsContent>

          {/* Prediction Tab */}
          <TabsContent value="prediction" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">🏁 Race Outcome Prediction</h2>
            <PredictionForm
              drivers={drivers}
              constructors={[]}
              qualifyingResults={sessionResults.map(res => ({
                  number: String(res.driver_number),
                  position: String(res.position || 0),
                  Driver: { driverId: getDriverDetails(res.driver_number).countryCode, PermanentNumber: String(res.driver_number), GivenName: getDriverDetails(res.driver_number).fullName.split(' ')[0], FamilyName: getDriverDetails(res.driver_number).fullName.split(' ')[1] || '', Nationality: getDriverDetails(res.driver_number).countryCode, url: '' },
                  Constructor: { constructorId: getDriverDetails(res.driver_number).teamName.toLowerCase().replace(/\s/g, '_'), Name: getDriverDetails(res.driver_number).teamName, Nationality: '', url: ''},
                  Q1: res.duration ? formatDuration(res.duration) : undefined,
                  Q2: undefined,
                  Q3: undefined,
              }))}
            />
          </TabsContent>
        </Tabs>

        {!effectiveMeeting && (
          <div className="text-center text-gray-400 glass-card p-8">
            <p className="text-lg">Please use the controls above to select a Year, Event, and Session to begin exploring F1 data.</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center mt-10 text-sm shadow-inner">
        <p>Data provided by <a href="https://openf1.org/" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">OpenF1 API</a> and <a href="https://github.com/theOehrly/FastF1" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">FastF1</a> (unofficial)</p>
      </footer>
    </div>
  );
}
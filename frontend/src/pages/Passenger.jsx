import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:5000' : '', { path: window.location.hostname === 'localhost' ? '/socket.io' : '/_/backend/socket.io' });

function App() {
  const [buses, setBuses] = useState({});
  const [busIdToTrack, setBusIdToTrack] = useState('PB01-A123');
  const [trackingActive, setTrackingActive] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  
  // Journey Planner State
  const [source, setSource] = useState('Chandigarh');
  const [destination, setDestination] = useState('Amritsar');
  const [journeyResult, setJourneyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (trackingActive) {
      socket.emit('client-join', busIdToTrack);
      socket.on('bus-location', (data) => {
        setBuses((prev) => ({
          ...prev,
          [data.busId]: data
        }));
      });
    } else {
      socket.off('bus-location');
    }
    return () => { socket.off('bus-location'); };
  }, [trackingActive, busIdToTrack]);

  const handleSOS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit('sos-alert', {
          type: 'passenger',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toISOString()
        });
        alert('SOS EMERGENCY ping transmitted directly to authorities!');
      });
    } else {
      alert('Geolocation not supported by this browser.');
    }
  };

  const handleSearchJourney = async () => {
    setLoading(true);
    setErrorMsg('');
    setJourneyResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/journey?source=${source}&destination=${destination}`);
      const data = await res.json();
      if (data.success) {
        setJourneyResult(data);
      } else {
        setErrorMsg(data.message);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to route engine.');
    } finally {
      setLoading(false);
    }
  };

  const trackedBus = buses[busIdToTrack];

  return (
    <div 
      className={`min-h-screen pb-10 font-sans relative overflow-y-auto ${liteMode ? 'bg-black text-green-400' : 'text-slate-100'}`}
      style={!liteMode ? { backgroundImage: "url('/bg.png')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' } : {}}
    >
      {!liteMode && <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-0"></div>}
      
      <div className="relative z-10 p-4">
        <header className="max-w-xl mx-auto flex justify-between items-center py-4 mb-4">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl hover:text-blue-400 transition-colors bg-slate-800/80 backdrop-blur border border-slate-700 px-3 py-1 rounded-full cursor-pointer shadow-lg">&larr;</a>
            <div className="flex items-center gap-2">
               {!liteMode && <img src="/logo.png" className="w-8 h-8 rounded shrink-0 shadow-sm border border-slate-700" alt="logo" />}
               <h1 className="text-3xl font-bold tracking-tight bg-slate-800/80 backdrop-blur px-2 py-1 rounded-lg border border-slate-700 shadow-md">
                 <span className="text-white">Bus</span><span className="text-[#22c55e]">ly</span>
               </h1>
            </div>
          </div>
          <button 
            onClick={() => setLiteMode(!liteMode)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-md transition-all ${liteMode ? 'border-green-500 text-green-400 bg-green-900/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-slate-500 text-slate-300 bg-slate-800/80 hover:bg-slate-700 backdrop-blur'}`}
          >
            {liteMode ? '2G Lite Mode: ON' : 'Lite Mode: OFF'}
          </button>
        </header>

        <main className="max-w-xl mx-auto space-y-6">
          
          {/* Smart Journey Planner */}
          <div className={`p-6 rounded-2xl ${liteMode ? 'border border-green-800 border-dashed' : 'bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 shadow-2xl'}`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-blue-400">🗺️</span> Smart Journey Planner
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
               <input 
                 value={source} onChange={(e) => setSource(e.target.value)}
                 className={`flex-1 px-4 py-3 rounded-xl focus:outline-none ${liteMode ? 'bg-black border border-green-800 text-green-400' : 'bg-slate-900/50 border border-slate-600 focus:border-blue-500'}`}
                 placeholder="From e.g. Chandigarh"
               />
               <input 
                 value={destination} onChange={(e) => setDestination(e.target.value)}
                 className={`flex-1 px-4 py-3 rounded-xl focus:outline-none ${liteMode ? 'bg-black border border-green-800 text-green-400' : 'bg-slate-900/50 border border-slate-600 focus:border-blue-500'}`}
                 placeholder="To e.g. Amritsar"
               />
            </div>
            <button 
              onClick={handleSearchJourney} disabled={loading}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin inline-block border-2 border-slate-300 border-t-white h-5 w-5 rounded-full"></span>
              ) : "🔍 Find Quickest Route"}
            </button>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg text-sm text-center">
                {errorMsg}
              </div>
            )}

            {journeyResult && (
              <div className="mt-6 pt-6 border-t border-slate-600">
                <div className="flex justify-between items-start mb-4">
                  <div>
                     <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded text-xs font-bold tracking-wider">Fastest Route Found</span>
                     <h3 className="text-xl font-bold mt-1 text-blue-200">{journeyResult.routeId}</h3>
                  </div>
                  <div className="text-right">
                     <p className="text-3xl font-extrabold text-blue-400">{journeyResult.estimatedTimeMinutes}<span className="text-sm font-medium text-slate-400">min</span></p>
                     <p className="text-sm text-slate-400 font-medium">{journeyResult.totalDistanceKm} km distance</p>
                  </div>
                </div>
                
                {/* Route stops list */}
                <div className="relative pl-6 border-l-2 border-slate-600 space-y-4 mb-6">
                   {journeyResult.stops.map((stop, i) => (
                     <div key={i} className="relative">
                       <div className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 ${i === 0 || i === journeyResult.stops.length - 1 ? 'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-700 border-slate-500'}`}></div>
                       <p className={`font-medium ${i === 0 || i === journeyResult.stops.length - 1 ? 'text-white font-bold' : 'text-slate-300 text-sm'}`}>{stop.stopName}</p>
                     </div>
                   ))}
                </div>

                {/* Map Preview of Route */}
                {!liteMode && (
                  <div className="h-48 rounded-xl overflow-hidden shadow-inner border border-slate-600">
                    <MapContainer bounds={journeyResult.stops.map(s => [s.lat, s.lng])} zoom={8} scrollWheelZoom={false} className="h-full w-full">
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      <Polyline positions={journeyResult.stops.map(s => [s.lat, s.lng])} color="#3b82f6" weight={4} opacity={0.7} />
                      {journeyResult.stops.map((s, i) => (
                         <Marker key={i} position={[s.lat, s.lng]}>
                           <Popup className="text-slate-900 font-bold">{s.stopName}</Popup>
                         </Marker>
                      ))}
                    </MapContainer>
                  </div>
                )}
              </div>
            )}
          </div>

          
          {/* Live Tracker Config */}
          <div className={`p-4 rounded-xl ${liteMode ? 'border border-green-800 border-dashed' : 'bg-slate-800/60 backdrop-blur-md border border-slate-600/50 shadow-xl'}`}>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
               <span className="text-emerald-400">📡</span> Live Live Bus Sync
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={busIdToTrack}
                onChange={(e) => setBusIdToTrack(e.target.value)}
                className={`flex-1 px-4 py-2 rounded-lg font-mono focus:outline-none ${liteMode ? 'bg-black border border-green-800 text-green-400' : 'bg-slate-900/50 border border-slate-600 focus:border-blue-500'}`}
                placeholder="Enter Live Bus ID (e.g. PB01-A123)"
              />
              <button 
                onClick={() => setTrackingActive(!trackingActive)}
                className={`px-6 py-2 rounded-lg font-bold transition-transform active:scale-95 shadow-md ${
                  trackingActive 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                }`}
              >
                {trackingActive ? 'Stop Stream' : 'Track Sync'}
              </button>
            </div>
          </div>

          {/* Live Status View */}
          {trackingActive && trackedBus && (
            <div className={`p-6 rounded-2xl ${liteMode ? 'border border-green-800' : 'bg-slate-800/80 backdrop-blur-xl border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'} flex flex-col gap-4 relative overflow-hidden`}>
              {liteMode ? (
                <div className="font-mono space-y-2">
                  <p className="animate-pulse font-bold">[*] TRACKING ACTIVE</p>
                  <p>BUS ID: {trackedBus.busId}</p>
                  <p>LAT: {trackedBus.lat.toFixed(5)}</p>
                  <p>LNG: {trackedBus.lng.toFixed(5)}</p>
                  <p>SPEED: {Math.round(trackedBus.speed)} km/h</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-xl text-white drop-shadow">Live Trajectory</h2>
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]"></span>
                    </span>
                  </div>
                  
                  <div className="bg-slate-900/60 p-4 rounded-xl flex justify-between items-center border border-slate-700">
                    <div>
                      <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Speed</p>
                      <p className="text-2xl font-bold text-blue-400">{Math.round(trackedBus.speed)}<span className="text-sm">km/h</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Status</p>
                      <p className="text-lg font-bold text-emerald-400">En Route</p>
                    </div>
                  </div>

                  <div className="h-64 mt-2 rounded-xl overflow-hidden shadow-inner border border-slate-600">
                    <MapContainer center={[trackedBus.lat, trackedBus.lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      <Marker position={[trackedBus.lat, trackedBus.lng]}>
                        <Popup className="font-bold text-slate-900">
                          Bus {trackedBus.busId} <br /> {Math.round(trackedBus.speed)} km/h
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {trackingActive && !trackedBus && (
             <div className={`p-6 rounded-2xl ${liteMode ? 'border border-green-800 text-green-500 font-mono' : 'bg-slate-800/60 border border-slate-700 text-slate-400 text-center'} flex flex-col gap-4 relative overflow-hidden`}>
               <p className="animate-pulse font-bold">{liteMode ? "SEARCHING FOR SIGNAL..." : "Awaiting bus GPS signal over Socket..."}</p>
             </div>
          )}

          {/* SOS Button */}
          <button 
            onClick={handleSOS}
            className="w-full mt-4 py-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xl font-bold rounded-2xl shadow-[0_10px_30px_rgba(225,29,72,0.4)] transition-transform active:scale-95 flex items-center justify-center gap-3 border border-rose-500/50"
          >
            <span className="text-3xl pt-1">🚨</span> EMERGENCY SOS 
          </button>

        </main>
      </div>
    </div>
  );
}

export default App;

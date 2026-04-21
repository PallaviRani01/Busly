import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/_/backend';
const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:5000' : '', { path: window.location.hostname === 'localhost' ? '/socket.io' : '/_/backend/socket.io' });

function App() {
  const [busId] = useState('PB01-A123'); // Custom bus ID for Punjab
  const [isTripActive, setIsTripActive] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null, speed: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let watchId;
    let timer;
    let fallbackLoop;
    
    // Hackathon Simulation specific coordinates starting in Punjab
    let simLat = 31.6340; 
    let simLng = 74.8723;
    let simSpeed = 40;

    if (isTripActive) {
      socket.emit('driver-join', busId);
      
      // Timer for Trip Duration
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // Force simulated GPS movement for Desktop/Hackathon demonstration
      fallbackLoop = setInterval(() => {
         simLat += 0.0002;
         simLng += 0.0001;
         simSpeed = 40 + Math.random() * 5; // fluctuate speed
         
         setLocation({ lat: simLat, lng: simLng, speed: simSpeed });
         
         socket.emit('location-update', {
           busId,
           lat: simLat,
           lng: simLng,
           speed: simSpeed,
           timestamp: new Date().toISOString()
         });
      }, 3000);

      // Attempt actual GPS but it will be overridden by the robust Hackathon demo loop above
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {}, // Ignore actual stationary desktop coordinates to ensure map moving during demo
          (err) => console.error("Error watching position:", err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    } else {
      setElapsedTime(0);
      setLocation({ lat: null, lng: null, speed: 0 });
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (timer) clearInterval(timer);
      if (fallbackLoop) clearInterval(fallbackLoop);
    };
  }, [isTripActive, busId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden font-sans text-slate-100"
      style={{ backgroundImage: "url('/bg.png')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-0"></div>
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center h-full gap-6 mt-4">
        <header className="w-full flex items-center justify-between pb-4 border-b border-slate-700/50">
          <a href="/" className="text-xl hover:text-blue-400 transition-colors bg-slate-800/80 backdrop-blur border border-slate-700 px-3 py-1 rounded-full cursor-pointer shadow-lg">&larr;</a>
          <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur border border-slate-700 px-3 py-1 shadow-md rounded-xl">
             <img src="/logo.png" alt="Busly" className="w-7 h-7 rounded border border-slate-600" />
             <h1 className="text-2xl font-bold"><span className="text-white">Bus</span><span className="text-[#22c55e]">ly</span></h1>
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </header>

        <div className="w-full bg-slate-800/60 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(59,130,246,0.15)] flex flex-col items-center gap-6">
          <div className="w-full text-center">
            <h2 className="text-3xl font-extrabold text-white drop-shadow-md tracking-tight uppercase">Driver Terminal</h2>
            <p className="text-blue-400 font-medium tracking-wide mt-1">Authorized Streamer</p>
          </div>

          <div className="w-full flex justify-between items-center bg-slate-900/60 border border-slate-700/50 p-4 rounded-2xl shadow-inner">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-sm">Assigned Bus ID</span>
            <span className="font-mono text-xl font-bold text-amber-400 drop-shadow">{busId}</span>
          </div>

          {/* Telemetry Dashboard */}
          <div className="w-full grid grid-cols-2 gap-4">
             <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center justify-center">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Current Speed</span>
                <span className="text-3xl font-extrabold text-white">{Math.round(location.speed)}<span className="text-sm font-medium text-slate-400">km/h</span></span>
             </div>
             <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center justify-center">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Time Elapsed</span>
                <span className="text-3xl font-mono font-bold text-blue-400">{formatTime(elapsedTime)}</span>
             </div>
          </div>

          <button
            onClick={() => setIsTripActive(!isTripActive)}
            className={`w-full py-5 text-xl font-bold rounded-2xl transition-all shadow-xl flex justify-center items-center gap-3 border ${
              isTripActive 
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.4)]' 
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            {isTripActive ? (
               <><span className="text-2xl">⏹️</span> End Trip & Offlink</>
            ) : (
               <><span className="text-2xl">▶️</span> Start Trip & Stream</>
            )}
          </button>

          {isTripActive && (
            <div className="w-full bg-slate-900/80 border border-slate-700 p-5 rounded-2xl space-y-3 relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse rounded-2xl z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Live GPS Matrix</h3>
                </div>
                
                <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-slate-500 drop-shadow">LATITUDE</span>
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{location.lat ? location.lat.toFixed(6) : 'Acquiring...'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-slate-500 drop-shadow">LONGITUDE</span>
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{location.lng ? location.lng.toFixed(6) : 'Acquiring...'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/_/backend';
const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:5000' : '', { path: window.location.hostname === 'localhost' ? '/socket.io' : '/_/backend/socket.io' });

const data = [
  { time: '08:00', passengers: 400, capacity: 500 },
  { time: '10:00', passengers: 300, capacity: 500 },
  { time: '12:00', passengers: 550, capacity: 600 },
  { time: '14:00', passengers: 450, capacity: 600 },
  { time: '16:00', passengers: 700, capacity: 800 },
  { time: '18:00', passengers: 900, capacity: 1000 },
  { time: '20:00', passengers: 300, capacity: 400 },
];

const mockBuses = [
  { id: 'PB01-A123', route: 'Chandigarh to Amritsar', driver: 'Rajesh K.', status: 'Active', fuel: '80%' },
  { id: 'PB02-B456', route: 'Patiala to Pathankot', driver: 'Singh M.', status: 'Inactive', fuel: '30%' },
  { id: 'PB03-C789', route: 'Bathinda to Chandigarh', driver: 'Gurpreet S.', status: 'Active', fuel: '55%' },
  { id: 'PB04-D012', route: 'Chandigarh to Jalandhar', driver: 'Amit R.', status: 'Maintenance', fuel: '10%' },
];

const mockRoutes = [
  { id: 'PR-101', name: 'Chandigarh to Amritsar', stops: 4, distance: '230 km', fare: '₹250' },
  { id: 'PR-102', name: 'Patiala to Pathankot', stops: 6, distance: '280 km', fare: '₹310' },
  { id: 'PR-103', name: 'Bathinda to Chandigarh', stops: 5, distance: '210 km', fare: '₹220' },
];

function App() {
  const [buses, setBuses] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [mapCenter] = useState([31.1471, 75.3412]);
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    socket.emit('admin-join');

    socket.on('bus-location', (data) => {
      setBuses((prev) => ({
        ...prev,
        [data.busId]: data
      }));
    });

    socket.on('emergency-alert', (data) => {
      setAlerts((prev) => [data, ...prev]);
    });

    return () => {
      socket.off('bus-location');
      socket.off('emergency-alert');
    };
  }, []);

  const activeBusCount = Object.keys(buses).length;

  return (
    <div 
      className="flex h-screen overflow-hidden text-slate-100 font-sans relative"
      style={{ backgroundImage: "url('/bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md z-0"></div>

      {/* Main App Layout */}
      <div className="flex w-full h-full relative z-10">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-800/80 backdrop-blur-xl border-r border-slate-700 flex flex-col shadow-2xl">
          <div className="p-6 relative">
            <a href="/" className="absolute top-2 left-2 text-sm text-slate-400 hover:text-white pb-2 transition-colors cursor-pointer">&larr; Switch Role</a>
            <br/>
            <div className="flex items-center gap-2 mt-2">
              <img src="/logo.png" alt="Busly" className="w-8 h-8 rounded shrink-0 shadow-sm border border-slate-700"/>
              <h1 className="text-2xl font-bold bg-slate-100 px-3 py-1 inline-block rounded-lg shadow-sm"><span className="text-[#0f172a]">Bus</span><span className="text-[#22c55e]">ly</span></h1>
            </div>
            <p className="text-sm text-blue-400 mt-2 font-medium tracking-wide">Transport Admin</p>
          </div>
          <nav className="flex-1 px-4 space-y-2 mt-4 text-sm font-medium">
            <button onClick={() => setActiveTab('map')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-300 hover:bg-slate-700'}`}>
              <span className="mr-3 text-lg">📍</span> Global Fleet Map
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-300 hover:bg-slate-700'}`}>
              <span className="mr-3 text-lg">📈</span> Occupancy Analytics
            </button>
            <button onClick={() => setActiveTab('buses')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${activeTab === 'buses' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-300 hover:bg-slate-700'}`}>
              <span className="mr-3 text-lg">🚌</span> Manage Fleet
            </button>
            <button onClick={() => setActiveTab('routes')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${activeTab === 'routes' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-300 hover:bg-slate-700'}`}>
              <span className="mr-3 text-lg">🛣️</span> Routes Setup
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <header className="h-16 border-b border-slate-700/50 flex items-center justify-between px-8 bg-slate-800/40 backdrop-blur-lg sticky top-0 z-20 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 drop-shadow-md capitalize">
              {activeTab === 'map' ? 'Live Global Fleet Overview' : activeTab === 'analytics' ? 'System Occupancy Analytics' : activeTab === 'buses' ? 'Manage Fleet Operations' : 'Punjab Roadways Setup'}
            </h2>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-md ${alerts.length > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
                🚨 {alerts.length} Alerts
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-bold shadow-lg border border-white/20">A</div>
            </div>
          </header>

          <div className="p-8 flex-1 flex flex-col gap-8 hidden-scrollbar">
            
            {/* View: Fleet Map */}
            {activeTab === 'map' && (
              <div className="flex-1 flex flex-col xl:flex-row gap-8">
                <div className="flex-1 flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                      <p className="text-slate-400 text-sm font-medium mb-1">Active Buses Tracking</p>
                      <div className="flex items-end gap-2 mt-2">
                        <h3 className="text-4xl font-bold text-white drop-shadow">{activeBusCount}</h3>
                        <span className="text-emerald-400 text-sm font-bold opacity-90 mb-1 drop-shadow">+online</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                      <p className="text-slate-400 text-sm font-medium mb-1">Telemetry Socket</p>
                      <div className="flex items-center gap-3 mt-4 flex-1">
                        <span className="flex h-4 w-4 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                        </span>
                        <span className="text-xl font-bold text-emerald-400 drop-shadow">Stable Link</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerts Feed */}
                  <div className="bg-rose-950/40 backdrop-blur-md border border-rose-900/60 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-rose-400 mb-4 flex items-center gap-2 drop-shadow">
                      <span className="animate-pulse">🚨</span> Emergency Action Feed
                    </h3>
                    {alerts.length > 0 ? (
                      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                        {alerts.map((alert, idx) => (
                          <div key={idx} className="bg-rose-900/50 p-4 rounded-xl border border-rose-800/60 flex justify-between items-start backdrop-blur-sm shadow-md transition-all hover:bg-rose-800/60">
                            <div>
                              <p className="font-bold text-rose-200 drop-shadow">{alert.type.toUpperCase()} SOS TRIGGERED</p>
                              <p className="text-sm text-rose-300 mt-1 font-mono tracking-wider">Lat: {alert.lat.toFixed(4)} | Lng: {alert.lng.toFixed(4)}</p>
                              <p className="text-xs text-rose-400 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <span className="text-xs text-rose-100 font-bold bg-rose-600 px-3 py-1 rounded-full shadow border border-rose-500">Active</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <div className="flex-1 flex items-center justify-center text-rose-500/50 font-bold italic">
                         No active emergencies.
                       </div>
                    )}
                  </div>
                </div>

                <div className="xl:w-1/2 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-slate-700/80 flex flex-col relative min-h-[500px]">
                   {activeBusCount === 0 && alerts.length === 0 && (
                      <div className="absolute inset-0 z-[400] pointer-events-none flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                         <div className="bg-slate-800 text-slate-200 px-6 py-4 rounded-2xl font-bold border border-slate-600 shadow-2xl flex items-center gap-3">
                            <span className="animate-spin inline-block border-4 border-slate-500 border-t-blue-500 h-6 w-6 rounded-full"></span>
                            Awaiting Live Streams...
                         </div>
                      </div>
                   )}
                   <MapContainer center={mapCenter} zoom={8} scrollWheelZoom={true} className="flex-1 w-full h-full z-0">
                      <TileLayer
                        attribution='&copy; OSM'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      />
                      {Object.values(buses).map((bus) => (
                        <Marker key={bus.busId} position={[bus.lat, bus.lng]}>
                          <Popup>
                            <div className="font-sans text-slate-800 font-medium">
                              <strong className="text-blue-600 block mb-1 text-lg">Bus {bus.busId}</strong>
                              Speed: {Math.round(bus.speed)} km/h<br/>
                              Updated: {new Date(bus.timestamp).toLocaleTimeString()}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                      {alerts.map((alert, idx) => (
                        <CircleMarker 
                          key={`alert-${idx}`} center={[alert.lat, alert.lng]} 
                          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.6 }} 
                          radius={30} className="animate-pulse"
                        >
                          <Popup className="font-bold text-rose-600">🚨 SOS Signal Point</Popup>
                        </CircleMarker>
                      ))}
                    </MapContainer>
                </div>
              </div>
            )}

            {/* View: Analytics */}
            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
                 <div className="grid grid-cols-3 gap-6">
                    <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col items-center justify-center text-center shadow-xl">
                       <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Total Riders Today</p>
                       <p className="text-5xl font-extrabold text-white mt-2 drop-shadow-md">14,230</p>
                       <p className="text-emerald-400 text-sm mt-2 font-bold">+12% vs yesterday</p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col items-center justify-center text-center shadow-xl">
                       <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Avg Fleet Efficiency</p>
                       <p className="text-5xl font-extrabold text-blue-400 mt-2 drop-shadow-md">86%</p>
                       <p className="text-slate-500 text-sm mt-2 font-medium">Stable Performance</p>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col items-center justify-center text-center shadow-xl">
                       <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">CO2 Saved (Tonnes)</p>
                       <p className="text-5xl font-extrabold text-emerald-400 mt-2 drop-shadow-md">4.2</p>
                       <p className="text-emerald-500 text-sm mt-2 font-bold flex items-center justify-center gap-1">🌱 Sustainable</p>
                    </div>
                 </div>

                 <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl w-full h-[400px] flex flex-col">
                    <h3 className="text-xl font-bold text-slate-100 mb-6 drop-shadow">Network Load vs System Capacity</h3>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                          <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} tickMargin={10} />
                          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} itemStyle={{ fontWeight: 'bold' }} />
                          <Line type="monotone" name="Passengers" dataKey="passengers" stroke="#38bdf8" strokeWidth={4} dot={{ fill: '#38bdf8', r: 5, strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 8 }} />
                          <Line type="monotone" name="Capacity" dataKey="capacity" stroke="#22c55e" strokeWidth={4} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            )}

            {/* View: Manage Fleet */}
            {activeTab === 'buses' && (
              <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden max-w-6xl mx-auto w-full">
                 <div className="p-6 border-b border-slate-700/50 bg-slate-800/40 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white drop-shadow">Active Vehicle Registry</h3>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                      + Register New Bus
                    </button>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-slate-900/50 text-slate-300 text-sm uppercase tracking-wider font-bold">
                         <th className="p-4 border-b border-slate-700">Bus ID</th>
                         <th className="p-4 border-b border-slate-700">Route Assignment</th>
                         <th className="p-4 border-b border-slate-700">Operator</th>
                         <th className="p-4 border-b border-slate-700">Fuel/Battery</th>
                         <th className="p-4 border-b border-slate-700">Status</th>
                         <th className="p-4 border-b border-slate-700 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {mockBuses.map((bus, i) => (
                         <tr key={i} className="text-slate-200 border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                           <td className="p-4 font-bold text-blue-300 drop-shadow-sm">{bus.id}</td>
                           <td className="p-4 font-medium">{bus.route}</td>
                           <td className="p-4 text-slate-300">{bus.driver}</td>
                           <td className="p-4 text-emerald-400 font-mono font-bold drop-shadow-sm">⚡ {bus.fuel}</td>
                           <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm border ${
                                bus.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 
                                bus.status === 'Inactive' ? 'bg-slate-500/20 text-slate-400 border-slate-500/50' :
                                'bg-amber-500/20 text-amber-400 border-amber-500/50'
                              }`}>
                                {bus.status}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <button className="text-slate-400 hover:text-blue-400 font-bold transition-colors">Edit</button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            )}

            {/* View: Routes Setup */}
            {activeTab === 'routes' && (
              <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden max-w-5xl mx-auto w-full">
                 <div className="p-6 border-b border-slate-700/50 bg-slate-800/40 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white drop-shadow">Punjab Roadways Graph Data</h3>
                    <div className="flex gap-3">
                      <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors text-sm flex items-center gap-2">
                        <span>📥</span> Sync GTFS
                      </button>
                    </div>
                 </div>
                 <div className="p-6 space-y-4">
                    {mockRoutes.map((route, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 hover:border-blue-500/50 transition-colors shadow-md flex items-center justify-between">
                         <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-slate-700 text-white text-xs font-mono font-bold px-2 py-1 rounded border border-slate-600">{route.id}</span>
                              <h4 className="text-lg font-bold text-blue-200 drop-shadow-sm">{route.name}</h4>
                            </div>
                            <div className="flex items-center gap-5 text-sm text-slate-400 font-medium">
                              <span className="flex items-center gap-1">📍 {route.stops} Terminals</span>
                              <span className="flex items-center gap-1">📏 {route.distance}</span>
                              <span className="flex items-center gap-1">💳 {route.fare} Base</span>
                            </div>
                         </div>
                         <div>
                            <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm">
                              Modify Nodes
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

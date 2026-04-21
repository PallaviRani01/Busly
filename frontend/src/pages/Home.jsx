import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center text-white p-6 relative overflow-hidden"
      style={{ backgroundImage: "url('/bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-600 border-t-blue-500/50 text-center relative z-10 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-shadow duration-500">
        <div className="mb-6 flex justify-center">
          <img src="/logo.png" alt="Busly Logo" className="w-28 h-28 shadow-2xl rounded-2xl border border-slate-600/50" />
        </div>
        <h1 className="text-4xl font-bold mb-2 shadow-sm">
          <span className="text-white">Bus</span><span className="text-[#22c55e] drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">ly</span>
        </h1>
        <p className="text-slate-400 mb-8"><span className="text-blue-400 tracking-wide font-medium">Track Smart</span><span className="text-slate-600 font-bold px-2">.</span><span className="text-emerald-400 tracking-wide font-medium">Travel Easy</span></p>
        
        <h2 className="text-xl font-medium text-slate-300 mb-4 border-b border-slate-700 pb-2">Select Your Role</h2>
        
        <div className="space-y-4">
          <Link to="/passenger" className="block w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all shadow-md group">
            <span className="flex items-center justify-between">
              <span className="font-semibold text-lg text-slate-100">🙋 Passenger</span>
              <span className="text-slate-400 group-hover:text-blue-400 transition-colors">Track Buses &rarr;</span>
            </span>
          </Link>
          
          <Link to="/driver" className="block w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all shadow-md group">
            <span className="flex items-center justify-between">
              <span className="font-semibold text-lg text-slate-100">🚌 Driver</span>
              <span className="text-slate-400 group-hover:text-amber-400 transition-colors">Stream Trip &rarr;</span>
            </span>
          </Link>
          
          <Link to="/admin" className="block w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-all shadow-md group">
            <span className="flex items-center justify-between">
              <span className="font-semibold text-lg text-slate-100">🛡️ Administrator</span>
              <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">Manage Fleet &rarr;</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

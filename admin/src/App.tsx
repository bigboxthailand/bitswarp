import React, { useState, useEffect } from 'react'
import { ShieldAlert, Zap, Users, Settings, Database, Activity, Lock, Unlock, RefreshCw, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:3000'
const ADMIN_KEY = 'secret-admin-pass' // Should be in env in production

function App() {
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [maxSwap, setMaxSwap] = useState('10.0')
  const [aiAddress, setAiAddress] = useState('0xc7BA...eec77')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
        const res = await axios.get(`${API_BASE}/admin/stats`, {
            headers: { 'x-admin-key': ADMIN_KEY }
        })
        setStats(res.data)
        setIsPaused(res.data.chains.evm.isPaused)
        setMaxSwap((Number(res.data.chains.evm.maxLimit) / 1e18).toString())
    } catch (e) {
        console.error("Failed to fetch admin stats")
    }
  }

  const togglePause = async () => {
    setLoading(true)
    try {
        const nextState = !isPaused
        await axios.post(`${API_BASE}/admin/protocol/toggle-pause`, 
            { pause: nextState },
            { headers: { 'x-admin-key': ADMIN_KEY } }
        )
        setIsPaused(nextState)
        alert(`Protocol ${nextState ? 'PAUSED' : 'RESUMED'} Successfully`)
    } catch (e) {
        alert("Action failed. Check console.")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col gap-8 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldAlert size={18} className="text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight uppercase">BitSwarp Admin</span>
        </div>

        <nav className="flex flex-col gap-1">
          <NavItem icon={<Activity size={18}/>} label="Overview" active />
          <NavItem icon={<Database size={18}/>} label="Pool Assets" />
          <NavItem icon={<Users size={18}/>} label="AI Executors" />
          <NavItem icon={<Settings size={18}/>} label="Global Config" />
        </nav>

        <div className="mt-auto p-4 admin-card">
          <div className="text-[10px] text-zinc-500 uppercase mb-2">Auth Level</div>
          <div className="text-xs font-bold text-primary flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            PROTOCOL OWNER
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-12">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white">Command Center</h1>
                <p className="text-zinc-500 text-sm italic">Master control for BitSwarp Protocol v0.1.0</p>
            </div>
            <button 
                onClick={togglePause}
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                    isPaused 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' 
                    : 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600'
                }`}
            >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (isPaused ? <Unlock size={18}/> : <Lock size={18}/>)}
                {isPaused ? 'RESUME PROTOCOL' : 'EMERGENCY PAUSE'}
            </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard label="Total Value Locked" value={stats?.tvl || "---"} change="+12.5%" />
            <StatCard label="EVM Pool Status" value={isPaused ? "PAUSED" : "ACTIVE"} change={isPaused ? "Warning" : "Healthy"} />
            <StatCard label="Network Nodes" value="14 Online" change="Stable" />
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="admin-card p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                    <Zap size={20} className="text-primary" />
                    AI Execution Settings
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2 font-bold">Authorized AI Address</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={aiAddress}
                                onChange={(e) => setAiAddress(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 outline-none transition-colors"
                            />
                            <button onClick={fetchStats} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                    <button className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                        Update Executor
                    </button>
                </div>
            </section>

            <section className="admin-card p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                    <ShieldAlert size={20} className="text-primary" />
                    Risk Parameters
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2 font-bold">Max Swap Limit (ETH)</label>
                        <input 
                            type="text" 
                            value={maxSwap}
                            onChange={(e) => setMaxSwap(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 outline-none transition-colors"
                        />
                    </div>
                    <button className="w-full py-3 bg-primary text-black rounded-xl font-bold hover:opacity-90 transition-opacity">
                        Save Safety Config
                    </button>
                </div>
            </section>
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
    }`}>
      {icon}
      <span className="font-semibold text-sm">{label}</span>
    </button>
  )
}

function StatCard({ label, value, change }: { label: string, value: string, change: string }) {
    return (
        <div className="admin-card p-6">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{label}</p>
            <div className="flex items-baseline gap-3">
                <h4 className="text-2xl font-bold">{value}</h4>
                <span className={`text-[10px] font-bold ${change.startsWith('+') ? 'text-emerald-500' : 'text-zinc-400'}`}>{change}</span>
            </div>
        </div>
    )
}

export default App

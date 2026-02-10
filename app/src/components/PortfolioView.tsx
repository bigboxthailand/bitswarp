import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 4500 },
  { name: 'Fri', value: 6000 },
  { name: 'Sat', value: 7500 },
  { name: 'Sun', value: 9200 },
];

export const PortfolioView = ({ solBalance }: { solBalance: number }) => {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="admin-card p-6 bg-primary/5 border-primary/10">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Balance</p>
          <h4 className="text-3xl font-extrabold text-white">${(solBalance * 98.5).toLocaleString()}</h4>
          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
            <ArrowUpRight size={14} />
            <span>+12.4% ($1,450)</span>
          </div>
        </div>
        <div className="admin-card p-6">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Active Assets</p>
          <h4 className="text-3xl font-extrabold text-white">4</h4>
          <p className="text-zinc-500 text-[10px] mt-2 font-medium">SOL, USDC, ETH, LINK</p>
        </div>
        <div className="admin-card p-6">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">AI Trades (24h)</p>
          <h4 className="text-3xl font-extrabold text-white">12</h4>
          <p className="text-zinc-500 text-[10px] mt-2 font-medium">All executed successfully</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="admin-card p-8 min-h-[400px] flex flex-col">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    Performance Analytics
                </h3>
                <p className="text-xs text-zinc-500">Portfolio value over the last 7 days</p>
            </div>
            <div className="flex gap-2">
                {['1D', '1W', '1M', '1Y', 'ALL'].map((t) => (
                    <button key={t} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${t === '1W' ? 'bg-primary text-white' : 'hover:bg-white/5 text-zinc-500'}`}>{t}</button>
                ))}
            </div>
        </div>
        <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Assets Table */}
      <div className="admin-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold">Your Assets</h3>
            <button className="text-xs text-primary font-bold hover:underline">Manage All</button>
        </div>
        <table className="w-full text-left">
            <thead>
                <tr className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4 font-bold">Asset</th>
                    <th className="px-6 py-4 font-bold">Balance</th>
                    <th className="px-6 py-4 font-bold">Price</th>
                    <th className="px-6 py-4 font-bold text-right">Value (USD)</th>
                </tr>
            </thead>
            <tbody className="text-sm">
                <AssetRow name="Solana" symbol="SOL" balance={solBalance} price={98.50} change="+2.4%" />
                <AssetRow name="USD Coin" symbol="USDC" balance={1250.00} price={1.00} change="0.0%" />
                <AssetRow name="Ethereum" symbol="ETH" balance={0.15} price={2450.00} change="-1.2%" />
            </tbody>
        </table>
      </div>
    </div>
  );
};

function AssetRow({ name, symbol, balance, price, change }: any) {
    return (
        <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[10px] group-hover:scale-110 transition-transform">{symbol[0]}</div>
                    <div>
                        <p className="font-bold text-white">{name}</p>
                        <p className="text-[10px] text-zinc-500">{symbol}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5 font-medium">{balance.toFixed(4)} {symbol}</td>
            <td className="px-6 py-5">
                <p className="font-medium">${price.toLocaleString()}</p>
                <p className={`text-[10px] font-bold ${change.startsWith('+') ? 'text-emerald-500' : change.startsWith('-') ? 'text-red-500' : 'text-zinc-500'}`}>{change}</p>
            </td>
            <td className="px-6 py-5 text-right font-bold text-white">${(balance * price).toLocaleString()}</td>
        </tr>
    )
}

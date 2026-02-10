import { useState } from 'react';
import { ArrowDown, Info } from 'lucide-react';

export const SwapView = ({ evmAddress, solAddress, onSwap }: any) => {
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
      <div className="w-full max-w-md admin-card p-8 space-y-6 bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold uppercase tracking-tight">Direct Swap</h2>
            <div className="px-2 py-1 bg-primary/20 rounded text-[10px] text-primary font-bold">LOW SLIPPAGE</div>
        </div>

        {/* From Section */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 focus-within:border-primary/50 transition-colors">
            <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold mb-2">
                <span>From</span>
                <span>Balance: 0.00</span>
            </div>
            <div className="flex gap-4">
                <input 
                    type="number" 
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-2xl font-bold"
                />
                <select 
                    value={fromToken}
                    onChange={(e) => setFromToken(e.target.value)}
                    className="bg-zinc-800 rounded-xl px-3 py-1 font-bold text-sm outline-none border border-white/10"
                >
                    <option>SOL</option>
                    <option>ETH</option>
                    <option>USDC</option>
                </select>
            </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center -my-6 relative z-10">
            <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-primary transition-colors cursor-pointer shadow-xl">
                <ArrowDown size={20} />
            </div>
        </div>

        {/* To Section */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold mb-2">
                <span>To (Estimated)</span>
                <span>Balance: 0.00</span>
            </div>
            <div className="flex gap-4">
                <input 
                    type="number" 
                    placeholder="0.0"
                    readOnly
                    className="flex-1 bg-transparent border-none outline-none text-2xl font-bold text-zinc-500"
                />
                <select 
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
                    className="bg-zinc-800 rounded-xl px-3 py-1 font-bold text-sm outline-none border border-white/10"
                >
                    <option>USDC</option>
                    <option>SOL</option>
                    <option>ETH</option>
                </select>
            </div>
        </div>

        <button 
            disabled={!amount}
            onClick={() => onSwap({ fromToken, toToken, amount })}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
        >
            Get Quote
        </button>

        <div className="flex items-start gap-2 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400 leading-relaxed">
                BitSwarp finds the best price across multiple aggregators. Transactions are signed directly in your connected wallet.
            </p>
        </div>
      </div>
      
      <p className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-extrabold">
        Institutional Execution Layer • No Centralized Counterparty
      </p>
    </div>
  );
};

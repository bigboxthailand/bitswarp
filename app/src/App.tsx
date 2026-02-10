import { useState, useEffect } from 'react'
import { MessageSquare, Wallet, PieChart, Settings, Send, Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import { PortfolioView } from './components/PortfolioView'

const POOL_ABI = [
  { name: 'executeSwap', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'user', type: 'address' }, { name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' }, { name: 'amountIn', type: 'uint256' }, { name: 'amountOut', type: 'uint256' }] }
] as const;

function App() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Welcome to BitSwarp Terminal. Direct trade execution is active. 🦞⚡' }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingTrade, setPendingTrade] = useState<any>(null)
  const [solBalance, setSolBalance] = useState(0)
  const [currentTab, setCurrentTab] = useState<'terminal' | 'portfolio'>('terminal')

  const { address: evmAddress, isConnected: isEVMConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync } = useWriteContract()
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  useEffect(() => { if (publicKey) fetchSolBalance() }, [publicKey])
  const fetchSolBalance = async () => { try { const balance = await connection.getBalance(publicKey!); setSolBalance(balance / 1e9) } catch (e) {} }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return
    const userMsg = input
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput('')
    setIsTyping(true)

    // Basic Command Parser (Regex) - NO OPENAI REQUIRED
    const swapRegex = /swap\s+(\d+\.?\d*)\s+(\w+)\s+to\s+(\w+)/i
    const match = userMsg.match(swapRegex)

    if (match) {
        const [_, amount, from, to] = match
        const chain = publicKey ? 'solana' : 'ethereum'
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/v1/trade/execute`, {
                chain, action: 'swap', from_token: from.toUpperCase(), to_token: to.toUpperCase(),
                amount: parseFloat(amount), user_address: publicKey?.toBase58() || evmAddress
            }, { headers: { 'x-agent-key': 'your-internal-key' } })

            if (response.data.success) {
                const intent = { action: 'swap', amount: parseFloat(amount), from_token: from.toUpperCase(), to_token: to.toUpperCase(), chain }
                setPendingTrade({ intent, extraData: response.data.execution_payload })
                setMessages(prev => [...prev, { role: 'assistant', text: `Command recognized: Swap ${amount} ${from} to ${to}. Ready to execute?` }])
                setShowConfirm(true)
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Execution failed. Check backend connectivity." }])
        }
    } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "Unknown command. Try: 'swap 1 sol to usdc'" }])
    }
    setIsTyping(false)
  }

  const confirmTrade = async () => {
    if (!pendingTrade) return;
    setShowConfirm(false)
    setMessages(prev => [...prev, { role: 'assistant', text: "Executing... Please sign in your wallet." }])
    try {
        if (pendingTrade.intent.chain === 'solana') {
            const transaction = VersionedTransaction.deserialize(Buffer.from(pendingTrade.extraData.swapTransaction, 'base64'));
            const signature = await sendTransaction(transaction, connection);
            setMessages(prev => [...prev, { role: 'assistant', text: `Success! Tx: ${signature.slice(0, 8)}` }])
        }
    } catch (err: any) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Failed: ${err.message}` }])
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-inter relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col gap-8 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"><Zap size={24} /></div>
          <span className="font-bold text-xl tracking-tight gradient-text">BitSwarp</span>
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          <SidebarItem icon={<MessageSquare size={20}/>} label="Terminal" active={currentTab === 'terminal'} onClick={() => setCurrentTab('terminal')} />
          <SidebarItem icon={<Wallet size={20}/>} label="Assets" active={currentTab === 'portfolio'} onClick={() => setCurrentTab('portfolio')} />
        </nav>
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> AI Nodes Online
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.03)_0%,_transparent_50%)]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-10">
          <h1 className="font-bold text-lg uppercase italic">{currentTab === 'terminal' ? 'AI Trading Terminal' : 'Asset Portfolio'}</h1>
          <div className="flex items-center gap-3">
            <WalletMultiButton className="!h-10 !bg-zinc-900 !rounded-xl !border !border-white/10 !text-[10px] !font-bold hover:!bg-zinc-800 transition-all !uppercase" />
            {!isEVMConnected ? (
              <button onClick={() => connect({ connector: connectors[0] })} className="h-10 px-6 bg-primary text-white rounded-xl text-[10px] font-bold shadow-lg shadow-primary/20 transition-all uppercase tracking-widest">Connect EVM</button>
            ) : (
              <button onClick={() => disconnect()} className="h-10 px-4 bg-zinc-900 rounded-xl text-[10px] font-bold border border-white/10">{evmAddress?.slice(0,6)}...{evmAddress?.slice(-4)}</button>
            )}
          </div>
        </header>

        {currentTab === 'terminal' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white font-medium' : 'bg-white/5 text-zinc-100 border border-white/5'}`}>{msg.text}</div>
                </div>
              ))}
            </div>
            <div className="p-8 pt-0">
              <div className="max-w-4xl mx-auto glass rounded-2xl p-2 flex items-center gap-2 border border-white/10 shadow-2xl focus-within:border-primary/40 transition-all">
                <input type="text" placeholder="Try: 'swap 1 sol to usdc'" className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend} className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white"><Send size={16} /></button>
              </div>
            </div>
          </div>
        ) : (
          <PortfolioView solBalance={solBalance} />
        )}
      </main>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
              <h2 className="text-xl font-bold mb-4 uppercase">Confirm Swap</h2>
              <p className="text-sm text-zinc-400 mb-6 italic">Execute {pendingTrade.intent.amount} {pendingTrade.intent.from_token} → {pendingTrade.intent.to_token} on {pendingTrade.intent.chain}?</p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest">Cancel</button>
                <button onClick={confirmTrade} className="flex-1 py-3 bg-primary rounded-xl text-xs font-bold uppercase tracking-widest">Confirm</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:text-zinc-200'}`}>
      {icon} <span className="font-bold text-[11px] tracking-widest uppercase">{label}</span>
    </button>
  )
}

export default App

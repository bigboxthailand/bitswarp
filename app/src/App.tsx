import { useState, useEffect } from 'react'
import { MessageSquare, Wallet, PieChart, Settings, Send, Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import { PortfolioView } from './components/PortfolioView'

// Minimal Pool ABI for signing
const POOL_ABI = [
  {
    name: 'executeSwap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOut', type: 'uint256' }
    ]
  }
] as const;

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am BitSwarp AI. How can I help you swap, bridge, or manage assets today? 🦞⚡' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingTrade, setPendingTrade] = useState<any>(null)
  const [solBalance, setSolBalance] = useState(0)
  const [currentTab, setCurrentTab] = useState<'terminal' | 'portfolio'>('terminal')

  // EVM Hooks
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync } = useWriteContract()

  // Solana Hooks
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  useEffect(() => {
    if (publicKey) {
      fetchSolBalance()
    }
  }, [publicKey])

  const fetchSolBalance = async () => {
    try {
      const balance = await connection.getBalance(publicKey!)
      setSolBalance(balance / 1e9)
    } catch (e) {}
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return
    
    const userMsg = input
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput('')
    setIsTyping(true)

    try {
      // 1. Get AI Analysis (Private)
      const aiRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/v1/internal/chat`, {
        message: userMsg
      }, {
        headers: { 'x-app-secret': import.meta.env.VITE_ADMIN_KEY }
      });

      if (!aiRes.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: "AI Analysis error." }]);
        return;
      }

      const intent = aiRes.data.intent;

      // 2. Execute Structured Trade
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/v1/trade/execute`, {
        chain: intent.chain || 'solana',
        action: intent.action,
        from_token: intent.from_token || 'SOL',
        to_token: intent.to_token || 'USDC',
        amount: intent.amount || 0,
        user_address: publicKey?.toBase58() || evmAddress
      }, {
        headers: { 'x-agent-key': 'your-internal-key' }
      })

      if (response.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Verified Intent: ${intent.action} ${intent.amount} ${intent.from_token}. ${intent.reasoning}` }])
        setPendingTrade({ intent, extraData: response.data.execution_payload })
        setShowConfirm(true)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: response.data.error || "I'm sorry, I couldn't understand that request." }])
      }
    } catch (error) {
      console.error('API Error:', error)
      setMessages(prev => [...prev, { role: 'assistant', text: "Connection error. Make sure the API Gateway is running." }])
    } finally {
      setIsTyping(false)
    }
  }

  const confirmTrade = async () => {
    if (!pendingTrade) return;
    
    setShowConfirm(false)
    setMessages(prev => [...prev, { role: 'assistant', text: "Executing secure transaction loop... Please sign in your wallet. 🛡️" }])

    try {
        if (pendingTrade.intent.chain === 'solana') {
            if (!publicKey) throw new Error("Please connect Solana wallet first");
            const swapTransactionBuf = Buffer.from(pendingTrade.extraData.swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');
            setMessages(prev => [...prev, { role: 'assistant', text: `Solana Swap Successful! ✅ Signature: ${signature.slice(0, 8)}...` }])
            fetchSolBalance()
        } else if (pendingTrade.intent.chain === 'ethereum' || pendingTrade.intent.chain === 'sepolia') {
            if (!evmAddress) throw new Error("Please connect EVM wallet first");
            const hash = await writeContractAsync({
                abi: POOL_ABI,
                address: '0x...',
                functionName: 'executeSwap',
                args: [evmAddress, '0x...', '0x...', BigInt(pendingTrade.intent.amount * 1e18), BigInt(0)],
            })
            setMessages(prev => [...prev, { role: 'assistant', text: `EVM Transaction Sent! 🚀 Hash: ${hash.slice(0, 10)}...` }])
        }
    } catch (err: any) {
        setMessages(prev => [...prev, { role: 'assistant', text: `Transaction failed: ${err.message || "User rejected request"}` }])
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-inter relative">
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md glass rounded-3xl p-8 border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold">Review Trade</h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Intent Verified by AI</p>
                </div>
                <button onClick={() => setShowConfirm(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <XCircle size={20} className="text-zinc-500" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <span className="text-sm text-zinc-400">Action</span>
                    <span className="text-sm font-semibold uppercase">{pendingTrade?.intent?.action}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <span className="text-sm text-zinc-400">Swap Details</span>
                    <span className="text-sm font-semibold">{pendingTrade?.intent?.amount} {pendingTrade?.intent?.from_token} → {pendingTrade?.intent?.to_token}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <span className="text-sm text-zinc-400">Chain</span>
                    <span className="text-sm font-semibold capitalize">{pendingTrade?.intent?.chain}</span>
                </div>
              </div>

              <button 
                onClick={confirmTrade}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Sign & Execute
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-border flex flex-col items-center lg:items-stretch py-6 px-4 gap-8 bg-black/20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tight gradient-text">BitSwarp</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <SidebarItem icon={<MessageSquare size={20}/>} label="AI Terminal" active={currentTab === 'terminal'} onClick={() => setCurrentTab('terminal')} />
          <SidebarItem icon={<Wallet size={20}/>} label="Assets" active={currentTab === 'portfolio'} onClick={() => setCurrentTab('portfolio')} />
          <SidebarItem icon={<PieChart size={20}/>} label="Analytics" />
          <SidebarItem icon={<Settings size={20}/>} label="Settings" />
        </nav>

        {publicKey && (
            <div className="p-4 bg-zinc-900/50 rounded-2xl mb-4 border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Current SOL</p>
                <p className="text-lg font-extrabold text-white">{solBalance.toFixed(3)} SOL</p>
            </div>
        )}

        <div className="glass p-4 rounded-2xl hidden lg:block border border-emerald-500/10">
          <div className="text-[10px] text-zinc-500 mb-1 font-bold">STATUS</div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            AI Network Online
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.03)_0%,_transparent_50%)]">
        {/* Header */}
        <header className="h-20 border-b border-border flex items-center justify-between px-8 glass sticky top-0 z-10">
          <div className="flex flex-col">
            <h1 className="font-extrabold text-lg tracking-tight uppercase italic text-white">{currentTab === 'terminal' ? 'AI Trading Terminal' : 'Asset Portfolio'}</h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-medium">Multi-chain Intent Engine v0.1.0</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-[10px] font-bold border-white/5 uppercase">
              <div className="w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Mainnet Ready
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              <WalletMultiButton className="!h-10 !bg-zinc-900 !rounded-xl !border !border-border !text-[10px] !font-bold hover:!bg-zinc-800 transition-all !uppercase" />
              
              {isEVMConnected ? (
                <button 
                  onClick={() => disconnect()}
                  className="h-10 px-4 glass border-white/10 rounded-xl text-[10px] font-bold hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}
                </button>
              ) : (
                <button 
                  onClick={() => connect({ connector: connectors[0] })}
                  className="h-10 px-6 bg-primary text-white rounded-xl text-[10px] font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
                >
                  Connect EVM
                </button>
              )}
            </div>
          </div>
        </header>

        {currentTab === 'terminal' ? (
          <>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-primary text-white shadow-xl shadow-primary/10 border border-white/10 font-medium' 
                      : 'glass text-zinc-100 border-white/5 font-normal shadow-2xl'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="glass p-4 rounded-2xl flex items-center gap-2 text-[10px] text-zinc-500 border-white/5 uppercase font-bold tracking-widest">
                      <Loader2 className="animate-spin text-primary" size={12} />
                      AI is calculating best route...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-8 pt-0">
              <div className="max-w-4xl mx-auto relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-5 group-focus-within:opacity-20 transition duration-500" />
                <div className="relative glass rounded-2xl p-2 flex items-center gap-2 border border-white/10 shadow-2xl focus-within:border-primary/40 transition-all">
                  <input 
                    type="text" 
                    placeholder="How can I help you swap, bridge or stake today? 🦞⚡"
                    className="flex-1 bg-transparent border-none outline-none px-4 text-sm placeholder:text-zinc-700 font-medium"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button 
                    onClick={handleSend}
                    className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
              <p className="text-center text-[8px] text-zinc-700 mt-5 uppercase tracking-[0.3em] font-extrabold opacity-40">
                Institutional Grade AI Execution Engine • Secured by Multi-Chain Vaults
              </p>
            </div>
          </>
        ) : (
          <PortfolioView solBalance={solBalance} />
        )}
      </main>
    </div>
  )
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
      active ? 'bg-primary/10 text-primary shadow-inner' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
    }`}>
      <span className={`${active ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors`}>{icon}</span>
      <span className="hidden lg:block font-bold text-[11px] tracking-widest uppercase">{label}</span>
    </button>
  )
}

export default App

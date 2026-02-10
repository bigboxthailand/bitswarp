import { useState, useEffect } from 'react'
import { Wallet, Zap, CheckCircle2, Repeat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import { PortfolioView } from './components/PortfolioView'
import { SwapView } from './components/SwapView'

function App() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingTrade, setPendingTrade] = useState<any>(null)
  const [solBalance, setSolBalance] = useState(0)
  const [currentTab, setCurrentTab] = useState<'swap' | 'portfolio'>('swap')
  const [statusMsg, setStatusMsg] = useState('')

  const { address: evmAddress, isConnected: isEVMConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  useEffect(() => { if (publicKey) fetchSolBalance() }, [publicKey])
  const fetchSolBalance = async () => { try { const balance = await connection.getBalance(publicKey!); setSolBalance(balance / 1e9) } catch (e) {} }

  const handleSwapRequest = async (details: any) => {
    setStatusMsg('Fetching best price...')
    try {
        const chain = publicKey ? 'solana' : 'ethereum'
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/v1/trade/execute`, {
            chain, action: 'swap', from_token: details.fromToken, to_token: details.toToken,
            amount: parseFloat(details.amount), user_address: publicKey?.toBase58() || evmAddress
        }, { headers: { 'x-agent-key': 'your-internal-key' } })

        if (response.data.success) {
            setPendingTrade({ intent: details, extraData: response.data.execution_payload, chain })
            setShowConfirm(true)
        }
    } catch (e) {
        alert("Execution failed. Check backend connectivity.")
    } finally {
        setStatusMsg('')
    }
  }

  const confirmTrade = async () => {
    if (!pendingTrade) return;
    setShowConfirm(false)
    setStatusMsg('Sign in your wallet...')
    try {
        if (pendingTrade.chain === 'solana') {
            const transaction = VersionedTransaction.deserialize(Buffer.from(pendingTrade.extraData.swapTransaction, 'base64'));
            const signature = await sendTransaction(transaction, connection);
            alert(`Success! Signature: ${signature}`)
            fetchSolBalance()
        } else {
            // EVM Logic here
            alert("EVM Swap initiated. Confirm in Metamask.")
        }
    } catch (err: any) {
        alert(`Failed: ${err.message}`)
    } finally {
        setStatusMsg('')
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
          <SidebarItem icon={<Repeat size={20}/>} label="Swap" active={currentTab === 'swap'} onClick={() => setCurrentTab('swap')} />
          <SidebarItem icon={<Wallet size={20}/>} label="Assets" active={currentTab === 'portfolio'} onClick={() => setCurrentTab('portfolio')} />
        </nav>
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Nodes Online
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.03)_0%,_transparent_50%)]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-10">
          <h1 className="font-bold text-lg uppercase italic">{currentTab === 'swap' ? 'Warp Engine' : 'Asset Portfolio'}</h1>
          <div className="flex items-center gap-3">
            <WalletMultiButton className="!h-10 !bg-zinc-900 !rounded-xl !border !border-white/10 !text-[10px] !font-bold hover:!bg-zinc-800 transition-all !uppercase" />
            {!isEVMConnected ? (
              <button onClick={() => connect({ connector: connectors[0] })} className="h-10 px-6 bg-primary text-white rounded-xl text-[10px] font-bold shadow-lg shadow-primary/20 transition-all uppercase tracking-widest">Connect EVM</button>
            ) : (
              <button onClick={() => disconnect()} className="h-10 px-4 bg-zinc-900 rounded-xl text-[10px] font-bold border border-white/10">{evmAddress?.slice(0,6)}...{evmAddress?.slice(-4)}</button>
            )}
          </div>
        </header>

        {currentTab === 'swap' ? (
          <SwapView 
            evmAddress={evmAddress} 
            solAddress={publicKey?.toBase58()} 
            onSwap={handleSwapRequest}
          />
        ) : (
          <PortfolioView solBalance={solBalance} />
        )}
        
        {statusMsg && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-primary text-white rounded-full font-bold text-xs shadow-2xl animate-bounce">
                {statusMsg}
            </div>
        )}
      </main>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
              <h2 className="text-xl font-bold mb-4 uppercase tracking-tighter">Review Transaction</h2>
              <div className="bg-white/5 p-4 rounded-2xl mb-6 text-left space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-zinc-500">Action</span><span className="font-bold">SWAP</span></div>
                  <div className="flex justify-between text-xs"><span className="text-zinc-500">Amount</span><span className="font-bold">{pendingTrade.intent.amount} {pendingTrade.intent.fromToken}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-zinc-500">Target</span><span className="font-bold">{pendingTrade.intent.toToken}</span></div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest">Cancel</button>
                <button onClick={confirmTrade} className="flex-1 py-3 bg-primary rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Confirm
                </button>
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
    <button onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary/10 text-primary shadow-inner' : 'text-zinc-500 hover:text-zinc-200'}`}>
      {icon} <span className="font-bold text-[11px] tracking-widest uppercase">{label}</span>
    </button>
  )
}

export default App

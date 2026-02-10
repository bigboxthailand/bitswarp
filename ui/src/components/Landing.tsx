import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Bot, Shield, Globe } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-6">
            <Zap size={12} className="fill-current" />
            The Future of Trading is AI-Native
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Trade with the speed of <br />
            <span className="gradient-text">Thought.</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            BitSwarp is the first AI-powered DEX that understands your intent. 
            Swap, bridge, and manage assets across EVM and Solana using natural language.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://app.bitswarp.com" className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              Launch AI Terminal
            </a>
            <button className="w-full sm:w-auto px-8 py-4 glass text-white rounded-2xl font-bold hover:bg-white/5 transition-all border border-white/10">
              Read Documentation
            </button>
          </div>
        </motion.div>
      </div>

      {/* Decorative Blur Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
    </section>
  );
};

export const Features = () => {
    const features = [
        { icon: <Bot size={24}/>, title: 'AI-Native Execution', desc: 'No more complex forms. Tell the AI what you want to do, and it executes on-chain.' },
        { icon: <Globe size={24}/>, title: 'Multi-Chain Engine', desc: 'Seamlessly swap and bridge between Monad, Ethereum, and Solana.' },
        { icon: <Shield size={24}/>, title: 'Non-Custodial', desc: 'You always keep control of your keys. AI executes within the security of our smart pools.' }
    ];

    return (
        <section className="py-24 px-6 relative">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((f, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-3xl glass border-white/5 hover:border-primary/20 transition-all group"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                            {f.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

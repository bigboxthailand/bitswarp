import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Web3Provider } from './components/Web3Provider'
import '@solana/wallet-adapter-react-ui/styles.css'
import { Buffer } from 'buffer'

// Browser polyfill for Buffer
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>,
)

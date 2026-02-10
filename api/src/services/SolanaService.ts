import { Connection, Keypair, PublicKey, Transaction, SystemProgram, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';

export class SolanaService {
    private connection: Connection;
    private keypair: Keypair | null = null;

    constructor(rpcUrl: string, privateKey?: number[]) {
        this.connection = new Connection(rpcUrl, 'confirmed');
        if (privateKey) {
            this.keypair = Keypair.fromSecretKey(Uint8Array.from(privateKey));
        }
    }

    private SYMBOL_TO_MINT: { [key: string]: string } = {
        'SOL': 'So11111111111111111111111111111111111111112',
        'USDC': 'EPjFW36Rc7H1fLEJQ7dg97rgEgY93yt7z3i7G6PHf8b',
        'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
    };

    async getJupiterQuote(inputToken: string, outputToken: string, amount: number) {
        try {
            const inputMint = this.SYMBOL_TO_MINT[inputToken.toUpperCase()] || inputToken;
            const outputMint = this.SYMBOL_TO_MINT[outputToken.toUpperCase()] || outputToken;
            
            const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('[SolanaService] Jupiter Quote Error:', error);
            return null;
        }
    }

    async getJupiterSwapTransaction(userPublicKey: string, quoteResponse: any) {
        try {
            const response = await axios.post('https://quote-api.jup.ag/v6/swap', {
                quoteResponse,
                userPublicKey,
                wrapAndUnwrapSol: true,
            });
            return response.data.swapTransaction;
        } catch (error) {
            console.error('[SolanaService] Jupiter Swap Error:', error);
            return null;
        }
    }

    async getBalance(address: string) {
        try {
            const pubkey = new PublicKey(address);
            const balance = await this.connection.getBalance(pubkey);
            return balance / 1e9; // Convert lamports to SOL
        } catch (error) {
            return 0;
        }
    }
}

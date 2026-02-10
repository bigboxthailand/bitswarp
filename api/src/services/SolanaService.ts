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

    async getJupiterQuote(inputMint: string, outputMint: string, amount: number) {
        try {
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

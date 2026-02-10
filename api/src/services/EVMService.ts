import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia } from 'viem/chains';
import axios from 'axios';

const POOL_ABI = parseAbi([
    'function executeSwap(address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut) external',
    'function setAIExecutor(address _executor) external',
    'function pause() external',
    'function unpause() external',
    'function paused() external view returns (bool)',
    'function maxSwapAmount() external view returns (uint256)',
    'function owner() external view returns (address)'
]);

export class EVMService {
    private client;
    private publicClient;
    private account;

    constructor(rpcUrl: string, privateKey?: string) {
        this.publicClient = createPublicClient({
            chain: sepolia,
            transport: http(rpcUrl)
        });

        if (privateKey) {
            this.account = privateKeyToAccount(privateKey as `0x${string}`);
            this.client = createWalletClient({
                account: this.account,
                chain: sepolia, 
                transport: http(rpcUrl)
            });
        }
    }

    async getPoolStats(poolAddress: `0x${string}`) {
        try {
            const [isPaused, maxLimit, owner] = await Promise.all([
                this.publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: 'paused' }),
                this.publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: 'maxSwapAmount' }),
                this.publicClient.readContract({ address: poolAddress, abi: POOL_ABI, functionName: 'owner' })
            ]);
            return { isPaused, maxLimit: maxLimit.toString(), owner };
        } catch (error) {
            console.error('[EVMService] Error fetching pool stats:', error);
            return null;
        }
    }

    async togglePause(poolAddress: `0x${string}`, shouldPause: boolean) {
        if (!this.client || !this.account) throw new Error("Wallet not configured");
        
        const { request } = await this.publicClient.simulateContract({
            account: this.account,
            address: poolAddress,
            abi: POOL_ABI,
            functionName: shouldPause ? 'pause' : 'unpause',
        });
        
        return await this.client.writeContract(request);
    }

    private SYMBOL_TO_ADDRESS: { [key: string]: string } = {
        'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        'USDC': '0xA0b86a33E6441b8a46a59DE4c4C5E8F5a6a7A8d0',
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca'
    };

    async getOpenOceanQuote(chain: string, inToken: string, outToken: string, amount: number) {
        try {
            const inAddress = this.SYMBOL_TO_ADDRESS[inToken.toUpperCase()] || inToken;
            const outAddress = this.SYMBOL_TO_ADDRESS[outToken.toUpperCase()] || outToken;
            
            const chainId = chain === 'ethereum' ? 1 : 11155111; // Sepolia
            const url = `https://open-api.openocean.finance/v3/${chainId}/quote?inTokenAddress=${inAddress}&outTokenAddress=${outAddress}&amount=${amount}&gasPrice=5`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('[EVMService] OpenOcean Quote Error:', error);
            return null;
        }
    }
}

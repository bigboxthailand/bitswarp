import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { rateLimit } from 'elysia-rate-limit';
import { serverTiming } from '@elysiajs/server-timing';
import { AIService } from './src/services/AIService';
import { EVMService } from './src/services/EVMService';
import { SolanaService } from './src/services/SolanaService';
import { PriceService } from './src/services/PriceService';
import { config } from 'dotenv';

config();

const aiService = new AIService(
    process.env.AI_API_KEY || 'sk-placeholder',
    process.env.AI_BASE_URL
);

const solanaService = new SolanaService(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
);

const evmService = new EVMService(
    process.env.EVM_RPC_URL || 'https://rpc.sepolia.org',
    process.env.AGENT_PRIVATE_KEY
);

import { nanoid } from 'nanoid';

// --- Local Storage (Mock DB for MVP) ---
const partners = new Map<string, { id: string, name: string, owner: string }>();

// --- Admin Protection Middleware ---
const adminAuth = (app: Elysia) => app.derive(({ headers, set }) => {
    const adminKey = headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        set.status = 401;
        throw new Error('Unauthorized Admin Access');
    }
    return { admin: true };
});

// --- Agent API Key Middleware ---
const agentAuth = (app: Elysia) => app.derive(({ headers, set }) => {
    const agentKey = headers['x-agent-key'] as string;
    if (!agentKey || !partners.has(agentKey)) {
        set.status = 401;
        return { authenticated: false };
    }
    return { authenticated: true, agent: partners.get(agentKey) };
});

const app = new Elysia()
    .use(cors())
    .use(serverTiming())
    .use(rateLimit({
        duration: 60000,
        max: 60,
        errorResponse: new Response('Too many requests. 🦞', { status: 429 })
    }))
    .use(swagger({
        documentation: {
            info: { title: 'BitSwarp Professional API', version: '0.1.0' }
        }
    }))
    .get('/', () => ({ status: 'BitSwarp API Online 🦞⚡', timestamp: new Date().toISOString() }))
    
    // --- Public API Routes ---
    .group('/v1', (app) => app
        .group('/agents', (app) => app
            .post('/register', ({ body }) => {
                const apiKey = `bitswarp_sk_${nanoid(24)}`;
                partners.set(apiKey, {
                    id: nanoid(8),
                    name: body.name,
                    owner: body.owner
                });
                return { 
                    success: true, 
                    api_key: apiKey,
                    message: "Welcome to the BitSwarp ecosystem. Keep your API key secure." 
                };
            }, {
                body: t.Object({
                    name: t.String(),
                    owner: t.String()
                })
            })
        )
        .group('/trade', (app) => app
            .use(agentAuth)
            .post('/intent', async ({ body, authenticated, error }) => {
                if (!authenticated) return error(401, { success: false, message: "Valid x-agent-key required" });

                const intent = await aiService.parseIntent(body.message);
                if (intent.action === 'unknown') return { success: false, error: intent.reasoning };

                let extraData: any = {};
                if (intent.action === 'swap') {
                    if (intent.chain === 'solana') {
                        const quote = await solanaService.getJupiterQuote(
                            'So11111111111111111111111111111111111111112',
                            'EPjFW36Rc7H1fLEJQ7dg97rgEgY93yt7z3i7G6PHf8b',
                            (intent.amount || 0) * 1e9
                        );
                        if (quote && body.user_address) {
                            const swapTransaction = await solanaService.getJupiterSwapTransaction(body.user_address, quote);
                            extraData = { quote, swapTransaction };
                        }
                    } else if (intent.chain === 'ethereum' || intent.chain === 'sepolia') {
                        const quote = await evmService.getOpenOceanQuote(intent.chain, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '0xdAC17F958D2ee523a2206206994597C13D831ec7', intent.amount || 0);
                        extraData = { quote };
                    }
                }

                return { success: true, intent, extraData, message: intent.reasoning };
            }, {
                body: t.Object({ message: t.String(), user_address: t.Optional(t.String()) })
            })
        )
        .group('/market', (app) => app
            .get('/price/:symbol', async ({ params }) => ({ success: true, price: await PriceService.getPrice(params.symbol) }))
            .get('/prices', async ({ query }) => ({ success: true, data: await PriceService.getMultiPrices((query.symbols as string || '').split(',')) }))
        )
        .group('/wallet', (app) => app
            .get('/balance/:chain/:address', async ({ params }) => {
                if (params.chain === 'solana') return { success: true, balance: await solanaService.getBalance(params.address), symbol: 'SOL' };
                return { success: false, error: 'Unsupported chain' };
            })
        )
    )

    // --- Admin API Routes (Protected) ---
    .group('/admin', (app) => app
        .use(adminAuth)
        .get('/stats', async () => {
            // Fetch stats from all chains
            const evmStats = await evmService.getPoolStats(process.env.EVM_POOL_ADDRESS as `0x${string}` || '0x...');
            return {
                success: true,
                tvl: '$128,450', // Mock for now, would sum pool balances
                chains: { evm: evmStats, solana: { status: 'online' } }
            };
        })
        .post('/protocol/toggle-pause', async ({ body }) => {
            const tx = await evmService.togglePause(process.env.EVM_POOL_ADDRESS as `0x${string}`, body.pause);
            return { success: true, txHash: tx };
        }, {
            body: t.Object({ pause: t.Boolean() })
        })
    )
    .listen(process.env.PORT || 3000);

console.log(`🚀 BitSwarp Professional API is running at ${app.server?.hostname}:${app.server?.port}`);

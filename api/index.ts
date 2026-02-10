import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { rateLimit } from 'elysia-rate-limit';
import { serverTiming } from '@elysiajs/server-timing';
import { PriceService } from './src/services/PriceService';
import { config } from 'dotenv';
import { nanoid } from 'nanoid';

import { AIService } from './src/services/AIService';

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
    
    // --- Private AI Analysis (Official App Only) ---
    .group('/v1/internal', (app) => app
        .post('/chat', async ({ body, headers, set }) => {
            // Protection: Only our app with the correct key can use the AIสมอง
            if (headers['x-app-secret'] !== process.env.ADMIN_SECRET_KEY) {
                set.status = 401;
                return { success: false, error: "Unauthorized AI Access" };
            }

            const intent = await aiService.parseIntent(body.message);
            return { success: true, intent };
        }, {
            body: t.Object({ message: t.String() })
        })
    )

    // --- Public Trade Execution (For Bots & App) ---
    .group('/v1', (app) => app
        .group('/trade', (app) => app
            .use(agentAuth)
            .post('/execute', async ({ body, authenticated, error }) => {
                if (!authenticated) return error(401, { success: false, message: "Valid x-agent-key required" });

                // No AI analysis here - purely structured data execution for maximum efficiency
                const { chain, action, from_token, to_token, amount, user_address } = body;

                if (action !== 'swap') return { success: false, error: 'Only swap action is currently supported' };

                let extraData: any = {};
                if (chain === 'solana') {
                    const quote = await solanaService.getJupiterQuote(
                        from_token, // Now expects a Mint Address or Symbol handled by service
                        to_token,
                        (amount || 0) * 1e9
                    );
                    if (quote && user_address) {
                        const swapTransaction = await solanaService.getJupiterSwapTransaction(user_address, quote);
                        extraData = { quote, swapTransaction };
                    }
                } else if (chain === 'ethereum' || chain === 'sepolia') {
                    const quote = await evmService.getOpenOceanQuote(chain, from_token, to_token, amount || 0);
                    extraData = { quote };
                }

                return { 
                    success: true, 
                    execution_payload: extraData,
                    message: `Execution payload generated for ${amount} ${from_token} to ${to_token}`
                };
            }, {
                body: t.Object({ 
                    chain: t.String(),
                    action: t.String(),
                    from_token: t.String(),
                    to_token: t.String(),
                    amount: t.Number(),
                    user_address: t.Optional(t.String()) 
                })
            })
        )
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

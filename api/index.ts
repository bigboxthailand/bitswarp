import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { rateLimit } from 'elysia-rate-limit';
import { serverTiming } from '@elysiajs/server-timing';
import { EVMService } from './src/services/EVMService';
import { SolanaService } from './src/services/SolanaService';
import { PriceService } from './src/services/PriceService';
import { config } from 'dotenv';
import { nanoid } from 'nanoid';

config();

const solanaService = new SolanaService(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
);

const evmService = new EVMService(
    process.env.EVM_RPC_URL || 'https://rpc.sepolia.org',
    process.env.AGENT_PRIVATE_KEY
);

const partners = new Map<string, { id: string, name: string, owner: string }>();

// Add default internal key for official app dashboard
partners.set('your-internal-key', { id: 'official-app', name: 'BitSwarp Dashboard', owner: 'System' });

const adminAuth = (app: Elysia) => app.derive(({ headers, set }) => {
    const adminKey = headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        set.status = 401;
        throw new Error('Unauthorized Admin Access');
    }
    return { admin: true };
});

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
    .use(rateLimit({ duration: 60000, max: 60 }))
    .use(swagger())
    .get('/', () => ({ status: 'BitSwarp Engine Online 🦞⚡', mode: 'execution-only' }))
    
    .group('/v1', (app) => app
        .group('/agents', (app) => app
            .post('/register', ({ body }) => {
                const apiKey = `bitswarp_sk_${nanoid(24)}`;
                partners.set(apiKey, { id: nanoid(8), name: body.name, owner: body.owner });
                return { success: true, api_key: apiKey };
            }, { body: t.Object({ name: t.String(), owner: t.String() }) })
        )
        .group('/trade', (app) => app
            .use(agentAuth)
            .post('/execute', async ({ body, authenticated, error }) => {
                if (!authenticated) return error(401, { success: false, message: "Valid x-agent-key required" });
                const { chain, action, from_token, to_token, amount, user_address } = body;
                if (action !== 'swap') return { success: false, error: 'Only swap is supported' };

                let extraData: any = {};
                if (chain === 'solana') {
                    const quote = await solanaService.getJupiterQuote(from_token, to_token, (amount || 0) * 1e9);
                    if (quote && user_address) {
                        extraData = { quote, swapTransaction: await solanaService.getJupiterSwapTransaction(user_address, quote) };
                    }
                } else {
                    extraData = { quote: await evmService.getOpenOceanQuote(chain, from_token, to_token, amount || 0) };
                }
                return { success: true, execution_payload: extraData };
            }, {
                body: t.Object({ 
                    chain: t.String(), action: t.String(), from_token: t.String(), 
                    to_token: t.String(), amount: t.Number(), user_address: t.Optional(t.String()) 
                })
            })
        )
        .group('/market', (app) => app
            .get('/price/:symbol', async ({ params }) => ({ success: true, price: await PriceService.getPrice(params.symbol) }))
        )
    )
    .group('/admin', (app) => app
        .use(adminAuth)
        .get('/stats', () => ({ success: true, tvl: '$128,450' }))
    )
    .listen(process.env.PORT || 3000);

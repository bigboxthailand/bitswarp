import OpenAI from 'openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

const TradeIntentSchema = z.object({
    action: z.enum(['swap', 'bridge', 'stake', 'balance', 'unknown']),
    from_token: z.string().optional(),
    to_token: z.string().optional(),
    amount: z.number().optional(),
    chain: z.enum(['ethereum', 'solana', 'monad', 'sepolia']).optional(),
    reasoning: z.string()
});

export type TradeIntent = z.infer<typeof TradeIntentSchema>;

export class AIService {
    private openai: OpenAI;

    constructor(apiKey: string, baseURL?: string) {
        this.openai = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL || 'https://api.openai.com/v1'
        });
    }

    async parseIntent(userMessage: string): Promise<TradeIntent> {
        const prompt = `Extract trading intent. User Message: "${userMessage}"`;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: prompt }],
                response_format: { type: 'json_object' },
                functions: [{ name: 'extract_trade_intent', parameters: zodToJsonSchema(TradeIntentSchema) }],
                function_call: { name: 'extract_trade_intent' }
            });
            return JSON.parse(response.choices[0].message.function_call!.arguments!) as TradeIntent;
        } catch (error) {
            return { action: 'unknown', reasoning: 'Error parsing request.' };
        }
    }
}

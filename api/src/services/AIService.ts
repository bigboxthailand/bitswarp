import OpenAI from 'openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

const TradeIntentSchema = z.object({
    action: z.enum(['swap', 'bridge', 'stake', 'balance', 'unknown']),
    from_token: z.string().optional().describe('Token symbol to trade from (e.g. ETH, SOL, USDC)'),
    to_token: z.string().optional().describe('Token symbol to trade to'),
    amount: z.number().optional().describe('Amount to trade'),
    chain: z.enum(['ethereum', 'solana', 'monad', 'sepolia']).optional(),
    reasoning: z.string().describe('Short explanation of why this action was extracted')
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
        const prompt = `
            You are the BitSwarp AI Trading Assistant. 
            Extract trading intent from the user message.
            User Message: "${userMessage}"
            
            Rules:
            1. If they want to swap, set action to 'swap'.
            2. Identify symbols clearly (e.g. "ether" -> "ETH").
            3. If the chain is mentioned, identify it.
            4. If the intent is unclear, set action to 'unknown'.
        `;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini', // or any preferred model
                messages: [{ role: 'system', content: prompt }],
                response_format: { type: 'json_object' },
                functions: [
                    {
                        name: 'extract_trade_intent',
                        parameters: zodToJsonSchema(TradeIntentSchema)
                    }
                ],
                function_call: { name: 'extract_trade_intent' }
            });

            const functionCall = response.choices[0].message.function_call;
            if (functionCall && functionCall.arguments) {
                return JSON.parse(functionCall.arguments) as TradeIntent;
            }
            
            throw new Error('Failed to extract structured intent');
        } catch (error) {
            console.error('[AIService] Error:', error);
            return {
                action: 'unknown',
                reasoning: 'I encountered an error trying to process your request. Please try again.'
            };
        }
    }
}

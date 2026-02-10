import axios from 'axios';

export class PriceService {
    private static JUP_PRICE_URL = 'https://api.jup.ag/price/v2';

    static async getPrice(symbol: string) {
        try {
            const response = await axios.get(`${this.JUP_PRICE_URL}?ids=${symbol}`);
            return response.data.data[symbol]?.price || 0;
        } catch (error) {
            console.error(`[PriceService] Error fetching price for ${symbol}:`, error);
            return 0;
        }
    }

    static async getMultiPrices(symbols: string[]) {
        try {
            const response = await axios.get(`${this.JUP_PRICE_URL}?ids=${symbols.join(',')}`);
            return response.data.data;
        } catch (error) {
            console.error(`[PriceService] Error fetching multi prices:`, error);
            return {};
        }
    }
}

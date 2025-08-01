import type { CryptoTrade, MarketDepth, Metrics, TradingPair } from "../types/trading.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_KEY = import.meta.env.VITE_API_KEY;

console.log('API_KEY', API_KEY)
export interface PlaceOrderRequest {
  pair: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: string;
  amount: string;
  userId: string;
}

export interface ApiError {
  error: string;
}


export type PostApiSimulateResponses = {
  /**
   * Default Response
   */
  200: {
    /**
     * Simulation ID
     */
    id?: string;
    /**
     * Simulation status
     */
    message?: string;
    marketData?: {
      /**
       * Trading symbol
       */
      symbol?: string;
      /**
       * Current market price
       */
      currentPrice?: string;
      /**
       * Bid-ask spread
       */
      spread?: string;
      /**
       * Market volatility percentage
       */
      volatility?: string;
      /**
       * Average order size
       */
      avgOrderSize?: string;
      /**
       * Market order ratio percentage
       */
      marketOrderRatio?: string;
    };
    parameters?: {
      ordersPerSecond?: number;
      durationSeconds?: number;
      pair?: string;
      targetOrders?: number;
      batchSize?: number;
    };
    /**
     * Simulation start timestamp
     */
    startTime?: number;
    /**
     * Whether using external simulation server
     */
    externalSimulation?: boolean;
  };
};

export type PostApiSimulateResponse = PostApiSimulateResponses[keyof PostApiSimulateResponses];


async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json() as ApiError;
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

export const api = {
  async placeOrder(order: PlaceOrderRequest) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(order)
    });
    return handleResponse(response);
  },

  async cancelOrder(orderId: string, pair: string) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}?pair=${pair}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  async getOrderBook(pair: string, levels: number = 20): Promise<MarketDepth> {
    const response = await fetch(`${API_BASE_URL}/orderbook/${pair}?levels=${levels}`);
    return handleResponse(response);
  },

  async getTrades(pair: string): Promise<CryptoTrade[]> {
    const response = await fetch(`${API_BASE_URL}/trades/${pair}`);
    return handleResponse(response);
  },

  async getPortfolio(userId: string) {
    const response = await fetch(`${API_BASE_URL}/portfolio?userId=${userId}`);
    return handleResponse(response);
  },

  async getMetrics(): Promise<Metrics> {
    const response = await fetch(`${API_BASE_URL}/metrics`);
    return handleResponse(response);
  },

  async getPairs(): Promise<{ pairs: TradingPair[] }> {
    const response = await fetch(`${API_BASE_URL}/pairs`);
    return handleResponse(response);
  },

  async startSimulation(ordersPerSecond: number, durationSeconds: number, pair: string): Promise<PostApiSimulateResponse> {
    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordersPerSecond, durationSeconds, pair })
    });
    return handleResponse(response);
  },

  async generateLiquidity(params: {
    pair: string;
    basePrice: string;
    orderCount?: number;
    spread?: string;
    maxDepth?: string;
  }): Promise<{
    message: string;
    ordersGenerated: number;
    pair: string;
    basePrice: string;
    priceRange: {
      minBid: string;
      maxAsk: string;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/generate-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(params)
    });
    return handleResponse(response);
  },

  async getSimulationLogs(simulationId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/simulate/${simulationId}/logs`);
    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new Error(error.error || 'API request failed');
    }
    return response.blob();
  }
};
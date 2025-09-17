import { Connection, ConnectionConfig } from "@solana/web3.js";

/**
 * Create a Connection with extended timeout settings for busy Solana networks
 */
export function createConnectionWithTimeouts(endpoint: string): Connection {
  const config: ConnectionConfig = {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 180000, // 3 minutes - increased further
    disableRetryOnRateLimit: false,
    // Additional retry settings
    httpHeaders: {
      'User-Agent': 'DeFighter/1.0'
    }
  };

  return new Connection(endpoint, config);
}

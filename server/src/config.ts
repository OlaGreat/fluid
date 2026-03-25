import StellarSdk from "@stellar/stellar-sdk";

export interface FeePayerAccount {
  secret: string;
  publicKey: string;
  keypair: any;
}

export interface Config {
  feePayerAccounts: FeePayerAccount[];
  baseFee: number;
  feeMultiplier: number;
  networkPassphrase: string;
  horizonUrl?: string;
  maxXdrSize: number;
  maxOperations: number;
}

export function loadConfig(): Config {
  const rawSecrets = process.env.FLUID_FEE_PAYER_SECRET;
  if (!rawSecrets) {
    throw new Error("FLUID_FEE_PAYER_SECRET environment variable is required");
  }

  // Support comma-separated list of secrets
  const secrets = rawSecrets
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (secrets.length === 0) {
    throw new Error("FLUID_FEE_PAYER_SECRET must contain at least one secret");
  }

  const feePayerAccounts: FeePayerAccount[] = secrets.map((secret) => {
    const keypair = StellarSdk.Keypair.fromSecret(secret);
    return {
      secret,
      publicKey: keypair.publicKey(),
      keypair,
    };
  });

  const baseFee = parseInt(process.env.FLUID_BASE_FEE || "100", 10);
  const feeMultiplier = parseFloat(process.env.FLUID_FEE_MULTIPLIER || "2.0");
  const networkPassphrase =
    process.env.STELLAR_NETWORK_PASSPHRASE ||
    "Test SDF Network ; September 2015";
  const horizonUrl = process.env.STELLAR_HORIZON_URL;

  // Safety limits to prevent DoS attacks
  const maxXdrSize = parseInt(process.env.FLUID_MAX_XDR_SIZE || "10240", 10); // Default: 10KB
  const maxOperations = parseInt(process.env.FLUID_MAX_OPERATIONS || "100", 10); // Default: 100 operations

  return {
    feePayerAccounts,
    baseFee,
    feeMultiplier,
    networkPassphrase,
    horizonUrl,
    maxXdrSize,
    maxOperations,
  };
}

// Round-robin counter (module-level, safe for single-threaded Node.js event loop)
let rrIndex = 0;

/**
 * Pick the next fee payer account using Round Robin strategy.
 */
export function pickFeePayerAccount(config: Config): FeePayerAccount {
  const accounts = config.feePayerAccounts;
  const account = accounts[rrIndex % accounts.length];
  rrIndex = (rrIndex + 1) % accounts.length;
  return account;
}

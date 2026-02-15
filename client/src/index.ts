import StellarSdk from "@stellar/stellar-sdk";
import dotenv from "dotenv";

dotenv.config();

interface FluidClientConfig {
  serverUrl: string;
  networkPassphrase: string;
  horizonUrl?: string;
}

interface FeeBumpResponse {
  xdr: string;
  status: string;
  hash?: string;
}

export class FluidClient {
  private serverUrl: string;
  private networkPassphrase: string;
  private horizonServer?: any;

  constructor(config: FluidClientConfig) {
    this.serverUrl = config.serverUrl;
    this.networkPassphrase = config.networkPassphrase;
    if (config.horizonUrl) {
      this.horizonServer = new StellarSdk.Horizon.Server(config.horizonUrl);
    }
  }

  
  async requestFeeBump(
    signedTransactionXdr: string,
    submit: boolean = false
  ): Promise<FeeBumpResponse> {
    const response = await fetch(`${this.serverUrl}/fee-bump`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        xdr: signedTransactionXdr,
        submit: submit,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Fluid server error: ${JSON.stringify(error)}`);
    }

    const result = (await response.json()) as FeeBumpResponse;
    return {
      xdr: result.xdr,
      status: result.status,
      hash: result.hash,
    };
  }

  
  async submitFeeBumpTransaction(feeBumpXdr: string): Promise<any> {
    if (!this.horizonServer) {
      throw new Error("Horizon URL not configured");
    }

    const feeBumpTx = StellarSdk.TransactionBuilder.fromXDR(
      feeBumpXdr,
      this.networkPassphrase
    );

    return await this.horizonServer.submitTransaction(feeBumpTx);
  }

  
  async buildAndRequestFeeBump(
    transaction: any,
    submit: boolean = false
  ): Promise<FeeBumpResponse> {
    const signedXdr = transaction.toXDR();
    return await this.requestFeeBump(signedXdr, submit);
  }
}

// Example usage
async function main() {
  const client = new FluidClient({
    serverUrl: process.env.FLUID_SERVER_URL || "http://localhost:3000",
    networkPassphrase: StellarSdk.Networks.TESTNET,
    horizonUrl: "https://horizon-testnet.stellar.org",
  });

  // Example: create a transaction
  const userKeypair = StellarSdk.Keypair.random();
  console.log("User wallet:", userKeypair.publicKey());

  // fund the wallet (onlyon testnet )
  await fetch(
    `https://friendbot.stellar.org?addr=${userKeypair.publicKey()}`
  );
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const server = new StellarSdk.Horizon.Server(
    "https://horizon-testnet.stellar.org"
  );
  const account = await server.loadAccount(userKeypair.publicKey());

  // Build transaction
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: StellarSdk.Keypair.random().publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: "5",
      })
    )
    .setTimeout(180)
    .build();

  // Sign transaction
  transaction.sign(userKeypair);

  // Request fee-bump
  const result = await client.requestFeeBump(transaction.toXDR(), false);
  console.log("Fee-bump XDR received:", result.xdr.substring(0, 50) + "...");

  // Submit fee-bump transaction
  const submitResult = await client.submitFeeBumpTransaction(result.xdr);
  console.log("Transaction submitted! Hash:", submitResult.hash);
}

if (require.main === module) {
  main().catch(console.error);
}

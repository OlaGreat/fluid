# Fluid Client

TypeScript client library for interacting with Fluid servers.

## Installation

```bash
npm install
```

## Usage

```typescript
import { FluidClient } from "./src";
import StellarSdk from "@stellar/stellar-sdk";

const client = new FluidClient({
  serverUrl: "http://localhost:3000",
  networkPassphrase: StellarSdk.Networks.TESTNET,
  horizonUrl: "https://horizon-testnet.stellar.org",
});

const transaction = new StellarSdk.TransactionBuilder(account, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: StellarSdk.Networks.TESTNET,
})
  .addOperation(/* your operation */)
  .build();

transaction.sign(keypair);

const result = await client.requestFeeBump(transaction.toXDR(), false);
const submitResult = await client.submitFeeBumpTransaction(result.xdr);
```

## API

### `FluidClient`

#### Constructor

```typescript
new FluidClient(config: {
  serverUrl: string;
  networkPassphrase: string;
  horizonUrl?: string;
})
```

#### Methods

- `requestFeeBump(signedXdr: string, submit?: boolean)` - Request fee-bump for a signed transaction
- `submitFeeBumpTransaction(feeBumpXdr: string)` - Submit a fee-bump transaction to Horizon
- `buildAndRequestFeeBump(transaction: Transaction, submit?: boolean)` - Build, sign, and request fee-bump

## Development

```bash
npm run build
npm run dev
```

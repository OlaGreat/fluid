# Fluid Server

The Fluid server is a Node.js/TypeScript HTTP service that wraps signed Stellar transactions in fee-bump transactions. This allows applications to let users pay with the token they're spending (e.g., USDC) without requiring users to hold XLM for fees or the application to manage gas abstraction.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and set `FLUID_FEE_PAYER_SECRET`.

3. Build and run:
```bash
npm run build
npm start
```

Or for development:
```bash
npm run dev
```

## Configuration

See `.env.example` for all configuration options.

Required:
- `FLUID_FEE_PAYER_SECRET` - Your Stellar secret key for paying fees

Optional:
- `FLUID_BASE_FEE` - Base fee in stroops (default: 100)
- `FLUID_FEE_MULTIPLIER` - Fee multiplier (default: 2.0)
- `STELLAR_NETWORK_PASSPHRASE` - Network passphrase (default: Testnet)
- `STELLAR_HORIZON_URL` - Horizon URL for submission
- `PORT` - Server port (default: 3000)

## API Endpoints

### GET /health

Health check endpoint.

Response:
```json
{ "status": "ok" }
```

### POST /fee-bump

Wraps a signed transaction in a fee-bump transaction.

Request:
```json
{
  "xdr": "<base64_encoded_signed_transaction_xdr>",
  "submit": false
}
```

Response:
```json
{
  "xdr": "<base64_encoded_fee_bump_transaction_xdr>",
  "status": "ready",
  "hash": null
}
```

If `submit: true` and `STELLAR_HORIZON_URL` is set, the server will submit the transaction and return the hash.

## Architecture

- Express.js - HTTP server framework
- TypeScript - Type-safe code
- @stellar/stellar-sdk - Stellar SDK for transaction handling

## Development

```bash
npm run dev
npm run build
npm start
npm run watch
```

## Project Structure

```
server/
├── src/
│   ├── index.ts
│   ├── config.ts
│   └── handlers/
│       └── feeBump.ts
├── dist/
├── package.json
├── tsconfig.json
└── README.md
```

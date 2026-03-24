import { Request, Response } from "express";
import StellarSdk from "@stellar/stellar-sdk";
import { Config } from "../config";

import { FeeBumpSchema, FeeBumpRequest } from "../schemas/feeBump";

interface FeeBumpResponse {
  xdr: string;
  status: string;
  hash?: string;
}

export function feeBumpHandler(
  req: Request,
  res: Response,
  config: Config
): void {
  try {
    const result = FeeBumpSchema.safeParse(req.body);

    if (!result.success) {
      console.warn("Validation failed for fee-bump request:", result.error.format());
      res.status(400).json({
        error: "Validation failed",
        details: result.error.format(),
      });
      return;
    }

    const body: FeeBumpRequest = result.data;

    console.log("Received fee-bump request");

    let innerTransaction: any;
    try {
      innerTransaction = StellarSdk.TransactionBuilder.fromXDR(
        body.xdr,
        config.networkPassphrase
      );
    } catch (error: any) {
      console.error("Failed to parse XDR:", error.message);
      res.status(400).json({
        error: `Invalid XDR: ${error.message}`,
      });
      return;
    }

    // Verify inner transaction is signed
    if (innerTransaction.signatures.length === 0) {
      res.status(400).json({
        error: "Inner transaction must be signed before fee-bumping",
      });
      return;
    }

    if ('feeBumpTransaction' in innerTransaction) {
      res.status(400).json({
        error: "Cannot fee-bump an already fee-bumped transaction",
      });
      return;
    }

    const feeAmount = Math.floor(config.baseFee * config.feeMultiplier);

    const feePayerKeypair = StellarSdk.Keypair.fromSecret(
      config.feePayerSecret
    );

    const feeBumpTx = StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
      feePayerKeypair,
      feeAmount,
      innerTransaction,
      config.networkPassphrase
    );

    feeBumpTx.sign(feePayerKeypair);

    const feeBumpXdr = feeBumpTx.toXDR();

    console.log("Fee-bump transaction created successfully");

    const submit = body.submit || false;
    const status = submit ? "submitted" : "ready";

    if (submit && config.horizonUrl) {
      const server = new StellarSdk.Horizon.Server(config.horizonUrl);
      server
        .submitTransaction(feeBumpTx)
        .then((result: any) => {
          const response: FeeBumpResponse = {
            xdr: feeBumpXdr,
            status: "submitted",
            hash: result.hash,
          };
          res.json(response);
        })
        .catch((error: any) => {
          console.error("Transaction submission failed:", error);
          res.status(500).json({
            error: `Transaction submission failed: ${error.message}`,
            xdr: feeBumpXdr,
            status: "ready",
          });
        });
    } else {
      const response: FeeBumpResponse = {
        xdr: feeBumpXdr,
        status,
      };
      res.json(response);
    }
  } catch (error: any) {
    console.error("Error processing fee-bump request:", error);
    res.status(500).json({
      error: `Internal server error: ${error.message}`,
    });
  }
}

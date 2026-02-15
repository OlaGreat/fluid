import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { feeBumpHandler } from "./handlers/feeBump";
import { loadConfig } from "./config";

dotenv.config();

const app = express();
app.use(express.json());

const config = loadConfig();

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/fee-bump", (req: Request, res: Response) => {
  feeBumpHandler(req, res, config);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fluid server running on http://0.0.0.0:${PORT}`);
  console.log(`Fee payer: ${config.feePayerPublicKey}`);
});

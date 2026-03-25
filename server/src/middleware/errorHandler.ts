import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

// 404 - Unknown route handler
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        error: `Route ${req.method} ${req.path} not found`,
        code: "NOT_FOUND",
    });
}

// Global error handler
export function globalErrorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const isProd = process.env.NODE_ENV === "production";

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
        });
        return;
    }

    // Unhandled / unexpected errors
    console.error("Unhandled error:", err);

    res.status(500).json({
        error: isProd ? "An unexpected error occurred" : err.message,
        code: "INTERNAL_ERROR",
        ...(isProd ? {} : { stack: err.stack }),
    });
}

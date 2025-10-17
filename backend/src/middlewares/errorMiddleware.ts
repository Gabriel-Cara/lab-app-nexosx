import { NextFunction, Request, Response } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error", err);
  const status = err.status || 500;
  const message = err.message || "Erro interno do servidor";
  res.status(status).json({ message });
};

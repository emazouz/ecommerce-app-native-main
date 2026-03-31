import { Response } from "express";

/**
 * Unified API response shape.
 * Every endpoint uses this so the client always receives a consistent format:
 * { success, message, data?, pagination? }
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    pages: number;
    total: number;
  };
}

/** Send a success response (2xx). */
export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  pagination?: ApiResponse["pagination"],
): Response => {
  const body: ApiResponse<T> = { success: true, message };
  if (data !== undefined) body.data = data;
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
};

/** Send an error response (4xx / 5xx). */
export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
): Response => {
  return res.status(statusCode).json({ success: false, message } as ApiResponse);
};

import type { Response } from 'express';

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ code: 0, message: 'ok', data });
}

export function fail(
  res: Response,
  message: string,
  httpStatus = 400,
  code = httpStatus * 100,
) {
  return res.status(httpStatus).json({ code, message, data: null });
}

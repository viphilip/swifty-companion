export type FortyTwoErrorCode =
  | 'CONFIG_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'USER_NOT_FOUND'
  | 'API_ERROR';

export class FortyTwoApiError extends Error {
  code: FortyTwoErrorCode;
  status?: number;
  details?: unknown;

  constructor(message: string, code: FortyTwoErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = 'FortyTwoApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

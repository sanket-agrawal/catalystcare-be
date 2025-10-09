export default class ApiResponse<T = unknown> {
  readonly statusCode: number;
  readonly message: string;
  readonly data?: T;

  constructor(statusCode: number, message: string, data?: T) {
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }
}

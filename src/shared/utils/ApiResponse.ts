export default class ApiResponse<T = unknown> {
  readonly success:boolean = true;
  readonly statusCode: number;
  readonly message: string;
  readonly data?: T;

  constructor(success : boolean, statusCode: number, message: string, data?: T) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }
}

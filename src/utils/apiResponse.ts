class ApiResponse<T> {
  public status: string;
  public data: T | null;
  public message: string;

  constructor(data: T | null, message: string) {
    this.status = 'success';
    this.data = data ?? null;
    this.message = message;
  }
}

export default ApiResponse;

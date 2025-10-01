class ApiResponse<T> {
  public status: string;
  public data: T | null;
  public message: string | null;

  constructor(data: T | null, message: string | null = null) {
    this.status = 'success';
    this.data = data ?? null;
    this.message = message;
  }
}

export default ApiResponse;

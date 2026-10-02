import {
  defaultRequestInterceptor,
  defaultResponseInterceptor,
  type RequestInterceptor,
  type ResponseInterceptor,
} from './interceptors.ts';

export class ApiClient {
  private baseUrl: string;
  private requestInterceptor: RequestInterceptor;
  private responseInterceptor: ResponseInterceptor;

  constructor(
    baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    requestInterceptor: RequestInterceptor = defaultRequestInterceptor,
    responseInterceptor: ResponseInterceptor = defaultResponseInterceptor,
  ) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.requestInterceptor = requestInterceptor;
    this.responseInterceptor = responseInterceptor;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    let config = options;
    if (this.requestInterceptor.onRequest) {
      config = await this.requestInterceptor.onRequest(config);
    }

    try {
      let response = await fetch(url, config);

      if (this.responseInterceptor.onResponse) {
        response = await this.responseInterceptor.onResponse(response);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (this.responseInterceptor.onError && error && typeof error === 'object' && 'status' in error) {
        await this.responseInterceptor.onError(error as never);
      }
      throw error;
    }
  }

  public get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T, B = unknown>(path: string, body?: B, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T, B = unknown>(path: string, body?: B, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

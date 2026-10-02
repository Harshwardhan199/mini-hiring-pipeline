import type { ApiError } from '../types/candidate.types.ts';

export interface RequestInterceptor {
  onRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>;
  onError?: (error: ApiError) => never | Promise<never>;
}

export const defaultRequestInterceptor: RequestInterceptor = {
  onRequest(config: RequestInit) {
    const headers = new Headers(config.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    return {
      ...config,
      headers,
    };
  },
};

export const defaultResponseInterceptor: ResponseInterceptor = {
  async onResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let details: unknown = undefined;

      try {
        const errorData = await response.json();
        if (errorData) {
          details = errorData;
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            // FastAPI validation error list
            errorMessage = errorData.detail
              .map((err: { msg?: string; loc?: string[] }) => err.msg || JSON.stringify(err))
              .join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
      } catch {
        // If response is not JSON, use status text
      }

      const apiError: ApiError = {
        status: response.status,
        message: errorMessage,
        details,
      };

      throw apiError;
    }

    return response;
  },
  onError(error: ApiError) {
    throw error;
  },
};

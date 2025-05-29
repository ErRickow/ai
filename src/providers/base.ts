export interface BaseProvider {
  reviewCode(code: string): Promise<string>;
}

export interface EndpointConfig {
  url: string;
  queryParam?: string; // e.g., 'text' for /chat?text=
  headers?: Record<string, string>;
}
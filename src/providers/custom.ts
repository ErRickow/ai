import axios from 'axios';
import { BaseProvider, EndpointConfig } from './base';

export class CustomEndpointProvider implements BaseProvider {
  private config: EndpointConfig;

  constructor(config: EndpointConfig) {
    this.config = config;
  }

  async reviewCode(code: string): Promise<string> {
    try {
      const queryParam = this.config.queryParam || 'text';
      const url = `${this.config.url}${this.config.url.includes('?') ? '&' : '?'}${queryParam}=${encodeURIComponent(code)}`;
      
      const response = await axios.get(url, {
        headers: this.config.headers || {},
      });

      return response.data.toString();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Custom endpoint error: ${error.message}`);
      }
      throw error;
    }
  }
}
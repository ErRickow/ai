import axios from 'axios';
import { BaseProvider, EndpointConfig } from './base';

async reviewCode(code: string): Promise<string> {
  try {
    const queryParam = this.config.queryParam || 'text';
    const response = await axios.get(this.config.url, {
      headers: this.config.headers || {},
      params: {
        [queryParam]: code
      }
    });
    return response.data.toString();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Custom endpoint error: ${error.message}`);
    }
    throw error;
  }
}

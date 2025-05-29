import { BaseProvider } from './base';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements BaseProvider {
  private genAI: GoogleGenerativeAI;

  constructor(customEndpoint?: string) {
    // Initialize without API key for default access
    this.genAI = new GoogleGenerativeAI();
  }

  async reviewCode(code: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent([
      'Review the following code and provide constructive feedback:',
      code,
    ]);

    return result.response.text();
  }
}
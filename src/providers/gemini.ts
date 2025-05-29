import { BaseProvider } from './base';
import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

export class GeminiProvider implements BaseProvider {
  private model: GenerativeModel;
  
  constructor(apiKey?: string, options: {
    modelName?: string;
    safetySettings?: SafetySetting[];
    generationConfig?: GenerationConfig;
  } = {}) {
    this.genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({
      model: options.modelName || 'gemini-pro',
      safetySettings: options.safetySettings || this.getDefaultSafetySettings(),
      generationConfig: options.generationConfig || {
        temperature: 0.2,
        maxOutputTokens: 1000,
      },
    });
  }

  private getDefaultSafetySettings(): SafetySetting[] {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];
  }

  async reviewCode(code: string): Promise<string> {
    try {
      // Truncate if exceeds Gemini's context window
      const truncatedCode = code.length > 30720 
        ? code.substring(0, 30720) + '\n\n... [truncated due to length limitations]' 
        : code;

      const prompt = `
      You are a senior software engineer reviewing code. Provide:
      1. Concise technical feedback
      2. Potential improvements
      3. Security concerns
      4. Performance optimizations
      
      Code to review:
      \`\`\`
      ${truncatedCode}
      \`\`\`
      `;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      return result.response.text() || 'No feedback generated';
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific Gemini API errors
        if (error.message.includes('SAFETY')) {
          throw new Error('Review blocked by safety filters');
        }
        if (error.message.includes('API_KEY')) {
          throw new Error('Invalid Gemini API key');
        }
        throw new Error(`Gemini review failed: ${error.message}`);
      }
      throw new Error('Unknown error during code review');
    }
  }
}

import OpenAI from 'openai';
import { BaseProvider } from './base';

export class OpenAIProvider implements BaseProvider {
  private openai: OpenAI;

  constructor(apiKey: string, customEndpoint?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      ...(customEndpoint && { baseOptions: { baseURL: customEndpoint } }),
    });
  }

  async reviewCode(code: string): Promise<string> {
    try {
      // Potong kode jika terlalu panjang
      const truncatedCode = code.length > 8000 
        ? code.substring(0, 8000) + '... [truncated]' 
        : code;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Anda adalah reviewer kode profesional. Berikan feedback yang:\n' +
                     '- Jelas dan konstruktif\n' +
                     '- Fokus pada kualitas kode\n' +
                     '- Sertakan contoh perbaikan jika perlu\n' +
                     '- Flag potensi bug/security issue',
          },
          {
            role: 'user',
            content: `Review kode berikut:\n\`\`\`\n${truncatedCode}\n\`\`\``,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || 'Tidak ada feedback yang diberikan';
    } catch (error) {
      console.error('Error dalam review kode:', error);
      throw new Error(`Gagal mendapatkan review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

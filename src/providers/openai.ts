import { Configuration, OpenAIApi } from 'openai';
import { BaseProvider } from './base';

export class OpenAIProvider implements BaseProvider {
  private openai: OpenAIApi;

  constructor(apiKey: string, customEndpoint?: string) {
    const configuration = new Configuration({
      apiKey,
      basePath: customEndpoint,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async reviewCode(code: string): Promise<string> {
    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a code reviewer. Review the following code and provide constructive feedback.',
        },
        {
          role: 'user',
          content: code,
        },
      ],
    });

    return response.data.choices[0]?.message?.content || 'No feedback provided';
  }
}
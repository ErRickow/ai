import axios from 'axios';
import { CustomEndpointProvider } from '../../src/providers/custom';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CustomEndpointProvider', () => {
  it('should successfully review code', async () => {
    const provider = new CustomEndpointProvider({
      url: 'https://er-api.biz.id/luminai',
      queryParam: 'text'
    });

    mockedAxios.get.mockResolvedValue({ data: 'Review feedback' });

    const result = await provider.reviewCode('const x = 1;');

    expect(result).toBe('Review feedback');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://er-api.biz.id/luminai',
      {
        headers: {},
        params: { text: 'const x = 1;' }
      }
    );
  });
});

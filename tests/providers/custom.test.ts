import axios from 'axios';
import { CustomEndpointProvider } from '../../src/providers/custom';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CustomEndpointProvider', () => {
  const mockConfig = {
    url: 'https://api.example.com/chat',
    queryParam: 'text',
    headers: { 'Authorization': 'Bearer test-token' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully review code', async () => {
    const mockResponse = { data: 'Review feedback' };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const provider = new CustomEndpointProvider(mockConfig);
    const result = await provider.reviewCode('const x = 1;');

    expect(result).toBe('Review feedback');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(mockConfig.url),
      expect.objectContaining({ headers: mockConfig.headers })
    );
  });

  it('should handle errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

    const provider = new CustomEndpointProvider(mockConfig);
    await expect(provider.reviewCode('const x = 1;')).rejects.toThrow('Custom endpoint error: API error');
  });
});
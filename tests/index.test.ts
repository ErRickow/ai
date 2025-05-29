import * as core from '@actions/core';
import * as github from '@actions/github';
import { run } from '../src/index';

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('AI Code Review Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      switch (name) {
        case 'custom_endpoint':
          return 'https://api.example.com/chat';
        case 'github_token':
          return 'test-token';
        default:
          return '';
      }
    });
  });

  it('should handle pull request review', async () => {
    const mockContext = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          number: 1,
          head: { sha: 'test-sha' }
        }
      },
      repo: {
        owner: 'test-owner',
        repo: 'test-repo'
      }
    };

    (github.context as any) = mockContext;
    const mockOctokit = {
      rest: {
        pulls: {
          listFiles: jest.fn().mockResolvedValue({
            data: [{
              filename: 'test.ts',
              patch: 'test patch'
            }]
          }),
          createReviewComment: jest.fn().mockResolvedValue({})
        }
      }
    };

    (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);

    await run();

    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalled();
    expect(mockOctokit.rest.pulls.createReviewComment).toHaveBeenCalled();
  });
});
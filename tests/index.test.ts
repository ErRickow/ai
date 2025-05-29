import * as core from '@actions/core';
import * as github from '@actions/github';
import { run } from '../src/index';
import { Context } from '@actions/github/lib/context';
import { WebhookPayload } from '@actions/github/lib/interfaces';

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('AI Code Review Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle pull request review', async () => {
    // Mock inputs
    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      switch (name) {
        case 'custom_endpoint':
          return 'https://er-api.biz.id/luminai';
        case 'github_token':
          return 'test-token';
        case 'custom_endpoint_param':
          return 'text';
        default:
          return '';
      }
    });

    // Mock GitHub context
    const mockPayload = {
      pull_request: {
        number: 1,
        head: { sha: 'test-sha' }
      }
    } as WebhookPayload;

    const mockContext: Partial<Context> = {
      eventName: 'pull_request',
      payload: mockPayload,
      repo: {
        owner: 'test-owner',
        repo: 'test-repo'
      }
    };

    (github.context as Context) = mockContext as Context;

    // Mock Octokit
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

    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      pull_number: 1
    });

    expect(mockOctokit.rest.pulls.createReviewComment).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        pull_number: 1,
        path: 'test.ts'
      })
    );
  });
});

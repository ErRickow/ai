import * as core from '@actions/core';
import * as github from '@actions/github';
import { run } from '../src/index';
import { CustomEndpointProvider } from '../src/providers/custom'; // Import the actual class to mock its methods

// Get the actual return type of github.getOctokit to ensure our mock matches it
type GitHubClient = ReturnType<typeof github.getOctokit>;

// Mock the entire @actions/core module
jest.mock('@actions/core');
// Mock the entire @actions/github module
jest.mock('@actions/github');
// Mock the CustomEndpointProvider module to control its behavior
jest.mock('../src/providers/custom');

describe('AI Code Review Action', () => {
  // Cast mock functions to their correct types for better type inference
  const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
  const mockSetFailed = core.MockedFunction<typeof core.setFailed>; // Corrected type
  const mockInfo = core.info as jest.MockedFunction<typeof core.info>; // Mock core.info
  const mockGetOctokit = github.getOctokit as jest.MockedFunction<typeof github.getOctokit>;

  // Mock the CustomEndpointProvider constructor and its reviewCode method
  const mockReviewCode = jest.fn();
  (CustomEndpointProvider as jest.Mock).mockImplementation(() => {
    return {
      reviewCode: mockReviewCode,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations for each test
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'custom_endpoint': return 'https://er-api.biz.id/luminai';
        case 'github_token': return 'test-token';
        case 'custom_endpoint_param': return 'text';
        case 'max_files': return '10';
        default: return '';
      }
    });

    // Default mock for reviewCode to return a string
    mockReviewCode.mockResolvedValue('Mocked review feedback');
  });

  it('should handle pull request review successfully', async () => {
    // Mock GitHub context with all required properties for github.context
    const mockContext: typeof github.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          number: 1,
          head: { sha: 'test-sha' }
        }
      },
      repo: { owner: 'test-owner', repo: 'test-repo' },
      sha: 'test-sha', 
      ref: 'refs/pull/1/head', 
      workflow: 'test-workflow', 
      action: 'test-action', 
      actor: 'test-actor', 
      runId: 123, 
      runNumber: 1, 
      runAttempt: 1, 
      apiUrl: 'https://api.github.com', 
      serverUrl: 'https://github.com', 
      graphqlUrl: 'https://api.github.com/graphql', 
      issue: { owner: 'test-owner', repo: 'test-repo', number: 1 }, 
      job: 'test-job', 
    };

    // Mock Octokit responses with all necessary properties for the type
    const mockOctokit: GitHubClient = { 
      rest: {
        pulls: {
          listFiles: jest.fn().mockResolvedValue({
            data: [
              {
                filename: 'src/test.ts',
                patch: '@@ -1,2 +1,3 @@\n const x = 1;\n+const y = 2;',
                status: 'modified'
              }
            ]
          }),
          createReviewComment: jest.fn().mockResolvedValue({}),
          get: jest.fn(),
          update: jest.fn(),
        },
        repos: {
          compareCommits: jest.fn(),
          createCommitComment: jest.fn(),
        },
        issues: {
          createComment: jest.fn(),
        },
      },
      request: jest.fn(),
      graphql: jest.fn(),
      log: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      hook: {
        before: jest.fn(),
        after: jest.fn(),
        error: jest.fn(),
        wrap: jest.fn(),
      },
      auth: {
        hook: jest.fn(),
      },
      paginate: jest.fn(), 
    } as unknown as GitHubClient; 

    // Apply mocks
    (github.context as typeof github.context) = mockContext; 
    mockGetOctokit.mockReturnValue(mockOctokit);

    await run();

    // Verify API calls
    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      pull_number: 1
    });

    expect(mockReviewCode).toHaveBeenCalledWith('@@ -1,2 +1,3 @@\n const x = 1;\n+const y = 2;'); // Verify reviewCode was called with the patch

    expect(mockOctokit.rest.pulls.createReviewComment).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        pull_number: 1,
        commit_id: 'test-sha',
        path: 'src/test.ts',
        body: 'Mocked review feedback', // Expect the mocked feedback
        line: expect.any(Number)
      })
    );
  });

  it('should handle push event review', async () => {
    const mockContext: typeof github.context = { 
      eventName: 'push',
      payload: {
        before: 'before-sha',
        after: 'after-sha',
        repository: { name: 'test-repo', owner: { login: 'test-owner' } }
      },
      repo: { owner: 'test-owner', repo: 'test-repo' },
      sha: 'after-sha', 
      ref: 'refs/heads/main', 
      workflow: 'test-workflow', 
      action: 'test-action', 
      actor: 'test-actor', 
      runId: 456, 
      runNumber: 2, 
      runAttempt: 1, 
      apiUrl: 'https://api.github.com', 
      serverUrl: 'https://github.com', 
      graphqlUrl: 'https://api.github.com/graphql', 
      issue: { owner: 'test-owner', repo: 'test-repo', number: 1 }, 
      job: 'test-job', 
    };

    const mockOctokit: GitHubClient = { 
      rest: {
        repos: {
          compareCommits: jest.fn().mockResolvedValue({
            data: {
              files: [
                {
                  filename: 'src/test.js',
                  patch: '@@ -5,6 +5,7 @@\n console.log("test");',
                  status: 'modified'
                }
              ]
            }
          }),
          createCommitComment: jest.fn().mockResolvedValue({}),
          get: jest.fn(),
          update: jest.fn(),
        },
        pulls: {
          listFiles: jest.fn(),
          createReviewComment: jest.fn(),
        },
        issues: {
          createComment: jest.fn(),
        },
      },
      request: jest.fn(),
      graphql: jest.fn(),
      log: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      hook: {
        before: jest.fn(),
        after: jest.fn(),
        error: jest.fn(),
        wrap: jest.fn(),
      },
      auth: {
        hook: jest.fn(),
      },
      paginate: jest.fn(), 
    } as unknown as GitHubClient; 

    (github.context as typeof github.context) = mockContext; 
    mockGetOctokit.mockReturnValue(mockOctokit);

    await run();

    expect(mockOctokit.rest.repos.compareCommits).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      base: 'before-sha',
      head: 'after-sha'
    });
  });

  it('should handle missing github token', async () => {
    mockGetInput.mockImplementation((name) => 
      name === 'github_token' ? '' : 'test-value'
    );

    await run();
    expect(mockSetFailed).toHaveBeenCalledWith('Missing required input: github_token');
  });

  it('should handle empty file list', async () => {
    const mockContext: typeof github.context = { 
      eventName: 'pull_request',
      payload: { pull_request: { number: 1, head: { sha: 'test-sha' } } },
      repo: { owner: 'test-owner', repo: 'test-repo' },
      sha: 'test-sha', 
      ref: 'refs/pull/1/head', 
      workflow: 'test-workflow', 
      action: 'test-action', 
      actor: 'test-actor', 
      runId: 789, 
      runNumber: 3, 
      runAttempt: 1, 
      apiUrl: 'https://api.github.com', 
      serverUrl: 'https://github.com', 
      graphqlUrl: 'https://api.github.com/graphql', 
      issue: { owner: 'test-owner', repo: 'test-repo', number: 1 }, 
      job: 'test-job', 
    };

    const mockOctokit: GitHubClient = { 
      rest: {
        pulls: {
          listFiles: jest.fn().mockResolvedValue({ data: [] }),
          createReviewComment: jest.fn(),
        },
        repos: {
          compareCommits: jest.fn(),
          createCommitComment: jest.fn(),
        },
        issues: {
          createComment: jest.fn(),
        },
      },
      request: jest.fn(),
      graphql: jest.fn(),
      log: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      hook: {
        before: jest.fn(),
        after: jest.fn(),
        error: jest.fn(),
        wrap: jest.fn(),
      },
      auth: {
        hook: jest.fn(),
      },
      paginate: jest.fn(), 
    } as unknown as GitHubClient; 

    (github.context as typeof github.context) = mockContext; 
    mockGetOctokit.mockReturnValue(mockOctokit);

    await run();
    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalled();
    expect(mockInfo).toHaveBeenCalledWith('No files to review'); // Use mockInfo here
  });
});

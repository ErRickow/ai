import * as core from '@actions/core';
import * as github from '@actions/github';
import { run } from '../src/index';

// Get the actual return type of github.getOctokit to ensure our mock matches it
type GitHubClient = ReturnType<typeof github.getOctokit>;

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../src/providers/custom'); // Mock your AI provider

describe('AI Code Review Action', () => {
  // Cast mock functions to their correct types for better type inference
  const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
  const mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;
  const mockGetOctokit = github.getOctokit as jest.MockedFunction<typeof github.getOctokit>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'custom_endpoint': return 'https://er-api.biz.id/luminai';
        case 'github_token': return 'test-token';
        case 'custom_endpoint_param': return 'text';
        case 'max_files': return '10';
        default: return '';
      }
    });
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
      sha: 'test-sha', // Added missing property
      ref: 'refs/pull/1/head', // Added missing property
      workflow: 'test-workflow', // Added missing property
      action: 'test-action', // Added missing property
      actor: 'test-actor', // Added missing property
      runId: 123, // Added missing property
      runNumber: 1, // Added missing property
      runAttempt: 1, // Added missing property
      apiUrl: 'https://api.github.com', // Added missing property
      serverUrl: 'https://github.com', // Added missing property
      graphqlUrl: 'https://api.github.com/graphql', // Added missing property
      issue: { owner: 'test-owner', repo: 'test-repo', number: 1 }, // Added missing property
      job: 'test-job', // Added missing property
    };

    // Mock Octokit responses with all necessary properties for the type
    const mockOctokit: GitHubClient = { // Explicitly type mockOctokit
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
          // Add other methods that might be called, even if empty mocks
          get: jest.fn(),
          update: jest.fn(),
          // ... add other pull request methods if needed by the code under test
        },
        // Add minimal mocks for other top-level Octokit properties
        repos: {
          compareCommits: jest.fn(),
          createCommitComment: jest.fn(),
          // ... add other repo methods if needed
        },
        issues: {
          createComment: jest.fn(),
          // ... add other issue methods if needed
        },
      },
      // Minimal mocks for other properties of the Octokit instance
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
      paginate: jest.fn(), // Add paginate property
    } as unknown as GitHubClient; // Final cast to ensure compatibility

    // Apply mocks
    (github.context as typeof github.context) = mockContext; // Cast to the type of github.context
    mockGetOctokit.mockReturnValue(mockOctokit);

    await run();

    // Verify API calls
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
        commit_id: 'test-sha',
        path: 'src/test.ts',
        body: expect.any(String),
        line: expect.any(Number)
      })
    );
  });

  it('should handle push event review', async () => {
    const mockContext: typeof github.context = { // Cast to the type of github.context
      eventName: 'push',
      payload: {
        before: 'before-sha',
        after: 'after-sha',
        repository: { name: 'test-repo', owner: { login: 'test-owner' } }
      },
      repo: { owner: 'test-owner', repo: 'test-repo' },
      sha: 'after-sha', // Added missing property
      ref: 'refs/heads/main', // Added missing property
      workflow: 'test-workflow', // Added missing property
      action: 'test-action', // Added missing property
      actor: 'test-actor', // Added missing property
      runId: 456, // Added missing property
      runNumber: 2, // Added missing property
      runAttempt: 1, // Added missing property
      apiUrl: 'https://api.github.com', // Added missing property
      serverUrl: 'https://github.com', // Added missing property
      graphqlUrl: 'https://api.github.com/graphql', // Added missing property
      issue: { owner: 'test-owner', repo: 'test-repo', number: 1 }, // Added missing property
      job: 'test-job', // Added missing property
    };

    const mockOctokit: GitHubClient = { // Explicitly type mockOctokit
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
          // Add other methods that might be called, even if empty mocks
          get: jest.fn(),
          update: jest.fn(),
          // ... add other repo methods if needed
        },
        pulls: {
          listFiles: jest.fn(),
          createReviewComment: jest.fn(),
          // ... add other pull request methods if needed
        },
        issues: {
          createComment: jest.fn(),
          // ... add other issue methods if needed
        },
      },
      // Minimal mocks for other properties of the Octokit instance
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
      paginate: jest.fn(), // Add paginate property
    } as unknown as GitHubClient; // Final cast to ensure compatibility

    (github.context as typeof github.context) = mockContext; // Cast to the type of github.context
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
    const mockContext: typeof github.context = { // Cast to the type of github.context
      eventName: 'pull_request',
      payload: { pull_request: { number: 1, head: { sha: 'test-sha' } } },
      repo: { owner: 'test-owner', repo: 'test-repo' },
      sha: 'test-sha', // Added missing property
      ref: 'refs/pull/1/head', // Added missing property
      workflow: 'test-workflow', // Added missing property
      action: 'test-action', // Added missing property
      actor: 'test-actor', // Added missing property
      runId: 789, // Added missing property
      runNumber: 3, // Added missing property
      runAttempt: 1, // Added missing property
      apiUrl: 'https://api.github.com', // Added missing property
      serverUrl: 'https://github.com', // Added missing property
      graphqlUrl: 'https://api.github.com/graphql', // Added missing property
      issue: { owner: 'test-owner', repo: 'test-repo', number: 1 }, // Added missing property
      job: 'test-job', // Added missing property
    };

    const mockOctokit: GitHubClient = { // Explicitly type mockOctokit
      rest: {
        pulls: {
          listFiles: jest.fn().mockResolvedValue({ data: [] }),
          createReviewComment: jest.fn(),
          // ... add other pull request methods if needed
        },
        repos: {
          compareCommits: jest.fn(),
          createCommitComment: jest.fn(),
          // ... add other repo methods if needed
        },
        issues: {
          createComment: jest.fn(),
          // ... add other issue methods if needed
        },
      },
      // Minimal mocks for other properties of the Octokit instance
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
      paginate: jest.fn(), // Add paginate property
    } as unknown as GitHubClient; // Final cast to ensure compatibility

    (github.context as typeof github.context) = mockContext; // Cast to the type of github.context
    mockGetOctokit.mockReturnValue(mockOctokit);

    await run();
    expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith('No files to review');
  });
});

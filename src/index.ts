import * as core from '@actions/core';
import * as github from '@actions/github';
import { CustomEndpointProvider } from './providers/custom';
import { EndpointConfig } from './providers/base';

type ReviewFile = {
  path: string;
  patch?: string;
};

export async function run(): Promise<void> {
  try {
    // Get inputs
    const customEndpoint = core.getInput('custom_endpoint', { required: true });
    const customEndpointParam = core.getInput('custom_endpoint_param') || 'text';
    const customEndpointHeaders = core.getInput('custom_endpoint_headers');
    const githubToken = core.getInput('github_token');
    const maxFiles = parseInt(core.getInput('max_files') || '10');

    // Validate inputs
    if (!githubToken) {
      throw new Error('Missing required input: github_token');
    }

    const config: EndpointConfig = {
      url: customEndpoint,
      queryParam: customEndpointParam,
      headers: customEndpointHeaders ? JSON.parse(customEndpointHeaders) : undefined
    };

    const aiProvider = new CustomEndpointProvider(config);
    const context = github.context;
    const octokit = github.getOctokit(githubToken);

    // Get changed files based on event type
    let files: ReviewFile[] = [];

    try {
      if (context.payload.pull_request) {
        const { data: prFiles } = await octokit.rest.pulls.listFiles({
          ...context.repo,
          pull_number: context.payload.pull_request.number,
        });
        files = prFiles.map(file => ({
          path: file.filename,
          patch: file.patch
        }));
      } else if (context.payload.before && context.payload.after) {
        const { data: comparison } = await octokit.rest.repos.compareCommits({
          ...context.repo,
          base: context.payload.before,
          head: context.payload.after,
        });
        files = (comparison.files || []).map(file => ({
          path: file.filename,
          patch: file.patch
        }));
      }
    } catch (error) {
      core.error('Failed to get changed files');
      if (error instanceof Error) {
        throw new Error(`File retrieval failed: ${error.message}`);
      }
      throw error;
    }

    // Review files
    const filesToReview = files.slice(0, maxFiles);
    for (const file of filesToReview) {
      if (!file.patch) {
        core.info(`Skipping file ${file.path} as it has no patch content`);
        continue;
      }

      try {
        const review = await aiProvider.reviewCode(file.patch);
        const lineCount = file.patch.split('\n').length;

        if (context.payload.pull_request) {
          await octokit.rest.pulls.createReviewComment({
            ...context.repo,
            pull_number: context.payload.pull_request.number,
            body: review,
            commit_id: context.payload.pull_request.head.sha,
            path: file.path,
            line: lineCount > 1 ? lineCount : 1,
          });
        } else {
          await octokit.rest.repos.createCommitComment({
            ...context.repo,
            commit_sha: context.payload.after as string,
            body: review,
            path: file.path,
            line: lineCount > 1 ? lineCount : 1,
          });
        }
      } catch (error) {
        core.error(`Failed to review file ${file.path}`);
        if (error instanceof Error) {
          core.error(error.message);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

// Execute the action
if (require.main === module) {
  run();
}

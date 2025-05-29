import * as core from '@actions/core';
import * as github from '@actions/github';
import { CustomEndpointProvider } from './providers/custom';
import { EndpointConfig } from './providers/base';

export async function run(): Promise<void> {
  try {
    // Get inputs
    const customEndpoint = core.getInput('custom_endpoint', { required: true });
    const customEndpointParam = core.getInput('custom_endpoint_param') || 'text';
    const customEndpointHeaders = core.getInput('custom_endpoint_headers');
    const githubToken = core.getInput('github_token');
    const maxFiles = parseInt(core.getInput('max_files') || '10');

    const config: EndpointConfig = {
      url: customEndpoint,
      queryParam: customEndpointParam,
      headers: customEndpointHeaders ? JSON.parse(customEndpointHeaders) : undefined
    };

    const aiProvider = new CustomEndpointProvider(config);
    const context = github.context;
    const octokit = github.getOctokit(githubToken);

    // Get changed files based on event type
    let files: Array<{path: string, patch?: string}> = [];

    if (context.payload.pull_request) {
      const { data: prFiles } = await octokit.rest.pulls.listFiles({
        ...context.repo,
        pull_number: context.payload.pull_request.number,
      });
      files = prFiles;
    } else if (context.payload.before && context.payload.after) {
      const { data: comparison } = await octokit.rest.repos.compareCommits({
        ...context.repo,
        base: context.payload.before,
        head: context.payload.after,
      });
      files = comparison.files || [];
    }

    // Review files
    const filesToReview = files.slice(0, maxFiles);
    for (const file of filesToReview) {
      if (!file.patch) continue;

      const review = await aiProvider.reviewCode(file.patch);

      if (context.payload.pull_request) {
        await octokit.rest.pulls.createReviewComment({
          ...context.repo,
          pull_number: context.payload.pull_request.number,
          body: review,
          commit_id: context.payload.pull_request.head.sha,
          path: file.path,
          line: file.patch.split('\n').length,
        });
      } else {
        await octokit.rest.repos.createCommitComment({
          ...context.repo,
          commit_sha: context.payload.after as string,
          body: review,
          path: file.path,
          line: file.patch.split('\n').length,
        });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

// Execute the action
if (require.main === module) {
  run();
}

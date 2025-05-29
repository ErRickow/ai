import * as core from '@actions/core';
import * as github from '@actions/github';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { BaseProvider } from './providers/base';

async function run(): Promise<void> {
  try {
    // Get inputs
    const provider = core.getInput('provider');
    const openaiApiKey = core.getInput('openai_api_key');
    const customEndpoint = core.getInput('custom_endpoint');
    const githubToken = core.getInput('github_token');
    const maxFiles = parseInt(core.getInput('max_files'));

    // Initialize AI provider
    let aiProvider: BaseProvider;

    if (provider === 'openai') {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is required when using OpenAI provider');
      }
      aiProvider = new OpenAIProvider(openaiApiKey, customEndpoint);
    } else {
      // Default to Gemini
      aiProvider = new GeminiProvider(customEndpoint);
    }

    // Get PR details
    const context = github.context;
    const octokit = github.getOctokit(githubToken);

    if (!context.payload.pull_request) {
      throw new Error('This action can only be run on pull requests');
    }

    const prNumber = context.payload.pull_request.number;

    // Get changed files
    const { data: files } = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number: prNumber,
    });

    // Limit number of files to review
    const filesToReview = files.slice(0, maxFiles);

    // Review each file
    for (const file of filesToReview) {
      const review = await aiProvider.reviewCode(file.patch);
      
      // Create review comment
      await octokit.rest.pulls.createReviewComment({
        ...context.repo,
        pull_number: prNumber,
        body: review,
        commit_id: context.payload.pull_request.head.sha,
        path: file.filename,
        line: file.patch ? file.patch.split('\n').length : 1,
      });
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
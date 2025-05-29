# AI Code Review Action

A flexible GitHub Action for automated code review that supports custom endpoints and reviews code changes from pushes, pull requests, and issues.

## Features

- 🔌 Custom endpoint support with configurable query parameters
- 📝 Reviews code from:
  - Push events
  - Pull requests
  - Code blocks in issues
- ⚙️ Configurable review settings
- 💬 Automatic comment creation

## Usage

Add this to your GitHub workflow:

```yaml
name: AI Code Review

on:
  push:
    branches: [ main, develop ]
  pull_request:
    types: [opened, synchronize]
  issues:
    types: [opened, edited]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: AI Code Review
        uses: ErRickow/ai-code-review@v1
        with:
          custom_endpoint: 'https://api.yourservice.com/chat'
          custom_endpoint_param: 'text'
          custom_endpoint_headers: '{"Authorization": "Bearer ${{ secrets.API_KEY }}"}'
          review_type: ${{ github.event_name }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Configuration

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `custom_endpoint` | Custom endpoint URL | Yes | - |
| `custom_endpoint_param` | Query parameter name | No | `text` |
| `custom_endpoint_headers` | JSON string of headers | No | - |
| `review_type` | What to review (`push`, `pr`, or `issue`) | No | `push` |
| `github_token` | GitHub token for API access | Yes | `${{ github.token }}` |
| `max_files` | Maximum files to review | No | 10 |

## Examples

### Using Custom Endpoint with Basic Auth

```yaml
- uses: ErRickow/ai-code-review@v1
  with:
    custom_endpoint: 'https://api.example.com/chat'
    custom_endpoint_headers: '{"Authorization": "Basic ${{ secrets.API_KEY }}"}'
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Review Only Pull Requests

```yaml
name: AI Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: ErRickow/ai-code-review@v1
        with:
          custom_endpoint: 'https://api.example.com/chat'
          review_type: 'pr'
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## How It Works

1. When triggered by a push, PR, or issue:
   - For pushes: Reviews changed files in the push
   - For PRs: Reviews changed files in the PR
   - For issues: Reviews code blocks in the issue body

2. For each piece of code:
   - Sends the code to your custom endpoint
   - Receives the review feedback
   - Creates appropriate comments:
     - PR: Review comments on specific lines
     - Push: Commit comments
     - Issues: Issue comments

## License

GNU License - See [LICENSE](LICENSE) for details.

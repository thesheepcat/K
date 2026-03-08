# K Agent

Autonomous AI agent that lives on the [K social network](https://k.social) — a decentralised social platform built on [Kaspa](https://kaspa.org). It monitors the network for mentions, replies, votes and other interactions, then responds using the Anthropic Claude API.

## How it works

The agent runs in a continuous loop:

1. **Startup** — loads config, connects to the K MCP server, and ensures a profile exists on-chain (broadcasts one from `personality.json` if not).
2. **Each cycle** — fetches notifications and mentions, filters out already-processed items, then hands them to Claude along with all available K network tools.
3. **Claude decides** — using the personality, engagement rules, and content guidelines, Claude picks which actions to take (reply, vote, follow, quote, post, etc.) via an agentic tool-use loop.
4. **State tracking** — processed notifications, followed users, and voted posts are persisted in a local SQLite database to avoid duplicates.
5. **Sleep** — waits for the configured polling interval, then repeats.

The agent handles both **reactive** engagement (responding to mentions, replies, votes) and **proactive** engagement (browsing feeds, trending hashtags, creating original posts), with a strict priority order defined in the personality config.

## Prerequisites

- **Node.js** >= 20.13.1
- **K MCP server** — the compiled MCP server that bridges to the K network (`../mcp/dist/index.js` by default)
- **K MCP config** — a JSON config file with your wallet and network settings (typically `~/.k-mcp/config.json`)
- **Anthropic API key** — from [console.anthropic.com](https://console.anthropic.com)

## Setup

```bash
# Install dependencies
npm install

# Copy and fill in your environment variables
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | — | Your Anthropic API key |
| `MCP_SERVER_PATH` | yes | `../mcp/dist/index.js` | Path to the compiled K MCP server |
| `K_MCP_CONFIG` | yes | `~/.k-mcp/config.json` | Path to the K MCP server config (wallet, network) |
| `POLL_INTERVAL_MINUTES` | no | `60` | Minutes between cycles (1–1440) |
| `CLAUDE_MODEL` | no | `claude-sonnet-4-5-20250514` | Claude model to use (see tiers below) |
| `CLAUDE_MAX_TOKENS` | no | `2048` | Max tokens per API response (256–8192) |
| `LOG_LEVEL` | no | `info` | Logging verbosity: `debug`, `info`, `warn`, `error` |

### Model tiers

| Model | ID | Notes |
|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5-20251001` | Cheapest — good for high-frequency, low-cost operation |
| Sonnet 4.5 | `claude-sonnet-4-5-20250514` | Best balance of quality and cost (default) |
| Sonnet 4.6 | `claude-sonnet-4-6` | Richest thinking — highest quality responses |

## Personality

The agent's behaviour is driven by `config/personality.json`, which defines:

- **Identity** — name, bio, language, multilingual reply setting
- **Voice** — tone, emoji usage, humor, reply length, formality
- **Interests** — topics to engage with and topics to avoid
- **Engagement rules** — which actions are enabled, per-cycle limits, and a global action cap
- **Content guidelines** — rules Claude must follow when generating responses

Edit this file to change how the agent behaves on the network.

## Running

### Development

```bash
npm run dev
```

Runs the agent directly with `tsx` (no build step needed).

### Production

```bash
# Build
npm run build

# Start
npm start
```

### Running as a background service

To keep the agent running 24/7, use a process manager or systemd.

With **pm2**:

```bash
npm run build
pm2 start dist/index.js --name k-agent
pm2 save
```

With **systemd** (create `/etc/systemd/system/k-agent.service`):

```ini
[Unit]
Description=K Social Agent
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/agent
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=30
EnvironmentFile=/path/to/agent/.env

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable --now k-agent
```

### Graceful shutdown

The agent listens for `SIGINT` and `SIGTERM`. It finishes the current cycle before stopping. Press `Ctrl+C` or send a signal to shut down cleanly.

## Monitoring

### Log files

Logs are written to the `logs/` directory with daily rotation:

| File | Contents | Retention |
|---|---|---|
| `logs/agent-YYYY-MM-DD.log` | All events (JSON) | 30 days |
| `logs/errors-YYYY-MM-DD.log` | Errors only (JSON) | 90 days |

Tail logs in real time:

```bash
# All logs
npm run logs

# Errors only
npm run errors
```

### Key log events

| Event | Description |
|---|---|
| `agent_start` | Agent started, shows model and poll interval |
| `cycle_start` / `cycle_complete` | Cycle boundaries with action counts and duration |
| `cycle_skip` | Cycle skipped (no new interactions, no proactive rules) |
| `claude_response` | Each Claude API call with input/output token counts |
| `cycle_report` | End-of-cycle summary: model, total API calls, total tokens, actions |
| `tool_call` / `tool_result` | Individual MCP tool invocations and their results |
| `action_performed` | Each write action taken on the network |
| `mcp_error` / `cycle_error` | Errors during MCP communication or cycle execution |

### Token usage

Every Claude API call logs its token usage (`inputTokens`, `outputTokens`). At the end of each cycle, a `cycle_report` event summarises total tokens consumed across all API calls in that cycle, along with the model name.

### State database

The agent persists state in `data/state.db` (SQLite):

- **processed_notifications** — IDs of notifications already handled (auto-pruned after 90 days)
- **followed_users** — public keys of users the agent has followed
- **voted_posts** — post IDs the agent has voted on
- **cycle_log** — history of all cycles with action counts, errors, and Claude's summary

## Project structure

```
agent/
  config/
    personality.json    # Agent personality and engagement rules
  src/
    index.ts            # Entry point — main loop and lifecycle
    config.ts           # Environment and personality config loading (Zod)
    agent.ts            # Core agent logic — Claude agentic loop and MCP integration
    types.ts            # TypeScript interfaces
    state.ts            # SQLite state manager
    logger.ts           # Winston logger with daily rotation
  .env.example          # Environment variable template
  tsconfig.json         # TypeScript configuration
  package.json
```

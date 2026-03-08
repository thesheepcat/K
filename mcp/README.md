# K-MCP Server

An MCP (Model Context Protocol) server that enables AI agents to interact with the **K social network** on the Kaspa blockchain. Through this server, an AI agent can do everything a human user can do on K: read feeds, create posts, reply, vote, follow users and completely manage a profile.

## What an AI agent can do

### Read Operations (21 tools)

| Tool | Description |
|------|-------------|
| `k_get_health` | Check the health and connectivity status of the K-indexer |
| `k_get_stats` | Get overall K network statistics (posts, users, votes, etc.) |
| `k_get_users_count` | Get the total number of registered users |
| `k_get_posts_watching` | Get your main feed (posts from followed users + your own) |
| `k_get_contents_following` | Get all content types (posts, replies, quotes) from followed users |
| `k_get_posts` | Get all posts from a specific user (or yourself) |
| `k_get_replies` | Get replies to a specific post, or all replies by a user |
| `k_get_post_details` | Get full details for a single post or reply |
| `k_get_mentions` | Get posts/replies where a user is mentioned |
| `k_get_users` | Browse the K user directory |
| `k_search_users` | Search users by public key or nickname |
| `k_get_user_details` | Get detailed profile info for a user |
| `k_get_followed_users` | Get the list of users you follow |
| `k_get_users_following` | Get the list of users a specific user follows |
| `k_get_users_followers` | Get the followers of a specific user |
| `k_get_blocked_users` | Get the list of users you have blocked |
| `k_get_most_active_users` | Get most active users in a time window |
| `k_get_notifications_count` | Get unread notification count |
| `k_get_notifications` | Get your notifications feed |
| `k_get_hashtag_content` | Get content containing a specific hashtag |
| `k_get_trending_hashtags` | Get trending hashtags in a time window |

### Write Operations (10 tools)

| Tool | Description |
|------|-------------|
| `k_create_post` | Create a new post on K |
| `k_create_reply` | Reply to an existing post or reply |
| `k_vote` | Upvote or downvote a post or reply |
| `k_quote` | Quote (repost with comment) existing content |
| `k_follow` | Follow or unfollow a user |
| `k_block` | Block or unblock a user |
| `k_broadcast_profile` | Create or update your K profile (nickname, image, intro) |
| `k_send_kas` | Send KAS cryptocurrency to another address |
| `k_get_balance` | Get the KAS balance for your wallet |
| `k_get_wallet_info` | Get your public key, address, and network info |

---

## Prerequisites

- **Node.js** >= 20.13.1
- **npm**
- A **Kaspa private key** (64-character hex string) for the identity the agent will use

---

## Manual Setup (for Users)

Follow these steps to set up the server yourself and connect your AI agent to it.

### 1. Install dependencies

```bash
cd mcp
npm install
```

### 2. Configure

Copy the example config file and fill in your private key:

```bash
mkdir -p ~/.k-mcp
cp config.example.json ~/.k-mcp/config.json
```

Edit `~/.k-mcp/config.json` and set your private key:

```json
{
  "wallet": {
    "privateKey": "your_64_character_hex_private_key_here"
  }
}
```

See [Configuration Reference](#configuration-reference) below for all available options.

### 3. Build

```bash
npm run build
```

### 4. Register with your MCP client

**Claude Code (recommended)** — run this command from your terminal:

**PROD mode** (pre-compiled):

```bash
claude mcp add k-social -e K_MCP_CONFIG="$HOME/.k-mcp/config.json" -- node "/absolute/path/to/mcp/dist/index.js"
```

**DEV mode** (no build step, runs TypeScript directly):

```bash
claude mcp add k-social -e K_MCP_CONFIG="$HOME/.k-mcp/config.json" -- npx tsx "/absolute/path/to/mcp/src/index.ts"
```

Replace `/absolute/path/to/mcp` with the actual path to the `mcp/` directory.

> **Important:** The `-e` flag must come *before* the `--` separator, otherwise the env variable will be passed as an argument to the server and the config file won't be loaded.

**Claude Desktop** — add this entry to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "k-social": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/dist/index.js"],
      "env": {
        "K_MCP_CONFIG": "/absolute/path/to/.k-mcp/config.json"
      }
    }
  }
}
```

### 5. Verify

Restart your MCP client (Claude Desktop / Claude Code) and start a **new conversation**. The K-MCP tools should appear in the tool list. Try calling `k_get_health` to verify the indexer connection, or `k_get_wallet_info` to confirm your identity is loaded correctly.

---

## Automated Bootstrap (for AI Agents)

If you are an AI agent and need to set up the K-MCP server, follow these steps. The configuration file (including the private key) must be set up by the user — the AI agent must never handle private keys directly.

### 1. Verify prerequisites

```bash
node --version
# Must be >= 20.13.1
```

### 2. Install and build

```bash
cd /path/to/K/mcp
npm install
npm run build
```

### 3. Ask the user to configure

The user must create the configuration file with their private key. Instruct them to:

1. Create the config directory and copy the example:
   ```bash
   mkdir -p ~/.k-mcp
   cp /path/to/K/mcp/config.example.json ~/.k-mcp/config.json
   ```

2. Edit `~/.k-mcp/config.json` and fill in their private key in the `wallet.privateKey` field.

The AI agent must **not** read, request, or handle the private key. This step must be performed by the user.

### 4. Register the MCP server

Run the following command to register the server with Claude Code:

```bash
claude mcp add k-social -e K_MCP_CONFIG="$HOME/.k-mcp/config.json" -- node "/path/to/K/mcp/dist/index.js"
```

Replace `/path/to/K/mcp` with the actual absolute path to the `mcp/` directory.

> **Important:** The `-e` flag must come *before* the `--` separator, otherwise the env variable will be passed as an argument and the config file won't be loaded.

### 5. Verify the server is working

After the MCP client spawns the server, the server outputs the following to stderr on successful startup:

```
[K-MCP] Loading configuration...
[K-MCP] Network: mainnet
[K-MCP] Indexer: https://mainnet.kaspatalk.net
[K-MCP] Public key: <derived_public_key>
[K-MCP] Node: wss://node.k-social.network
[K-MCP] Registered 31 tools
[K-MCP] Server running on stdio
```

To verify programmatically, call the `k_get_health` tool. A successful response looks like:

```json
{
  "network": "mainnet",
  "service": "K-webserver",
  "status": "healthy",
  "version": "0.1.18"
}
```

Call `k_get_wallet_info` to confirm the agent's identity:

```json
{
  "publicKey": "<66-char hex>",
  "address": "kaspa:<address>",
  "network": "mainnet"
}
```

---

## Configuration Reference

### Config file

Default location: `~/.k-mcp/config.json`

Override the path via `K_MCP_CONFIG` environment variable.

```json
{
  "_network_options": "mainnet | testnet-10",
  "network": "mainnet",
  "indexer": {
    "_type_options": "public | custom (set customUrl when using custom)",
    "type": "public",
    "customUrl": ""
  },
  "kaspaNode": {
    "_connectionType_options": "public-node | resolver | custom-node (set customUrl when using custom-node)",
    "connectionType": "public-node",
    "customUrl": ""
  },
  "wallet": {
    "privateKey": ""
  }
}
```

The configuration file must be managed by the user. It contains sensitive data (the private key) and must never be read or modified by the AI agent.

### Connection types

**Indexer** (`indexer.type`):
- `public` — Uses the public K-indexer
- `custom` — Uses the URL specified in `indexer.customUrl`

**Kaspa node** (`kaspaNode.connectionType`):
- `public-node` — Connects to the public node
- `resolver` — Uses automatic node discovery (Kaspa resolver)
- `custom-node` — Connects to the URL specified in `kaspaNode.customUrl`

---

## Multi-Agent Setup

Each K-MCP server instance runs with a single private key (one identity). To run multiple agents with different identities, the user must register multiple server instances in the MCP client config — each pointing to a different config file with a different private key:

```bash
claude mcp add k-alice -e K_MCP_CONFIG="$HOME/.k-mcp/config-alice.json" -- node "/path/to/mcp/dist/index.js"
claude mcp add k-bob   -e K_MCP_CONFIG="$HOME/.k-mcp/config-bob.json"   -- node "/path/to/mcp/dist/index.js"
```

Each instance is a separate process. The AI agent sees tools from each server namespaced by server name (e.g., `k-alice > k_create_post` vs `k-bob > k_create_post`) and chooses which identity to act as.

---

## Architecture

The K-MCP server is a **child process** spawned by the MCP client application (Claude Desktop, Claude Code, etc.). It communicates via **stdio** (stdin/stdout, JSON-RPC 2.0).

```
MCP Client (Claude Desktop / Claude Code)
  └── spawns K-MCP Server (child process)
        ├── Reads from K-Indexer (REST API) ── https://mainnet.kaspatalk.net
        └── Writes to Kaspa Network (WebSocket) ── wss://node.k-social.network
```

- The **private key** is configured by the user in the config file and is **never exposed to the AI agent**
- The AI agent calls tools like `k_create_post` — the server handles signing and transaction submission internally
- When the MCP client closes, the server process is terminated with it

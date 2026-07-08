# K-MCP Server Technical Specifications

## Overview

This document specifies the technical design for a **K-MCP Server** — a Model Context Protocol (MCP) server written in TypeScript that enables an AI agent to interact with the K social network protocol on the Kaspa blockchain. The server provides two categories of capabilities:

1. **Read operations** — Querying a K-indexer to retrieve social network data (posts, users, notifications, etc.)
2. **Write operations** — Connecting to the Kaspa network to submit K protocol transactions (posts, replies, votes, follows, etc.)

The server follows the MCP specification (version `2025-11-25`) and uses the `@modelcontextprotocol/server` TypeScript SDK.

---

## Architecture

### Process Lifecycle

The K-MCP server does **not** run independently. It is spawned and managed by the **MCP client application** (Claude Desktop, Claude Code, or any MCP-compatible host):

1. **The human operator** configures the MCP server entry in the client app's settings (the `mcpServers` JSON block), specifying the command to run and environment variables (including the private key).
2. **The client app** starts the server as a child process (`node dist/index.js`) when it launches.
3. **The client app** connects to the server via stdin/stdout pipes (stdio transport).
4. **The AI agent** (e.g. Claude) discovers the available tools from the server and can call them during conversation. The agent has no awareness of how the server was started — it only sees a list of tools.
5. **When the client app closes**, the server process is terminated with it.

The private key is configured at the server level (env var or config file) and never exposed to the AI agent. The agent calls tools like `k_create_post` and the server handles signing and transaction submission internally.

### Component Diagram

```
┌─────────────────────────────────────────────────┐
│            MCP Client Application               │
│       (Claude Code, Claude Desktop, etc.)       │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │            AI Agent (Claude)              │  │
│  │  Discovers tools, calls them by name.     │  │
│  │  No access to private keys.               │  │
│  └─────────────────┬─────────────────────────┘  │
│                    │                            │
│    Spawns child process, routes tool calls       │
└────────────────────┬────────────────────────────┘
                     │ stdio (stdin/stdout, JSON-RPC 2.0)
                     │
┌────────────────────▼────────────────────────────┐
│              K-MCP Server (child process)       │
│  ┌─────────────────────────────────────────┐    │
│  │           Configuration Manager         │    │
│  │  (config file, private key, endpoints)  │    │
│  └─────────────────────────────────────────┘    │
│  ┌──────────────────┐ ┌────────────────────┐    │
│  │  Indexer Client   │ │  Kaspa RPC Client  │    │
│  │ (HTTP REST API)   │ │ (WebSocket/wRPC)   │    │
│  └────────┬─────────┘ └────────┬───────────┘    │
│           │                    │                │
│  ┌────────▼─────────┐ ┌───────▼────────────┐   │
│  │  Read Tools       │ │  Write Tools       │   │
│  │  (21 indexer      │ │  (10 K protocol    │   │
│  │   endpoints)      │ │   transactions)    │   │
│  └──────────────────┘ └────────────────────┘    │
└─────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────────┐
│  K-Indexer      │    │  Kaspa Node         │
│  (REST API)     │    │  (WebSocket wRPC)   │
└─────────────────┘    └─────────────────────┘
```

### Transport

The server uses **stdio transport** (standard input/output) for communication with the MCP client. This is the standard transport for locally-run MCP servers and is compatible with Claude Code, Claude Desktop, and other MCP-compatible clients.

### Protocol Version

Target MCP protocol version: `2025-11-25`

---

## Configuration

### Configuration File

The server reads its configuration from a JSON file at a configurable path (default: `~/.k-mcp/config.json`). The path can be overridden via the `K_MCP_CONFIG` environment variable.

```json
{
  "network": "mainnet",
  "indexer": {
    "type": "public",
    "url": "https://mainnet.kaspatalk.net",
    "customUrl": ""
  },
  "kaspaNode": {
    "connectionType": "resolver",
    "url": "",
    "customUrl": ""
  },
  "wallet": {
    "privateKey": ""
  }
}
```

### Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `network` | `"mainnet" \| "testnet-10"` | `"mainnet"` | Kaspa network to connect to |
| `indexer.type` | `"public" \| "custom"` | `"public"` | Indexer source selection |
| `indexer.url` | `string` | `"https://mainnet.kaspatalk.net"` | Base URL of the public indexer |
| `indexer.customUrl` | `string` | `""` | Custom indexer URL (used when type is `"custom"`) |
| `kaspaNode.connectionType` | `"resolver" \| "public-node" \| "custom-node"` | `"resolver"` | How to connect to the Kaspa network |
| `kaspaNode.url` | `string` | `""` | Optional override for the public node URL (defaults to `wss://node.k-social.network` when `connectionType` is `"public-node"`) |
| `kaspaNode.customUrl` | `string` | `""` | Custom node WebSocket URL |
| `wallet.privateKey` | `string` | `""` | Hex-encoded Secp256k1 private key |

### Derived Values

The server computes these values at startup from the configuration:

- **`apiBaseUrl`**: Resolved from `indexer.type` and `indexer.customUrl`
  - `"public"` → `indexer.url` (default: `"https://mainnet.kaspatalk.net"`)
  - `"custom"` → `indexer.customUrl`

- **`kaspaNodeUrl`**: Resolved from `kaspaNode.connectionType`
  - `"resolver"` → empty string (triggers automatic resolver-based connection)
  - `"public-node"` → `kaspaNode.url` (default: `"wss://node.k-social.network"`)
  - `"custom-node"` → `kaspaNode.customUrl`

- **`userPublicKey`**: Derived from `wallet.privateKey` using Secp256k1 (66-character hex, compressed format with `02`/`03` prefix)

- **`networkId`**: The network identifier string used for RPC connections (e.g., `"mainnet"`, `"testnet-10"`)

### Environment Variable Overrides

The following environment variables override config file values:

| Variable | Overrides | Description |
|----------|-----------|-------------|
| `K_MCP_CONFIG` | — | Path to config file |
| `K_MCP_PRIVATE_KEY` | `wallet.privateKey` | Private key (higher priority than config file) |
| `K_MCP_NETWORK` | `network` | Network selection |
| `K_MCP_INDEXER_URL` | `indexer.customUrl` | Indexer URL (sets type to `"custom"`) |
| `K_MCP_NODE_URL` | `kaspaNode.customUrl` | Node URL (sets connectionType to `"custom-node"`) |

### Security Notes

- The private key grants full control over the associated K identity and wallet funds
- The config file should have restricted permissions (`chmod 600`)
- Environment variables are preferred for CI/automated environments
- The server must NEVER log or expose the private key through MCP responses

---

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/server": "latest",
    "@modelcontextprotocol/core": "latest",
    "js-base64": "^3.7.8"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

### Kaspa WASM SDK

The server must include the Kaspa WASM SDK for blockchain operations. The SDK provides:
- `RpcClient` — WebSocket RPC connection to Kaspa nodes
- `Resolver` — Automatic node discovery and connection
- `PrivateKey` / `PublicKey` — Key pair operations
- `createTransactions` — Transaction construction with automatic UTXO selection
- `signMessage` / `verifyMessage` — Schnorr signature operations for K protocol
- `sompiToKaspaString` — Unit conversion (1 KAS = 100,000,000 sompi)

The WASM SDK files should be bundled with the server (from the K webapp's `src/kaspa-wasm32-sdk/` or the kaspa-mcp-server's `packages/kaspa-wasm-sdk/wasm/` directory).

---

## Server Initialization

### Startup Sequence

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

const server = new McpServer({
  name: "k-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false }
  }
});

// 1. Load configuration
const config = loadConfig();

// 2. Validate private key and derive public key
const publicKey = derivePublicKey(config.wallet.privateKey);

// 3. Resolve indexer base URL
const apiBaseUrl = resolveApiBaseUrl(config);

// 4. Register all tools
registerIndexerTools(server, apiBaseUrl, publicKey);
registerKaspaTools(server, config, publicKey);

// 5. Start transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Capability Declaration

The server declares support for:
- **Tools**: All K operations as callable tools
- **Resources**: K user profile and wallet balance as readable resources

---

## Tools — K-Indexer Read Operations

All indexer tools are **read-only** (`readOnlyHint: true`) and query the configured K-indexer REST API. They make HTTP GET requests and return the parsed JSON response.

### Common Patterns

- All tools that return user-facing content decode Base64 fields (`postContent`, `userNickname`) into readable text using `Base64.decode()` from the `js-base64` library
- Profile images (`userProfileImage`) are kept as Base64 strings (not decoded)
- Pagination is cursor-based with `before`/`after` cursors and a `limit` parameter (1-100)
- The `requesterPubkey` parameter is auto-populated from the configured private key's derived public key

### Tool Definitions

#### 1. `k_get_health`

Check indexer health status.

```typescript
server.tool(
  "k_get_health",
  "Check the health and connectivity status of the K-indexer",
  {},  // No input parameters
  async () => {
    // GET {apiBaseUrl}/health
    // Returns: { status, service, version, network }
  }
);
```

**Input**: None
**Output**: `{ status: string, service: string, version: string, network: string }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 2. `k_get_stats`

Get network-wide statistics.

```typescript
server.tool(
  "k_get_stats",
  "Get overall K network statistics including total counts of posts, users, votes, etc.",
  {},
  async () => {
    // GET {apiBaseUrl}/stats
    // Returns: { broadcasts, posts, replies, quotes, votes, follows, blocks }
  }
);
```

**Input**: None
**Output**: `{ broadcasts: number, posts: number, replies: number, quotes: number, votes: number, follows: number, blocks: number }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 3. `k_get_users_count`

Get total number of registered users.

```typescript
server.tool(
  "k_get_users_count",
  "Get the total number of users registered on the K network",
  {},
  async () => {
    // GET {apiBaseUrl}/get-users-count
    // Returns: { count: number }
  }
);
```

**Input**: None
**Output**: `{ count: number }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 4. `k_get_posts_watching`

Get posts from users who are being watched (followed and the user themselves).

```typescript
server.tool(
  "k_get_posts_watching",
  "Get the latest posts from users you follow and your own posts (main feed). Use pagination cursors to load older or newer content.",
  {
    limit: { type: "number", description: "Number of posts to return (1-100)", default: 20 },
    before: { type: "string", description: "Unix timestamp cursor — return posts older than this", optional: true },
    after: { type: "string", description: "Unix timestamp cursor — return posts newer than this", optional: true }
  },
  async ({ limit, before, after }) => {
    // GET {apiBaseUrl}/get-posts-watching?requesterPubkey={pubkey}&limit={limit}[&before={before}][&after={after}]
  }
);
```

**Input**: `{ limit?: number, before?: string, after?: string }`
**Output**: `{ posts: Post[], pagination: { hasMore: boolean, nextCursor: string | null, prevCursor: string | null } }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 5. `k_get_contents_following`

Get all content (posts, replies, quotes) from followed users.

```typescript
server.tool(
  "k_get_contents_following",
  "Get all content types (posts, replies, quotes) from users you follow. Returns a mixed feed sorted by timestamp.",
  {
    limit: { type: "number", description: "Number of items to return (1-100)", default: 20 },
    before: { type: "string", description: "Compound cursor (timestamp_id) for older content", optional: true },
    after: { type: "string", description: "Compound cursor (timestamp_id) for newer content", optional: true }
  },
  async ({ limit, before, after }) => {
    // GET {apiBaseUrl}/get-contents-following?requesterPubkey={pubkey}&limit={limit}[&before={before}][&after={after}]
  }
);
```

**Input**: `{ limit?: number, before?: string, after?: string }`
**Output**: `{ posts: Post[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 6. `k_get_mentions`

Get posts and replies where the user is mentioned.

```typescript
server.tool(
  "k_get_mentions",
  "Get posts and replies where a specific user is mentioned. Defaults to your own mentions if no user specified.",
  {
    user: { type: "string", description: "Public key of the user whose mentions to retrieve (defaults to own pubkey)", optional: true },
    limit: { type: "number", description: "Number of items to return (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for older content", optional: true },
    after: { type: "string", description: "Cursor for newer content", optional: true }
  },
  async ({ user, limit, before, after }) => {
    // GET {apiBaseUrl}/get-mentions?user={user||pubkey}&requesterPubkey={pubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ user?: string, limit?: number, before?: string, after?: string }`
**Output**: `{ posts: Post[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 7. `k_get_posts`

Get all posts from a specific user.

```typescript
server.tool(
  "k_get_posts",
  "Get all posts from a specific user. If no user is specified, returns your own posts.",
  {
    user: { type: "string", description: "Public key of the user whose posts to retrieve", optional: true },
    limit: { type: "number", description: "Number of posts to return (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for older posts", optional: true },
    after: { type: "string", description: "Cursor for newer posts", optional: true }
  },
  async ({ user, limit, before, after }) => {
    // GET {apiBaseUrl}/get-posts?user={user||pubkey}&requesterPubkey={pubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ user?: string, limit?: number, before?: string, after?: string }`
**Output**: `{ posts: Post[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 8. `k_get_replies`

Get replies to a specific post, or all replies by a specific user.

```typescript
server.tool(
  "k_get_replies",
  "Get replies to a specific post (by post ID) or all replies by a specific user (by pubkey). Exactly one of 'post' or 'user' must be provided.",
  {
    post: { type: "string", description: "Post ID (64-char hex) to get replies for", optional: true },
    user: { type: "string", description: "Public key of the user whose replies to retrieve", optional: true },
    limit: { type: "number", description: "Number of replies to return (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for older replies", optional: true },
    after: { type: "string", description: "Cursor for newer replies", optional: true }
  },
  async ({ post, user, limit, before, after }) => {
    // GET {apiBaseUrl}/get-replies?[post={post}|user={user}]&requesterPubkey={pubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ post?: string, user?: string, limit?: number, before?: string, after?: string }`
**Output**: `{ posts: Post[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 9. `k_get_post_details`

Get full details for a single post or reply.

```typescript
server.tool(
  "k_get_post_details",
  "Get complete details for a single post or reply, including vote counts, reply counts, and your voting status.",
  {
    id: { type: "string", description: "Post/reply ID (64-character hex hash)" }
  },
  async ({ id }) => {
    // GET {apiBaseUrl}/get-post-details?id={id}&requesterPubkey={pubkey}
    // Returns: { post: Post }
  }
);
```

**Input**: `{ id: string }`
**Output**: `{ post: Post }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 10. `k_get_hashtag_content`

Get all content containing a specific hashtag.

```typescript
server.tool(
  "k_get_hashtag_content",
  "Get all posts, replies, and quotes containing a specific hashtag. Hashtag should be provided without the # symbol.",
  {
    hashtag: { type: "string", description: "Hashtag to search for (without # symbol, max 30 chars, case-insensitive)" },
    limit: { type: "number", description: "Number of items to return (1-100)", default: 20 },
    before: { type: "string", description: "Compound cursor for older content", optional: true },
    after: { type: "string", description: "Compound cursor for newer content", optional: true }
  },
  async ({ hashtag, limit, before, after }) => {
    // GET {apiBaseUrl}/get-hashtag-content?hashtag={hashtag}&requesterPubkey={pubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ hashtag: string, limit?: number, before?: string, after?: string }`
**Output**: `{ posts: Post[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 11. `k_get_trending_hashtags`

Get the most-used hashtags within a time window.

```typescript
server.tool(
  "k_get_trending_hashtags",
  "Get trending hashtags on the K network within a time window.",
  {
    timeWindow: { type: "string", description: "Time window: '1h', '6h', '24h', '7d', or '30d'", default: "24h" },
    limit: { type: "number", description: "Number of hashtags to return (1-100)", default: 10 }
  },
  async ({ timeWindow, limit }) => {
    // GET {apiBaseUrl}/get-trending-hashtags?timeWindow={timeWindow}&limit={limit}
    // Note: No requesterPubkey needed for this endpoint
  }
);
```

**Input**: `{ timeWindow?: string, limit?: number }`
**Output**: `{ hashtags: { hashtag: string, usageCount: number, rank: number }[] }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 12. `k_get_most_active_users`

Get users ranked by content activity in a time window.

```typescript
server.tool(
  "k_get_most_active_users",
  "Get the most active users on the K network within a time window, ranked by total content count.",
  {
    timeWindow: { type: "string", description: "Time window: '1h', '6h', '24h', '7d', or '30d'", default: "24h" },
    limit: { type: "number", description: "Number of users to return (1-100)", default: 10 },
    before: { type: "string", description: "Compound cursor for pagination", optional: true },
    after: { type: "string", description: "Compound cursor for pagination", optional: true }
  },
  async ({ timeWindow, limit, before, after }) => {
    // GET {apiBaseUrl}/get-most-active-users?requesterPubkey={pubkey}&timeWindow={timeWindow}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ timeWindow?: string, limit?: number, before?: string, after?: string }`
**Output**: `{ posts: ActiveUser[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 13. `k_get_users`

Get user introduction posts (the "Users" directory).

```typescript
server.tool(
  "k_get_users",
  "Browse the K user directory. Returns user profiles (introduction posts) with pagination.",
  {
    limit: { type: "number", description: "Number of users to return (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for older entries", optional: true },
    after: { type: "string", description: "Cursor for newer entries", optional: true }
  },
  async ({ limit, before, after }) => {
    // GET {apiBaseUrl}/get-users?requesterPubkey={pubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ limit?: number, before?: string, after?: string }`
**Output**: `{ posts: UserPost[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 14. `k_search_users`

Search users by public key or nickname.

```typescript
server.tool(
  "k_search_users",
  "Search for K users by their public key (exact match) or nickname (partial, case-insensitive match).",
  {
    pubkey: { type: "string", description: "Exact public key to search for (66-char hex)", optional: true },
    nickname: { type: "string", description: "Partial nickname to search for (case-insensitive)", optional: true },
    limit: { type: "number", description: "Number of results (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for pagination", optional: true },
    after: { type: "string", description: "Cursor for pagination", optional: true }
  },
  async ({ pubkey, nickname, limit, before, after }) => {
    // GET {apiBaseUrl}/search-users?requesterPubkey={pubkey}&limit={limit}[&searchedUserPubkey={pubkey}][&searchedUserNickname={nickname}][&before][&after]
  }
);
```

**Input**: `{ pubkey?: string, nickname?: string, limit?: number, before?: string, after?: string }`
**Output**: `{ posts: UserPost[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 15. `k_get_user_details`

Get detailed information for a specific user.

```typescript
server.tool(
  "k_get_user_details",
  "Get detailed profile information for a specific user, including follower/following counts and relationship status.",
  {
    user: { type: "string", description: "Public key of the user (66-char hex)" }
  },
  async ({ user }) => {
    // GET {apiBaseUrl}/get-user-details?user={user}&requesterPubkey={pubkey}
    // Returns: { post: UserDetails }
  }
);
```

**Input**: `{ user: string }`
**Output**: `{ post: UserDetails }` (includes `followersCount`, `followingCount`, `blockedCount`, `followedUser`, `blockedUser`)
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 16. `k_get_followed_users`

Get the list of users you follow.

```typescript
server.tool(
  "k_get_followed_users",
  "Get the list of users you are currently following.",
  {
    limit: { type: "number", description: "Number of users to return (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for older entries", optional: true },
    after: { type: "string", description: "Cursor for newer entries", optional: true }
  },
  async ({ limit, before, after }) => {
    // GET {apiBaseUrl}/get-followed-users?requesterPubkey={pubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ limit?: number, before?: string, after?: string }`
**Output**: `{ posts: UserPost[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 17. `k_get_users_following`

Get the list of users that a specific user follows.

```typescript
server.tool(
  "k_get_users_following",
  "Get the list of users that a specific user follows.",
  {
    userPubkey: { type: "string", description: "Public key of the user to query" },
    limit: { type: "number", description: "Number of users to return (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for pagination", optional: true },
    after: { type: "string", description: "Cursor for pagination", optional: true }
  },
  async ({ userPubkey, limit, before, after }) => {
    // GET {apiBaseUrl}/get-users-following?requesterPubkey={pubkey}&userPubkey={userPubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ userPubkey: string, limit?: number, before?: string, after?: string }`
**Output**: `{ posts: UserPost[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 18. `k_get_users_followers`

Get the list of followers for a specific user.

```typescript
server.tool(
  "k_get_users_followers",
  "Get the list of users that follow a specific user.",
  {
    userPubkey: { type: "string", description: "Public key of the user to query" },
    limit: { type: "number", description: "Number of users to return (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for pagination", optional: true },
    after: { type: "string", description: "Cursor for pagination", optional: true }
  },
  async ({ userPubkey, limit, before, after }) => {
    // GET {apiBaseUrl}/get-users-followers?requesterPubkey={pubkey}&userPubkey={userPubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ userPubkey: string, limit?: number, before?: string, after?: string }`
**Output**: `{ posts: UserPost[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 19. `k_get_blocked_users`

Get the list of users you have blocked.

```typescript
server.tool(
  "k_get_blocked_users",
  "Get the list of users you have blocked.",
  {
    limit: { type: "number", description: "Number of users to return (1-100)", default: 20 },
    before: { type: "string", description: "Cursor for pagination", optional: true },
    after: { type: "string", description: "Cursor for pagination", optional: true }
  },
  async ({ limit, before, after }) => {
    // GET {apiBaseUrl}/get-blocked-users?requesterPubkey={pubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ limit?: number, before?: string, after?: string }`
**Output**: `{ posts: UserPost[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 20. `k_get_notifications_count`

Get the count of unread notifications.

```typescript
server.tool(
  "k_get_notifications_count",
  "Get the number of unread notifications for the current user.",
  {},
  async () => {
    // GET {apiBaseUrl}/get-notifications-count?requesterPubkey={pubkey}
    // Returns: { count: number }
  }
);
```

**Input**: None
**Output**: `{ count: number }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 21. `k_get_notifications`

Get the notifications feed.

```typescript
server.tool(
  "k_get_notifications",
  "Get your notifications feed including mentions, replies, quotes, and votes on your content.",
  {
    limit: { type: "number", description: "Number of notifications to return (1-100)", default: 20 },
    before: { type: "string", description: "Compound cursor for older notifications", optional: true },
    after: { type: "string", description: "Compound cursor for newer notifications", optional: true }
  },
  async ({ limit, before, after }) => {
    // GET {apiBaseUrl}/get-notifications?requesterPubkey={pubkey}&limit={limit}[&before][&after]
  }
);
```

**Input**: `{ limit?: number, before?: string, after?: string }`
**Output**: `{ notifications: Notification[], pagination: PaginationInfo }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

## Tools — Kaspa Network Write Operations

Write tools connect to the Kaspa network to submit transactions. They follow the K protocol format as defined in `PROTOCOL_SPECIFICATIONS.md`.

### Transaction Flow (Common to All Write Tools)

Each write operation follows this flow:

1. **Load Kaspa WASM SDK** — `await kaspaService.ensureLoaded()`
2. **Establish RPC connection** — Connect to configured Kaspa node (resolver / public / custom)
3. **Derive keys** — Create `PrivateKey` object, derive public key and address
4. **Get UTXOs** — Fetch available UTXOs for the user's address
5. **Build payload** — Construct the K protocol payload string
6. **Sign payload** — Generate Schnorr signature of the relevant data fields
7. **Create transaction** — Use `createTransactions()` with the payload as transaction data
8. **Sign & submit** — Sign the transaction with private key and submit to the network
9. **Disconnect** — Close the RPC connection
10. **Return result** — Return transaction ID and fee information

### K Protocol Payload Format

All K protocol messages follow this structure:
```
k:1:<action>:<sender_pubkey>:<sender_signature>:<action_specific_fields>
```

- `k` — Protocol identifier
- `1` — Protocol version
- `<action>` — Operation type (post, reply, vote, etc.)
- `<sender_pubkey>` — 66-character hex compressed public key
- `<sender_signature>` — Schnorr signature of the action-specific fields
- Text content is Base64-encoded using the `js-base64` library (Unicode-compatible)

### Signature Generation

Each action type signs a specific subset of fields:

| Action | Signed Data |
|--------|-------------|
| `post` | `{base64_message}:{mentioned_pubkeys_json}` |
| `reply` | `{post_id}:{base64_message}:{mentioned_pubkeys_json}` |
| `vote` | `{post_id}:{vote_type}:{author_pubkey}` |
| `quote` | `{content_id}:{base64_message}:{author_pubkey}` |
| `block` | `{blocking_action}:{blocked_pubkey}` |
| `follow` | `{following_action}:{followed_pubkey}` |
| `broadcast` | `{base64_nickname}:{base64_profile_image}:{base64_message}` |

Signatures use the Kaspa WASM SDK's `signMessage()` function with `noAuxRand: false`.

### Tool Definitions

#### 22. `k_create_post`

Create a new post on the K network.

```typescript
server.tool(
  "k_create_post",
  "Create a new post on the K social network. The post content will be broadcast as a Kaspa transaction. Mention other users by including their public key prefixed with @.",
  {
    content: { type: "string", description: "Post content text (will be Base64-encoded)" },
    mentionedPubkeys: {
      type: "array",
      items: { type: "string" },
      description: "Array of public keys to mention in the post",
      optional: true
    }
  },
  async ({ content, mentionedPubkeys = [] }) => {
    // Payload format: k:1:post:{pubkey}:{signature}:{base64_content}:{mentioned_pubkeys_json}
    // Sign: "{base64_content}:{mentioned_pubkeys_json}"
  }
);
```

**Input**: `{ content: string, mentionedPubkeys?: string[] }`
**Output**: `{ transactionId: string, feeKAS: string }`
**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`

---

#### 23. `k_create_reply`

Reply to an existing post.

```typescript
server.tool(
  "k_create_reply",
  "Reply to an existing post or reply on K. The reply will appear as a nested response to the target content.",
  {
    postId: { type: "string", description: "ID of the post/reply to respond to (64-char hex)" },
    content: { type: "string", description: "Reply content text" },
    mentionedPubkeys: {
      type: "array",
      items: { type: "string" },
      description: "Array of public keys to mention. Should include the author of the post being replied to.",
      optional: true
    }
  },
  async ({ postId, content, mentionedPubkeys = [] }) => {
    // Payload format: k:1:reply:{pubkey}:{signature}:{post_id}:{base64_content}:{mentioned_pubkeys_json}
    // Sign: "{post_id}:{base64_content}:{mentioned_pubkeys_json}"
  }
);
```

**Input**: `{ postId: string, content: string, mentionedPubkeys?: string[] }`
**Output**: `{ transactionId: string, feeKAS: string }`
**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`

---

#### 24. `k_vote`

Upvote or downvote a post or reply.

```typescript
server.tool(
  "k_vote",
  "Upvote or downvote a post or reply on K.",
  {
    postId: { type: "string", description: "ID of the post/reply to vote on (64-char hex)" },
    vote: { type: "string", description: "Vote type: 'upvote' or 'downvote'" },
    authorPubkey: { type: "string", description: "Public key of the content author (for notification)" }
  },
  async ({ postId, vote, authorPubkey }) => {
    // Payload format: k:1:vote:{pubkey}:{signature}:{post_id}:{vote}:{author_pubkey}
    // Sign: "{post_id}:{vote}:{author_pubkey}"
  }
);
```

**Input**: `{ postId: string, vote: "upvote" | "downvote", authorPubkey: string }`
**Output**: `{ transactionId: string, feeKAS: string }`
**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`

---

#### 25. `k_quote`

Quote/repost content with commentary.

```typescript
server.tool(
  "k_quote",
  "Quote (repost with comment) an existing post or reply on K.",
  {
    contentId: { type: "string", description: "ID of the content to quote (64-char hex)" },
    content: { type: "string", description: "Your commentary on the quoted content" },
    authorPubkey: { type: "string", description: "Public key of the original content author" }
  },
  async ({ contentId, content, authorPubkey }) => {
    // Payload format: k:1:quote:{pubkey}:{signature}:{content_id}:{base64_content}:{author_pubkey}
    // Sign: "{content_id}:{base64_content}:{author_pubkey}"
  }
);
```

**Input**: `{ contentId: string, content: string, authorPubkey: string }`
**Output**: `{ transactionId: string, feeKAS: string }`
**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`

---

#### 26. `k_follow`

Follow or unfollow a user.

```typescript
server.tool(
  "k_follow",
  "Follow or unfollow a user on the K network.",
  {
    action: { type: "string", description: "Action: 'follow' or 'unfollow'" },
    userPubkey: { type: "string", description: "Public key of the user to follow/unfollow" }
  },
  async ({ action, userPubkey }) => {
    // Payload format: k:1:follow:{pubkey}:{signature}:{action}:{user_pubkey}
    // Sign: "{action}:{user_pubkey}"
  }
);
```

**Input**: `{ action: "follow" | "unfollow", userPubkey: string }`
**Output**: `{ transactionId: string, feeKAS: string }`
**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`

---

#### 27. `k_block`

Block or unblock a user.

```typescript
server.tool(
  "k_block",
  "Block or unblock a user on the K network. Blocked users' content will be hidden from your feeds.",
  {
    action: { type: "string", description: "Action: 'block' or 'unblock'" },
    userPubkey: { type: "string", description: "Public key of the user to block/unblock" }
  },
  async ({ action, userPubkey }) => {
    // Payload format: k:1:block:{pubkey}:{signature}:{action}:{user_pubkey}
    // Sign: "{action}:{user_pubkey}"
  }
);
```

**Input**: `{ action: "block" | "unblock", userPubkey: string }`
**Output**: `{ transactionId: string, feeKAS: string }`
**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`

---

#### 28. `k_broadcast_profile`

Announce or update user profile (nickname, profile image, intro message).

```typescript
server.tool(
  "k_broadcast_profile",
  "Create or update your K profile by broadcasting your nickname, profile image, and introduction message to the network.",
  {
    nickname: { type: "string", description: "Your display name" },
    profileImage: { type: "string", description: "Base64-encoded profile image (should be a small image, e.g. 48x48 PNG/WebP)" },
    introMessage: { type: "string", description: "Short introduction message (under 100 characters recommended)" }
  },
  async ({ nickname, profileImage, introMessage }) => {
    // The userMessage for broadcast is pre-formatted as: "base64_nickname:base64_profile_image:base64_intro"
    // Payload format: k:1:broadcast:{pubkey}:{signature}:{base64_nickname}:{base64_profile_image}:{base64_intro}
    // Sign: "{base64_nickname}:{base64_profile_image}:{base64_intro}"
  }
);
```

**Input**: `{ nickname: string, profileImage: string, introMessage: string }`
**Output**: `{ transactionId: string, feeKAS: string }`
**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`

---

#### 29. `k_send_kas`

Send KAS to another address (tip/transfer).

```typescript
server.tool(
  "k_send_kas",
  "Send KAS cryptocurrency to another Kaspa address. Used for tipping other users or transferring funds.",
  {
    destinationAddress: { type: "string", description: "Kaspa address to send to (e.g., kaspa:qq...)" },
    amountKAS: { type: "number", description: "Amount of KAS to send (e.g., 1.5 for 1.5 KAS)" }
  },
  async ({ destinationAddress, amountKAS }) => {
    // Uses createTransactions with explicit output amount
    // Change goes back to sender's address
  }
);
```

**Input**: `{ destinationAddress: string, amountKAS: number }`
**Output**: `{ transactionId: string, feeKAS: string }`
**Annotations**: `{ readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }`

---

#### 30. `k_get_balance`

Get the KAS balance for the configured wallet.

```typescript
server.tool(
  "k_get_balance",
  "Get the KAS balance and UTXO count for the configured wallet address.",
  {},
  async () => {
    // Connect to Kaspa node, get UTXOs for derived address
    // Sum all UTXO amounts, convert to KAS
  }
);
```

**Input**: None
**Output**: `{ address: string, balanceKAS: string, balanceSompi: string, utxoCount: number }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: true }`

---

#### 31. `k_get_wallet_info`

Get wallet information (public key, address, network).

```typescript
server.tool(
  "k_get_wallet_info",
  "Get the current wallet's public key, address, and network information. Does NOT expose the private key.",
  {},
  async () => {
    // Derive public key and address from configured private key
    // Return public info only
  }
);
```

**Input**: None
**Output**: `{ publicKey: string, address: string, network: string }`
**Annotations**: `{ readOnlyHint: true, openWorldHint: false }`

---

## Resources

The server exposes the following MCP resources:

### `k://profile`

The user's own K profile information.

```typescript
server.resource(
  "k://profile",
  "Your K profile information",
  async () => ({
    contents: [{
      uri: "k://profile",
      mimeType: "application/json",
      text: JSON.stringify({
        publicKey: userPublicKey,
        network: config.network,
        indexerUrl: apiBaseUrl
      })
    }]
  })
);
```

### `k://config`

The current server configuration (without sensitive data).

```typescript
server.resource(
  "k://config",
  "Current K-MCP server configuration (non-sensitive)",
  async () => ({
    contents: [{
      uri: "k://config",
      mimeType: "application/json",
      text: JSON.stringify({
        network: config.network,
        indexerType: config.indexer.type,
        indexerUrl: apiBaseUrl,
        kaspaConnectionType: config.kaspaNode.connectionType,
        walletConfigured: !!config.wallet.privateKey
      })
    }]
  })
);
```

---

## Data Types

### Post Object (from indexer)

```typescript
interface Post {
  id: string;                    // 64-char hex transaction hash
  userPublicKey: string;         // 66-char hex compressed public key
  postContent: string;           // Base64-encoded text content
  signature: string;             // 130-char Schnorr signature
  timestamp: number;             // Unix timestamp (seconds)
  repliesCount: number;
  upVotesCount: number;
  downVotesCount: number;
  quotesCount: number;
  repostsCount: number;
  parentPostId: string | null;   // null for top-level posts, post-id for replies
  mentionedPubkeys: string[];    // Array of mentioned public keys
  isUpvoted: boolean;            // Has requester upvoted this?
  isDownvoted: boolean;          // Has requester downvoted this?
  userNickname: string | null;   // Base64-encoded display name (optional)
  userProfileImage: string | null; // Base64-encoded profile image (optional)
  blockedUser: boolean;          // Is author blocked by requester?
  isQuote: boolean;              // Is this a quote post?
  quote?: QuoteInfo;             // Quote details (when isQuote is true)
}
```

### QuoteInfo Object

```typescript
interface QuoteInfo {
  referencedContentId: string;        // 64-char hex ID of quoted content
  referencedMessage: string;          // Base64-encoded message of quoted content
  referencedSenderPubkey: string;     // Public key of quoted content author
  referencedNickname: string | null;  // Base64-encoded nickname (optional)
  referencedProfileImage: string | null; // Base64-encoded profile image (optional)
}
```

### UserDetails Object

```typescript
interface UserDetails extends Post {
  followersCount: number;
  followingCount: number;
  blockedCount: number;
  followedUser: boolean;   // Does requester follow this user?
}
```

### Notification Object

```typescript
interface Notification {
  id: string;
  userPublicKey: string;
  postContent: string;           // Base64-encoded
  timestamp: number;
  userNickname: string | null;   // Base64-encoded
  userProfileImage: string | null;
  contentType: "post" | "reply" | "quote" | "vote";
  cursor: string;               // Compound cursor (timestamp_id)
  voteType: "upvote" | "downvote" | null;
  contentId: string | null;
  votedContent: string | null;   // Base64-encoded content that was voted on
}
```

### PaginationInfo Object

```typescript
interface PaginationInfo {
  hasMore: boolean;
  nextCursor: string | null;    // Use with 'before' param for older content
  prevCursor: string | null;    // Use with 'after' param for newer content
}
```

### TransactionResult Object

```typescript
interface TransactionResult {
  transactionId: string;   // 64-char hex transaction hash
  feeKAS: string;          // Fee amount in KAS (human-readable)
}
```

---

## Error Handling

### Indexer Errors

Tool errors from indexer HTTP calls should be returned as `isError: true` results with descriptive messages:

```typescript
{
  content: [{ type: "text", text: "Failed to fetch posts: HTTP 429 Too Many Requests" }],
  isError: true
}
```

Common indexer errors:
- `400 Bad Request` — Invalid or missing parameters
- `404 Not Found` — Endpoint not found
- `429 Too Many Requests` — Rate limited
- `500 Internal Server Error` — Indexer server error

### Kaspa Network Errors

Transaction errors should be returned as `isError: true` with context:

```typescript
{
  content: [{ type: "text", text: "Transaction failed: No UTXO entries found. Please ensure the wallet has funds." }],
  isError: true
}
```

Common Kaspa errors:
- No UTXOs available (wallet empty)
- Insufficient funds for amount + fees
- RPC connection failure
- Invalid destination address
- Transaction submission rejected

### Configuration Errors

At startup, the server should validate the configuration and fail with a clear error if:
- Private key is missing or invalid
- Private key cannot derive a valid public key
- Indexer URL is unreachable (optional: warn but continue)

---

## Content Decoding

All tools that return content from the indexer must decode Base64 fields for readability:

```typescript
import { Base64 } from 'js-base64';

function decodePost(post: Post): DecodedPost {
  return {
    ...post,
    postContent: Base64.decode(post.postContent),
    userNickname: post.userNickname ? Base64.decode(post.userNickname) : null,
    // Keep userProfileImage as Base64 (it's binary image data)
  };
}
```

The following fields should be decoded:
- `postContent` — Post/reply/quote text content
- `userNickname` — User display name
- `votedContent` — Content that was voted on (in notifications)
- `referencedMessage` — Quoted content text (in quotes)
- `referencedNickname` — Quoted author nickname (in quotes)

The following fields should NOT be decoded (binary data):
- `userProfileImage`
- `referencedProfileImage`

---

## Project Structure

```
k-mcp-server/
├── src/
│   ├── index.ts                  # Entry point, server setup, transport
│   ├── config.ts                 # Configuration loading and validation
│   ├── tools/
│   │   ├── indexer/              # Read tools (one file per tool or grouped)
│   │   │   ├── posts.ts          # Post-related tools
│   │   │   ├── users.ts          # User-related tools
│   │   │   ├── notifications.ts  # Notification tools
│   │   │   ├── hashtags.ts       # Hashtag tools
│   │   │   └── system.ts         # Health, stats tools
│   │   └── kaspa/                # Write tools
│   │       ├── social.ts         # Post, reply, vote, quote, follow, block, broadcast
│   │       ├── wallet.ts         # Balance, wallet info, send KAS
│   │       └── connection.ts     # Kaspa RPC connection management
│   ├── services/
│   │   ├── indexerClient.ts      # HTTP client for K-indexer API
│   │   ├── kaspaService.ts       # Kaspa WASM SDK loader and manager
│   │   └── transactionBuilder.ts # K protocol payload construction & signing
│   ├── types/
│   │   ├── indexer.ts            # Indexer API response types
│   │   ├── kaspa.ts              # Kaspa-specific types
│   │   └── config.ts             # Configuration types
│   └── utils/
│       ├── base64.ts             # Base64 encoding/decoding helpers
│       └── validation.ts         # Input validation helpers
├── kaspa-wasm/                   # Kaspa WASM SDK binaries
│   ├── kaspa.js
│   └── kaspa_bg.wasm
├── package.json
├── tsconfig.json
└── README.md
```

---

## Build and Run

### Package.json Scripts

```json
{
  "name": "k-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  }
}
```

### MCP Client Configuration

To use with Claude Code or Claude Desktop, add to the MCP server configuration. There are two modes:

#### PROD — Pre-compiled (requires `npm run build` first)

The TypeScript source is compiled to JavaScript ahead of time. The MCP client runs the compiled output directly via `node`. This is the recommended approach for production use — faster startup, no runtime compilation overhead.

```json
{
  "mcpServers": {
    "k-social": {
      "command": "node",
      "args": ["/path/to/k-mcp-server/dist/index.js"],
      "env": {
        "K_MCP_PRIVATE_KEY": "your_private_key_hex",
        "K_MCP_NETWORK": "mainnet"
      }
    }
  }
}
```

Requires a build step before first use (and after any code changes):
```bash
cd /path/to/k-mcp-server
npm run build
```

#### DEV — On-the-fly compilation (no build step)

Uses `tsx` to run TypeScript directly without a pre-compilation step. Useful during development — no need to rebuild after every code change. Slightly slower startup due to on-the-fly TypeScript compilation.

```json
{
  "mcpServers": {
    "k-social": {
      "command": "npx",
      "args": ["tsx", "/path/to/k-mcp-server/src/index.ts"],
      "env": {
        "K_MCP_PRIVATE_KEY": "your_private_key_hex",
        "K_MCP_NETWORK": "mainnet"
      }
    }
  }
}
```

No build step required — changes to the TypeScript source are picked up on next server restart.

#### Using a config file (works with both PROD and DEV)

Instead of passing all settings via environment variables, point to a config file:

```json
{
  "mcpServers": {
    "k-social": {
      "command": "node",
      "args": ["/path/to/k-mcp-server/dist/index.js"],
      "env": {
        "K_MCP_CONFIG": "/path/to/k-mcp-config.json"
      }
    }
  }
}
```

### Multi-Agent Setup (Multiple User Identities)

Each K-MCP server process runs with a single private key, which means a single identity. To have multiple AI agents each impersonating a different K user, you must run **separate server instances** — one per user identity. Each instance is an independent process with its own stdio pipe, private key, and derived public key.

The MCP client connects to all of them simultaneously. The AI agent sees each server's tools namespaced by server name (e.g. `k-alice > k_create_post` vs `k-bob > k_create_post`) and chooses which identity to act as for each action.

Example — 3 agents impersonating 3 different users:

```json
{
  "mcpServers": {
    "k-alice": {
      "command": "node",
      "args": ["/path/to/k-mcp-server/dist/index.js"],
      "env": {
        "K_MCP_PRIVATE_KEY": "alice_private_key_hex",
        "K_MCP_NETWORK": "mainnet"
      }
    },
    "k-bob": {
      "command": "node",
      "args": ["/path/to/k-mcp-server/dist/index.js"],
      "env": {
        "K_MCP_PRIVATE_KEY": "bob_private_key_hex",
        "K_MCP_NETWORK": "mainnet"
      }
    },
    "k-charlie": {
      "command": "node",
      "args": ["/path/to/k-mcp-server/dist/index.js"],
      "env": {
        "K_MCP_PRIVATE_KEY": "charlie_private_key_hex",
        "K_MCP_NETWORK": "mainnet"
      }
    }
  }
}
```

All three instances share the same server code and the same network/indexer settings. Only the private key differs, giving each agent a distinct on-chain identity. Shared defaults (indexer URL, node connection, network) can be set in a common config file via `K_MCP_CONFIG`, with only `K_MCP_PRIVATE_KEY` varying per instance.

---

## Implementation Notes

### Kaspa WASM SDK Loading

The Kaspa WASM SDK must be loaded asynchronously before any blockchain operations. Use a lazy-loading pattern:

```typescript
let kaspaModule: any = null;

async function ensureKaspaLoaded(): Promise<any> {
  if (!kaspaModule) {
    kaspaModule = await import('./kaspa-wasm/kaspa.js');
    // WASM initialization may be required depending on the SDK version
  }
  return kaspaModule;
}
```

### RPC Connection Management

RPC connections to Kaspa nodes should be short-lived (connect → operation → disconnect) rather than long-lived, matching the K webapp's pattern. This avoids connection timeout issues and stale state.

```typescript
async function withRpcConnection<T>(config: Config, fn: (rpc: any) => Promise<T>): Promise<T> {
  const kaspa = await ensureKaspaLoaded();
  const rpc = createRpcClient(kaspa, config);
  try {
    await rpc.connect();
    return await fn(rpc);
  } finally {
    try { await rpc.disconnect(); } catch { /* ignore */ }
  }
}
```

### UTXO Selection

For K protocol transactions (posts, replies, etc.), the webapp uses a single UTXO with empty outputs and the entire amount going back as change (minus fees). The K protocol payload is attached to the transaction data field.

```typescript
const { transactions } = await createTransactions({
  networkId,
  entries: [selectedUtxo],    // Single UTXO
  outputs: [],                // No explicit outputs
  changeAddress: userAddress,  // All funds return to sender
  priorityFee: 0n,
  payload: new TextEncoder().encode(payloadString)
});
```

For KAS send transactions, explicit outputs specify the destination and amount, with change returning to the sender.

### Rate Limiting Awareness

The K-indexer enforces rate limiting. The server should:
- Not retry aggressively on 429 responses
- Return clear error messages indicating rate limiting
- Consider adding a brief delay between rapid successive calls if needed

### Logging

Since the server uses stdio transport, all log output must go to `stderr` (never `stdout`):

```typescript
console.error("[K-MCP] Server started");
// NOT: console.log() — this would corrupt the JSON-RPC stream
```

---

## Reference Documents

- `PROTOCOL_SPECIFICATIONS.md` — K protocol message formats and field specifications
- `API_TECHNICAL_SPECIFICATIONS.md` — K-indexer API endpoint documentation
- `experimenting/mcp/modelcontextprotocol/` — MCP protocol specification
- `experimenting/mcp/typescript-sdk/` — MCP TypeScript SDK source and examples
- `experimenting/mcp/kaspa-mcp-server/` — Reference Kaspa MCP server implementation
- `src/utils/sendTransaction.ts` — K webapp transaction building implementation
- `src/contexts/UserSettingsContext.tsx` — K webapp configuration patterns

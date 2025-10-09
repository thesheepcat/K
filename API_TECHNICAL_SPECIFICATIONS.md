# K Webapp API Technical Specifications

This document provides comprehensive technical specifications for the REST API endpoints used by K webapp to communicate with K-indexer.

## Introduction

The K webapp API provides the following endpoints for social media functionality:

### Available API Endpoints

1. **`get-posts`** - Retrieve posts from a specific user
   - Scope: Fetch all posts created by a particular user with pagination support

2. **`get-posts-following`** - Retrieve posts from followed users
   - Scope: Fetch posts from users that the requester is following

3. **`get-posts-watching`** - Retrieve posts from watched users
   - Scope: Fetch posts from users that the requester is watching

4. **`get-mentions`** - Retrieve posts where a user is mentioned
   - Scope: Fetch posts and replies that mention a specific user

5. **`get-users`** - Retrieve user introduction posts
   - Scope: Fetch user introduction posts (max 100 characters) for community discovery

6. **`get-replies`** - Retrieve replies to a specific post or by a specific user
   - Scope: Fetch all replies (including nested replies) for a given post, or fetch all replies made by a specific user

7. **`get-post-details`** - Retrieve details for a specific post
   - Scope: Fetch complete details for a single post or reply with voting status

8. **`get-notifications-count`** - Count notifications for a user
   - Scope: Get the total count of unread notifications (posts, replies, votes that mention the user, and quotes of user's content)

9. **`get-notifications`** - Retrieve notifications for a user
   - Scope: Fetch paginated notifications including posts, replies, votes mentioning the user, and quotes of user's content with full details

## General Pagination Rules

The API uses cursor-based pagination for efficient handling of large datasets. Pagination is implemented across all major endpoints.

### Pagination Parameters

- `limit` (required): Number of items to return
  - Maximum: 100
  - Minimum: 1

- `before` (optional): Unix timestamp cursor
  - Returns items created before this timestamp
  - Used for paginating to older content
  - Example: `before=1703185000`

- `after` (optional): Unix timestamp cursor
  - Returns items created after this timestamp
  - Used for fetching newer content
  - Example: `after=1703190000`

### Pagination Response Format

All paginated endpoints include a `pagination` object in the response:

```json
{
  "posts": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1703184000",
    "prevCursor": "1703186000"
  }
}
```

- `hasMore`: Boolean indicating if more older posts are available
- `nextCursor`: Timestamp for the next page of older posts (use with `before`)
- `prevCursor`: Timestamp for newer posts (use with `after`)
- Cursors are `null` when no more content is available in that direction

### Pagination Usage Examples

```bash
# Get first page (10 posts)
curl "http://localhost:3000/get-posts-watching?limit=10"

# Get next page (older posts) using nextCursor from previous response
curl "http://localhost:3000/get-posts-watching?limit=10&before=1703185000"

# Check for new posts since last fetch using prevCursor
curl "http://localhost:3000/get-posts-watching?after=1703190000&limit=10"

# Get smaller page size
curl "http://localhost:3000/get-posts-watching?limit=5"
```

## API Endpoint Details

### 1. Get Following Posts
Fetch posts from users you follow with pagination support and voting status:

```bash
curl "http://localhost:3000/get-posts-following?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

**Query Parameters:**
- `requesterPubkey` (required): Public key of the user requesting the posts (66-character hex string with 02/03 prefix)
- `limit` (required): Number of posts to return (max: 100, min: 1)
- `before` (optional): Return posts created before this timestamp (for pagination to older posts)
- `after` (optional): Return posts created after this timestamp (for fetching newer posts)

**User Profile Information:**
The `get-posts-following` API includes optional user profile fields for each post:
- `userNickname`: Base64 encoded nickname (optional) - When decoded, shows the user's display name
- `userProfileImage`: Base64 encoded profile image (optional) - 48x48px image in PNG format

These fields are populated when users have shared profile information through broadcast transactions. If not available, they will be omitted from the response.

**Response:**
```json
{
  "posts": [
    {
      "id": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
      "userPublicKey": "021234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      "postContent": "R3JlYXQgZGlzY3Vzc2lvbiBhYm91dCBjcnlwdG9jdXJyZW5jeSB0cmVuZHMh",
      "signature": "3045022100f1f2f3f4f5f6f7f8f9f0f1f2f3f4f5f6f7f8f9f0f1f2f3f4f5f6f7f8f9f0f1f2022071f2f3f4f5f6f7f8f9f0f1f2f3f4f5f6f7f8f9f0f1f2f3f4f5f6f7f8f9f0f1f2",
      "timestamp": 1703186000,
      "repliesCount": 2,
      "upVotesCount": 18,
      "downVotesCount": 3,
      "repostsCount": 5,
      "parentPostId": null,
      "mentionedPubkeys": [],
      "isUpvoted": true,
      "isDownvoted": false,
      "userNickname": "TWFyeQ==",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1703185000",
    "prevCursor": "1703187000"
  }
}
```

### 2. Get Watching Posts

Fetch posts from users you're watching with voting status. This endpoint requires pagination parameters:

```bash
# First page (latest 10 posts)
curl "http://localhost:3000/get-posts-watching?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"

# Next page (older posts)
curl "http://localhost:3000/get-posts-watching?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10&before=1703185000"

# Check for newer posts
curl "http://localhost:3000/get-posts-watching?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10&after=1703190000"
```

**Query Parameters:**
- `requesterPubkey` (required): Public key of the user requesting the posts (66-character hex string with 02/03 prefix)
- `limit` (required): Number of posts to return (max: 100, min: 1)
- `before` (optional): Return posts created before this timestamp (for pagination to older posts)
- `after` (optional): Return posts created after this timestamp (for fetching newer posts)

Fetch posts from users you're watching with voting status. This endpoint requires pagination parameters:

```bash
# First page (latest 10 posts)
curl "http://localhost:3000/get-posts-watching?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"

# Next page (older posts)
curl "http://localhost:3000/get-posts-watching?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10&before=1703185000"

# Check for newer posts
curl "http://localhost:3000/get-posts-watching?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10&after=1703190000"
```

**Query Parameters:**
- `requesterPubkey` (required): Public key of the user requesting the posts (66-character hex string with 02/03 prefix)
- `limit` (required): Number of posts to return (max: 100, min: 1)
- `before` (optional): Return posts created before this timestamp (for pagination to older posts)
- `after` (optional): Return posts created after this timestamp (for fetching newer posts)

**Note:** This endpoint requires the `limit` parameter and always returns paginated results with pagination metadata.

**User Profile Information:**
The `get-posts-watching` API now includes optional user profile fields for each post:
- `userNickname`: Base64 encoded nickname (optional) - When decoded, shows the user's display name
- `userProfileImage`: Base64 encoded profile image (optional) - 48x48px image in PNG format

These fields are populated when users have shared profile information through broadcast transactions. If not available, they will be omitted from the response.

**Quote Support:**
This endpoint returns both regular posts and quotes (posts that reference other content):
- `isQuote`: Boolean field indicating if this is a quote (true) or regular post (false)
- `quote`: Object containing referenced content data (only present when `isQuote` is true)
  - `referencedContentId`: Transaction ID of the referenced content (64-character hex string)
  - `referencedMessage`: Base64 encoded message of the referenced content
  - `referencedSenderPubkey`: Public key of the referenced content's author
  - `referencedNickname`: Base64 encoded nickname of referenced author (optional)
  - `referencedProfileImage`: Base64 encoded profile image of referenced author (optional)

Quotes are treated as posts with all standard interaction fields (upvotes, downvotes, replies, etc.) and include the data from the content being quoted.

**Response:**
```json
{
  "posts": [
    {
      "id": "w1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
      "userPublicKey": "029876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98",
      "postContent": "TWFya2V0IGFuYWx5c2lzIHNob3dzIGludGVyZXN0aW5nIHBhdHRlcm5zIGVtZXJnaW5n",
      "signature": "304502210011111111111111111111111111111111111111111111111111111111111111110220222222222222222222222222222222222222222222222222222222222222222222",
      "timestamp": 1703185000,
      "repliesCount": 1,
      "quotesCount": 1,
      "upVotesCount": 15,
      "downVotesCount": 1,
      "repostsCount": 2,
      "parentPostId": null,
      "mentionedPubkeys": [],
      "isUpvoted": false,
      "isDownvoted": false,
      "userNickname": "QWxpY2U=",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": false,
      "isQuote": false
    },
    {
      "id": "q1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
      "userPublicKey": "021234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      "postContent": "R3JlYXQgcG9pbnQhIEkgY29tcGxldGVseSBhZ3JlZSB3aXRoIHRoaXM=",
      "signature": "3045022100b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b20220444555666777888999000111222333444555666777888999000111222333444555",
      "timestamp": 1703184500,
      "repliesCount": 0,
      "quotesCount": 0,
      "upVotesCount": 8,
      "downVotesCount": 0,
      "repostsCount": 1,
      "parentPostId": null,
      "mentionedPubkeys": [],
      "isUpvoted": true,
      "isDownvoted": false,
      "userNickname": "Qm9i",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": false,
      "isQuote": true,
      "quote": {
        "referencedContentId": "w1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
        "referencedMessage": "TWFya2V0IGFuYWx5c2lzIHNob3dzIGludGVyZXN0aW5nIHBhdHRlcm5zIGVtZXJnaW5n",
        "referencedSenderPubkey": "029876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98",
        "referencedNickname": "QWxpY2U=",
        "referencedProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
      }
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1703184000",
    "prevCursor": "1703186000"
  }
}
```

**Pagination Metadata:**
- `hasMore`: Boolean indicating if more posts are available for pagination
- `nextCursor`: Timestamp cursor for fetching older posts (use with `before` parameter)
- `prevCursor`: Timestamp cursor for fetching newer posts (use with `after` parameter)
- Both cursors are `null` when no more posts are available in that direction

### 3. Get Mentions

Fetch posts where a specific user has been mentioned with voting status. This endpoint requires pagination parameters:

```bash
# First page (latest 10 mentions)
curl "http://localhost:3000/get-mentions?user=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"

# Next page (older mentions)
curl "http://localhost:3000/get-mentions?user=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10&before=1703185000"

# Check for newer mentions
curl "http://localhost:3000/get-mentions?user=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10&after=1703190000"
```

**Query Parameters:**
- `user` (required): User's public key (66-character hex string with 02/03 prefix)
- `requesterPubkey` (required): Public key of the user requesting the mentions (66-character hex string with 02/03 prefix)
- `limit` (required): Number of posts to return (max: 100, min: 1)
- `before` (optional): Return posts created before this timestamp (for pagination to older posts)
- `after` (optional): Return posts created after this timestamp (for fetching newer posts)

**User Profile Information:**
The `get-mentions` API includes optional user profile fields for each post:
- `userNickname`: Base64 encoded nickname (optional) - When decoded, shows the user's display name
- `userProfileImage`: Base64 encoded profile image (optional) - 48x48px image in PNG format

These fields are populated when users have shared profile information through broadcast transactions. If not available, they will be omitted from the response.

**Quote Support:**
This endpoint returns posts, quotes, and replies that mention the user:
- `isQuote`: Boolean field indicating if this is a quote (true) or regular post (false)
- `quote`: Object containing referenced content data (only present when `isQuote` is true)
  - `referencedContentId`: Transaction ID of the referenced content (64-character hex string)
  - `referencedMessage`: Base64 encoded message of the referenced content
  - `referencedSenderPubkey`: Public key of the referenced content's author
  - `referencedNickname`: Base64 encoded nickname of referenced author (optional)
  - `referencedProfileImage`: Base64 encoded profile image of referenced author (optional)

Quotes are treated as posts with all standard interaction fields (upvotes, downvotes, replies, etc.) and include the data from the content being quoted.

**Response:**
```json
{
  "posts": [
    {
      "id": "m1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
      "userPublicKey": "029876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98",
      "postContent": "SGV5IEAyMDIxOGIzNzMyZGYyMzUzOTc4MTU0ZWM1MzIzYjc0NWJjZTk1MjBhNWVkNTA2YTk2ZGU0ZjRlM2RhZDIwZGM0NGYsIHdoYXQgYXJlIHlvdXIgdGhvdWdodHM/",
      "signature": "304502210033333333333333333333333333333333333333333333333333333333333333330220444444444444444444444444444444444444444444444444444444444444444444",
      "timestamp": 1703185000,
      "repliesCount": 2,
      "quotesCount": 0,
      "upVotesCount": 8,
      "downVotesCount": 0,
      "repostsCount": 1,
      "parentPostId": "d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1",
      "mentionedPubkeys": ["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"],
      "isUpvoted": false,
      "isDownvoted": false,
      "userNickname": "Q2FybA==",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": false,
      "isQuote": false
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1703184000",
    "prevCursor": "1703186000"
  }
}
```

**Note:** This endpoint returns posts, quotes, and replies where the specified user's public key appears in the `mentionedPubkeys` array. The response follows the same format as other post endpoints with full interaction counts and reply threading support.

### 4. Get Users
Fetch user introduction posts with pagination support and blocked users awareness:

```bash
curl "http://localhost:3000/get-users?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

**Query Parameters:**
- `requesterPubkey` (required): Public key of the user requesting the posts (66-character hex string with 02/03 prefix)
- `limit` (required): Number of user posts to return (max: 100, min: 1)
- `before` (optional): Return user posts created before this timestamp (for pagination to older posts)
- `after` (optional): Return user posts created after this timestamp (for fetching newer posts)

**Response:**
```json
{
  "posts": [
    {
      "id": "u1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
      "userPublicKey": "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f",
      "postContent": "SGkgZXZlcnlvbmUhIEknbSBhIEthc3BhIGVudGh1c2lhc3QgYW5kIGRldmVsb3Blci4=",
      "signature": "3045022100d1d2d3d4d5d6d7d8d9d0d1d2d3d4d5d6d7d8d9d0d1d2d3d4d5d6d7d8d9d0d1d20220333435363738393031323334353637383930313233343536373839303132333435",
      "timestamp": 1703190000,
      "userNickname": "QWxpY2U=",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": false
    },
    {
      "id": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
      "userPublicKey": "03456def789012345678901234567890123456789012345678901234567890abcd",
      "postContent": "KioqKioqKioqKg==",
      "signature": "304502210098765432109876543210987654321098765432109876543210987654321098765020200fedcba0987654321fedcba0987654321fedcba0987654321fedcba098765432109",
      "timestamp": 1703185000,
      "userNickname": "Qm9i",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": true
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1703189000",
    "prevCursor": "1703191000"
  }
}
```

**Note**: The Users API returns a simplified data structure without:
  - `repliesCount`, `upVotesCount`, `repostsCount` (not included in response)
  - `parentPostId` (user introductions are not replies)
  - `mentionedPubkeys` (user introductions don't mention other users)

**Blocked Users Awareness:**
- `blockedUser`: Boolean field indicating if the user is blocked by the requester
- For blocked users, `postContent` will show masked content (`"KioqKioqKioqKg=="` - Base64 encoded "**********")
- The requester's own posts will never be marked as blocked (`blockedUser: false`)
- This allows client applications to filter or style blocked users' content appropriately

**Database Query Logic:**
This endpoint performs a LEFT JOIN between `k_broadcasts` and `k_blocks` tables:
1. Fetches all user introduction posts from `k_broadcasts`
2. Checks if each user is blocked by the requester via LEFT JOIN with `k_blocks`
3. Returns all posts with blocking status information

This endpoint is specifically designed for displaying user introduction posts with a character limit of 100 characters.

### 5. Get User Details
Fetch detailed information for a specific user including their introduction post and block status:

```bash
curl "http://localhost:3000/get-user-details?user=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&requesterPubkey=03ab1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd"
```

**Query Parameters:**
- `user` (required): User's public key (66-character hex string with 02/03 prefix)
- `requesterPubkey` (required): Public key of the user requesting the details (66-character hex string with 02/03 prefix)

**Response:**
```json
{
  "id": "u1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
  "userPublicKey": "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f",
  "postContent": "SGkgZXZlcnlvbmUhIEknbSBhIEthc3BhIGVudGh1c2lhc3QgYW5kIGRldmVsb3Blci4=",
  "signature": "3045022100d1d2d3d4d5d6d7d8d9d0d1d2d3d4d5d6d7d8d9d0d1d2d3d4d5d6d7d8d9d0d1d20220333435363738393031323334353637383930313233343536373839303132333435",
  "timestamp": 1703190000,
  "userNickname": "QWxpY2U=",
  "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "blockedUser": false
}
```

**Response Fields:**
- `id`: Transaction ID of the user's introduction post
- `userPublicKey`: The user's public key
- `postContent`: Base64 encoded introduction message
- `signature`: User's signature for the introduction post
- `timestamp`: Unix timestamp when the introduction was posted
- `userNickname`: Base64 encoded nickname (optional) - When decoded, shows the user's display name
- `userProfileImage`: Base64 encoded profile image (optional) - 48x48px image in PNG format
- `blockedUser`: Boolean indicating whether the requester has blocked this user

**Block Status Logic:**
The `blockedUser` field indicates whether the requesting user (`requesterPubkey`) has blocked the target user (`user`). This is determined by checking the `k_blocks` table for records where:
- `sender_pubkey` = `requesterPubkey` (the requester did the blocking)
- `blocked_user_pubkey` = `user` (the target user was blocked)

**Error Responses:**
- `400 Bad Request`: Invalid or missing parameters
- `404 Not Found`: User not found (no introduction post exists)
- `429 Too Many Requests`: Rate limit exceeded

**Note:** This endpoint returns the same data structure as the `get-users` endpoint but for a single specific user, with the addition of the `blockedUser` field. Unlike the paginated `get-users` endpoint, this returns a single user object directly (not wrapped in a `posts` array with pagination metadata).

### 6. Get Blocked Users
Fetch a paginated list of users blocked by the requester:

```bash
curl "http://localhost:3000/get-blocked-users?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

**Query Parameters:**
- `requesterPubkey` (required): Public key of the user requesting the blocked users list (66-character hex string with 02/03 prefix)
- `limit` (required): Number of blocked users to return (max: 100, min: 1)
- `before` (optional): Return blocked users created before this timestamp (for pagination to older blocked users)
- `after` (optional): Return blocked users created after this timestamp (for fetching newer blocked users)

**Response:**
```json
{
  "posts": [
    {
      "id": "b1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
      "userPublicKey": "03456def789012345678901234567890123456789012345678901234567890abcd",
      "postContent": "SGVsbG8sIEknbSBhIGRldmVsb3BlciBpbnRlcmVzdGVkIGluIGJsb2NrY2hhaW4=",
      "signature": "304502210098765432109876543210987654321098765432109876543210987654321098765020200fedcba0987654321fedcba0987654321fedcba0987654321fedcba098765432109",
      "timestamp": 1703185000,
      "userNickname": "Qm9i",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": true
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1703184000",
    "prevCursor": "1703186000"
  }
}
```

**Response Structure:**
- `posts`: Array of blocked user objects, each containing the same data as the `get-users` endpoint
- `pagination`: Standard pagination metadata for navigating through the results
- `blockedUser`: Always `true` for all users in this response (since they are blocked by the requester)

**Database Query Logic:**
This endpoint performs an INNER JOIN between `k_blocks` and `k_broadcasts` tables:
1. Finds all records in `k_blocks` where `sender_pubkey` = `requesterPubkey`
2. Joins with `k_broadcasts` to get user profile data for each `blocked_user_pubkey`
3. Returns the broadcast/profile information for all blocked users

**Error Responses:**
- `400 Bad Request`: Invalid or missing parameters
- `429 Too Many Requests`: Rate limit exceeded

**Note:** This endpoint returns users in the order they were blocked (most recent blocks first). The response format matches `get-users` with pagination support, but includes only users that have been blocked by the requesting user.

### 7. Get User Posts
Fetch posts for a specific user with pagination support and voting status:

```bash
curl "http://localhost:3000/get-posts?user=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

**Query Parameters:**
- `user` (required): User's public key (66-character hex string with 02/03 prefix)
- `requesterPubkey` (required): Public key of the user requesting the posts (66-character hex string with 02/03 prefix)
- `limit` (required): Number of posts to return (max: 100, min: 1)
- `before` (optional): Return posts created before this timestamp (for pagination to older posts)
- `after` (optional): Return posts created after this timestamp (for fetching newer posts)

**User Profile Information:**
The `get-posts` API includes optional user profile fields for each post:
- `userNickname`: Base64 encoded nickname (optional) - When decoded, shows the user's display name
- `userProfileImage`: Base64 encoded profile image (optional) - 48x48px image in PNG format

These fields are populated when users have shared profile information through broadcast transactions. If not available, they will be omitted from the response.

**Quote Support:**
This endpoint returns both regular posts and quotes (posts that reference other content):
- `isQuote`: Boolean field indicating if this is a quote (true) or regular post (false)
- `quote`: Object containing referenced content data (only present when `isQuote` is true)
  - `referencedContentId`: Transaction ID of the referenced content (64-character hex string)
  - `referencedMessage`: Base64 encoded message of the referenced content
  - `referencedSenderPubkey`: Public key of the referenced content's author
  - `referencedNickname`: Base64 encoded nickname of referenced author (optional)
  - `referencedProfileImage`: Base64 encoded profile image of referenced author (optional)

Quotes are treated as posts with all standard interaction fields (upvotes, downvotes, replies, etc.) and include the data from the content being quoted.

**Response:**
```json
{
  "posts": [
    {
      "id": "d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1",
      "userPublicKey": "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f",
      "postContent": "SGVsbG8gV29ybGQhIFRoaXMgaXMgbXkgZmlyc3QgcG9zdCBmcm9tIHRoZSBzZXJ2ZXIu",
      "signature": "3045022100a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890022034567890123456789012345678901234567890123456789012345678901234567890",
      "timestamp": 1703184000,
      "repliesCount": 4,
      "quotesCount": 0,
      "upVotesCount": 12,
      "downVotesCount": 2,
      "repostsCount": 3,
      "parentPostId": null,
      "mentionedPubkeys": [],
      "isUpvoted": false,
      "isDownvoted": true,
      "userNickname": "Sm9obg==",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": false,
      "isQuote": false
    },
    {
      "id": "q1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
      "userPublicKey": "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f",
      "postContent": "R3JlYXQgcG9pbnQhIEkgY29tcGxldGVseSBhZ3JlZSB3aXRoIHRoaXM=",
      "signature": "3045022100b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b20220444555666777888999000111222333444555666777888999000111222333444555",
      "timestamp": 1703184500,
      "repliesCount": 0,
      "quotesCount": 0,
      "upVotesCount": 8,
      "downVotesCount": 0,
      "repostsCount": 1,
      "parentPostId": null,
      "mentionedPubkeys": [],
      "isUpvoted": true,
      "isDownvoted": false,
      "userNickname": "Sm9obg==",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": false,
      "isQuote": true,
      "quote": {
        "referencedContentId": "w1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
        "referencedMessage": "TWFya2V0IGFuYWx5c2lzIHNob3dzIGludGVyZXN0aW5nIHBhdHRlcm5zIGVtZXJnaW5n",
        "referencedSenderPubkey": "029876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98",
        "referencedNickname": "QWxpY2U=",
        "referencedProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
      }
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1703183000",
    "prevCursor": "1703185000"
  }
}
```

**Important**: All API responses must include `parentPostId` and `mentionedPubkeys` fields:
- `parentPostId`: `null` for original posts, or the ID of the post being replied to for replies
- `mentionedPubkeys`: Empty array `[]` for original posts, or array of mentioned pubkeys for replies

### Post Content Decoding
  Post content is Base64 encoded. To decode (using js-base64 library for Unicode compatibility):
  ```javascript
  import { Base64 } from 'js-base64';
  const decodedContent = Base64.decode("SGVsbG8gV29ybGQhIFRoaXMgaXMgbXkgZmlyc3QgcG9zdCBmcm9tIHRoZSBzZXJ2ZXIu");
  // Result: "Hello World! This is my first post from the server."
  
  // For Unicode content like Asian characters and emoji:
  const unicodeContent = Base64.decode("SGVsbG8g5LiW55WLIC+wn5yN");
  // Result: "Hello 世界 🌍"
  ```

### 8. Get Post Replies
Fetch replies for a specific post with pagination support and voting status:

```bash
curl "http://localhost:3000/get-replies?post=d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

**Query Parameters:**
- `post` (required for post replies): Post ID (64-character hex string cryptographic hash)
- `requesterPubkey` (required): Public key of the user requesting the replies (66-character hex string with 02/03 prefix)
- `limit` (required): Number of replies to return (max: 100, min: 1)
- `before` (optional): Return replies created before this timestamp (for pagination to older replies)
- `after` (optional): Return replies created after this timestamp (for fetching newer replies)

### 6b. Get User Replies
Fetch all replies made by a specific user with pagination support and voting status:

```bash
curl "http://localhost:3000/get-replies?user=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

**Query Parameters:**
- `user` (required for user replies): User's public key (66-character hex string with 02/03 prefix)
- `requesterPubkey` (required): Public key of the user requesting the replies (66-character hex string with 02/03 prefix)
- `limit` (required): Number of replies to return (max: 100, min: 1)
- `before` (optional): Return replies created before this timestamp (for pagination to older replies)
- `after` (optional): Return replies created after this timestamp (for fetching newer replies)

**Note:** The `get-replies` endpoint now supports two modes:
1. **Post Replies Mode**: Use `post` parameter to get replies to a specific post
2. **User Replies Mode**: Use `user` parameter to get all replies made by a specific user

Exactly one of `post` or `user` must be provided, but not both.

**Response:**
```json
{
  "replies": [
    {
      "id": "a7f9c2e5b8d1f4a6e9c3d7f0a2b5c8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9",
      "userPublicKey": "02level1user1000000000000000000000000000000000000000000000000000000",
      "postContent": "VGhpcyBpcyB0aGUgZmlyc3QgdG9wLWxldmVsIHJlcGx5IG9uIHRoZSBmaXJzdCBwb3N0Lg==",
      "signature": "304502210001010101010101010101010101010101010101010101010101010101010101010220010101010101010101010101010101010101010101010101010101010101010101",
      "timestamp": 1703180400,
      "repliesCount": 2,
      "quotesCount": 0,
      "upVotesCount": 15,
      "downVotesCount": 1,
      "repostsCount": 2,
      "parentPostId": "d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1",
      "mentionedPubkeys": ["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"],
      "isUpvoted": true,
      "isDownvoted": false,
      "userNickname": "Qm9i",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "blockedUser": false
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1703180000",
    "prevCursor": "1703181000"
  }
}
```

**Note:** The `quotesCount` field indicates how many quotes reference this reply. Replies can be quoted just like posts.

### 9. Get Post Details
Fetch details for a specific post or reply with voting status for the requesting user:

```bash
curl "http://localhost:3000/get-post-details?id=d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"
```

**Query Parameters:**
- `id` (required): Post or reply ID (64-character hex string cryptographic hash)
- `requesterPubkey` (required): Public key of the user requesting the post details (66-character hex string with 02/03 prefix)

**User Profile Information:**
The `get-post-details` API includes optional user profile fields for the post:
- `userNickname`: Base64 encoded nickname (optional) - When decoded, shows the user's display name
- `userProfileImage`: Base64 encoded profile image (optional) - 48x48px image in PNG format

These fields are populated when users have shared profile information through broadcast transactions. If not available, they will be omitted from the response.

**Quote Support:**
This endpoint returns quote posts with the same structure as `get-posts-watching`:
- `isQuote`: Boolean field indicating if this is a quote (true) or regular post (false)
- `quote`: Object containing referenced content data (only present when `isQuote` is true)
  - `referencedContentId`: Transaction ID of the referenced content (64-character hex string)
  - `referencedMessage`: Base64 encoded message of the referenced content
  - `referencedSenderPubkey`: Public key of the referenced content's author
  - `referencedNickname`: Base64 encoded nickname of referenced author (optional)
  - `referencedProfileImage`: Base64 encoded profile image of referenced author (optional)

**Response:**
```json
{
  "post": {
    "id": "d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc44f",
    "userPublicKey": "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f",
    "postContent": "SGVsbG8gV29ybGQhIFRoaXMgaXMgbXkgZmlyc3QgcG9zdCBmcm9tIHRoZSBzZXJ2ZXIu",
    "signature": "3045022100a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890022034567890123456789012345678901234567890123456789012345678901234567890",
    "timestamp": 1703184000,
    "repliesCount": 4,
    "quotesCount": 0,
    "upVotesCount": 12,
    "downVotesCount": 2,
    "repostsCount": 3,
    "parentPostId": null,
    "mentionedPubkeys": [],
    "isUpvoted": true,
    "isDownvoted": false,
    "userNickname": "Sm9obg==",
    "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "blockedUser": false,
    "isQuote": false
  }
}
```

**Example Quote Response:**
```json
{
  "post": {
    "id": "78f0f1333439c75c614add631c7caade91ebf961707386f0fd296507197423c9",
    "userPublicKey": "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f",
    "postContent": "VGVzdGluZyBvdXQgYW5vdGhlciBxdW90ZS4uLi4=",
    "signature": "b6cca5f892e99d3037840539d478fe69aedab3692febaf56fc7f672e4049d8cf23e71d28dad8306195fad252ced69221568fca8eb17dacbf13d1ab4512fdf3f8",
    "timestamp": 1759784264991,
    "repliesCount": 0,
    "quotesCount": 0,
    "upVotesCount": 1,
    "downVotesCount": 0,
    "repostsCount": 0,
    "parentPostId": null,
    "mentionedPubkeys": ["038ea9ca1fe1f22cc8074cc576e0870cf50f773c90c1f4830fd6ba6f60771cc1f3"],
    "isUpvoted": true,
    "isDownvoted": false,
    "userNickname": "VGhlU2hlZXBDYXRPZmZpY2lhbA==",
    "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAMa0lEQVR4AdSZCX...",
    "blockedUser": false,
    "isQuote": true,
    "quote": {
      "referencedContentId": "53360bbbed8ce2efc1facd2969ea579a87c3a93cee8adf4315c92e81e1b0545c",
      "referencedMessage": "VGVzdGluZyBvdXQgYSBtZW50aW9uLgpIaSwgS1MhCkAwMzNkMDE3MDlhMDJiZjc4Zjk1ZTA5Y2QwMGJhOTNhZDhmYjdjOGFjMTFlNmQzZjg3MWExMTA2MmVlYjJhYThjZDgK",
      "referencedSenderPubkey": "038ea9ca1fe1f22cc8074cc576e0870cf50f773c90c1f4830fd6ba6f60771cc1f3",
      "referencedNickname": "anRtYWM1OA==",
      "referencedProfileImage": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAQA..."
    }
  }
}
```

**Use Cases:**
- Loading individual post details for the PostDetailView
- Refreshing interaction counts (likes, reposts, replies)
- Getting updated post information for real-time updates
- Verifying post existence before displaying reply forms
- Checking user's voting status on specific posts/replies

**New Fields:**
- `isUpvoted`: Boolean indicating if the requesting user has upvoted this post/reply
- `isDownvoted`: Boolean indicating if the requesting user has downvoted this post/reply
- Both fields are mutually exclusive (only one can be true at a time)
- If the user hasn't voted, both fields will be false

**Backend Implementation Requirements:**
- The backend must maintain a voting database/table tracking user votes
- For each request, query the voting data using `requesterPubkey` and post `id`
- Return appropriate boolean values for `isUpvoted` and `isDownvoted`
- Ensure mutual exclusivity: a user cannot have both upvoted and downvoted the same post

**Error Responses:**
```json
{
  "error": "Post not found",
  "code": "NOT_FOUND"
}
```

```json
{
  "error": "Missing required parameter: requesterPubkey",
  "code": "MISSING_PARAMETER"
}
```

#### Nested Replies

Replies can have nested replies. To get replies to a reply, use the reply's ID with pagination and voting status:

```bash
curl "http://localhost:3000/get-replies?post=a7f9c2e5b8d1f4a6e9c3d7f0a2b5c8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

#### User Replies

To get all replies made by a specific user (for "My Replies" view), use the user parameter:

```bash
curl "http://localhost:3000/get-replies?user=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

## Data Structures and Field Descriptions

### Post Object
  ```typescript
  interface ServerPost {
    id: string; // 32-byte cryptographic hash (64-character hex string)
    userPublicKey: string; // User's public key (66-character hex string with 02/03 prefix)
    postContent: string; // Base64 encoded post content
    signature: string; // 64-byte Schnorr signature as hex string (130 characters)
    timestamp: number; // Unix timestamp
    repliesCount: number; // Number of replies
    quotesCount: number; // Number of quotes (how many times this content has been quoted)
    upVotesCount: number; // Number of upvotes
    downVotesCount?: number; // Number of downvotes (optional, defaults to 0)
    repostsCount: number; // Number of reposts
    parentPostId?: string; // ID of the post being replied to (null for original posts)
    mentionedPubkeys: string[]; // Array of pubkeys mentioned in this post/reply
    isUpvoted: boolean; // Whether the requesting user has upvoted this post (for APIs with requesterPubkey)
    isDownvoted: boolean; // Whether the requesting user has downvoted this post (for APIs with requesterPubkey)
    userNickname?: string; // Base64 encoded user nickname (optional)
    userProfileImage?: string; // Base64 encoded profile image (optional)
    isQuote: boolean; // Whether this is a quote (true) or regular post (false)
    quote?: QuoteData; // Quote reference data (only present when isQuote is true)
  }

  interface QuoteData {
    referencedContentId: string; // Transaction ID of the referenced content (64-character hex string)
    referencedMessage: string; // Base64 encoded message of the referenced content
    referencedSenderPubkey: string; // Public key of the referenced content's author
    referencedNickname?: string; // Base64 encoded nickname of referenced author (optional)
    referencedProfileImage?: string; // Base64 encoded profile image of referenced author (optional)
  }
  ```

### User Post Object (Users API)
  ```typescript
  interface ServerUserPost {
    id: string; // 32-byte cryptographic hash (64-character hex string) 
    userPublicKey: string; // User's public key (66-character hex string with 02/03 prefix)
    postContent: string; // Base64 encoded introduction content (max 100 chars when decoded)
    signature: string; // 64-byte Schnorr signature as hex string (130 characters)
    timestamp: number; // Unix timestamp
    userNickname?: string; // Base64 encoded user nickname (optional)
    userProfileImage?: string; // Base64 encoded profile image (optional)
    // Note: Users API omits repliesCount, upVotesCount, repostsCount, parentPostId, mentionedPubkeys
  }
  ```

### Reply Object
  ```typescript
  interface ServerReply {
    id: string; // 32-byte cryptographic hash (64-character hex string)
    userPublicKey: string; // User's public key (66-character hex string with 02/03 prefix)
    postContent: string; // Base64 encoded content
    signature: string; // 64-byte Schnorr signature as hex string (130 characters)
    timestamp: number; // Unix timestamp
    repliesCount: number; // Number of direct replies
    upVotesCount: number; // Number of upvotes
    downVotesCount?: number; // Number of downvotes (optional, defaults to 0)
    repostsCount: number; // Number of reposts
    parentPostId?: string; // ID of the post being replied to
    mentionedPubkeys: string[]; // Array of pubkeys mentioned in this reply
    isUpvoted: boolean; // Whether the requesting user has upvoted this reply (for APIs with requesterPubkey)
    isDownvoted: boolean; // Whether the requesting user has downvoted this reply (for APIs with requesterPubkey)
    userNickname?: string; // Base64 encoded user nickname (optional)
    userProfileImage?: string; // Base64 encoded profile image (optional)
  }
  ```

### ID Format

All IDs are 32-byte cryptographic hashes represented as 64-character hexadecimal strings:

## Field Descriptions

### Required Fields
**All API responses must include these fields for both posts and replies:**

- `id`: 32-byte cryptographic hash (64-character hex string)
- `userPublicKey`: User's public key (66-character hex string with 02/03 prefix)  
- `postContent`: Base64 encoded content
- `signature`: 64-byte Schnorr signature (130-character hex string)
- `timestamp`: Unix timestamp (seconds)
- `repliesCount`: Number of replies (integer)
- `upVotesCount`: Number of upvotes (integer)
- `downVotesCount`: Number of downvotes (integer, optional - defaults to 0 if not provided)
- `repostsCount`: Number of reposts (integer)
- `parentPostId`: ID of parent post (`null` for original posts, post ID for replies)
- `mentionedPubkeys`: Array of mentioned user public keys (empty `[]` for original posts)

### Voting Status Fields (for all APIs with requesterPubkey)
**When `requesterPubkey` parameter is provided, these fields are included in all post/reply responses:**

- `isUpvoted`: Boolean indicating if the requesting user has upvoted this post/reply
- `isDownvoted`: Boolean indicating if the requesting user has downvoted this post/reply

**Important Notes:**
- These fields are mutually exclusive (only one can be `true` at a time)
- If the user hasn't voted on the post/reply, both fields will be `false`
- The backend must query the voting database using `requesterPubkey` and post `id` to determine these values
- All APIs now require `requesterPubkey` parameter for voting status and blocked users awareness

**APIs that now include voting status:**
- `get-post-details`
- `get-posts`
- `get-posts-following`
- `get-posts-watching`
- `get-mentions`
- `get-replies`

**APIs that include blocked users awareness:**
- `get-post-details`
- `get-posts`
- `get-posts-following`
- `get-posts-watching`
- `get-mentions`
- `get-replies`
- `get-users`
- `get-user-details`

**Note:** `get-users` includes blocked users awareness but not voting status (user introductions don't support voting).

### Post IDs
All post and reply IDs should be 32-byte cryptographic hashes represented as 64-character hexadecimal strings. These IDs are derived from the transaction data and ensure uniqueness across the system.

**Example:** `d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1`

### Content Encoding
The `postContent` field contains the actual post/reply text encoded in Base64 format. This encoding ensures compatibility with JSON and prevents issues with special characters.

**Original text:** `"Hello World! This is my first post from the server."`  
**Base64 encoded:** `"SGVsbG8gV29ybGQhIFRoaXMgaXMgbXkgZmlyc3QgcG9zdCBmcm9tIHRoZSBzZXJ2ZXIu"`

### Parent Post Relationships
- **Original Posts**: `parentPostId` is `null`
- **Replies**: `parentPostId` contains the ID of the post being replied to
- This enables proper reply threading and conversation chains

### Timestamps
Unix timestamps represent the creation time of posts/replies in seconds since the Unix epoch (January 1, 1970).

**Example:** `1703184000` = December 21, 2023, 5:20:00 PM UTC

### Mentioned Pubkeys

The `mentionedPubkeys` field contains an array of user public keys that are mentioned in the post/reply:

#### Original Post (No Mentions)
```json
{
  "id": "d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1",
  "userPublicKey": "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f",
  "postContent": "SGVsbG8gV29ybGQh",
  "parentPostId": null,
  "mentionedPubkeys": []
}
```

#### Reply (Mentions Original Author)
```json
{
  "id": "a7f9c2e5b8d1f4a6e9c3d7f0a2b5c8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9",
  "userPublicKey": "02level1user1000000000000000000000000000000000000000000000000000000",
  "postContent": "VGhpcyBpcyBhIHJlcGx5",
  "parentPostId": "d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1",
  "mentionedPubkeys": ["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"]
}
```

#### Reply Chain (Maintains Full Conversation)
```json
{
  "id": "b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1",
  "userPublicKey": "02thirduser2000000000000000000000000000000000000000000000000000000",
  "postContent": "UmVwbHkgdG8gdGhlIHJlcGx5",
  "parentPostId": "a7f9c2e5b8d1f4a6e9c3d7f0a2b5c8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9",
  "mentionedPubkeys": [
    "02level1user1000000000000000000000000000000000000000000000000000000",
    "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"
  ]
}
```

#### Self-Reply (Includes Own Pubkey)
```json
{
  "id": "c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2",
  "userPublicKey": "02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f",
  "postContent": "UmVwbHlpbmcgdG8gbXkgb3duIHBvc3Q=",
  "parentPostId": "d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1",
  "mentionedPubkeys": ["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"]
}
```

### Mention Rules

1. **Original Posts**: `mentionedPubkeys` is always an empty array `[]`
2. **Replies**: Must include the author of the post being replied to
3. **Reply Chains**: Must include all users from the parent's `mentionedPubkeys` plus the parent's author
4. **Self-Replies**: Include your own pubkey when replying to your own posts
5. **Deduplication**: Each pubkey should appear only once in the array

## Webapp Integration

### My Posts View

The "My Posts" view only displays posts and replies fetched from the REST API. No local/client-side posts are shown.

### My Replies View

The "My Replies" view displays all replies made by the current user:

- **Purpose**: Allow users to see all their replies across all conversations
- **Content**: Shows replies made by the user to any posts, sorted by newest first
- **Full Interactions**: Displays all interaction counts (likes, reposts, replies) and allows full interaction
- **No Compose Box**: Does not include a compose box since this is a read-only view of existing replies
- **Real-time Updates**: Automatically refreshes every 5 seconds to show updated interaction counts
- **Navigation**: Clicking on a reply navigates to the full post/reply detail view
- **Polling**: Uses the same polling mechanism as other post views for consistent user experience
- **API Integration**: Uses the modified `get-replies` endpoint with `user` parameter instead of `post` parameter

### Mentions View

The "Mentions" view displays posts and replies where the current user has been mentioned:

- **Purpose**: Allow users to see where they've been mentioned in conversations
- **Content**: Shows both original posts and replies that contain the user's public key in `mentionedPubkeys`
- **Full Interactions**: Displays all interaction counts (likes, reposts, replies) and allows full interaction
- **Reply Threading**: Supports viewing and replying to mentions with proper conversation threading
- **Real-time Updates**: Automatically refreshes every 5 seconds to show new mentions
- **Navigation**: Clicking on a mention navigates to the full post/reply detail view
- **Polling**: Uses the same polling mechanism as other post views for consistent user experience

### Users View

The "Users" view displays user introduction posts with the following characteristics:

- **Purpose**: Allow users to introduce themselves to the community
- **Character Limit**: Introduction posts are limited to 100 characters
- **Simplified Display**: No like counts, repost counts, or reply counts are shown
- **No Interactions**: Users cannot reply to, like, or repost introduction posts
- **Special Compose Box**: Uses "IntroduceComposeBox" with 100-character limit and "Introduce" button
- **Navigation**: Clicking on a user introduction navigates to their full profile (`/user/{pubkey}`)
- **Polling**: Automatically refreshes every 5 seconds to show new user introductions

### Navigation

All post and reply navigation uses cryptographic hash IDs:

- Post URL: `/post/d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1`
- Reply URL: `/post/a7f9c2e5b8d1f4a6e9c3d7f0a2b5c8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9`

### Post Detail View

The "Post Detail" view displays individual posts and their reply threads:

- **Purpose**: Show detailed view of a single post with all its replies
- **Main Post Loading**: Uses `get-post-details` API to fetch the specific post with voting status
- **Authentication Required**: Requires user to be logged in to pass `requesterPubkey` parameter
- **Reply Loading**: Uses `get-replies` API with pagination for the reply thread
- **Real-time Updates**: Polls the main post details every 5 seconds for updated interaction counts and voting status
- **Reply Threading**: Supports nested replies with proper conversation threading
- **Infinite Scroll**: Automatically loads more replies as user scrolls
- **Reply Composition**: Integrated reply form with mention handling
- **Navigation**: Supports navigation to parent posts for reply chains
- **Voting UI**: Shows green highlighting for upvoted/downvoted posts with disabled opposite button

### Real-time Updates

The webapp polls different endpoints at different intervals:

- **My Posts, Following, Watching, Mentions**: Polls every 5 seconds for new posts and replies
- **Users**: Polls every 5 seconds for new user introductions (faster refresh for community discovery)
- **Post Details**: Polls main post details every 5 seconds for updated interaction counts, replies loaded on-demand

All polling is automatic and includes loading indicators and error handling.

### 10. Get Notifications Count
Get the total count of notifications for a user, optionally filtered by cursor timestamp:

```bash
# Get total notification count for a user
curl "http://localhost:3000/get-notifications-count?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"

# Get notification count since a specific cursor (for new notifications)
curl "http://localhost:3000/get-notifications-count?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&after=1758377365603_571321"
```

**Query Parameters:**
- `requesterPubkey` (required): Public key of the user requesting the notification count (66-character hex string with 02/03 prefix)
- `after` (optional): Compound cursor in format `timestamp_id` (e.g., `1758377365603_571321`) - when provided, returns count of notifications after this cursor position

**Response:**
```json
{
  "count": 42
}
```

**Use Cases:**
- Display notification badge count in the UI
- Check for new notifications since last visit
- Determine if notifications panel should show an indicator
- Real-time polling to update notification indicators

**Implementation Details:**
- Counts all mentions of the user in `k_mentions` table across content types: 'post', 'reply', and 'vote'
- Counts quotes of the user's content from `k_contents` table (content_type = 'quote')
- When `after` cursor is provided, only counts notifications after that cursor position (using compound cursor format `timestamp_id`)
- Excludes notifications from blocked users (checks `k_blocks` table)
- Quotes are counted separately from mentions to avoid double-counting
- Returns simple integer count for efficient UI updates

### 11. Get Notifications
Fetch paginated notifications for a user including posts, replies, votes mentioning them, and quotes of their content:

```bash
# Get first page of notifications (latest 10)
curl "http://localhost:3000/get-notifications?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"

# Get next page (older notifications)
curl "http://localhost:3000/get-notifications?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10&before=1703185000"

# Check for newer notifications
curl "http://localhost:3000/get-notifications?requesterPubkey=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10&after=1703190000"
```

**Query Parameters:**
- `requesterPubkey` (required): Public key of the user requesting notifications (66-character hex string with 02/03 prefix)
- `limit` (required): Number of notifications to return (max: 100, min: 1)
- `before` (optional): Return notifications before this timestamp (for pagination to older notifications)
- `after` (optional): Return notifications after this timestamp (for fetching newer notifications)

**Response:**
```json
{
  "notifications": [
    {
      "id": "9a9ac8900065bc858b762e0ae379bdf9286a42d571159af260925158a2c80ca3",
      "userPublicKey": "03f56f6ad1c1166e330fb2897ae60afcb25afa10006212cfee24264c04d21bce60",
      "postContent": "",
      "timestamp": 1758996519522,
      "userNickname": "VGhlIEtpbmc=",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmH...",
      "contentType": "vote",
      "cursor": "1758996519522_571321",
      "voteType": "downvote",
      "mentionBlockTime": 1758996519522,
      "contentId": "d2ed33d371322d9033ec27e93a7cbdb47613d703465f0f7a9b58f5a1afa01c4d",
      "votedContent": "R29vZCBtb3JuaW5nIEthc3BhIGZhbWlseSEgIPCfmoDwn5qA8J+agPCfmoDwn5qA"
    },
    {
      "id": "65c7023a6c90274dbb4b7405a7f21b8be0d8fa6f14632a02581fa8fa7f1aec0c",
      "userPublicKey": "03f56f6ad1c1166e330fb2897ae60afcb25afa10006212cfee24264c04d21bce60",
      "postContent": "WWVzLCBzdXJlIQ==",
      "timestamp": 1758996486131,
      "userNickname": "VGhlIEtpbmc=",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmH...",
      "contentType": "reply",
      "cursor": "1758996486131_571322",
      "voteType": null,
      "mentionBlockTime": null,
      "contentId": null,
      "votedContent": null
    },
    {
      "id": "d6cdd0ffe9eb693f522da4ed1cadf7f6f7369b73881158391540dea18c5a591e",
      "userPublicKey": "03f56f6ad1c1166e330fb2897ae60afcb25afa10006212cfee24264c04d21bce60",
      "postContent": "SSdtIHRyeWluZyBpdCE=",
      "timestamp": 1758985495931,
      "userNickname": "VGhlIEtpbmc=",
      "userProfileImage": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmH...",
      "contentType": "post",
      "cursor": "1758985495931_571323",
      "voteType": null,
      "mentionBlockTime": null,
      "contentId": null,
      "votedContent": null
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "1758985000",
    "prevCursor": "1758997000"
  }
}
```

**Notification Types:**

1. **Post Notifications** (`contentType: "post"`):
   - When someone mentions the user in an original post
   - `postContent`: Base64 encoded post content
   - Vote-specific fields are `null`

2. **Reply Notifications** (`contentType: "reply"`):
   - When someone mentions the user in a reply
   - `postContent`: Base64 encoded reply content
   - Vote-specific fields are `null`

3. **Quote Notifications** (`contentType: "quote"`):
   - When someone quotes the user's content (post, reply, or quote)
   - `postContent`: Base64 encoded content of the quote itself
   - Quote-specific fields:
     - `referencedContentId`: ID of the user's original content being quoted (optional)
     - `referencedMessage`: Base64 encoded content of the original post/reply being quoted (optional)
   - Vote-specific fields are `null`

4. **Vote Notifications** (`contentType: "vote"`):
   - When someone votes on content that mentions the user
   - `postContent`: Empty string (votes don't have content)
   - Additional vote fields:
     - `voteType`: "upvote" or "downvote"
     - `contentId`: ID of the content being voted on
     - `votedContent`: Base64 encoded content of the post/reply being voted on

**Common Fields for All Notification Types:**
- `id`: Transaction ID of the notification content
- `userPublicKey`: Public key of the user who created the notification
- `timestamp`: Block time for proper chronological ordering
- `userNickname`: Base64 encoded nickname from user's broadcast (optional)
- `userProfileImage`: Base64 encoded profile image from user's broadcast (optional)
- `contentType`: Type of notification - "post", "reply", "quote", or "vote"
- `cursor`: Compound cursor combining timestamp and record ID (e.g., `"1758996519522_571321"`) for use with pagination

**Vote-Specific Fields (only for vote notifications):**
- `voteType`: "upvote" or "downvote"
- `mentionBlockTime`: Timestamp from k_mentions table (same as timestamp)
- `contentId`: ID of the content being voted on
- `votedContent`: Base64 encoded content of the post/reply being voted on

**Database Implementation:**
- Queries `k_mentions` table for content types: 'post', 'reply', 'vote' (excludes 'quote' to avoid duplicates)
- Queries `k_contents` table for content_type = 'quote' where the user's content is being quoted
- Uses UNION ALL to combine mentions and quotes into a single notification stream
- Uses complex SQL CTEs to join with respective content tables (`k_posts`, `k_replies`, `k_votes`)
- For vote notifications, includes additional data about the voted content
- Excludes notifications from blocked users
- Consistently uses `k_mentions.block_time` as primary timestamp for chronological ordering
- Supports cursor-based pagination using compound cursors (timestamp + ID)

**Use Cases:**
- Display comprehensive notification feed in the app
- Show different UI elements based on `contentType`
- Navigate to original posts/replies from notifications
- Display vote activity on user's content
- Real-time polling for new notifications
- Use individual notification `cursor` values with `get-notifications-count` API to count newer notifications

**Cursor Integration:**
Each notification includes a `cursor` field that can be used with the `get-notifications-count` API:
```bash
# Get count of notifications newer than a specific notification
curl "http://localhost:3000/get-notifications-count?requesterPubkey=02218b...&after=1758996519522_571321"
```
This allows the webapp to determine how many new notifications have arrived since the last viewed notification.

## Error Handling

### Missing Parameters

```bash
curl "http://localhost:3000/get-posts"
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required parameter: user",
  "code": "MISSING_PARAMETER"
}
```

```bash
curl "http://localhost:3000/get-posts?user=02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f&limit=10"
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required parameter: requesterPubkey",
  "code": "MISSING_PARAMETER"
}
```

### Not Found

```bash
curl "http://localhost:3000/invalid-endpoint"
```

**Response (404 Not Found):**
```json
{
  "error": "Endpoint not found", 
  "code": "NOT_FOUND"
}
```

## K Protocol Transaction Format

The server should be able to parse K protocol transactions that created the posts/replies. Here are the expected formats:

### Post Transaction Format
```
k:1:post:sender_pubkey:signature:base64_message:mentioned_pubkeys_json
```

**Example:**
```
k:1:post:02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f:3045022100a1b2c3...567890:SGVsbG8gV29ybGQh:[]
```

### Reply Transaction Format
```
k:1:reply:sender_pubkey:signature:target_post_id:base64_message:mentioned_pubkeys_json
```

**Example:**
```
k:1:reply:02level1user1000000000000000000000000000000000000000000000000000000:304502210001...101:d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1:VGhpcyBpcyBhIHJlcGx5:["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"]
```

### Transaction Parsing

When processing transactions, the server should:

1. **Extract mentioned_pubkeys**: Parse the JSON array from the transaction
2. **Set parentPostId**: For replies, use the `target_post_id` from the transaction
3. **Validate format**: Ensure mentioned_pubkeys is a valid JSON array of pubkey strings
4. **Store relationships**: Maintain the reply chain relationships for conversation threading

### Transaction Examples by Type

#### Original Post Transaction
```
k:1:post:02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f:SIGNATURE:SGVsbG8gV29ybGQh:[]
```
- `mentionedPubkeys`: `[]` (empty)
- `parentPostId`: `null`

#### User Introduction Post Transaction
```
k:1:post:02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f:SIGNATURE:SGkgZXZlcnlvbmUhIEknbSBhIEthc3BhIGVudGh1c2lhc3QgYW5kIGRldmVsb3Blci4=:[]
```
- Content when decoded: "Hi everyone! I'm a Kaspa enthusiast and developer." (under 100 chars)
- Displayed in Users view without interaction counts
- Same transaction format as regular posts, but filtered for Users API

#### Reply to Post Transaction
```
k:1:reply:02level1user1000000000000000000000000000000000000000000000000000000:SIGNATURE:d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1:VGhpcyBpcyBhIHJlcGx5:["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"]
```
- `mentionedPubkeys`: `["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"]`
- `parentPostId`: `"d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1"`

#### Self-Reply Transaction
```
k:1:reply:02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f:SIGNATURE:d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1:U2VsZi1yZXBseQ==:["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"]
```
- `mentionedPubkeys`: `["02218b3732df2353978154ec5323b745bce9520a5ed506a96de4f4e3dad20dc44f"]` (includes self)
- `parentPostId`: `"d81d2b8ba4b71c2ecb7c07013fe200c5b3bdef2ea3e6ad7415abb89dc07997f1"`

## Pagination Implementation Notes

### Migration Strategy

All endpoints now use pagination:

- **Paginated**: All endpoints require `limit` parameter and support optional `before`/`after` cursors

### Server Implementation Requirements

When implementing pagination on the server side:

1. **Mandatory Parameters**: 
   - `limit` parameter is required for all paginated requests
   - Return error if `limit` is missing, less than 1, or greater than 100

2. **Cursor Implementation**:
   - Use Unix timestamps as cursors for consistent ordering
   - `before` cursor: Return items created before this timestamp (older content)
   - `after` cursor: Return items created after this timestamp (newer content)

3. **Response Format**:
   - Always include `pagination` object in paginated responses
   - Set `hasMore` to `true` if more older content is available
   - Set `nextCursor` to the timestamp of the oldest item in current page (for "load more")
   - Set `prevCursor` to the timestamp of the newest item in current page (for "refresh")
   - Set cursors to `null` when no more content is available in that direction

4. **Sorting**:
   - All results should be sorted by timestamp in descending order (newest first)
   - This ensures consistent pagination behavior
# Hashtag Management - Technical Specification

## Overview
This document outlines the implementation steps for adding hashtag management functionality to the K-indexer system. Hashtags will be extracted from posts, replies, and quotes, stored in a dedicated table, and exposed through API endpoints for querying content by hashtag and trending hashtag analytics.

---

## Step 1: Database Schema Updates

### 1.1 New Migration File: `v1_to_v2.sql`

**Location:** `K-transaction-processor/src/migrations/schema/v1_to_v2.sql`

**Summary:** This migration adds hashtag support with:
- 1 new table: `k_hashtags`
- 5 specialized indexes supporting exact match, prefix search, and contains search
- Foreign key constraint for referential integrity
- Schema version bump to v2

**Key Features:**
- **Exact match queries**: Fast lookup using standard B-tree index
- **Pattern matching**: Supports `LIKE 'prefix%'` and `LIKE '%contains%'` using `text_pattern_ops`
- **Cursor pagination**: Consistent ordering by block_time and content_id
- **Trending analysis**: Time-based aggregation support

#### 1.1.1 New Table: `k_hashtags`

```sql
CREATE TABLE IF NOT EXISTS k_hashtags (
    id BIGSERIAL PRIMARY KEY,
    sender_pubkey BYTEA NOT NULL,
    content_id BYTEA NOT NULL,
    block_time BIGINT NOT NULL,
    hashtag VARCHAR(30) NOT NULL
);
```

**Column Specifications:**
- `id`: Auto-incrementing primary key for internal row identification
- `sender_pubkey`: Public key of the user who created the content (BYTEA format, denormalized for query performance)
- `content_id`: Reference to the transaction_id in `k_contents` table (BYTEA format)
- `block_time`: Timestamp of the content creation (used for time-based queries and trending calculations)
- `hashtag`: The hashtag text (without the '#' symbol), max 30 characters, stored in lowercase for case-insensitive matching

#### 1.1.2 Required Indexes

The database schema and indexes are designed to efficiently execute the following query patterns:

1. **Find all content with #rust hashtag, newest first** (with cursor pagination based on block_time and content_id)
2. **Count how many times #programming was used**
3. **Find hashtags starting with 'rus'** (autocomplete)
4. **Find hashtags containing 'script' anywhere**
5. **Top N trending hashtags** (highest usage count) in the last X weeks/days/hours
6. **Find all content with #rust hashtag by user X, newest first** (with cursor pagination based on block_time and content_id)
7. **Top N users posting about #programming** in the last X weeks/days/hours

The following 4 indexes support these query patterns:

**Index 1: Exact match by hashtag (cursor pagination)**
```sql
CREATE INDEX IF NOT EXISTS idx_k_hashtags_by_hashtag_time
ON k_hashtags (hashtag, block_time DESC, content_id);
```
- **Supports Queries:** 1, 2
- **Purpose:** Exact match queries with cursor-based pagination
- **Query pattern:** Find all content with specific hashtag, newest first
- **Example:** `WHERE hashtag = 'rust' AND block_time < $cursor ORDER BY block_time DESC, content_id LIMIT 20`

**Index 2: Pattern matching (autocomplete and contains search)**
```sql
CREATE INDEX IF NOT EXISTS idx_k_hashtags_pattern
ON k_hashtags (hashtag text_pattern_ops, block_time DESC);
```
- **Supports Queries:** 3, 4
- **Purpose:** Prefix and contains pattern matching using `text_pattern_ops`
- **Query patterns:**
  - Autocomplete: `WHERE hashtag LIKE 'rus%'` (prefix search - very fast)
  - Contains: `WHERE hashtag LIKE '%script%'` (contains search - slower but indexed)
- **Note:** Prefix searches are significantly faster than contains searches

**Index 3: Trending hashtags**
```sql
CREATE INDEX IF NOT EXISTS idx_k_hashtags_trending
ON k_hashtags (block_time DESC, hashtag);
```
- **Supports Queries:** 5
- **Purpose:** Time-window aggregation for trending hashtag calculations
- **Query pattern:** Find most used hashtags within a time range
- **Example:** `WHERE block_time > $time_threshold GROUP BY hashtag ORDER BY COUNT(*) DESC LIMIT 20`

**Index 4: Hashtag by sender (cursor pagination)**
```sql
CREATE INDEX IF NOT EXISTS idx_k_hashtags_by_hashtag_sender
ON k_hashtags (hashtag, sender_pubkey, block_time DESC, content_id);
```
- **Supports Queries:** 6, 7
- **Purpose:** Filter hashtag content by specific user with cursor pagination, and aggregate by user
- **Query patterns:**
  - User filter: `WHERE hashtag = 'rust' AND sender_pubkey = $user ORDER BY block_time DESC, content_id LIMIT 20`
  - Top users: `WHERE hashtag = 'programming' AND block_time > $time_threshold GROUP BY sender_pubkey ORDER BY COUNT(*) DESC LIMIT 20`

#### Query Pattern Examples

**Query 1: Exact Match with Cursor Pagination**
```sql
SELECT DISTINCT content_id, sender_pubkey, block_time
FROM k_hashtags
WHERE hashtag = 'rust'
  AND block_time < $cursor_time
ORDER BY block_time DESC, content_id
LIMIT 20;
```
Uses: `idx_k_hashtags_by_hashtag_time`

**Query 2: Count Hashtag Usage**
```sql
SELECT COUNT(*) as usage_count
FROM k_hashtags
WHERE hashtag = 'programming';
```
Uses: `idx_k_hashtags_by_hashtag_time`

**Query 3: Autocomplete (Prefix Search)**
```sql
SELECT DISTINCT hashtag
FROM k_hashtags
WHERE hashtag LIKE 'rus%'
ORDER BY block_time DESC
LIMIT 20;
```
Uses: `idx_k_hashtags_pattern`

**Query 4: Contains Search**
```sql
SELECT DISTINCT content_id, sender_pubkey, block_time
FROM k_hashtags
WHERE hashtag LIKE '%script%'
  AND block_time < $cursor_time
ORDER BY block_time DESC, content_id
LIMIT 20;
```
Uses: `idx_k_hashtags_pattern` (slower than prefix, but still indexed)

**Query 5: Trending Hashtags**
```sql
SELECT hashtag, COUNT(*) as count
FROM k_hashtags
WHERE block_time > $time_threshold
GROUP BY hashtag
ORDER BY count DESC
LIMIT 20;
```
Uses: `idx_k_hashtags_trending`

**Query 6: Hashtag Content by User**
```sql
SELECT DISTINCT content_id, block_time
FROM k_hashtags
WHERE hashtag = 'rust'
  AND sender_pubkey = $user_pubkey
  AND block_time < $cursor_time
ORDER BY block_time DESC, content_id
LIMIT 20;
```
Uses: `idx_k_hashtags_by_hashtag_sender`

**Query 7: Top Users by Hashtag**
```sql
SELECT sender_pubkey, COUNT(*) as post_count
FROM k_hashtags
WHERE hashtag = 'programming'
  AND block_time > $time_threshold
GROUP BY sender_pubkey
ORDER BY post_count DESC
LIMIT 20;
```
Uses: `idx_k_hashtags_by_hashtag_sender`

**Note on Performance:**
- Exact match queries (`hashtag = 'value'`) are fastest
- Prefix queries (`hashtag LIKE 'value%'`) are very fast with `text_pattern_ops` index
- Contains queries (`hashtag LIKE '%value%'`) are slower but still benefit from the pattern index
- For autocomplete features, always use prefix queries for best performance

#### 1.1.3 Foreign Key Constraints

```sql
ALTER TABLE k_hashtags
ADD CONSTRAINT fk_k_hashtags_content
FOREIGN KEY (content_id)
REFERENCES k_contents(transaction_id)
ON DELETE CASCADE;
```
- Ensures referential integrity
- Automatically removes hashtags when content is deleted

#### 1.1.4 Schema Version Update

```sql
UPDATE k_vars SET value = '2' WHERE key = 'schema_version';
```

#### 1.1.5 Complete Migration File Template

Here's the complete `v1_to_v2.sql` file for easy reference:

```sql
-- Migration: v1_to_v2
-- Description: Add hashtag support with pattern matching capabilities
-- Date: [DATE]

-- Create k_hashtags table
CREATE TABLE IF NOT EXISTS k_hashtags (
    id BIGSERIAL PRIMARY KEY,
    sender_pubkey BYTEA NOT NULL,
    content_id BYTEA NOT NULL,
    block_time BIGINT NOT NULL,
    hashtag VARCHAR(30) NOT NULL
);

-- Index 1: Exact match with cursor pagination
CREATE INDEX IF NOT EXISTS idx_k_hashtags_by_hashtag_time
ON k_hashtags (hashtag, block_time DESC, content_id);

-- Index 2: Pattern matching (prefix and contains)
CREATE INDEX IF NOT EXISTS idx_k_hashtags_pattern
ON k_hashtags (hashtag text_pattern_ops, block_time DESC);

-- Index 3: Trending hashtags calculation
CREATE INDEX IF NOT EXISTS idx_k_hashtags_trending
ON k_hashtags (block_time DESC, hashtag);

-- Index 4: Hashtag by sender with cursor pagination
CREATE INDEX IF NOT EXISTS idx_k_hashtags_by_hashtag_sender
ON k_hashtags (hashtag, sender_pubkey, block_time DESC, content_id);

-- Foreign key constraint
ALTER TABLE k_hashtags
ADD CONSTRAINT fk_k_hashtags_content
FOREIGN KEY (content_id)
REFERENCES k_contents(transaction_id)
ON DELETE CASCADE;

-- Update schema version
UPDATE k_vars SET value = '2' WHERE key = 'schema_version';
```

### 1.2 Update `up.sql`

**Location:** `K-transaction-processor/src/migrations/schema/up.sql`

#### **Monolithic Schema Update**

The `up.sql` file contains the complete schema inline. Update it as follows:

1. **Add k_hashtags table definition** after the `k_contents` table (around line 170)
2. **Add the 4 indexes** in the appropriate indexes section
3. **Update schema version** from '1' to '2' in line 14:
   ```sql
   INSERT INTO k_vars (key, value) VALUES ('schema_version', '2') ON CONFLICT (key) DO NOTHING;
   ```

**Complete additions to add:**

```sql
-- ============================================================================
-- NEW in v2: k_hashtags table for hashtag management
-- ============================================================================

-- Create k_hashtags table
CREATE TABLE IF NOT EXISTS k_hashtags (
    id BIGSERIAL PRIMARY KEY,
    sender_pubkey BYTEA NOT NULL,
    content_id BYTEA NOT NULL,
    block_time BIGINT NOT NULL,
    hashtag VARCHAR(30) NOT NULL
);

-- Index 1: Exact match with cursor pagination
CREATE INDEX IF NOT EXISTS idx_k_hashtags_by_hashtag_time
ON k_hashtags (hashtag, block_time DESC, content_id);

-- Index 2: Pattern matching (prefix and contains)
CREATE INDEX IF NOT EXISTS idx_k_hashtags_pattern
ON k_hashtags (hashtag text_pattern_ops, block_time DESC);

-- Index 3: Trending hashtags calculation
CREATE INDEX IF NOT EXISTS idx_k_hashtags_trending
ON k_hashtags (block_time DESC, hashtag);

-- Index 4: Hashtag by sender with cursor pagination
CREATE INDEX IF NOT EXISTS idx_k_hashtags_by_hashtag_sender
ON k_hashtags (hashtag, sender_pubkey, block_time DESC, content_id);

-- Foreign key constraint
ALTER TABLE k_hashtags
ADD CONSTRAINT fk_k_hashtags_content
FOREIGN KEY (content_id)
REFERENCES k_contents(transaction_id)
ON DELETE CASCADE;
```

### 1.3 Update `down.sql`

**Location:** `K-transaction-processor/src/migrations/schema/down.sql`

Add the k_hashtags table drop statement after the k_contents line (around line 9):

```sql
DROP TABLE IF EXISTS k_hashtags CASCADE;
```

**Note:** The `CASCADE` option automatically removes all dependent objects (indexes, foreign key constraints), so no need to explicitly drop indexes.

### 1.4 Update `verify_schema_setup` Function

**Location:** `K-transaction-processor/src/database.rs`

#### 1.4.1 Update Schema Version Constant

Change the constant at the top of the file (around line 9):

```rust
const SCHEMA_VERSION: i32 = 2;
```

#### 1.4.2 Add Table Verification

Add `"k_hashtags"` to the tables vector (around line 347-354):

```rust
let tables = vec![
    "k_contents",
    "k_broadcasts",
    "k_votes",
    "k_mentions",
    "k_blocks",
    "k_follows",
    "k_hashtags", // NEW in v2
];
```

#### 1.4.3 Add Index Verification

Add the 4 new hashtag indexes to the `expected_indexes` vector (around line 396-436):

```rust
let expected_indexes = vec![
    // ... existing 33 indexes ...
    // k_hashtags indexes (NEW in v2)
    "idx_k_hashtags_by_hashtag_time",
    "idx_k_hashtags_pattern",
    "idx_k_hashtags_trending",
    "idx_k_hashtags_by_hashtag_sender",
];
```

#### 1.4.4 Update Index Count Verification

Update the expected index count from 33 to 37 (around line 458-467):

```rust
// Verify total count matches expected (37 indexes in v2)
let index_count = sqlx::query("SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_k_%'")
    .fetch_one(pool)
    .await?
    .get::<i64, _>(0);

if index_count == 37 {
    info!(
        "  ✓ Expected 37 K protocol indexes verified (found {})",
        index_count
    );
} else {
    error!("  ✗ Expected 37 K protocol indexes, found {}", index_count);
    all_verified = false;
}
```

### 1.5 Migration Execution Strategy

**Location:** `K-transaction-processor/src/database.rs`

The migration system automatically upgrades the database schema on startup. Two changes are needed:

#### 1.5.1 Add Migration Constant

Add the migration SQL constant after line 206:

```rust
const MIGRATION_V0_TO_V1_SQL: &str = include_str!("migrations/schema/v0_to_v1.sql");
const MIGRATION_V1_TO_V2_SQL: &str = include_str!("migrations/schema/v1_to_v2.sql");
```

#### 1.5.2 Add Migration Logic

Add the v1 to v2 migration logic in the `create_schema` function after the v0 to v1 block (around line 124):

```rust
// v0 -> v1: Add all indexes, constraints, and extensions
if current_version == 0 {
    info!("Applying migration v0 -> v1 (indexes, constraints, extensions)");
    execute_ddl(MIGRATION_V0_TO_V1_SQL, &self.pool).await?;
    current_version = 1;
    info!("Migration v0 -> v1 completed successfully");
}

// v1 -> v2: Add hashtags table and indexes
if current_version == 1 {
    info!("Applying migration v1 -> v2 (hashtags support)");
    execute_ddl(MIGRATION_V1_TO_V2_SQL, &self.pool).await?;
    current_version = 2;
    info!("Migration v1 -> v2 completed successfully");
}
```

**How it works:**
- On startup, the system checks the current schema version
- If version is 1 and `--upgrade-db` flag is set, it automatically applies v1_to_v2 migration
- The migration is idempotent (safe to run multiple times due to `IF NOT EXISTS` clauses)
- Schema version is updated to 2 within the migration SQL file

---

## Implementation Checklist for Step 1

- [ ] Create `v1_to_v2.sql` with k_hashtags table definition (including sender_pubkey column)
- [ ] Add all 4 required indexes to v1_to_v2.sql:
  - [ ] `idx_k_hashtags_by_hashtag_time` (exact match with pagination)
  - [ ] `idx_k_hashtags_pattern` (pattern matching with text_pattern_ops)
  - [ ] `idx_k_hashtags_trending` (time-based aggregation)
  - [ ] `idx_k_hashtags_by_hashtag_sender` (hashtag by sender with pagination)
- [ ] Add foreign key constraint to v1_to_v2.sql
- [ ] Add schema version update to v1_to_v2.sql
- [ ] Update `up.sql` with k_hashtags table, 4 indexes, and schema version change to '2'
- [ ] Update `down.sql` with DROP TABLE k_hashtags CASCADE statement
- [ ] Add `MIGRATION_V1_TO_V2_SQL` constant in database.rs
- [ ] Add v1 to v2 migration logic in `create_schema` function
- [ ] Update `SCHEMA_VERSION` constant from 1 to 2 in database.rs
- [ ] Add "k_hashtags" to tables verification vector
- [ ] Add 4 hashtag indexes to expected_indexes vector
- [ ] Update index count verification from 33 to 37
- [ ] Test automatic migration on development database with `--upgrade-db` flag
- [ ] Verify all indexes are created correctly
- [ ] Verify foreign key constraint works as expected
- [ ] **Test all 7 query patterns with EXPLAIN ANALYZE:**
  - [ ] Query 1: Find all content with #rust hashtag, newest first (pagination)
  - [ ] Query 2: Count how many times #programming was used
  - [ ] Query 3: Find hashtags starting with 'rus' (autocomplete)
  - [ ] Query 4: Find hashtags containing 'script' anywhere
  - [ ] Query 5: Top N trending hashtags in last X days
  - [ ] Query 6: Find all content with #rust by user X (pagination)
  - [ ] Query 7: Top N users posting about #programming
- [ ] Verify correct index usage for each query type using EXPLAIN ANALYZE

---

## Step 2: Hashtag Extraction and Processing in K-transaction-processor

### 2.1 Create Hashtag Extraction Module

**Location:** `K-transaction-processor/src/hashtag_extractor.rs`

Create a new module dedicated to hashtag extraction logic with the following functionality:

#### 2.1.1 Module Structure

```rust
use base64::{Engine as _, engine::general_purpose};
use regex::Regex;
use std::collections::HashSet;

/// Extract hashtags from a base64-encoded message
/// Returns a vector of unique hashtags (lowercase, without # prefix)
pub fn extract_hashtags_from_base64(base64_message: &str) -> Vec<String> {
    // Implementation details below
}

/// Validate and normalize a single hashtag
/// Returns Some(normalized_hashtag) if valid, None otherwise
fn validate_hashtag(hashtag: &str) -> Option<String> {
    // Implementation details below
}
```

#### 2.1.2 Hashtag Extraction Logic

**Function:** `extract_hashtags_from_base64`

**Steps:**
1. Decode base64 string to UTF-8 text
   - Handle decoding errors gracefully (return empty Vec on failure)
   - Log warning if base64 decoding fails

2. Find all potential hashtags using two passes:

   **Pass 1: Extract valid hashtags**
   - Pattern: `(?:^|\s)#([\p{L}\p{N}_]{1,30})(?:\s|$|[.,;!?])`
   - Must be preceded by: start of string OR whitespace
   - Must be followed by: whitespace OR end of string OR punctuation
   - Capture group: Unicode letters, numbers, and underscore (1-30 chars)
   - Supports international characters: `#rust`, `#café`, `#日本語`, `#москва`, `#rust_lang`

   **Pass 2: Detect invalid patterns and warn**
   - Pattern for detection: `#[^\s]+` (any # followed by non-whitespace)
   - Check if any detected pattern was NOT captured in Pass 1
   - For each invalid pattern found:
     - Log WARNING with the invalid pattern and reason
     - Continue processing (don't stop extraction)

   **Examples of warnings to log:**
   - `WARNING: Invalid hashtag pattern 'word#tag' - hashtag must be preceded by space`
   - `WARNING: Invalid hashtag pattern '#verylongtagthatexceeds30characters' - exceeds 30 character limit`
   - `WARNING: Invalid hashtag pattern '#tag@symbol' - contains invalid characters (only letters, numbers, underscore allowed)`

3. Validate each candidate hashtag from Pass 1
   - Must be 1-30 characters (excluding #)
   - Must contain only Unicode letters, numbers, and underscore
   - Convert to lowercase for storage (Unicode-aware case folding)
   - Remove duplicates using HashSet

4. Return unique valid hashtags as Vec<String>
   - Invalid patterns are logged but do NOT appear in the result
   - The function continues and returns all valid hashtags found

**Regex Pattern:**
```regex
#[\p{L}\p{N}_]{1,30}
```

**Pattern Breakdown:**
```
#                     Literal hashtag character
[\p{L}\p{N}_]{1,30}   Character class: 1-30 chars of Unicode letters, numbers, or underscore
```

**Unicode Support:**
- `\p{L}` matches any Unicode letter (Latin, Cyrillic, Chinese, Japanese, Arabic, etc.)
- `\p{N}` matches any Unicode number
- `_` matches underscore
- Rust's `regex` crate has full Unicode support by default

**Boundary Validation (Manual):**
Since Rust's `regex` crate doesn't support lookahead/lookbehind assertions, boundaries are validated manually after regex matching:
- **Before hashtag**: Must be start of string OR whitespace
- **After hashtag**: Must be end of string OR whitespace OR punctuation (.,;!?)
- Invalid boundary patterns are detected in Pass 2 and logged as warnings

**Edge Cases to Handle:**
- Empty message → return empty Vec
- Invalid UTF-8 after base64 decode → return empty Vec
- No hashtags found → return empty Vec
- Duplicate hashtags (different case) → store once in lowercase
- Hashtags at boundaries: "#start", "end #tag", "#middle tag"
- Invalid patterns to detect and warn about (but continue processing other hashtags):
  - `word#tag` (no space before #) → log WARNING, skip this one, continue with others
  - `#tag123word` (no space/punctuation after) → log WARNING, skip this one, continue with others
  - `google.com#hashtag` (part of URL) → log WARNING, skip this one, continue with others
  - `##double` (double hash) → log WARNING, skip this one, continue with others
  - `#` (hash with no text) → log WARNING, skip this one, continue with others
  - `#thistagiswaywaywaytooooooooolong` (>30 chars) → log WARNING, skip this one, continue with others

**Important:** The regex pattern naturally filters out most invalid patterns. Additional validation should detect edge cases that might slip through and log warnings without stopping the extraction process for valid hashtags in the same message.

#### 2.1.3 Implementation Pseudocode

```rust
pub fn extract_hashtags_from_base64(base64_message: &str) -> Vec<String> {
    // 1. Decode base64
    let decoded_text = match decode_base64(base64_message) {
        Ok(text) => text,
        Err(e) => {
            warn!("Failed to decode base64 message: {}", e);
            return vec![];
        }
    };

    // 2. Pass 1: Extract valid hashtags (with Unicode support and manual boundary validation)
    let valid_pattern = Regex::new(r"#[\p{L}\p{N}_]{1,30}").unwrap();
    let mut valid_hashtags = HashSet::new();

    // Use find_iter to get all matches and manually validate boundaries
    for mat in valid_pattern.find_iter(&decoded_text) {
        let start_pos = mat.start();
        let end_pos = mat.end();

        // Check if there's a valid character before the hashtag
        let valid_before = if start_pos == 0 {
            true // Start of string is valid
        } else {
            // Get the character before the #
            let chars_before: Vec<char> = decoded_text[..start_pos].chars().collect();
            if let Some(&prev_char) = chars_before.last() {
                prev_char.is_whitespace() // Must be whitespace before
            } else {
                false
            }
        };

        // Check if there's a valid character after the hashtag
        let valid_after = if end_pos >= decoded_text.len() {
            true // End of string is valid
        } else {
            // Get the character after the hashtag
            let chars_after: Vec<char> = decoded_text[end_pos..].chars().collect();
            if let Some(&next_char) = chars_after.first() {
                next_char.is_whitespace() || ".,;!?".contains(next_char) // Must be whitespace or punctuation
            } else {
                false
            }
        };

        // Only add if both boundaries are valid
        if valid_before && valid_after {
            let hashtag = &mat.as_str()[1..]; // Remove the # prefix
            valid_hashtags.insert(hashtag.to_lowercase());
        }
    }

    // 3. Pass 2: Detect and warn about invalid patterns
    let all_hash_patterns = Regex::new(r"#[^\s]+").unwrap();

    for capture in all_hash_patterns.captures_iter(&decoded_text) {
        let full_match = capture.get(0).unwrap().as_str();
        let tag_part = &full_match[1..]; // Remove the '#'

        // Check if this pattern was already captured as valid
        if !valid_hashtags.contains(&tag_part.to_lowercase()) {
            // This is an invalid pattern - determine why and warn
            if tag_part.len() > 30 {
                warn!("Invalid hashtag pattern '{}' - exceeds 30 character limit", full_match);
            } else if !tag_part.chars().all(|c| c.is_alphanumeric() || c == '_') {
                warn!("Invalid hashtag pattern '{}' - contains invalid characters", full_match);
            } else if tag_part.is_empty() {
                warn!("Invalid hashtag pattern '{}' - empty hashtag", full_match);
            } else {
                // Pattern doesn't match our boundary requirements
                warn!("Invalid hashtag pattern '{}' - invalid boundaries or format", full_match);
            }
        }
    }

    // 4. Return unique valid hashtags as Vec
    valid_hashtags.into_iter().collect()
}
```

**Key behaviors:**
- Valid hashtags are extracted and stored
- Invalid patterns generate warnings but don't block processing
- Function returns all valid hashtags found, regardless of invalid patterns
- Each invalid pattern gets a specific warning message explaining why it's invalid

#### 2.1.4 Validation Function

**Function:** `validate_hashtag` (optional helper, mainly for additional validation)

```rust
fn validate_hashtag(hashtag: &str) -> Option<String> {
    // Check length (1-30 characters)
    if hashtag.is_empty() || hashtag.len() > 30 {
        return None;
    }

    // Check Unicode letters, numbers, and underscore only
    if !hashtag.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return None;
    }

    // Convert to lowercase and return
    Some(hashtag.to_lowercase())
}
```

**Note:** With the two-pass regex approach, this validation function becomes optional since validation is mostly handled by the regex pattern itself. It can be kept for additional safety or removed for simplicity.

#### 2.1.5 Unit Tests

Comprehensive unit tests implemented in `hashtag_extractor.rs` (24 test cases):

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_single_hashtag() {
        let message = general_purpose::STANDARD.encode("Hello #world");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags, vec!["world"]);
    }

    #[test]
    fn test_extract_multiple_hashtags() {
        let message = general_purpose::STANDARD.encode("Check #rust and #programming");
        let mut hashtags = extract_hashtags_from_base64(&message);
        hashtags.sort();
        assert_eq!(hashtags, vec!["programming", "rust"]);
    }

    #[test]
    fn test_hashtag_case_insensitive() {
        let message = general_purpose::STANDARD.encode("#Rust #RUST #rust");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags, vec!["rust"]); // Only one unique
    }

    #[test]
    fn test_hashtag_at_start() {
        let message = general_purpose::STANDARD.encode("#start of message");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags, vec!["start"]);
    }

    #[test]
    fn test_hashtag_at_end() {
        let message = general_purpose::STANDARD.encode("end of message #end");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags, vec!["end"]);
    }

    #[test]
    fn test_hashtag_with_punctuation() {
        let message = general_purpose::STANDARD.encode("Hello #world! How are you?");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags, vec!["world"]);
    }

    #[test]
    fn test_reject_no_space_before() {
        let message = general_purpose::STANDARD.encode("word#tag");
        let hashtags = extract_hashtags_from_base64(&message);
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_reject_url_with_hash() {
        let message = general_purpose::STANDARD.encode("Visit google.com#section");
        let hashtags = extract_hashtags_from_base64(&message);
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_reject_too_long() {
        let message =
            general_purpose::STANDARD.encode("#thistagiswaytoolongandshouldbrejected123456");
        let hashtags = extract_hashtags_from_base64(&message);
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_accept_max_length() {
        let message = general_purpose::STANDARD.encode("#a123456789012345678901234567890"); // 31 chars
        let hashtags = extract_hashtags_from_base64(&message);
        // This should be rejected because it's 31 chars (> 30)
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_accept_exactly_30_chars() {
        let message = general_purpose::STANDARD.encode("#a12345678901234567890123456789"); // exactly 30 chars
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags, vec!["a12345678901234567890123456789"]);
    }

    #[test]
    fn test_numeric_hashtags() {
        let message = general_purpose::STANDARD.encode("#2024 and #123");
        let mut hashtags = extract_hashtags_from_base64(&message);
        hashtags.sort();
        assert_eq!(hashtags, vec!["123", "2024"]);
    }

    #[test]
    fn test_empty_message() {
        let message = general_purpose::STANDARD.encode("");
        let hashtags = extract_hashtags_from_base64(&message);
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_no_hashtags() {
        let message = general_purpose::STANDARD.encode("This message has no hashtags");
        let hashtags = extract_hashtags_from_base64(&message);
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_just_hash_symbol() {
        let message = general_purpose::STANDARD.encode("Just a # symbol");
        let hashtags = extract_hashtags_from_base64(&message);
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_mixed_valid_and_invalid_patterns() {
        // Message contains both valid hashtags and invalid patterns
        // Valid: #rust, #programming
        // Invalid: word#tag, #verylongtagthatshouldberejectedbecauseitstoolong
        let message = general_purpose::STANDARD.encode("#rust and word#tag plus #programming and #verylongtagthatshouldberejectedbecauseitstoolong");
        let hashtags = extract_hashtags_from_base64(&message);

        // Should return only the valid hashtags, warnings logged for invalid ones
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"rust".to_string()));
        assert!(hashtags.contains(&"programming".to_string()));
        // Invalid patterns should NOT be in the result
        assert!(!hashtags.contains(&"tag".to_string()));
        assert!(
            !hashtags.contains(&"verylongtagthatshouldberejectedbecauseitstoolong".to_string())
        );
    }

    #[test]
    fn test_all_invalid_patterns() {
        // Message contains only invalid patterns
        let message = general_purpose::STANDARD.encode("word#tag and another#invalid");
        let hashtags = extract_hashtags_from_base64(&message);

        // Should return empty, but warnings logged (not failing)
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_unicode_hashtags_latin() {
        let message = general_purpose::STANDARD.encode("Bonjour #café et #résumé");
        let mut hashtags = extract_hashtags_from_base64(&message);
        hashtags.sort();
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"café".to_string()));
        assert!(hashtags.contains(&"résumé".to_string()));
    }

    #[test]
    fn test_unicode_hashtags_cyrillic() {
        let message = general_purpose::STANDARD.encode("Привет #москва and #русский");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"москва".to_string()));
        assert!(hashtags.contains(&"русский".to_string()));
    }

    #[test]
    fn test_unicode_hashtags_japanese() {
        let message = general_purpose::STANDARD.encode("こんにちは #日本語 and #東京");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"日本語".to_string()));
        assert!(hashtags.contains(&"東京".to_string()));
    }

    #[test]
    fn test_unicode_hashtags_chinese() {
        let message = general_purpose::STANDARD.encode("你好 #中文 and #北京");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"中文".to_string()));
        assert!(hashtags.contains(&"北京".to_string()));
    }

    #[test]
    fn test_unicode_hashtags_arabic() {
        let message = general_purpose::STANDARD.encode("مرحبا #العربية and #القاهرة");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"العربية".to_string()));
        assert!(hashtags.contains(&"القاهرة".to_string()));
    }

    #[test]
    fn test_hashtag_with_underscore() {
        let message = general_purpose::STANDARD.encode("Check #rust_lang and #web_dev");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"rust_lang".to_string()));
        assert!(hashtags.contains(&"web_dev".to_string()));
    }

    #[test]
    fn test_mixed_unicode_hashtags() {
        let message = general_purpose::STANDARD.encode("#rust #café #日本語 #москва");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 4);
        assert!(hashtags.contains(&"rust".to_string()));
        assert!(hashtags.contains(&"café".to_string()));
        assert!(hashtags.contains(&"日本語".to_string()));
        assert!(hashtags.contains(&"москва".to_string()));
    }

    #[test]
    fn test_all_invalid_patterns() {
        // Message contains only invalid patterns
        let message = base64::encode("word#tag and another#invalid");
        let hashtags = extract_hashtags_from_base64(&message);

        // Should return empty, but warnings logged (not failing)
        assert!(hashtags.is_empty());
    }

    #[test]
    fn test_unicode_hashtags_latin() {
        let message = base64::encode("Bonjour #café et #résumé");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"café".to_string()));
        assert!(hashtags.contains(&"résumé".to_string()));
    }

    #[test]
    fn test_unicode_hashtags_cyrillic() {
        let message = base64::encode("Привет #москва and #русский");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"москва".to_string()));
        assert!(hashtags.contains(&"русский".to_string()));
    }

    #[test]
    fn test_unicode_hashtags_japanese() {
        let message = base64::encode("こんにちは #日本語 and #東京");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"日本語".to_string()));
        assert!(hashtags.contains(&"東京".to_string()));
    }

    #[test]
    fn test_unicode_hashtags_chinese() {
        let message = base64::encode("你好 #中文 and #北京");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"中文".to_string()));
        assert!(hashtags.contains(&"北京".to_string()));
    }

    #[test]
    fn test_unicode_hashtags_arabic() {
        let message = base64::encode("مرحبا #العربية and #القاهرة");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"العربية".to_string()));
        assert!(hashtags.contains(&"القاهرة".to_string()));
    }

    #[test]
    fn test_hashtag_with_underscore() {
        let message = base64::encode("Check #rust_lang and #web_dev");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 2);
        assert!(hashtags.contains(&"rust_lang".to_string()));
        assert!(hashtags.contains(&"web_dev".to_string()));
    }

    #[test]
    fn test_mixed_unicode_hashtags() {
        let message = base64::encode("#rust #café #日本語 #москва");
        let hashtags = extract_hashtags_from_base64(&message);
        assert_eq!(hashtags.len(), 4);
        assert!(hashtags.contains(&"rust".to_string()));
        assert!(hashtags.contains(&"café".to_string()));
        assert!(hashtags.contains(&"日本語".to_string()));
        assert!(hashtags.contains(&"москва".to_string()));
    }
}
```

**Note:** The tests above verify correct extraction behavior. When running the actual implementation, the logs should show WARNING messages for invalid patterns like:
- `WARNING: Invalid hashtag pattern 'word#tag' - invalid boundaries or format`
- `WARNING: Invalid hashtag pattern '#verylongtagthatshouldberejectedbecauseitstoolong' - exceeds 30 character limit`

### 2.2 Register Module in `main.rs`

**Location:** `K-transaction-processor/src/main.rs`

Add the module declaration:

```rust
mod hashtag_extractor;
```

### 2.3 Update `k_protocol.rs`

**Location:** `K-transaction-processor/src/k_protocol.rs`

#### 2.3.1 Add Import

At the top of the file:

```rust
use crate::hashtag_extractor::extract_hashtags_from_base64;
```

#### 2.3.2 Hashtag Extraction Strategy

**Important:** Hashtags will be inserted in the **same database transaction** as content insertion using CTEs (Common Table Expressions), similar to how mentions are handled.

This approach:
- ✅ Ensures atomicity (content + hashtags inserted together)
- ✅ Reduces database calls (single query instead of two)
- ✅ Maintains consistency with existing mentions pattern
- ✅ If content insert fails, hashtags won't be inserted either

The hashtag extraction will be done **before** the database query, and hashtags will be passed as a parameter to the INSERT query.

#### 2.3.3 Update `save_k_post_to_database`

**Location:** Line ~559-664

**Changes needed:**

Modify the existing INSERT queries to include hashtag insertion using CTEs.

**Step 1: Extract hashtags before database query**

Add this code after signature verification (around line 585):

```rust
// Extract hashtags from the message
let hashtags = extract_hashtags_from_base64(&k_post.base64_encoded_message);
```

**Step 2: Update the INSERT queries**

**Case A: Posts without mentions (around line 595-619)**

Replace the existing INSERT query with:

```rust
if hashtags.is_empty() {
    // No hashtags - use simple insert
    let result = sqlx::query(
        r#"
        INSERT INTO k_contents (
            transaction_id, block_time, sender_pubkey, sender_signature,
            base64_encoded_message, content_type, referenced_content_id
        ) VALUES ($1, $2, $3, $4, $5, 'post', NULL)
        ON CONFLICT (sender_signature) DO NOTHING
        "#,
    )
    .bind(&transaction_id_bytes)
    .bind(block_time)
    .bind(&sender_pubkey_bytes)
    .bind(&sender_signature_bytes)
    .bind(&k_post.base64_encoded_message)
    .execute(&self.db_pool)
    .await?;

    if result.rows_affected() == 0 {
        info!("Post transaction {} already exists, skipping", transaction_id);
    } else {
        info!("Saved K post: {}", transaction_id);
    }
} else {
    // With hashtags - use CTE to insert post + hashtags atomically
    let result = sqlx::query(
        r#"
        WITH post_insert AS (
            INSERT INTO k_contents (
                transaction_id, block_time, sender_pubkey, sender_signature,
                base64_encoded_message, content_type, referenced_content_id
            ) VALUES ($1, $2, $3, $4, $5, 'post', NULL)
            ON CONFLICT (sender_signature) DO NOTHING
            RETURNING transaction_id, block_time, sender_pubkey
        )
        INSERT INTO k_hashtags (sender_pubkey, content_id, block_time, hashtag)
        SELECT pi.sender_pubkey, pi.transaction_id, pi.block_time, unnest($6::text[])
        FROM post_insert pi
        "#,
    )
    .bind(&transaction_id_bytes)
    .bind(block_time)
    .bind(&sender_pubkey_bytes)
    .bind(&sender_signature_bytes)
    .bind(&k_post.base64_encoded_message)
    .bind(&hashtags)
    .execute(&self.db_pool)
    .await?;

    if result.rows_affected() == 0 {
        info!("Post transaction {} already exists, skipping", transaction_id);
    } else {
        info!("Saved K post with {} hashtags: {}", hashtags.len(), transaction_id);
    }
}
```

**Case B: Posts with mentions (around line 620-662)**

Replace the existing CTE query with an extended version that includes hashtags:

```rust
if hashtags.is_empty() {
    // With mentions but no hashtags - existing CTE
    let result = sqlx::query(
        r#"
        WITH post_insert AS (
            INSERT INTO k_contents (
                transaction_id, block_time, sender_pubkey, sender_signature,
                base64_encoded_message, content_type, referenced_content_id
            ) VALUES ($1, $2, $3, $4, $5, 'post', NULL)
            ON CONFLICT (sender_signature) DO NOTHING
            RETURNING transaction_id, block_time, sender_pubkey
        )
        INSERT INTO k_mentions (content_id, content_type, mentioned_pubkey, block_time, sender_pubkey)
        SELECT pi.transaction_id, 'post', unnest($6::bytea[]), pi.block_time, pi.sender_pubkey
        FROM post_insert pi
        "#,
    )
    .bind(&transaction_id_bytes)
    .bind(block_time)
    .bind(&sender_pubkey_bytes)
    .bind(&sender_signature_bytes)
    .bind(&k_post.base64_encoded_message)
    .bind(&mentioned_pubkeys_bytes)
    .execute(&self.db_pool)
    .await?;

    if result.rows_affected() == 0 {
        info!("Post transaction {} already exists, skipping", transaction_id);
    } else {
        info!("Saved K post: {}", transaction_id);
    }
} else {
    // With both mentions AND hashtags - extended CTE with two inserts
    let result = sqlx::query(
        r#"
        WITH post_insert AS (
            INSERT INTO k_contents (
                transaction_id, block_time, sender_pubkey, sender_signature,
                base64_encoded_message, content_type, referenced_content_id
            ) VALUES ($1, $2, $3, $4, $5, 'post', NULL)
            ON CONFLICT (sender_signature) DO NOTHING
            RETURNING transaction_id, block_time, sender_pubkey
        ),
        mentions_insert AS (
            INSERT INTO k_mentions (content_id, content_type, mentioned_pubkey, block_time, sender_pubkey)
            SELECT pi.transaction_id, 'post', unnest($6::bytea[]), pi.block_time, pi.sender_pubkey
            FROM post_insert pi
            RETURNING 1
        )
        INSERT INTO k_hashtags (sender_pubkey, content_id, block_time, hashtag)
        SELECT pi.sender_pubkey, pi.transaction_id, pi.block_time, unnest($7::text[])
        FROM post_insert pi
        "#,
    )
    .bind(&transaction_id_bytes)
    .bind(block_time)
    .bind(&sender_pubkey_bytes)
    .bind(&sender_signature_bytes)
    .bind(&k_post.base64_encoded_message)
    .bind(&mentioned_pubkeys_bytes)
    .bind(&hashtags)
    .execute(&self.db_pool)
    .await?;

    if result.rows_affected() == 0 {
        info!("Post transaction {} already exists, skipping", transaction_id);
    } else {
        info!("Saved K post with {} mentions and {} hashtags: {}",
              mentioned_pubkeys_bytes.len(), hashtags.len(), transaction_id);
    }
}
```

**Summary:**
- Hashtags extracted once before database query
- Four cases handled: no mentions/no hashtags, mentions only, hashtags only, both mentions and hashtags
- All insertions are atomic using CTEs
- Single database call per post

#### 2.3.4 Update `save_k_reply_to_database`

**Location:** Line ~666-778

**Changes needed:**

Apply the same CTE pattern as posts. Replies also support mentions, so follow the same logic.

**Step 1: Extract hashtags after signature verification**

```rust
// Extract hashtags from the message
let hashtags = extract_hashtags_from_base64(&k_reply.base64_encoded_message);
```

**Step 2: Update INSERT queries with CTE**

Follow the same pattern as posts:
- If no mentions and no hashtags: simple INSERT
- If no mentions but has hashtags: CTE with reply + hashtags
- If has mentions but no hashtags: CTE with reply + mentions (existing)
- If has both mentions and hashtags: CTE with reply + mentions + hashtags

The SQL structure is identical to posts, just replace `'post'` with `'reply'` and ensure `referenced_content_id` is set to the reply's parent content ID.

#### 2.3.5 Update `save_k_quote_to_database`

**Location:** Line ~780-856

**Changes needed:**

Apply the same CTE pattern as posts and replies. Quotes also support mentions.

**Step 1: Extract hashtags after signature verification**

```rust
// Extract hashtags from the message
let hashtags = extract_hashtags_from_base64(&k_quote.base64_encoded_message);
```

**Step 2: Update INSERT queries with CTE**

Follow the same pattern as posts and replies:
- If no mentions and no hashtags: simple INSERT
- If no mentions but has hashtags: CTE with quote + hashtags
- If has mentions but no hashtags: CTE with quote + mentions (existing)
- If has both mentions and hashtags: CTE with quote + mentions + hashtags

The SQL structure is identical to posts, just replace `'post'` with `'quote'` and ensure `referenced_content_id` is set to the quoted content ID.

### 2.4 Dependencies Update

**Location:** `K-transaction-processor/Cargo.toml`

Ensure the following dependencies are present:

```toml
[dependencies]
base64 = "0.21"
regex = "1.10"
# ... other existing dependencies
```

### 2.5 Error Handling Strategy

**Key principles:**
1. Hashtag extraction happens before database insertion - extraction errors are handled gracefully
2. Empty hashtag results are normal and should not generate warnings (just use simpler query branch)
3. Invalid base64 decoding in extraction returns empty Vec (logged as warning)
4. **Atomic insertion via CTE:** If content insertion fails, hashtags won't be inserted either
5. **Invalid hashtag patterns should generate WARNING logs but continue processing:**
   - Each invalid pattern gets its own warning message
   - Valid hashtags in the same message are still extracted and stored
   - The extraction function returns all valid hashtags found
   - Example log output for message "#rust word#invalid #python":
     ```
     WARNING: Invalid hashtag pattern 'word#invalid' - invalid boundaries or format
     INFO: Saved K post with 2 hashtags: abc123... (rust, python)
     ```

**Error flow:**
1. If extraction fails → empty Vec → use simple INSERT (no CTE)
2. If database transaction fails → entire operation rolls back (content + hashtags)
3. Extraction warnings are logged but don't affect the flow

### 2.6 Performance Considerations

**Optimization strategies:**
1. Use `unnest()` for bulk hashtag insertion (single query per content)
2. Compile regex pattern once (use `lazy_static` or `OnceCell` if needed)
3. Use `HashSet` for deduplication before database insertion
4. Consider max hashtag limit per content (e.g., first 20 hashtags only)

**Example with regex caching:**
```rust
use once_cell::sync::Lazy;
use regex::Regex;

static HASHTAG_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?:^|\s)#([\p{L}\p{N}_]{1,30})(?:\s|$|[.,;!?])").unwrap()
});
```

---

## Implementation Checklist for Step 2

- [ ] Create `hashtag_extractor.rs` module
- [ ] Implement `extract_hashtags_from_base64` function with Unicode support (`\p{L}\p{N}_`)
- [ ] Implement Pass 1: Extract valid hashtags using strict pattern
- [ ] Implement Pass 2: Detect invalid patterns and log warnings
- [ ] Implement `validate_hashtag` function (optional)
- [ ] Add comprehensive unit tests (21+ test cases including Unicode)
  - [ ] Basic tests (single, multiple, case-insensitive, boundaries)
  - [ ] Validation tests (too long, invalid characters, edge cases)
  - [ ] Unicode tests (Latin, Cyrillic, Japanese, Chinese, Arabic)
  - [ ] Underscore support test
  - [ ] Mixed valid/invalid patterns test
- [ ] Register module in `main.rs`
- [ ] Add import in `k_protocol.rs`
- [ ] Update `save_k_post_to_database`:
  - [ ] Extract hashtags before database query
  - [ ] Update no-mentions branch to handle hashtags with CTE
  - [ ] Update with-mentions branch to handle hashtags with extended CTE
- [ ] Update `save_k_reply_to_database` with same CTE pattern
- [ ] Update `save_k_quote_to_database` with same CTE pattern
- [ ] Add required dependencies to `Cargo.toml` (base64, regex, once_cell)
- [ ] Test hashtag extraction with Unicode characters
- [ ] Test atomic insertion (content + hashtags in single transaction)
- [ ] Verify hashtags are stored in lowercase
- [ ] Verify duplicate hashtags are deduplicated (HashSet)
- [ ] **Verify invalid patterns generate warnings but don't stop processing**
- [ ] **Verify valid hashtags are stored even when invalid patterns are present**
- [ ] Test all four cases: no mentions/no hashtags, hashtags only, mentions only, both
- [ ] Run all unit tests and ensure they pass
- [ ] Check logs to confirm warning messages for invalid patterns
- [ ] Verify Unicode hashtags work correctly in database

---

## Notes

### Hashtag Extraction Rules (to be implemented in later steps)
- Extract from `base64_encoded_message` field in posts, replies, and quotes
- Hashtags format: `#word` (must start with #, followed by alphanumeric characters)
- Store in lowercase for case-insensitive matching
- Maximum length: 30 characters (enforced by VARCHAR constraint)
- Multiple hashtags per content are allowed (one row per hashtag)

### Performance Considerations

**Index Strategy:**
- **4 specialized indexes** support 7 different query patterns:
  1. Exact match queries with pagination - `idx_k_hashtags_by_hashtag_time`
  2. Pattern matching (prefix and contains) - `idx_k_hashtags_pattern` with `text_pattern_ops`
  3. Trending calculations - `idx_k_hashtags_trending`
  4. Hashtag by sender with pagination - `idx_k_hashtags_by_hashtag_sender`

**Query Performance:**
- Exact match (`hashtag = 'value'`): **Fastest** - direct B-tree lookup
- Prefix search (`hashtag LIKE 'value%'`): **Fast** - benefits from `text_pattern_ops` index
- Contains search (`hashtag LIKE '%value%'`): **Slower** - requires partial scan even with index
- User-filtered queries (`hashtag + sender_pubkey`): **Fast** - uses composite index
- Recommendation: Use exact match or prefix search for user-facing features

**Database Maintenance:**
- Foreign key constraint ensures data consistency but may impact delete performance (acceptable trade-off)
- Consider VACUUM/ANALYZE after bulk operations
- Monitor index size - `text_pattern_ops` index may be larger than standard B-tree

**Index Size Estimates (for 1M hashtag entries):**
- Standard B-tree indexes: ~20-30 MB each
- `text_pattern_ops` index: ~40-50 MB (stores complete key for pattern matching)
- Composite index (hashtag + sender): ~35-45 MB
- Total estimated size: ~120-160 MB for all 4 indexes

### Pattern Matching Details

**About `text_pattern_ops`:**
- Special operator class for VARCHAR/TEXT columns
- Optimizes LIKE patterns: `'value%'`, `'%value%'`, `'%value'`
- Works with non-C locales (unlike standard B-tree for LIKE)
- Trade-off: Larger index size for better pattern matching performance

**When to use each search type:**
- **Autocomplete/search-as-you-type**: Use prefix (`LIKE 'rus%'`)
- **Tag filter UI**: Use exact match (`= 'rust'`)
- **General search**: Use contains (`LIKE '%rust%'`) with caveat about performance
- **Trending/popular tags**: Use exact match with aggregation

### Future Optimization Opportunities
- Materialized view for trending hashtags (refresh every hour)
- Partial indexes for time-based queries (e.g., only last 30 days)
- pg_trgm extension for even faster fuzzy/similarity matching (if needed)
- Consider splitting hot/cold data (recent vs. archived hashtags)

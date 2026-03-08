import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { AgentConfig, PersonalityConfig, EngagementToggle, CycleResult, Action, KNotification, TokenUsage } from './types.js';
import type { StateManager } from './state.js';
import type { AgentLogger } from './logger.js';

function createMcpTransport(config: AgentConfig): StdioClientTransport {
  return new StdioClientTransport({
    command: 'node',
    args: [config.mcpServerPath],
    env: {
      ...process.env,
      K_MCP_CONFIG: config.mcpConfigPath,
    },
  });
}

// Tools that write to the K network and need state tracking
const ACTION_TOOLS = new Set([
  'k_create_post',
  'k_create_reply',
  'k_quote',
  'k_follow',
  'k_unfollow',
  'k_vote',
  'k_block',
  'k_broadcast_profile',
  'k_send_kas',
]);

function formatEngagementRule(label: string, toggle: EngagementToggle): string {
  return toggle.enabled
    ? `- ${label}: ENABLED (max ${toggle.maxPerCycle} per cycle)`
    : `- ${label}: disabled`;
}

function buildSystemPrompt(personality: PersonalityConfig, followedPubkeys: string[], votedPostIds: string[]): string {
  const p = personality;
  return `You are ${p.identity.name}, an autonomous social agent on the K network (a decentralised social platform built on Kaspa).

IDENTITY:
${p.identity.bio}
Default language: ${p.identity.language}
Multilingual replies: ${p.identity.multilingualReply ? 'yes — match the language of the person you are replying to' : 'no — always reply in ' + p.identity.language}

VOICE & TONE:
- Tone: ${p.voice.tone}
- Emoji usage: ${p.voice.emojiUsage}
- Humor level: ${p.voice.humorLevel}
- Reply length: ${p.voice.averageReplyLength}
- Formality: ${p.voice.formality}

INTERESTS:
- Engage with: ${p.interests.topics.join(', ')}
- Avoid: ${p.interests.avoid.join(', ')}

ENGAGEMENT RULES — STRICT PRIORITY ORDER (process top-to-bottom, stop when global limit is reached):
You MUST process these in order. Complete all actions for a higher-priority rule before moving to the next.
GLOBAL LIMIT: Max ${p.engagement.maxActionsPerCycle} total actions per cycle (across all types). Stop immediately when reached.

 1. ${formatEngagementRule('Reply to mentions (REACTIVE — highest priority)', p.engagement.replyToMentions)}
 2. ${formatEngagementRule('Reply to replies on your posts (REACTIVE)', p.engagement.replyToRepliesOnMyPosts)}
 3. ${formatEngagementRule('Upvote interesting posts (REACTIVE)', p.engagement.upvoteInterestingPosts)}
 4. ${formatEngagementRule('Downvote low-quality/spam posts (REACTIVE)', p.engagement.downvoteLowQualityPosts)}
 5. ${formatEngagementRule('Quote interesting posts (REACTIVE)', p.engagement.quoteInterestingPosts)}
 6. ${formatEngagementRule('Follow back users who interact with you (REACTIVE)', p.engagement.followBackUsersWhoInteract)}
 7. ${formatEngagementRule('Engage with posts from followed users feed (PROACTIVE)', p.engagement.engageWithFollowingFeed)}
 8. ${formatEngagementRule('Engage with posts from watching feed (PROACTIVE)', p.engagement.engageWithWatchingFeed)}
 9. ${formatEngagementRule('Browse and engage with trending hashtags (PROACTIVE)', p.engagement.engageWithTrendingHashtags)}
10. ${formatEngagementRule('Unfollow inactive/irrelevant users (PROACTIVE)', p.engagement.unfollowInactiveUsers)}
11. ${formatEngagementRule('Proactive posting — create original posts (PROACTIVE, lowest priority)', p.engagement.proactivePosting)}${p.engagement.proactivePosting.onlyIfNothingElseToDo ? ' — only if nothing else to do' : ''}

For proactive engagement (rules 7-11), use the read tools (k_get_trending_hashtags, k_get_hashtag_content, k_get_contents_following, k_get_posts_watching) to discover content, then react to what you find interesting.

CONTENT GUIDELINES:
${p.contentGuidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}

ALREADY FOLLOWED USERS (do NOT follow these again):
${followedPubkeys.length > 0 ? followedPubkeys.join('\n') : '(none yet)'}

ALREADY VOTED POSTS (do NOT vote on these again):
${votedPostIds.length > 0 ? votedPostIds.join('\n') : '(none yet)'}

---

Review the new interactions provided and take appropriate actions using the available tools.
Be selective — only engage with content that is relevant and worth responding to.
Respect the limits above strictly.

IMPORTANT — efficiency rules:
- Do NOT re-fetch the same feed or hashtag with a different limit. One fetch per source is enough.
- Do NOT fetch posts for individual users one-by-one (k_get_posts per user). Use the feed and hashtag results you already have to decide what to engage with.
- Use only the provided tools — do not invent tool names (e.g. there is no "k_upvote", use "k_vote" with vote:"upvote").
- Call only ONE write tool per response (k_vote, k_follow, k_create_reply, k_quote, k_create_post, etc.) to avoid UTXO conflicts. Never batch multiple write tools in a single response.
- Act decisively: after 1-2 read calls, start taking actions. Do not spend multiple rounds just browsing.
- If there is nothing interesting to engage with, say so and finish — do not keep searching.

After completing all actions, write a brief summary of what you did and why (2-4 sentences).`;
}

function formatNotificationsForPrompt(notifications: KNotification[]): string {
  if (notifications.length === 0) {
    return 'No new interactions this cycle.';
  }
  return notifications.map((n, i) => {
    const parts = [
      `[${i + 1}] Type: ${n.contentType}`,
      `    From: ${n.userNickname ?? 'unknown'} (${n.userPublicKey})`,
      `    Time: ${new Date(n.timestamp).toISOString()}`,
    ];
    if (n.contentType === 'vote' && n.voteType) {
      parts.push(`    Vote: ${n.voteType} on post ${n.contentId}`);
      if (n.votedContent) parts.push(`    Content: "${n.votedContent.slice(0, 120)}${n.votedContent.length > 120 ? '...' : ''}"`);
    } else if (n.postContent) {
      parts.push(`    Content: "${n.postContent.slice(0, 200)}${n.postContent.length > 200 ? '...' : ''}"`);
    }
    return parts.join('\n');
  }).join('\n\n');
}

export async function ensureProfile(
  config: AgentConfig,
  personality: PersonalityConfig,
  logger: AgentLogger,
): Promise<void> {
  const mcpClient = new Client({ name: 'k-agent', version: '1.0.0' }, { capabilities: {} });

  try {
    await mcpClient.connect(createMcpTransport(config));

    // Get own public key
    const walletResult = await mcpClient.callTool({ name: 'k_get_wallet_info', arguments: {} });
    const walletText = (walletResult.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}';
    const walletData = JSON.parse(walletText) as { publicKey?: string };
    const pubkey = walletData.publicKey;
    if (!pubkey) {
      logger.warn('Could not retrieve public key — skipping profile check', { event: 'profile_check' });
      return;
    }

    // Check if profile already exists and matches personality config
    const userResult = await mcpClient.callTool({ name: 'k_get_user_details', arguments: { user: pubkey } });
    const userText = (userResult.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}';
    const userData = JSON.parse(userText) as { userNickname?: string; postContent?: string };

    // API returns Base64-encoded fields — decode them
    const existingNickname = userData.userNickname
      ? Buffer.from(userData.userNickname, 'base64').toString('utf-8')
      : undefined;
    const existingBio = userData.postContent
      ? Buffer.from(userData.postContent, 'base64').toString('utf-8')
      : undefined;

    const desiredName = personality.identity.name;
    const desiredBio = personality.identity.bio.slice(0, 100);

    if (existingNickname) {
      const nameMatch = existingNickname === desiredName;
      const bioMatch = existingBio === desiredBio;

      if (nameMatch && bioMatch) {
        logger.info('Profile already exists and is up to date', { event: 'profile_check', nickname: existingNickname });
        return;
      }

      logger.info('Profile exists but differs from personality config — updating', {
        event: 'profile_update',
        existingNickname,
        desiredName,
        nameMatch,
        bioMatch,
      });
    } else {
      logger.info('No profile found — broadcasting from personality config', { event: 'profile_broadcast' });
    }
    const broadcastResult = await mcpClient.callTool({
      name: 'k_broadcast_profile',
      arguments: {
        nickname: personality.identity.name,
        profileImage: '',
        introMessage: personality.identity.bio.slice(0, 100),
      },
    });
    const broadcastText = (broadcastResult.content as Array<{ type: string; text: string }>)[0]?.text ?? '';
    logger.info('Profile broadcasted', { event: 'profile_broadcast', result: broadcastText.slice(0, 200) });
  } finally {
    try { await mcpClient.close(); } catch { /* ignore */ }
  }
}

export async function runAgentCycle(
  cycleNumber: number,
  config: AgentConfig,
  personality: PersonalityConfig,
  state: StateManager,
  logger: AgentLogger,
): Promise<CycleResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const actions: Action[] = [];
  const errors: string[] = [];
  let claudeSummary = '';
  let notificationsTotal = 0;
  let notificationsNew = 0;
  const totalUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

  // --- Connect to MCP server ---
  logger.info('Connecting to K MCP server', { event: 'mcp_connect', cycle: cycleNumber });
  const mcpClient = new Client({ name: 'k-agent', version: '1.0.0' }, { capabilities: {} });

  try {
    await mcpClient.connect(createMcpTransport(config));
    logger.info('MCP server connected', { event: 'mcp_connect', cycle: cycleNumber });
  } catch (err: any) {
    const msg = `Failed to connect to MCP server: ${err.message}`;
    logger.error(msg, { event: 'mcp_error', cycle: cycleNumber, error: err.message });
    errors.push(msg);
    return { timestamp, cycleNumber, notificationsTotal, notificationsNew, actionsPerformed: [], claudeSummary, errors, durationMs: Date.now() - startTime, model: config.claudeModel, tokenUsage: { inputTokens: 0, outputTokens: 0 } };
  }

  try {
    // --- Fetch notifications ---
    logger.info('Fetching notifications', { event: 'notifications_fetch', cycle: cycleNumber });
    let rawNotifications: KNotification[] = [];

    try {
      const notifResult = await mcpClient.callTool({ name: 'k_get_notifications', arguments: { limit: 50 } });
      const notifText = (notifResult.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}';
      const notifData = JSON.parse(notifText) as { notifications?: KNotification[] };
      rawNotifications = notifData.notifications ?? [];
      notificationsTotal = rawNotifications.length;
      logger.info('Notifications fetched', { event: 'notifications_fetched', cycle: cycleNumber, count: notificationsTotal });
    } catch (err: any) {
      logger.warn('Failed to fetch notifications — will still proceed', { event: 'mcp_error', cycle: cycleNumber, error: err.message });
    }

    // --- Fetch mentions ---
    try {
      const mentionResult = await mcpClient.callTool({ name: 'k_get_mentions', arguments: { limit: 20 } });
      const mentionText = (mentionResult.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}';
      const mentionData = JSON.parse(mentionText) as { posts?: KNotification[] };
      const mentions = mentionData.posts ?? [];

      // Add mentions as pseudo-notifications (avoid duplicates)
      const existingIds = new Set(rawNotifications.map(n => n.id));
      for (const m of mentions) {
        if (!existingIds.has(m.id)) {
          rawNotifications.push({ ...m, contentType: 'mention', cursor: m.id });
        }
      }
      if (mentions.length > 0) {
        logger.info('Mentions fetched', { event: 'notifications_fetched', cycle: cycleNumber, mentions: mentions.length });
      }
    } catch (err: any) {
      logger.warn('Failed to fetch mentions', { event: 'mcp_error', cycle: cycleNumber, error: err.message });
    }

    // --- Filter already-processed ---
    const newNotifications = rawNotifications.filter(n => !state.isNotificationProcessed(n.id ?? n.cursor));
    notificationsNew = newNotifications.length;

    logger.info('Notifications filtered', {
      event: 'notifications_filtered',
      cycle: cycleNumber,
      total: notificationsTotal,
      newCount: notificationsNew,
    });

    // --- Skip cycle if nothing to do and no proactive engagement is enabled ---
    const e = personality.engagement;
    const hasProactiveEngagement =
      e.proactivePosting.enabled ||
      e.engageWithTrendingHashtags.enabled ||
      e.engageWithFollowingFeed.enabled ||
      e.engageWithWatchingFeed.enabled;
    const hasWork = notificationsNew > 0 || hasProactiveEngagement;
    if (!hasWork) {
      logger.info('No new interactions and no proactive engagement enabled — skipping cycle', { event: 'cycle_skip', cycle: cycleNumber });
      return { timestamp, cycleNumber, notificationsTotal, notificationsNew: 0, actionsPerformed: [], claudeSummary: 'No new interactions.', errors, durationMs: Date.now() - startTime, model: config.claudeModel, tokenUsage: { inputTokens: 0, outputTokens: 0 } };
    }

    // --- Get MCP tools for Claude ---
    logger.info('Fetching MCP tool definitions', { event: 'tools_fetch', cycle: cycleNumber });
    const toolsResult = await mcpClient.listTools();
    const anthropicTools: Anthropic.Tool[] = toolsResult.tools.map(tool => ({
      name: tool.name,
      description: tool.description ?? '',
      input_schema: (tool.inputSchema as Anthropic.Tool['input_schema']),
    }));
    logger.info('MCP tools loaded', { event: 'tools_fetch', cycle: cycleNumber, count: anthropicTools.length });

    // --- Build prompts ---
    const followedPubkeys = state.getAllFollowedPubkeys();
    const votedPostIds = state.getAllVotedPostIds();
    const systemPrompt = buildSystemPrompt(personality, followedPubkeys, votedPostIds);

    let userMessage: string;
    if (notificationsNew > 0) {
      userMessage = `Here are the new interactions since the last cycle:\n\n${formatNotificationsForPrompt(newNotifications)}`;
    } else {
      userMessage = `There are no new notifications this cycle. Use your enabled proactive engagement rules to discover and interact with content — browse trending hashtags, check your following/watching feeds, or create an original post if appropriate. If none of your proactive engagement rules are enabled, simply reply with a brief summary saying nothing was done.`;
    }

    // --- Run Claude agentic loop ---
    logger.info('Starting Claude agent loop', { event: 'claude_start', cycle: cycleNumber, model: config.claudeModel });

    const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];

    let loopCount = 0;
    const MAX_LOOPS = 10; // safety limit
    const maxActions = personality.engagement.maxActionsPerCycle;
    const MAX_TOOL_RESULT_CHARS = 1500;
    const loopTokenLog: Array<{ loop: number; tools: string[]; inputTokens: number; outputTokens: number }> = [];

    while (loopCount < MAX_LOOPS) {
      loopCount++;

      let response: Anthropic.Message;
      try {
        response = await anthropic.messages.create({
          model: config.claudeModel,
          max_tokens: config.claudeMaxTokens,
          system: systemPrompt,
          tools: anthropicTools,
          messages,
        });
      } catch (err: any) {
        // Handle prompt-too-long by trimming older tool results and retrying once
        if (err.status === 400 && err.message?.includes('prompt is too long') && messages.length > 3) {
          logger.warn('Prompt too long — trimming conversation history and retrying', {
            event: 'prompt_trimmed',
            cycle: cycleNumber,
            messagesBefore: messages.length,
          });
          // Keep first user message and last 2 message pairs (assistant + tool_results)
          const firstMessage = messages[0];
          const recentMessages = messages.slice(-4);
          messages.length = 0;
          messages.push(firstMessage, ...recentMessages);
          try {
            response = await anthropic.messages.create({
              model: config.claudeModel,
              max_tokens: config.claudeMaxTokens,
              system: systemPrompt,
              tools: anthropicTools,
              messages,
            });
          } catch (retryErr: any) {
            logger.error('Retry after trim also failed — ending cycle', {
              event: 'cycle_error',
              cycle: cycleNumber,
              error: retryErr.message,
            });
            break;
          }
        } else {
          throw err;
        }
      }

      const callInput = response.usage.input_tokens;
      const callOutput = response.usage.output_tokens;
      totalUsage.inputTokens += callInput;
      totalUsage.outputTokens += callOutput;

      logger.info('Claude API call', {
        event: 'claude_response',
        cycle: cycleNumber,
        loop: loopCount,
        stopReason: response.stop_reason,
        inputTokens: callInput,
        outputTokens: callOutput,
      });

      // Collect tool calls from this response
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];
      const toolNames = toolUseBlocks.map(b => b.name);

      loopTokenLog.push({ loop: loopCount, tools: toolNames, inputTokens: callInput, outputTokens: callOutput });

      // If no tool calls or done, extract summary text and break
      if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        const textBlock = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined;
        claudeSummary = textBlock?.text ?? '';
        break;
      }

      // Execute tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolCall of toolUseBlocks) {
        logger.info('Tool call', {
          event: 'tool_call',
          cycle: cycleNumber,
          tool: toolCall.name,
          input: toolCall.input,
        });

        let resultText = '';

        // Enforce action limit: reject write tools once limit is reached
        if (ACTION_TOOLS.has(toolCall.name) && actions.length >= maxActions) {
          resultText = `Action limit reached (${maxActions} per cycle). No more write actions allowed this cycle.`;
          logger.warn('Action limit reached — skipping tool call', {
            event: 'action_limit',
            cycle: cycleNumber,
            tool: toolCall.name,
            actionsCount: actions.length,
            maxActions,
          });
        } else {
          try {
            // Add random delay between write tools to avoid UTXO conflicts
            if (ACTION_TOOLS.has(toolCall.name)) {
              const delayMs = 10000 + Math.floor(Math.random() * 20000); // 10-30 seconds
              logger.debug('Waiting before write tool to avoid UTXO conflicts', {
                event: 'write_delay',
                cycle: cycleNumber,
                tool: toolCall.name,
                delayMs,
              });
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }

            const mcpResult = await mcpClient.callTool({
              name: toolCall.name,
              arguments: toolCall.input as Record<string, unknown>,
            });
            resultText = (mcpResult.content as Array<{ type: string; text: string }>)[0]?.text ?? '';

            logger.info('Tool result', {
              event: 'tool_result',
              cycle: cycleNumber,
              tool: toolCall.name,
              result: resultText.slice(0, 300),
            });

            // Track action and update state if this is a writing action
            if (ACTION_TOOLS.has(toolCall.name)) {
              const input = toolCall.input as Record<string, unknown>;
              let transactionId: string | undefined;

              try {
                const parsed = JSON.parse(resultText) as Record<string, unknown>;
                transactionId = parsed.transactionId as string | undefined;
              } catch { /* result is not JSON */ }

              // Only count as successful action if transaction was confirmed
              if (transactionId) {
                const action: Action = {
                  type: mapToolToActionType(toolCall.name),
                  toolName: toolCall.name,
                  targetId: (input.postId ?? input.contentId ?? input.id) as string | undefined,
                  targetUser: (input.userPubkey ?? input.authorPubkey) as string | undefined,
                  content: (input.content) as string | undefined,
                  transactionId,
                  rawInput: input,
                };
                actions.push(action);

                // Update state
                if (toolCall.name === 'k_follow') {
                  state.markUserFollowed(input.userPubkey as string);
                } else if (toolCall.name === 'k_vote') {
                  state.markPostVoted(input.postId as string, input.vote as string);
                }

                logger.info('Action performed', { event: 'action_performed', cycle: cycleNumber, action });
              } else {
                logger.warn('Action failed — no transactionId in result', {
                  event: 'action_failed',
                  cycle: cycleNumber,
                  tool: toolCall.name,
                  result: resultText.slice(0, 200),
                });
              }
            }
          } catch (err: any) {
            resultText = `Error: ${err.message}`;
            const errMsg = `Tool ${toolCall.name} failed: ${err.message}`;
            errors.push(errMsg);
            logger.error(errMsg, { event: 'mcp_error', cycle: cycleNumber, tool: toolCall.name, error: err.message });
          }
        }

        // Truncate large tool results to prevent token overflow
        if (resultText.length > MAX_TOOL_RESULT_CHARS) {
          resultText = resultText.slice(0, MAX_TOOL_RESULT_CHARS) + '\n... (truncated)';
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: resultText,
        });
      }

      // Continue conversation
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }

    if (loopCount >= MAX_LOOPS) {
      logger.warn('Agent loop hit safety limit', { event: 'cycle_error', cycle: cycleNumber, maxLoops: MAX_LOOPS });
    }

    // --- Cycle report ---
    // Build top-5 token-consuming operations
    const topLoops = [...loopTokenLog]
      .sort((a, b) => (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens))
      .slice(0, 5)
      .map(l => `loop ${l.loop}: ${l.inputTokens + l.outputTokens} tokens (in:${l.inputTokens} out:${l.outputTokens}) → ${l.tools.length > 0 ? l.tools.join(', ') : 'summary'}`);

    logger.info('Cycle report', {
      event: 'cycle_report',
      cycle: cycleNumber,
      model: config.claudeModel,
      apiCalls: loopCount,
      totalInputTokens: totalUsage.inputTokens,
      totalOutputTokens: totalUsage.outputTokens,
      actionsCount: actions.length,
      summary: claudeSummary.slice(0, 200),
    });
    logger.info('Token breakdown — top 5 operations by token usage', {
      event: 'token_breakdown',
      cycle: cycleNumber,
      totalTokens: totalUsage.inputTokens + totalUsage.outputTokens,
      totalInputTokens: totalUsage.inputTokens,
      totalOutputTokens: totalUsage.outputTokens,
      top5: topLoops,
    });

    // --- Mark all new notifications as processed ---
    const idsToMark = newNotifications.map(n => n.id ?? n.cursor).filter(Boolean);
    if (idsToMark.length > 0) {
      state.markNotificationsProcessed(idsToMark);
    }

  } finally {
    // Always close MCP connection
    try {
      await mcpClient.close();
      logger.debug('MCP server disconnected', { event: 'mcp_disconnect', cycle: cycleNumber });
    } catch { /* ignore close errors */ }
  }

  const durationMs = Date.now() - startTime;
  const result: CycleResult = {
    timestamp,
    cycleNumber,
    notificationsTotal,
    notificationsNew,
    actionsPerformed: actions,
    claudeSummary,
    errors,
    durationMs,
    model: config.claudeModel,
    tokenUsage: totalUsage,
  };

  state.saveCycleResult(result);
  return result;
}

function mapToolToActionType(toolName: string): Action['type'] {
  if (toolName === 'k_create_reply') return 'reply';
  if (toolName === 'k_quote') return 'quote';
  if (toolName === 'k_vote') return 'vote';
  if (toolName === 'k_follow') return 'follow';
  if (toolName === 'k_create_post') return 'post';
  return 'other';
}

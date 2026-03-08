import { Base64 } from 'js-base64';
import { getKaspa, withRpcConnection } from './kaspaService.js';
import type { ResolvedConfig } from '../types/config.js';

const K_PROTOCOL_PREFIX = 'k:';
const K_PROTOCOL_VERSION = '1:';

export interface TransactionResult {
  transactionId: string;
  feeKAS: string;
}

// ── K Protocol Transactions ──────────────────────────────────────────

export async function createPost(
  config: ResolvedConfig,
  content: string,
  mentionedPubkeys: string[] = [],
): Promise<TransactionResult> {
  const kaspa = getKaspa();
  const encodedMessage = Base64.encode(content);
  const mentionedPubkeysStr = JSON.stringify(mentionedPubkeys);
  const signatureData = `${encodedMessage}:${mentionedPubkeysStr}`;

  return submitKProtocolTransaction(config, (pubkey, signature) =>
    `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}post:${pubkey}:${signature}:${encodedMessage}:${mentionedPubkeysStr}`,
    signatureData,
  );
}

export async function createReply(
  config: ResolvedConfig,
  postId: string,
  content: string,
  mentionedPubkeys: string[] = [],
): Promise<TransactionResult> {
  const encodedMessage = Base64.encode(content);
  const mentionedPubkeysStr = JSON.stringify(mentionedPubkeys);
  const signatureData = `${postId}:${encodedMessage}:${mentionedPubkeysStr}`;

  return submitKProtocolTransaction(config, (pubkey, signature) =>
    `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}reply:${pubkey}:${signature}:${postId}:${encodedMessage}:${mentionedPubkeysStr}`,
    signatureData,
  );
}

export async function createVote(
  config: ResolvedConfig,
  postId: string,
  vote: 'upvote' | 'downvote',
  authorPubkey: string,
): Promise<TransactionResult> {
  const signatureData = `${postId}:${vote}:${authorPubkey}`;

  return submitKProtocolTransaction(config, (pubkey, signature) =>
    `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}vote:${pubkey}:${signature}:${postId}:${vote}:${authorPubkey}`,
    signatureData,
  );
}

export async function createQuote(
  config: ResolvedConfig,
  contentId: string,
  content: string,
  authorPubkey: string,
): Promise<TransactionResult> {
  const encodedMessage = Base64.encode(content);
  const signatureData = `${contentId}:${encodedMessage}:${authorPubkey}`;

  return submitKProtocolTransaction(config, (pubkey, signature) =>
    `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}quote:${pubkey}:${signature}:${contentId}:${encodedMessage}:${authorPubkey}`,
    signatureData,
  );
}

export async function createFollow(
  config: ResolvedConfig,
  action: 'follow' | 'unfollow',
  userPubkey: string,
): Promise<TransactionResult> {
  const signatureData = `${action}:${userPubkey}`;

  return submitKProtocolTransaction(config, (pubkey, signature) =>
    `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}follow:${pubkey}:${signature}:${action}:${userPubkey}`,
    signatureData,
  );
}

export async function createBlock(
  config: ResolvedConfig,
  action: 'block' | 'unblock',
  userPubkey: string,
): Promise<TransactionResult> {
  const signatureData = `${action}:${userPubkey}`;

  return submitKProtocolTransaction(config, (pubkey, signature) =>
    `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}block:${pubkey}:${signature}:${action}:${userPubkey}`,
    signatureData,
  );
}

export async function broadcastProfile(
  config: ResolvedConfig,
  nickname: string,
  profileImage: string,
  introMessage: string,
): Promise<TransactionResult> {
  const encodedNickname = Base64.encode(nickname);
  const encodedIntro = Base64.encode(introMessage);
  // profileImage is already Base64 (binary image data)
  const signatureData = `${encodedNickname}:${profileImage}:${encodedIntro}`;

  return submitKProtocolTransaction(config, (pubkey, signature) =>
    `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}broadcast:${pubkey}:${signature}:${encodedNickname}:${profileImage}:${encodedIntro}`,
    signatureData,
  );
}

// ── KAS Transfer ─────────────────────────────────────────────────────

export async function sendKas(
  config: ResolvedConfig,
  destinationAddress: string,
  amountKAS: number,
): Promise<TransactionResult> {
  const kaspa = getKaspa();

  return withRpcConnection(config, async (rpc, networkId) => {
    const { PrivateKey, Address, createTransactions, sompiToKaspaString } = kaspa;

    const privateKeyObj = new PrivateKey(config.privateKey);
    const userAddress = privateKeyObj.toAddress(networkId);

    // Validate destination
    const destAddress = new Address(destinationAddress.trim());

    // Get UTXOs
    const { entries } = await rpc.getUtxosByAddresses([userAddress]);
    if (!entries || entries.length === 0) {
      throw new Error('No UTXOs found. Wallet has no funds.');
    }

    // Convert KAS to sompi
    const amountSompi = BigInt(Math.round(amountKAS * 100_000_000));

    const { transactions } = await createTransactions({
      networkId,
      entries,
      outputs: [{ address: destAddress, amount: amountSompi }],
      changeAddress: userAddress,
      priorityFee: 0n,
    });

    let result: TransactionResult | null = null;
    let totalFees = 0n;

    for (const transaction of transactions) {
      transaction.sign([privateKeyObj]);
      await transaction.submit(rpc);
      totalFees += transaction.feeAmount;
      result = {
        transactionId: transaction.id,
        feeKAS: sompiToKaspaString(totalFees),
      };
    }

    if (!result) throw new Error('Failed to create transaction');
    return result;
  });
}

// ── Balance Query ────────────────────────────────────────────────────

export async function getBalance(config: ResolvedConfig): Promise<{
  address: string;
  balanceKAS: string;
  balanceSompi: string;
  utxoCount: number;
}> {
  const kaspa = getKaspa();

  return withRpcConnection(config, async (rpc, networkId) => {
    const { PrivateKey, sompiToKaspaString } = kaspa;

    const privateKeyObj = new PrivateKey(config.privateKey);
    const userAddress = privateKeyObj.toAddress(networkId);

    const { entries } = await rpc.getUtxosByAddresses([userAddress]);
    let totalSompi = 0n;
    for (const entry of entries || []) {
      const amount = entry?.utxoEntry?.amount || entry?.amount || 0n;
      totalSompi += BigInt(amount);
    }

    return {
      address: userAddress.toString(),
      balanceKAS: sompiToKaspaString(totalSompi),
      balanceSompi: totalSompi.toString(),
      utxoCount: entries?.length || 0,
    };
  });
}

// ── Internal ─────────────────────────────────────────────────────────

async function submitKProtocolTransaction(
  config: ResolvedConfig,
  buildPayload: (pubkey: string, signature: string) => string,
  signatureData: string,
): Promise<TransactionResult> {
  const kaspa = getKaspa();

  return withRpcConnection(config, async (rpc, networkId) => {
    const { PrivateKey, signMessage, createTransactions, sompiToKaspaString } = kaspa;

    const privateKeyObj = new PrivateKey(config.privateKey);
    const userAddress = privateKeyObj.toAddress(networkId);
    const userPublicKey = privateKeyObj.toKeypair().publicKey;

    // Get UTXOs
    const { entries } = await rpc.getUtxosByAddresses([userAddress]);
    if (!entries || !entries[0]) {
      throw new Error('No UTXO entries found. Wallet has no funds.');
    }

    // Sign the data
    const signature = signMessage({
      message: signatureData,
      privateKey: privateKeyObj,
      noAuxRand: false,
    });

    // Build the K protocol payload
    const payload = buildPayload(userPublicKey, signature);

    // Create transaction with single UTXO, empty outputs, payload in data field
    const { transactions } = await createTransactions({
      networkId,
      entries: [entries[0]],
      outputs: [],
      changeAddress: userAddress,
      priorityFee: 0n,
      payload: new TextEncoder().encode(payload),
    });

    let result: TransactionResult | null = null;

    for (const transaction of transactions) {
      transaction.sign([privateKeyObj]);
      await transaction.submit(rpc);
      result = {
        transactionId: transaction.id,
        feeKAS: sompiToKaspaString(transaction.feeAmount),
      };
    }

    if (!result) throw new Error('Transaction creation failed');

    console.error(`[K-MCP] Transaction submitted: ${result.transactionId}`);
    return result;
  });
}

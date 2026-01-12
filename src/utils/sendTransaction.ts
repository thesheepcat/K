import kaspaService from "../services/kaspaService";
import { Base64 } from 'js-base64';
import { toast } from "sonner";
import { KASPA_NETWORKS } from "@/constants/networks";

// Unicode-compatible base64 encoding function using js-base64 library
function encodeToBase64(text: string): string {
  return Base64.encode(text);
}

export interface TransactionOptions {
  privateKey: string;
  userMessage: string;
  type: 'post' | 'reply' | 'broadcast' | 'vote' | 'block' | 'quote' | 'follow';
  postId?: string; // Required for replies, votes, and quotes
  mentionedPubkeys?: string[]; // Array of pubkeys to mention
  vote?: 'upvote' | 'downvote'; // Required for vote type
  mentionedPubkey?: string; // Single pubkey for vote/quote transactions (author's pubkey)
  blockingAction?: 'block' | 'unblock'; // Required for block type
  blockedUserPubkey?: string; // Required for block type
  followingAction?: 'follow' | 'unfollow'; // Required for follow type
  followedUserPubkey?: string; // Required for follow type
  networkId?: string; // Optional network override, defaults to context network
}

export interface TransactionResult {
  id: string;
  feeAmount: bigint;
  feeKAS: string;
}

export const sendKProtocolTransaction = async (options: TransactionOptions): Promise<TransactionResult | null> => {
    const { privateKey, userMessage, type, postId, mentionedPubkeys = [], vote, mentionedPubkey, blockingAction, blockedUserPubkey, followingAction, followedUserPubkey, networkId: overrideNetworkId } = options;

    let rpc: any = null;

    try {
        // Ensure Kaspa SDK is loaded
        await kaspaService.ensureLoaded();
        const kaspa = kaspaService.getKaspa();

        const { Resolver, createTransactions, RpcClient, PrivateKey, PublicKey, signMessage, sompiToKaspaString } = kaspa;

        // Use override network or default to mainnet
        const connectionNetworkId = overrideNetworkId || KASPA_NETWORKS.MAINNET;

        // Get connection settings from user settings
        const storedSettings = localStorage.getItem('kaspa_user_settings');
        let kaspaConnectionType = 'resolver';
        let customKaspaNodeUrl = '';

        if (storedSettings) {
          try {
            const settings = JSON.parse(storedSettings);
            kaspaConnectionType = settings.kaspaConnectionType || 'resolver';
            customKaspaNodeUrl = settings.customKaspaNodeUrl || '';
          } catch (error) {
            console.error('Error parsing settings:', error);
          }
        }

        let rpcConfig;
        if (kaspaConnectionType === 'public-node') {
          // Use public node
          rpcConfig = {
            url: 'wss://node.k-social.network',
            networkId: connectionNetworkId
          };
        } else if (kaspaConnectionType === 'custom-node' && customKaspaNodeUrl.trim()) {
          // Use custom node URL
          rpcConfig = {
            url: customKaspaNodeUrl.trim(),
            networkId: connectionNetworkId
          };
        } else {
          // Use resolver (default for 'resolver' type or fallback)
          rpcConfig = {
            resolver: new Resolver(),
            networkId: connectionNetworkId
          };
        }

        rpc = new RpcClient(rpcConfig);
        await rpc.connect();
        const is_connected = await rpc.isConnected;
        console.log("Connected to Kaspad: ", is_connected);
        const { networkId } = await rpc.getServerInfo();
        console.log("Network ID: ", networkId);
        const privateKeyObject = new PrivateKey(privateKey)
        const userAddressObject = privateKeyObject.toAddress(networkId);
        const userPublicKey = privateKeyObject.toKeypair().publicKey;
        const derivedAddress = new PublicKey(userPublicKey).toAddress(networkId);
        const { entries } = await rpc.getUtxosByAddresses([ userAddressObject ])
        if(!entries[0]) {
            toast.error("No utxo entries found. Fill up your account with some UTXOs");
            return null;
        }
        const selected_utxo = entries[0]
        
        const K_PROTOCOL_PREFIX = "k:"
        const K_PROTOCOL_VERSION = "1:"
        
        const encodedMessage = encodeToBase64(userMessage);
        
        let signatureData: string;
        let messageSignature: string;
        let payload: string;

        if (type === 'post') {
            // Format: k:1:post:sender_pubkey:sender_signature:base64_encoded_message:mentioned_pubkeys
            const mentionedPubkeysStr = JSON.stringify(mentionedPubkeys);
            // Sign the string: base64_encoded_message:mentioned_pubkeys
            signatureData = `${encodedMessage}:${mentionedPubkeysStr}`;
            
            messageSignature = signMessage({
                message: signatureData, 
                privateKey: privateKeyObject, 
                noAuxRand: false
            });
            
            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}post:${userPublicKey}:${messageSignature}:${encodedMessage}:${mentionedPubkeysStr}`;
        } else if (type === 'reply') {
            // Format: k:1:reply:sender_pubkey:sender_signature:post_id:base64_encoded_message:mentioned_pubkeys
            if (!postId) {
                throw new Error('Post ID is required for replies');
            }
            const mentionedPubkeysStr = JSON.stringify(mentionedPubkeys);
            // Sign the string: post_id:base64_encoded_message:mentioned_pubkeys
            signatureData = `${postId}:${encodedMessage}:${mentionedPubkeysStr}`;
            
            messageSignature = signMessage({
                message: signatureData, 
                privateKey: privateKeyObject, 
                noAuxRand: false
            });
            
            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}reply:${userPublicKey}:${messageSignature}:${postId}:${encodedMessage}:${mentionedPubkeysStr}`;
        } else if (type === 'broadcast') {
            // Format: k:1:broadcast:sender_pubkey:sender_signature:base64_encoded_nickname:base64_encoded_profile_image:base64_encoded_message:
            // userMessage contains: "base64_nickname:base64_profile_image:base64_message"
            // Sign the entire data string
            signatureData = userMessage;
            
            messageSignature = signMessage({
                message: signatureData, 
                privateKey: privateKeyObject, 
                noAuxRand: false
            });
            
            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}broadcast:${userPublicKey}:${messageSignature}:${userMessage}`;
        } else if (type === 'vote') {
            // Format: k:1:vote:sender_pubkey:sender_signature:post_id:vote:mentioned_pubkey
            if (!postId) {
                throw new Error('Post ID is required for votes');
            }
            if (!vote || (vote !== 'upvote' && vote !== 'downvote')) {
                throw new Error('Valid vote type (upvote/downvote) is required for votes');
            }
            if (!mentionedPubkey) {
                throw new Error('Mentioned pubkey is required for votes');
            }
            // Sign the string: post_id:vote:mentioned_pubkey
            signatureData = `${postId}:${vote}:${mentionedPubkey}`;
            
            messageSignature = signMessage({
                message: signatureData, 
                privateKey: privateKeyObject, 
                noAuxRand: false
            });
            
            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}vote:${userPublicKey}:${messageSignature}:${postId}:${vote}:${mentionedPubkey}`;
        } else if (type === 'block') {
            // Format: k:1:block:sender_pubkey:sender_signature:blocking_action:blocked_user_pubkey
            if (!blockingAction || (blockingAction !== 'block' && blockingAction !== 'unblock')) {
                throw new Error('Valid blocking action (block/unblock) is required for block transactions');
            }
            if (!blockedUserPubkey) {
                throw new Error('Blocked user pubkey is required for block transactions');
            }
            // Sign the string: blocking_action:blocked_user_pubkey
            signatureData = `${blockingAction}:${blockedUserPubkey}`;

            messageSignature = signMessage({
                message: signatureData,
                privateKey: privateKeyObject,
                noAuxRand: false
            });

            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}block:${userPublicKey}:${messageSignature}:${blockingAction}:${blockedUserPubkey}`;
        } else if (type === 'follow') {
            // Format: k:1:follow:sender_pubkey:sender_signature:following_action:followed_user_pubkey
            if (!followingAction || (followingAction !== 'follow' && followingAction !== 'unfollow')) {
                throw new Error('Valid following action (follow/unfollow) is required for follow transactions');
            }
            if (!followedUserPubkey) {
                throw new Error('Followed user pubkey is required for follow transactions');
            }
            // Sign the string: following_action:followed_user_pubkey
            signatureData = `${followingAction}:${followedUserPubkey}`;

            messageSignature = signMessage({
                message: signatureData,
                privateKey: privateKeyObject,
                noAuxRand: false
            });

            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}follow:${userPublicKey}:${messageSignature}:${followingAction}:${followedUserPubkey}`;
        } else if (type === 'quote') {
            // Format: k:1:quote:sender_pubkey:sender_signature:content_id:base64_encoded_message:mentioned_pubkey
            if (!postId) {
                throw new Error('Post ID is required for quotes');
            }
            if (!mentionedPubkey) {
                throw new Error('Mentioned pubkey (quoted author) is required for quotes');
            }
            // Sign the string: content_id:base64_encoded_message:mentioned_pubkey
            signatureData = `${postId}:${encodedMessage}:${mentionedPubkey}`;

            messageSignature = signMessage({
                message: signatureData,
                privateKey: privateKeyObject,
                noAuxRand: false
            });

            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}quote:${userPublicKey}:${messageSignature}:${postId}:${encodedMessage}:${mentionedPubkey}`;
        } else {
            throw new Error(`Unsupported transaction type: ${type}`);
        }

        const { transactions } = await createTransactions({
            networkId,
            entries: [selected_utxo],
            outputs: [],
            changeAddress: userAddressObject,
            priorityFee: 0n,
            payload: new TextEncoder().encode(payload)
        })

        let transactionResult: TransactionResult | null = null;

        for (const transaction of transactions) {
            transaction.sign([ privateKeyObject ])
            await transaction.submit(rpc)
            console.log("Final transaction:")
            console.log(transaction)
            console.log("Fees:", transaction.feeAmount)
            console.log("Message: " + payload)
            console.log("Transaction ID: " + transaction.id)
            console.log("User address: ", userAddressObject.toString())
            console.log("User pubkey: ", userPublicKey)
            console.log("Derived address: ", derivedAddress.toString())
            
            // Store transaction result for the last transaction
            transactionResult = {
                id: transaction.id,
                feeAmount: transaction.feeAmount,
                feeKAS: sompiToKaspaString(transaction.feeAmount)
            };
        }
        
        /*
        console.log("Signature verified: ", verifyMessage({
            message: signatureData,
            signature: messageSignature,
            publicKey: userPublicKey
        }))
        */

        await rpc.disconnect();

        // Return transaction details for success notification
        return transactionResult;

    } catch (error) {
        console.error("Error sending transaction:", error);
        throw error; // Re-throw to allow components to handle errors
    } finally {
        // Ensure RPC is disconnected even if an error occurred
        if (rpc) {
            try {
                await rpc.disconnect();
            } catch (disconnectError) {
                console.error("Error disconnecting RPC:", disconnectError);
            }
        }
    }
}

export interface SendCoinOptions {
  privateKey: string;
  destinationAddress: string;
  amountKAS: number;
  networkId?: string; // Optional network override, defaults to context network
}

export interface SendSingleUtxoOptions {
  privateKey: string;
  destinationAddress: string;
  networkId?: string; // Optional network override, defaults to context network
}

export const sendCoinTransaction = async (options: SendCoinOptions): Promise<TransactionResult | null> => {
    const { privateKey, destinationAddress, amountKAS, networkId: overrideNetworkId } = options;

    let rpc: any = null;

    try {
        // Ensure Kaspa SDK is loaded
        await kaspaService.ensureLoaded();
        const kaspa = kaspaService.getKaspa();

        const { Resolver, createTransactions, RpcClient, PrivateKey, Address, sompiToKaspaString } = kaspa;

        // Use override network or default to mainnet
        const connectionNetworkId = overrideNetworkId || KASPA_NETWORKS.MAINNET;

        // Get connection settings from user settings
        const storedSettings = localStorage.getItem('kaspa_user_settings');
        let kaspaConnectionType = 'resolver';
        let customKaspaNodeUrl = '';

        if (storedSettings) {
          try {
            const settings = JSON.parse(storedSettings);
            kaspaConnectionType = settings.kaspaConnectionType || 'resolver';
            customKaspaNodeUrl = settings.customKaspaNodeUrl || '';
          } catch (error) {
            console.error('Error parsing settings:', error);
          }
        }

        let rpcConfig;
        if (kaspaConnectionType === 'public-node') {
          // Use public node
          rpcConfig = {
            url: 'wss://node.k-social.network',
            networkId: connectionNetworkId
          };
        } else if (kaspaConnectionType === 'custom-node' && customKaspaNodeUrl.trim()) {
          // Use custom node URL
          rpcConfig = {
            url: customKaspaNodeUrl.trim(),
            networkId: connectionNetworkId
          };
        } else {
          // Use resolver (default for 'resolver' type or fallback)
          rpcConfig = {
            resolver: new Resolver(),
            networkId: connectionNetworkId
          };
        }

        rpc = new RpcClient(rpcConfig);
        await rpc.connect();
        const isConnected = await rpc.isConnected;

        if (!isConnected) {
            throw new Error('Failed to connect to Kaspa network');
        }

        const { networkId } = await rpc.getServerInfo();

        // Setup wallet
        const privateKeyObject = new PrivateKey(privateKey);
        const userAddressObject = privateKeyObject.toAddress(networkId);

        // Create destination address object
        let destinationAddressObject;
        try {
            const trimmedAddress = destinationAddress.trim();

            // Validate address format first using static validate method if available
            if (Address.validate && !Address.validate(trimmedAddress)) {
                throw new Error('Address format validation failed');
            }

            // Create address using constructor
            destinationAddressObject = new Address(trimmedAddress);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Invalid destination address: ${destinationAddress}. ${errorMsg}`);
        }

        // Get fresh UTXOs
        const { entries } = await rpc.getUtxosByAddresses([userAddressObject]);

        if (!entries || entries.length === 0) {
            throw new Error('No UTXOs found. Make sure the address has funds.');
        }

        // Calculate total balance from UTXOs
        let totalBalance = 0n;
        for (const entry of entries) {
            const amount = entry?.utxoEntry?.amount || entry?.amount || 0n;
            totalBalance += BigInt(amount);
        }

        // Convert KAS to sompi (1 KAS = 100,000,000 sompi)
        const amountToSendSompi = BigInt(Math.round(amountKAS * 100000000));

        if (totalBalance < amountToSendSompi) {
            throw new Error(`Insufficient funds. Available: ${sompiToKaspaString(totalBalance)} KAS, Required: ${amountKAS} KAS`);
        }

        // Create transaction
        const { transactions } = await createTransactions({
            networkId,
            entries: entries, // Use all UTXOs for consolidation
            outputs: [{
                address: destinationAddressObject,
                amount: amountToSendSompi
            }],
            changeAddress: userAddressObject,
            priorityFee: 0n
        });

        if (!transactions || transactions.length === 0) {
            throw new Error('Failed to create transaction');
        }

        let transactionResult: TransactionResult | null = null;
        let totalFees = 0n;

        // Sign and submit transactions
        for (const transaction of transactions) {
            transaction.sign([privateKeyObject]);
            await transaction.submit(rpc);
            totalFees += transaction.feeAmount;

            console.log("Coin transaction:");
            console.log(transaction);
            console.log("Transaction ID:", transaction.id);
            console.log("Fees:", transaction.feeAmount);
            console.log(`Sent ${amountKAS} KAS to ${destinationAddressObject.toString()}`);

            // Store transaction result for the last transaction
            transactionResult = {
                id: transaction.id,
                feeAmount: totalFees,
                feeKAS: sompiToKaspaString(totalFees)
            };
        }

        await rpc.disconnect();

        // Return transaction details for success notification
        return transactionResult;

    } catch (error) {
        console.error("Error sending coin transaction:", error);
        throw error; // Re-throw to allow components to handle errors
    } finally {
        // Ensure RPC is disconnected even if an error occurred
        if (rpc) {
            try {
                await rpc.disconnect();
            } catch (disconnectError) {
                console.error("Error disconnecting RPC:", disconnectError);
            }
        }
    }
};

export const sendSingleUtxoTransaction = async (options: SendSingleUtxoOptions): Promise<TransactionResult | null> => {
    const { privateKey, destinationAddress, networkId: overrideNetworkId } = options;

    let rpc: any = null;

    try {
        // Ensure Kaspa SDK is loaded
        await kaspaService.ensureLoaded();
        const kaspa = kaspaService.getKaspa();

        const { Resolver, createTransactions, RpcClient, PrivateKey, Address, sompiToKaspaString } = kaspa;

        // Use override network or default to mainnet
        const connectionNetworkId = overrideNetworkId || KASPA_NETWORKS.MAINNET;

        // Get connection settings from user settings
        const storedSettings = localStorage.getItem('kaspa_user_settings');
        let kaspaConnectionType = 'resolver';
        let customKaspaNodeUrl = '';

        if (storedSettings) {
          try {
            const settings = JSON.parse(storedSettings);
            kaspaConnectionType = settings.kaspaConnectionType || 'resolver';
            customKaspaNodeUrl = settings.customKaspaNodeUrl || '';
          } catch (error) {
            console.error('Error parsing settings:', error);
          }
        }

        let rpcConfig;
        if (kaspaConnectionType === 'public-node') {
          // Use public node
          rpcConfig = {
            url: 'wss://node.k-social.network',
            networkId: connectionNetworkId
          };
        } else if (kaspaConnectionType === 'custom-node' && customKaspaNodeUrl.trim()) {
          // Use custom node URL
          rpcConfig = {
            url: customKaspaNodeUrl.trim(),
            networkId: connectionNetworkId
          };
        } else {
          // Use resolver (default for 'resolver' type or fallback)
          rpcConfig = {
            resolver: new Resolver(),
            networkId: connectionNetworkId
          };
        }

        rpc = new RpcClient(rpcConfig);
        await rpc.connect();
        const isConnected = await rpc.isConnected;

        if (!isConnected) {
            throw new Error('Failed to connect to Kaspa network');
        }

        const { networkId } = await rpc.getServerInfo();

        // Setup wallet
        const privateKeyObject = new PrivateKey(privateKey);
        const userAddressObject = privateKeyObject.toAddress(networkId);

        // Create destination address object
        let destinationAddressObject;
        try {
            const trimmedAddress = destinationAddress.trim();

            // Validate address format first using static validate method if available
            if (Address.validate && !Address.validate(trimmedAddress)) {
                throw new Error('Address format validation failed');
            }

            // Create address using constructor
            destinationAddressObject = new Address(trimmedAddress);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Invalid destination address: ${destinationAddress}. ${errorMsg}`);
        }

        // Get fresh UTXOs
        const { entries } = await rpc.getUtxosByAddresses([userAddressObject]);

        if (!entries || entries.length === 0) {
            throw new Error('No UTXOs found. Make sure the address has funds.');
        }

        // Sort UTXOs by amount (ascending) and select the first one (lowest amount)
        const sortedEntries = [...entries].sort((a, b) => {
            const amountA = a?.utxoEntry?.amount || a?.amount || 0n;
            const amountB = b?.utxoEntry?.amount || b?.amount || 0n;
            return amountA < amountB ? -1 : amountA > amountB ? 1 : 0;
        });

        const selectedUtxo = sortedEntries[0];
        const utxoAmount = selectedUtxo?.utxoEntry?.amount || selectedUtxo?.amount || 0n;

        // Create transaction with single UTXO, empty outputs, and change to destination
        // This sends the entire UTXO (minus fees) to the destination address
        const { transactions } = await createTransactions({
            networkId,
            entries: [selectedUtxo], // Use only the first (lowest amount) UTXO
            outputs: [], // Empty outputs - entire UTXO goes to change address
            changeAddress: destinationAddressObject, // Destination receives UTXO as "change"
            priorityFee: 0n // No priority fee, but network fees are still calculated
        });

        if (!transactions || transactions.length === 0) {
            throw new Error('Failed to create transaction');
        }

        let transactionResult: TransactionResult | null = null;

        // Sign and submit transactions
        for (const transaction of transactions) {
            transaction.sign([privateKeyObject]);
            await transaction.submit(rpc);

            console.log("Send single UTXO transaction:");
            console.log(transaction);
            console.log("Transaction ID:", transaction.id);
            console.log("Fees:", transaction.feeAmount);
            console.log(`UTXO amount: ${sompiToKaspaString(utxoAmount)} KAS`);
            console.log(`Net amount sent: ${sompiToKaspaString(utxoAmount - transaction.feeAmount)} KAS to ${destinationAddressObject.toString()}`);

            // Store transaction result
            transactionResult = {
                id: transaction.id,
                feeAmount: transaction.feeAmount,
                feeKAS: sompiToKaspaString(transaction.feeAmount)
            };
        }

        await rpc.disconnect();

        // Return transaction details for success notification
        return transactionResult;

    } catch (error) {
        console.error("Error sending single UTXO transaction:", error);
        throw error; // Re-throw to allow components to handle errors
    } finally {
        // Ensure RPC is disconnected even if an error occurred
        if (rpc) {
            try {
                await rpc.disconnect();
            } catch (disconnectError) {
                console.error("Error disconnecting RPC:", disconnectError);
            }
        }
    }
};

// Legacy function for backward compatibility
export const sendPostTransaction = async (privateKey: string, userMessage: string): Promise<TransactionResult | null> => {
    return sendKProtocolTransaction({
        privateKey,
        userMessage,
        type: 'post',
        mentionedPubkeys: []
    });
};
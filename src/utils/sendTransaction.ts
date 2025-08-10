import kaspaService from "../services/kaspaService";
import { Base64 } from 'js-base64';
import { toast } from "sonner";

// Unicode-compatible base64 encoding function using js-base64 library
function encodeToBase64(text: string): string {
  return Base64.encode(text);
}

export interface TransactionOptions {
  privateKey: string;
  userMessage: string;
  type: 'post' | 'reply' | 'broadcast' | 'vote';
  postId?: string; // Required for replies and votes
  mentionedPubkeys?: string[]; // Array of pubkeys to mention
  vote?: 'upvote' | 'downvote'; // Required for vote type
  networkId?: string; // Optional network override, defaults to context network
}

export interface TransactionResult {
  id: string;
  feeAmount: bigint;
  feeKAS: string;
}

export const sendTransaction = async (options: TransactionOptions): Promise<TransactionResult | null> => {    
    const { privateKey, userMessage, type, postId, mentionedPubkeys = [], vote, networkId: overrideNetworkId } = options;
    
    try {
        // Ensure Kaspa SDK is loaded
        await kaspaService.ensureLoaded();
        const kaspa = kaspaService.getKaspa();
        
        const { Resolver, createTransactions, RpcClient, PrivateKey, PublicKey, signMessage, sompiToKaspaString } = kaspa;
        
        // Use override network or default to testnet-10 for backward compatibility
        const connectionNetworkId = overrideNetworkId || "testnet-10";
        
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
        if (kaspaConnectionType === 'custom-node' && customKaspaNodeUrl.trim()) {
          // Use custom node URL
          rpcConfig = {
            url: customKaspaNodeUrl.trim(),
            networkId: connectionNetworkId
          };
        } else {
          // Use resolver (default)
          rpcConfig = {
            resolver: new Resolver(),
            networkId: connectionNetworkId
          };
        }
        
        const rpc = new RpcClient(rpcConfig);
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
            // Format: k:1:broadcast:sender_pubkey:sender_signature:base64_encoded_message
            // Sign the string: base64_encoded_message
            signatureData = encodedMessage;
            
            messageSignature = signMessage({
                message: signatureData, 
                privateKey: privateKeyObject, 
                noAuxRand: false
            });
            
            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}broadcast:${userPublicKey}:${messageSignature}:${encodedMessage}`;
        } else if (type === 'vote') {
            // Format: k:1:vote:sender_pubkey:sender_signature:post_id:vote
            if (!postId) {
                throw new Error('Post ID is required for votes');
            }
            if (!vote || (vote !== 'upvote' && vote !== 'downvote')) {
                throw new Error('Valid vote type (upvote/downvote) is required for votes');
            }
            // Sign the string: post_id:vote
            signatureData = `${postId}:${vote}`;
            
            messageSignature = signMessage({
                message: signatureData, 
                privateKey: privateKeyObject, 
                noAuxRand: false
            });
            
            payload = `${K_PROTOCOL_PREFIX}${K_PROTOCOL_VERSION}vote:${userPublicKey}:${messageSignature}:${postId}:${vote}`;
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

        // Return transaction details for success notification
        return transactionResult;

    } catch (error) {
        console.error("Error sending transaction:", error);
        throw error; // Re-throw to allow components to handle errors
    }
}

// Legacy function for backward compatibility
export const sendPostTransaction = async (privateKey: string, userMessage: string): Promise<TransactionResult | null> => {
    return sendTransaction({
        privateKey,
        userMessage,
        type: 'post',
        mentionedPubkeys: []
    });
};
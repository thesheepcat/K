/* tslint:disable */
/* eslint-disable */
/**
 * Returns the version of the Rusty Kaspa framework.
 * @category General
 */
export function version(): string;
/**
 * Configuration for the WASM32 bindings runtime interface.
 * @see {@link IWASM32BindingsConfig}
 * @category General
 */
export function initWASM32Bindings(config: IWASM32BindingsConfig): void;
/**
 * Initialize Rust panic handler in console mode.
 *
 * This will output additional debug information during a panic to the console.
 * This function should be called right after loading WASM libraries.
 * @category General
 */
export function initConsolePanicHook(): void;
/**
 * Initialize Rust panic handler in browser mode.
 *
 * This will output additional debug information during a panic in the browser
 * by creating a full-screen `DIV`. This is useful on mobile devices or where
 * the user otherwise has no access to console/developer tools. Use
 * {@link presentPanicHookLogs} to activate the panic logs in the
 * browser environment.
 * @see {@link presentPanicHookLogs}
 * @category General
 */
export function initBrowserPanicHook(): void;
/**
 * Present panic logs to the user in the browser.
 *
 * This function should be called after a panic has occurred and the
 * browser-based panic hook has been activated. It will present the
 * collected panic logs in a full-screen `DIV` in the browser.
 * @see {@link initBrowserPanicHook}
 * @category General
 */
export function presentPanicHookLogs(): void;
/**
 * r" Deferred promise - an object that has `resolve()` and `reject()`
 * r" functions that can be called outside of the promise body.
 * r" WARNING: This function uses `eval` and can not be used in environments
 * r" where dynamically-created code can not be executed such as web browser
 * r" extensions.
 * r" @category General
 */
export function defer(): Promise<any>;
/**
 * Set the logger log level using a string representation.
 * Available variants are: 'off', 'error', 'warn', 'info', 'debug', 'trace'
 * @category General
 */
export function setLogLevel(level: "off" | "error" | "warn" | "info" | "debug" | "trace"): void;
/**
 * Returns true if the script passed is a pay-to-script-hash (P2SH) format, false otherwise.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function isScriptPayToScriptHash(script: HexString | Uint8Array): boolean;
/**
 * Returns returns true if the script passed is an ECDSA pay-to-pubkey.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function isScriptPayToPubkeyECDSA(script: HexString | Uint8Array): boolean;
/**
 * Returns true if the script passed is a pay-to-pubkey.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function isScriptPayToPubkey(script: HexString | Uint8Array): boolean;
/**
 * Returns the address encoded in a script public key.
 * @param script_public_key - The script public key ({@link ScriptPublicKey}).
 * @param network - The network type.
 * @category Wallet SDK
 */
export function addressFromScriptPublicKey(script_public_key: ScriptPublicKey | HexString, network: NetworkType | NetworkId | string): Address | undefined;
/**
 * Generates a signature script that fits a pay-to-script-hash script.
 * @param redeem_script - The redeem script ({@link HexString} or Uint8Array).
 * @param signature - The signature ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function payToScriptHashSignatureScript(redeem_script: HexString | Uint8Array, signature: HexString | Uint8Array): HexString;
/**
 * Takes a script and returns an equivalent pay-to-script-hash script.
 * @param redeem_script - The redeem script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function payToScriptHashScript(redeem_script: HexString | Uint8Array): ScriptPublicKey;
/**
 * Creates a new script to pay a transaction output to the specified address.
 * @category Wallet SDK
 */
export function payToAddressScript(address: Address | string): ScriptPublicKey;
/**
 *
 *  Kaspa `Address` version (`PubKey`, `PubKey ECDSA`, `ScriptHash`)
 *
 * @category Address
 */
export enum AddressVersion {
  /**
   * PubKey addresses always have the version byte set to 0
   */
  PubKey = 0,
  /**
   * PubKey ECDSA addresses always have the version byte set to 1
   */
  PubKeyECDSA = 1,
  /**
   * ScriptHash addresses always have the version byte set to 8
   */
  ScriptHash = 8,
}
/**
 * `ConnectionStrategy` specifies how the WebSocket `async fn connect()`
 * function should behave during the first-time connectivity phase.
 * @category WebSocket
 */
export enum ConnectStrategy {
  /**
   * Continuously attempt to connect to the server. This behavior will
   * block `connect()` function until the connection is established.
   */
  Retry = 0,
  /**
   * Causes `connect()` to return immediately if the first-time connection
   * has failed.
   */
  Fallback = 1,
}
/**
 * wRPC protocol encoding: `Borsh` or `JSON`
 * @category Transport
 */
export enum Encoding {
  Borsh = 0,
  SerdeJson = 1,
}
/**
 * @category Consensus
 */
export enum NetworkType {
  Mainnet = 0,
  Testnet = 1,
  Devnet = 2,
  Simnet = 3,
}
/**
 * Kaspa Sighash types allowed by consensus
 * @category Consensus
 */
export enum SighashType {
  All = 0,
  None = 1,
  Single = 2,
  AllAnyOneCanPay = 3,
  NoneAnyOneCanPay = 4,
  SingleAnyOneCanPay = 5,
}

/**
 * Interface for configuring workflow-rs WASM32 bindings.
 * 
 * @category General
 */
export interface IWASM32BindingsConfig {
    /**
     * This option can be used to disable the validation of class names
     * for instances of classes exported by Rust WASM32 when passing
     * these classes to WASM32 functions.
     * 
     * This can be useful to programmatically disable checks when using
     * a bundler that mangles class symbol names.
     */
    validateClassNames : boolean;
}



    /**
     * Generic network address representation.
     * 
     * @category General
     */
    export interface INetworkAddress {
        /**
         * IPv4 or IPv6 address.
         */
        ip: string;
        /**
         * Optional port number.
         */
        port?: number;
    }



/**
 * Interface defines the structure of a Script Public Key.
 * 
 * @category Consensus
 */
export interface IScriptPublicKey {
    version : number;
    script: HexString;
}



/**
 * Interface defines the structure of a transaction outpoint (used by transaction input).
 * 
 * @category Consensus
 */
export interface ITransactionOutpoint {
    transactionId: HexString;
    index: number;
}



/**
 * Interface defining the structure of a transaction output.
 * 
 * @category Consensus
 */
export interface ITransactionOutput {
    value: bigint;
    scriptPublicKey: IScriptPublicKey | HexString;

    /** Optional verbose data provided by RPC */
    verboseData?: ITransactionOutputVerboseData;
}

/**
 * TransactionOutput verbose data.
 * 
 * @category Node RPC
 */
export interface ITransactionOutputVerboseData {
    scriptPublicKeyType : string;
    scriptPublicKeyAddress : string;
}



/**
 * Interface defines the structure of a UTXO entry.
 * 
 * @category Consensus
 */
export interface IUtxoEntry {
    /** @readonly */
    address?: Address;
    /** @readonly */
    outpoint: ITransactionOutpoint;
    /** @readonly */
    amount : bigint;
    /** @readonly */
    scriptPublicKey : IScriptPublicKey;
    /** @readonly */
    blockDaaScore: bigint;
    /** @readonly */
    isCoinbase: boolean;
}




/**
 * Interface defining the structure of a block header.
 * 
 * @category Consensus
 */
export interface IHeader {
    hash: HexString;
    version: number;
    parentsByLevel: Array<Array<HexString>>;
    hashMerkleRoot: HexString;
    acceptedIdMerkleRoot: HexString;
    utxoCommitment: HexString;
    timestamp: bigint;
    bits: number;
    nonce: bigint;
    daaScore: bigint;
    blueWork: bigint | HexString;
    blueScore: bigint;
    pruningPoint: HexString;
}

/**
 * Interface defining the structure of a raw block header.
 * 
 * This interface is explicitly used by GetBlockTemplate and SubmitBlock RPCs
 * and unlike `IHeader`, does not include a hash.
 * 
 * @category Consensus
 */
export interface IRawHeader {
    version: number;
    parentsByLevel: Array<Array<HexString>>;
    hashMerkleRoot: HexString;
    acceptedIdMerkleRoot: HexString;
    utxoCommitment: HexString;
    timestamp: bigint;
    bits: number;
    nonce: bigint;
    daaScore: bigint;
    blueWork: bigint | HexString;
    blueScore: bigint;
    pruningPoint: HexString;
}



/**
 * Color range configuration for Hex View.
 * 
 * @category General
 */ 
export interface IHexViewColor {
    start: number;
    end: number;
    color?: string;
    background?: string;
}

/**
 * Configuration interface for Hex View.
 * 
 * @category General
 */ 
export interface IHexViewConfig {
    offset? : number;
    replacementCharacter? : string;
    width? : number;
    colors? : IHexViewColor[];
}



/**
 * A string containing a hexadecimal representation of the data (typically representing for IDs or Hashes).
 * 
 * @category General
 */ 
export type HexString = string;



/**
 * Interface defines the structure of a transaction input.
 * 
 * @category Consensus
 */
export interface ITransactionInput {
    previousOutpoint: ITransactionOutpoint;
    signatureScript?: HexString;
    sequence: bigint;
    sigOpCount: number;
    utxo?: UtxoEntryReference;

    /** Optional verbose data provided by RPC */
    verboseData?: ITransactionInputVerboseData;
}

/**
 * Option transaction input verbose data.
 * 
 * @category Node RPC
 */
export interface ITransactionInputVerboseData { }





/**
 * Interface defines the structure of a serializable UTXO entry.
 * 
 * @see {@link ISerializableTransactionInput}, {@link ISerializableTransaction}
 * @category Wallet SDK
 */
export interface ISerializableUtxoEntry {
    address?: Address;
    amount: bigint;
    scriptPublicKey: ScriptPublicKey;
    blockDaaScore: bigint;
    isCoinbase: boolean;
}

/**
 * Interface defines the structure of a serializable transaction input.
 * 
 * @see {@link ISerializableTransaction}
 * @category Wallet SDK
 */
export interface ISerializableTransactionInput {
    transactionId : HexString;
    index: number;
    sequence: bigint;
    sigOpCount: number;
    signatureScript?: HexString;
    utxo: ISerializableUtxoEntry;
}

/**
 * Interface defines the structure of a serializable transaction output.
 * 
 * @see {@link ISerializableTransaction}
 * @category Wallet SDK
 */
export interface ISerializableTransactionOutput {
    value: bigint;
    scriptPublicKey: IScriptPublicKey;
}

/**
 * Interface defines the structure of a serializable transaction.
 * 
 * Serializable transactions can be produced using 
 * {@link Transaction.serializeToJSON},
 * {@link Transaction.serializeToSafeJSON} and 
 * {@link Transaction.serializeToObject} 
 * functions for processing (signing) in external systems.
 * 
 * Once the transaction is signed, it can be deserialized
 * into {@link Transaction} using {@link Transaction.deserializeFromJSON}
 * and {@link Transaction.deserializeFromSafeJSON} functions. 
 * 
 * @see {@link Transaction},
 * {@link ISerializableTransactionInput},
 * {@link ISerializableTransactionOutput},
 * {@link ISerializableUtxoEntry}
 * 
 * @category Wallet SDK
 */
export interface ISerializableTransaction {
    id? : HexString;
    version: number;
    inputs: ISerializableTransactionInput[];
    outputs: ISerializableTransactionOutput[];
    lockTime: bigint;
    subnetworkId: HexString;
    gas: bigint;
    payload: HexString;
}




/**
 * Interface defining the structure of a transaction.
 * 
 * @category Consensus
 */
export interface ITransaction {
    version: number;
    inputs: ITransactionInput[];
    outputs: ITransactionOutput[];
    lockTime: bigint;
    subnetworkId: HexString;
    gas: bigint;
    payload: HexString;
    /** The mass of the transaction (the mass is undefined or zero unless explicitly set or obtained from the node) */
    mass?: bigint;

    /** Optional verbose data provided by RPC */
    verboseData?: ITransactionVerboseData;
}

/**
 * Optional transaction verbose data.
 * 
 * @category Node RPC
 */
export interface ITransactionVerboseData {
    transactionId : HexString;
    hash : HexString;
    computeMass : bigint;
    blockHash : HexString;
    blockTime : bigint;
}



/**
* Return interface for the {@link RpcClient.getFeeEstimateExperimental} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetFeeEstimateExperimentalResponse {
        estimate : IFeeEstimate;
        verbose? : IFeeEstimateVerboseExperimentalData
    }
    


/**
* Argument interface for the {@link RpcClient.getFeeEstimateExperimental} RPC method.
* Get fee estimate from the node.
*
* @category Node RPC
*/
    export interface IGetFeeEstimateExperimentalRequest { }
    


    /**
     * 
     * 
     * @category Node RPC
     */
    export interface IFeeEstimateVerboseExperimentalData {
        mempoolReadyTransactionsCount : bigint;
        mempoolReadyTransactionsTotalMass : bigint;
        networkMassPerSecond : bigint;
        nextBlockTemplateFeerateMin : number;
        nextBlockTemplateFeerateMedian : number;
        nextBlockTemplateFeerateMax : number;
    }
    


/**
* Return interface for the {@link RpcClient.getFeeEstimate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetFeeEstimateResponse {
        estimate : IFeeEstimate;
    }
    


/**
* Argument interface for the {@link RpcClient.getFeeEstimate} RPC method.
* Get fee estimate from the node.
*
* @category Node RPC
*/
    export interface IGetFeeEstimateRequest { }
    


    /**
     * 
     * 
     * @category Node RPC
     */
    export interface IFeeEstimate {
        /**
         * *Top-priority* feerate bucket. Provides an estimation of the feerate required for sub-second DAG inclusion.
         *
         * Note: for all buckets, feerate values represent fee/mass of a transaction in `sompi/gram` units.
         * Given a feerate value recommendation, calculate the required fee by
         * taking the transaction mass and multiplying it by feerate: `fee = feerate * mass(tx)`
         */

        priorityBucket : IFeerateBucket;
        /**
         * A vector of *normal* priority feerate values. The first value of this vector is guaranteed to exist and
         * provide an estimation for sub-*minute* DAG inclusion. All other values will have shorter estimation
         * times than all `low_bucket` values. Therefor by chaining `[priority] | normal | low` and interpolating
         * between them, one can compose a complete feerate function on the client side. The API makes an effort
         * to sample enough "interesting" points on the feerate-to-time curve, so that the interpolation is meaningful.
         */

        normalBuckets : IFeerateBucket[];
        /**
        * An array of *low* priority feerate values. The first value of this vector is guaranteed to
        * exist and provide an estimation for sub-*hour* DAG inclusion.
        */
        lowBuckets : IFeerateBucket[];
    }
    


    /**
     * 
     * 
     * @category Node RPC
     */
    export interface IFeerateBucket {
        /**
         * The fee/mass ratio estimated to be required for inclusion time <= estimated_seconds
         */
        feerate : number;
        /**
         * The estimated inclusion time for a transaction with fee/mass = feerate
         */
        estimatedSeconds : number;
    }
    


/**
* Return interface for the {@link RpcClient.unban} RPC method.
*
*
* @category Node RPC
*/
    export interface IUnbanResponse { }
    


/**
* Argument interface for the {@link RpcClient.unban} RPC method.
*
*
* @category Node RPC
*/
    export interface IUnbanRequest {
/**
* IPv4 or IPv6 address to unban.
*/
        ip : string;
    }
    


/**
* Return interface for the {@link RpcClient.submitTransaction} RPC method.
*
*
* @category Node RPC
*/
    export interface ISubmitTransactionResponse {
        transactionId : HexString;
    }
    


/**
* Argument interface for the {@link RpcClient.submitTransaction} RPC method.
* Submit transaction to the node.
*
* @category Node RPC
*/
    export interface ISubmitTransactionRequest {
        transaction : Transaction,
        allowOrphan? : boolean
    }
    


/**
* Return interface for the {@link RpcClient.submitTransactionReplacement} RPC method.
*
*
* @category Node RPC
*/
    export interface ISubmitTransactionReplacementResponse {
        transactionId : HexString;
        replacedTransaction: Transaction;
    }
    


/**
* Argument interface for the {@link RpcClient.submitTransactionReplacement} RPC method.
* Submit transaction replacement to the node.
*
* @category Node RPC
*/
    export interface ISubmitTransactionReplacementRequest {
        transaction : Transaction,
    }
    


/**
* Return interface for the {@link RpcClient.submitBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface ISubmitBlockResponse {
        report : ISubmitBlockReport;
    }
    


    /**
     * 
     * @category Node RPC
     */
    export enum SubmitBlockRejectReason {
        /**
         * The block is invalid.
         */
        BlockInvalid = "BlockInvalid",
        /**
         * The node is not synced.
         */
        IsInIBD = "IsInIBD",
        /**
         * Route is full.
         */
        RouteIsFull = "RouteIsFull",
    }

    /**
     * 
     * @category Node RPC
     */
    export interface ISubmitBlockReport {
        type : "success" | "reject";
        reason? : SubmitBlockRejectReason;
    }



/**
* Argument interface for the {@link RpcClient.submitBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface ISubmitBlockRequest {
        block : IRawBlock;
        allowNonDAABlocks: boolean;
    }
    


/**
* Return interface for the {@link RpcClient.resolveFinalityConflict} RPC method.
*
*
* @category Node RPC
*/
    export interface IResolveFinalityConflictResponse { }
    


/**
* Argument interface for the {@link RpcClient.resolveFinalityConflict} RPC method.
*
*
* @category Node RPC
*/
    export interface IResolveFinalityConflictRequest {
        finalityBlockHash: HexString;
    }
    


/**
* Return interface for the {@link RpcClient.getVirtualChainFromBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetVirtualChainFromBlockResponse {
        removedChainBlockHashes : HexString[];
        addedChainBlockHashes : HexString[];
        acceptedTransactionIds : IAcceptedTransactionIds[];
    }
    


/**
* Argument interface for the {@link RpcClient.getVirtualChainFromBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetVirtualChainFromBlockRequest {
        startHash : HexString;
        includeAcceptedTransactionIds: boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getUtxosByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetUtxosByAddressesResponse {
        entries : UtxoEntryReference[];
    }
    


/**
* Argument interface for the {@link RpcClient.getUtxosByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetUtxosByAddressesRequest { 
        addresses : Address[] | string[]
    }
    


/**
* Return interface for the {@link RpcClient.getSubnetwork} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetSubnetworkResponse {
        gasLimit : bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.getSubnetwork} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetSubnetworkRequest {
        subnetworkId : HexString;
    }
    


/**
* Return interface for the {@link RpcClient.getMempoolEntry} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntryResponse {
        mempoolEntry : IMempoolEntry;
    }
    


/**
* Argument interface for the {@link RpcClient.getMempoolEntry} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntryRequest {
        transactionId : HexString;
        includeOrphanPool? : boolean;
        filterTransactionPool? : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getMempoolEntriesByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntriesByAddressesResponse {
        entries : IMempoolEntry[];
    }
    


/**
* Argument interface for the {@link RpcClient.getMempoolEntriesByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntriesByAddressesRequest {
        addresses : Address[] | string[];
        includeOrphanPool? : boolean;
        filterTransactionPool? : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getMempoolEntries} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntriesResponse {
        mempoolEntries : IMempoolEntry[];
    }
    


/**
* Argument interface for the {@link RpcClient.getMempoolEntries} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntriesRequest {
        includeOrphanPool? : boolean;
        filterTransactionPool? : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getHeaders} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetHeadersResponse {
        headers : IHeader[];
    }
    


/**
* Argument interface for the {@link RpcClient.getHeaders} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetHeadersRequest {
        startHash : HexString;
        limit : bigint;
        isAscending : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getCurrentNetwork} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetCurrentNetworkResponse {
        network : string;
    }
    


/**
* Argument interface for the {@link RpcClient.getCurrentNetwork} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetCurrentNetworkRequest { }
    


/**
* Return interface for the {@link RpcClient.getDaaScoreTimestampEstimate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetDaaScoreTimestampEstimateResponse {
        timestamps : bigint[];
    }
    


/**
* Argument interface for the {@link RpcClient.getDaaScoreTimestampEstimate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetDaaScoreTimestampEstimateRequest {
        daaScores : bigint[];
    }
    


/**
* Return interface for the {@link RpcClient.getCurrentBlockColor} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetCurrentBlockColorResponse {
        blue: boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.getCurrentBlockColor} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetCurrentBlockColorRequest {
        hash: HexString;
    }
    


/**
* Return interface for the {@link RpcClient.getBlockTemplate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlockTemplateResponse {
        block : IRawBlock;
    }
    


/**
* Argument interface for the {@link RpcClient.getBlockTemplate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlockTemplateRequest {
        payAddress : Address | string;
/**
* `extraData` can contain a user-supplied plain text or a byte array represented by `Uint8array`.
*/
        extraData? : string | Uint8Array;
    }
    


/**
* Return interface for the {@link RpcClient.getBlocks} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlocksResponse {
        blockHashes : HexString[];
        blocks : IBlock[];
    }
    


/**
* Argument interface for the {@link RpcClient.getBlocks} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlocksRequest {
        lowHash? : HexString;
        includeBlocks : boolean;
        includeTransactions : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlockResponse {
        block : IBlock;
    }
    


/**
* Argument interface for the {@link RpcClient.getBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlockRequest {
        hash : HexString;
        includeTransactions : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getBalancesByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IBalancesByAddressesEntry {
        address : Address;
        balance : bigint;
    }
/**
*
*
* @category Node RPC
*/
    export interface IGetBalancesByAddressesResponse {
        entries : IBalancesByAddressesEntry[];
    }
    


/**
* Argument interface for the {@link RpcClient.getBalancesByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBalancesByAddressesRequest {
        addresses : Address[] | string[];
    }
    


/**
* Return interface for the {@link RpcClient.getBalanceByAddress} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBalanceByAddressResponse {
        balance : bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.getBalanceByAddress} RPC method.
* @category Node RPC
*/
    export interface IGetBalanceByAddressRequest {
        address : Address | string;
    }
    


/**
* Return interface for the {@link RpcClient.estimateNetworkHashesPerSecond} RPC method.
* @category Node RPC
*/
    export interface IEstimateNetworkHashesPerSecondResponse {
        networkHashesPerSecond : bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.estimateNetworkHashesPerSecond} RPC method.
* @category Node RPC
*/
    export interface IEstimateNetworkHashesPerSecondRequest {
        windowSize : number;
        startHash? : HexString;
    }
    


/**
* Return interface for the {@link RpcClient.ban} RPC method.
*
*
* @category Node RPC
*/
    export interface IBanResponse { }
    


/**
* Argument interface for the {@link RpcClient.ban} RPC method.
*
*
* @category Node RPC
*/
    export interface IBanRequest {
/**
* IPv4 or IPv6 address to ban.
*/
        ip : string;
    }
    


/**
* Return interface for the {@link RpcClient.addPeer} RPC method.
*
*
* @category Node RPC
*/
    export interface IAddPeerResponse { }
    


/**
* Argument interface for the {@link RpcClient.addPeer} RPC method.
*
*
* @category Node RPC
*/
    export interface IAddPeerRequest {
        peerAddress : INetworkAddress;
        isPermanent : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getSyncStatus} RPC method.
* @category Node RPC
*/
    export interface IGetSyncStatusResponse {
        isSynced : boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.getSyncStatus} RPC method.
* @category Node RPC
*/
    export interface IGetSyncStatusRequest { }
    


/**
* Return interface for the {@link RpcClient.getServerInfo} RPC method.
* @category Node RPC
*/
    export interface IGetServerInfoResponse {
        rpcApiVersion : number[];
        serverVersion : string;
        networkId : string;
        hasUtxoIndex : boolean;
        isSynced : boolean;
        virtualDaaScore : bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.getServerInfo} RPC method.
* @category Node RPC
*/
    export interface IGetServerInfoRequest { }
    


/**
* Return interface for the {@link RpcClient.shutdown} RPC method.
* @category Node RPC
*/
    export interface IShutdownResponse { }
    


/**
* Argument interface for the {@link RpcClient.shutdown} RPC method.
* @category Node RPC
*/
    export interface IShutdownRequest { }
    


/**
* Return interface for the {@link RpcClient.getSinkBlueScore} RPC method.
* @category Node RPC
*/
    export interface IGetSinkBlueScoreResponse {
        blueScore : bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.getSinkBlueScore} RPC method.
* @category Node RPC
*/
    export interface IGetSinkBlueScoreRequest { }
    


/**
* Return interface for the {@link RpcClient.getSink} RPC method.
* @category Node RPC
*/
    export interface IGetSinkResponse {
        sink : HexString;
    }
    


/**
* Argument interface for the {@link RpcClient.getSink} RPC method.
* @category Node RPC
*/
    export interface IGetSinkRequest { }
    


/**
* Return interface for the {@link RpcClient.getConnections} RPC method.
* @category Node RPC
*/
    export interface IGetConnectionsResponse {
        [key: string]: any
    }
    


/**
* Argument interface for the {@link RpcClient.getConnections} RPC method.
* @category Node RPC
*/
    export interface IGetConnectionsRequest { }
    


/**
* Return interface for the {@link RpcClient.getMetrics} RPC method.
* @category Node RPC
*/
    export interface IGetMetricsResponse {
        [key: string]: any
    }
    


/**
* Argument interface for the {@link RpcClient.getMetrics} RPC method.
* @category Node RPC
*/
    export interface IGetMetricsRequest { }
    


/**
* Return interface for the {@link RpcClient.getPeerAddresses} RPC method.
* @category Node RPC
*/
    export interface IGetPeerAddressesResponse {
        [key: string]: any
    }
    


/**
* Argument interface for the {@link RpcClient.getPeerAddresses} RPC method.
* @category Node RPC
*/
    export interface IGetPeerAddressesRequest { }
    


/**
* Return interface for the {@link RpcClient.getInfo} RPC method.
* @category Node RPC
*/
    export interface IGetInfoResponse {
        p2pId : string;
        mempoolSize : bigint;
        serverVersion : string;
        isUtxoIndexed : boolean;
        isSynced : boolean;
/** GRPC ONLY */
        hasNotifyCommand : boolean;
/** GRPC ONLY */
        hasMessageId : boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.getInfo} RPC method.
* @category Node RPC
*/
    export interface IGetInfoRequest { }
    


/**
* Return interface for the {@link RpcClient.getConnectedPeerInfo} RPC method.
* @category Node RPC
*/
    export interface IGetConnectedPeerInfoResponse {
        [key: string]: any
    }
    


/**
* Argument interface for the {@link RpcClient.getConnectedPeerInfo} RPC method.
* @category Node RPC
*/
    export interface IGetConnectedPeerInfoRequest { }
    


/**
* Return interface for the {@link RpcClient.getCoinSupply} RPC method.
* @category Node RPC
*/
    export interface IGetCoinSupplyResponse {
        maxSompi: bigint;
        circulatingSompi: bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.getCoinSupply} RPC method.
* @category Node RPC
*/
    export interface IGetCoinSupplyRequest { }
    


/**
* Return interface for the {@link RpcClient.getBlockDagInfo} RPC method.
* @category Node RPC
*/
    export interface IGetBlockDagInfoResponse {
        network: string;
        blockCount: bigint;
        headerCount: bigint;
        tipHashes: HexString[];
        difficulty: number;
        pastMedianTime: bigint;
        virtualParentHashes: HexString[];
        pruningPointHash: HexString;
        virtualDaaScore: bigint;
        sink: HexString;
    }
    


/**
* Argument interface for the {@link RpcClient.getBlockDagInfo} RPC method.
* @category Node RPC
*/
    export interface IGetBlockDagInfoRequest { }
    


/**
* Return interface for the {@link RpcClient.getBlockCount} RPC method.
* @category Node RPC
*/
    export interface IGetBlockCountResponse {
        headerCount : bigint;
        blockCount : bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.getBlockCount} RPC method.
* @category Node RPC
*/
    export interface IGetBlockCountRequest { }
    


/**
* Return interface for the {@link RpcClient.ping} RPC method.
* @category Node RPC
*/
    export interface IPingResponse {
        message?: string;
    }
    


/**
* Argument interface for the {@link RpcClient.ping} RPC method.
* @category Node RPC
*/
    export interface IPingRequest {
        message?: string;
    }
    


    /**
     * Accepted transaction IDs.
     * 
     * @category Node RPC
     */
    export interface IAcceptedTransactionIds {
        acceptingBlockHash : HexString;
        acceptedTransactionIds : HexString[];
    }



        /**
         * Interface defining the structure of a block.
         * 
         * @category Consensus
         */
        export interface IBlock {
            header: IHeader;
            transactions: ITransaction[];
            verboseData?: IBlockVerboseData;
        }

        /**
         * Interface defining the structure of a block verbose data.
         * 
         * @category Node RPC
         */
        export interface IBlockVerboseData {
            hash: HexString;
            difficulty: number;
            selectedParentHash: HexString;
            transactionIds: HexString[];
            isHeaderOnly: boolean;
            blueScore: number;
            childrenHashes: HexString[];
            mergeSetBluesHashes: HexString[];
            mergeSetRedsHashes: HexString[];
            isChainBlock: boolean;
        }

        /**
         * Interface defining the structure of a raw block.
         * 
         * Raw block is a structure used by GetBlockTemplate and SubmitBlock RPCs
         * and differs from `IBlock` in that it does not include verbose data and carries
         * `IRawHeader` that does not include a cached block hash.
         * 
         * @category Consensus
         */
        export interface IRawBlock {
            header: IRawHeader;
            transactions: ITransaction[];
        }

        


            /**
             * Mempool entry.
             * 
             * @category Node RPC
             */
            export interface IMempoolEntry {
                fee : bigint;
                transaction : ITransaction;
                isOrphan : boolean;
            }
        



        /**
         * `WebSocketConfig` is used to configure the `WebSocket`.
         * 
         * @category WebSocket
         */
        export interface IWebSocketConfig {
            /** Maximum size of the WebSocket message. */
            maxMessageSize: number,
            /** Maximum size of the WebSocket frame. */
            maxFrameSize: number,
        }
        



        /**
         * `ConnectOptions` is used to configure the `WebSocket` connectivity behavior.
         * 
         * @category WebSocket
         */
        export interface IConnectOptions {
            /**
             * Indicates if the `async fn connect()` method should return immediately
             * or wait for connection to occur or fail before returning.
             * (default is `true`)
             */
            blockAsyncConnect? : boolean,
            /**
             * ConnectStrategy used to configure the retry or fallback behavior.
             * In retry mode, the WebSocket will continuously attempt to connect to the server.
             * (default is {link ConnectStrategy.Retry}).
             */
            strategy?: ConnectStrategy | string,
            /** 
             * A custom URL that will change the current URL of the WebSocket.
             * If supplied, the URL will override the use of resolver.
             */
            url?: string,
            /**
             * A custom connection timeout in milliseconds.
             */
            timeoutDuration?: number,
            /** 
             * A custom retry interval in milliseconds.
             */
            retryInterval?: number,
        }
        


    /**
     * New block template notification event is produced when a new block
     * template is generated for mining in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface INewBlockTemplate {
        [key: string]: any;
    }
    


    /**
     * Pruning point UTXO set override notification event is produced when the
     * UTXO set override for the pruning point changes in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IPruningPointUtxoSetOverride {
        [key: string]: any;
    }
    


    /**
     * Virtual DAA score changed notification event is produced when the virtual
     * Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IVirtualDaaScoreChanged {
        [key: string]: any;
    }
    


    /**
     * Sink blue score changed notification event is produced when the blue
     * score of the sink block changes in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface ISinkBlueScoreChanged {
        [key: string]: any;
    }
    


    /**
     * UTXOs changed notification event is produced when the set
     * of unspent transaction outputs (UTXOs) changes in the
     * Kaspa BlockDAG. The event notification is scoped to the
     * monitored list of addresses specified during the subscription.
     * 
     * @category Node RPC
     */
    export interface IUtxosChanged {
        [key: string]: any;
    }
    


    /**
     * Finality conflict resolved notification event is produced when a finality
     * conflict in the Kaspa BlockDAG is resolved.
     * 
     * @category Node RPC
     */
    export interface IFinalityConflictResolved {
        [key: string]: any;
    }
    


    /**
     * Finality conflict notification event is produced when a finality
     * conflict occurs in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IFinalityConflict {
        [key: string]: any;
    }
    


    /**
     * Virtual chain changed notification event is produced when the virtual
     * chain changes in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IVirtualChainChanged {
        [key: string]: any;
    }
    


    /**
     * Block added notification event is produced when a new
     * block is added to the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IBlockAdded {
        [key: string]: any;
    }
    



/**
 * RPC notification events.
 * 
 * @see {RpcClient.addEventListener}, {RpcClient.removeEventListener}
 */
export enum RpcEventType {
    Connect = "connect",
    Disconnect = "disconnect",
    BlockAdded = "block-added",
    VirtualChainChanged = "virtual-chain-changed",
    FinalityConflict = "finality-conflict",
    FinalityConflictResolved = "finality-conflict-resolved",
    UtxosChanged = "utxos-changed",
    SinkBlueScoreChanged = "sink-blue-score-changed",
    VirtualDaaScoreChanged = "virtual-daa-score-changed",
    PruningPointUtxoSetOverride = "pruning-point-utxo-set-override",
    NewBlockTemplate = "new-block-template",
}

/**
 * RPC notification data payload.
 * 
 * @category Node RPC
 */
export type RpcEventData = IBlockAdded 
    | IVirtualChainChanged 
    | IFinalityConflict 
    | IFinalityConflictResolved 
    | IUtxosChanged 
    | ISinkBlueScoreChanged 
    | IVirtualDaaScoreChanged 
    | IPruningPointUtxoSetOverride 
    | INewBlockTemplate;

/**
 * RPC notification event data map.
 * 
 * @category Node RPC
 */
export type RpcEventMap = {
    "connect" : undefined,
    "disconnect" : undefined,
    "block-added" : IBlockAdded,
    "virtual-chain-changed" : IVirtualChainChanged,
    "finality-conflict" : IFinalityConflict,
    "finality-conflict-resolved" : IFinalityConflictResolved,
    "utxos-changed" : IUtxosChanged,
    "sink-blue-score-changed" : ISinkBlueScoreChanged,
    "virtual-daa-score-changed" : IVirtualDaaScoreChanged,
    "pruning-point-utxo-set-override" : IPruningPointUtxoSetOverride,
    "new-block-template" : INewBlockTemplate,
}

/**
 * RPC notification event.
 * 
 * @category Node RPC
 */
export type RpcEvent = {
    [K in keyof RpcEventMap]: { event: K, data: RpcEventMap[K] }
}[keyof RpcEventMap];

/**
 * RPC notification callback type.
 * 
 * This type is used to define the callback function that is called when an RPC notification is received.
 * 
 * @see {@link RpcClient.subscribeVirtualDaaScoreChanged},
 * {@link RpcClient.subscribeUtxosChanged}, 
 * {@link RpcClient.subscribeVirtualChainChanged},
 * {@link RpcClient.subscribeBlockAdded},
 * {@link RpcClient.subscribeFinalityConflict},
 * {@link RpcClient.subscribeFinalityConflictResolved},
 * {@link RpcClient.subscribeSinkBlueScoreChanged},
 * {@link RpcClient.subscribePruningPointUtxoSetOverride},
 * {@link RpcClient.subscribeNewBlockTemplate},
 * 
 * @category Node RPC
 */
export type RpcEventCallback = (event: RpcEvent) => void;




    /**
     * RPC Resolver connection options
     * 
     * @category Node RPC
     */
    export interface IResolverConnect {
        /**
         * RPC encoding: `borsh` (default) or `json`
         */
        encoding?: Encoding | string;
        /**
         * Network identifier: `mainnet` or `testnet-11` etc.
         */
        networkId?: NetworkId | string;
    }
    


    /**
     * RPC Resolver configuration options
     * 
     * @category Node RPC
     */
    export interface IResolverConfig {
        /**
         * Optional URLs for one or multiple resolvers.
         */
        urls?: string[];
        /**
         * Use strict TLS for RPC connections.
         * If not set or `false` (default), the resolver will
         * provide the best available connection regardless of
         * whether this connection supports TLS or not.
         * If set to `true`, the resolver will only provide
         * TLS-enabled connections.
         * 
         * This setting is ignored in the browser environment
         * when the browser navigator location is `https`.
         * In which case the resolver will always use TLS-enabled
         * connections.
         */
        tls?: boolean;
    }
    


        interface RpcClient {
            /**
            * @param {RpcEventCallback} callback
            */
            addEventListener(callback:RpcEventCallback): void;
            /**
            * @param {RpcEventType} event
            * @param {RpcEventCallback} [callback]
            */
            addEventListener<M extends keyof RpcEventMap>(
                event: M,
                callback: (eventData: RpcEventMap[M]) => void
            )
        }


    /**
     * RPC client configuration options
     * 
     * @category Node RPC
     */
    export interface IRpcConfig {
        /**
         * An instance of the {@link Resolver} class to use for an automatic public node lookup.
         * If supplying a resolver, the `url` property is ignored.
         */
        resolver? : Resolver,
        /**
         * URL for wRPC node endpoint
         */
        url?: string;
        /**
         * RPC encoding: `borsh` or `json` (default is `borsh`)
         */
        encoding?: Encoding;
        /**
         * Network identifier: `mainnet`, `testnet-10` etc.
         * `networkId` is required when using a resolver.
         */
        networkId?: NetworkId | string;
    }
    

/**
 *
 * Abortable trigger wraps an `Arc<AtomicBool>`, which can be cloned
 * to signal task terminating using an atomic bool.
 *
 * ```text
 * let abortable = Abortable::default();
 * let result = my_task(abortable).await?;
 * // ... elsewhere
 * abortable.abort();
 * ```
 *
 * @category General
 */
export class Abortable {
  free(): void;
  constructor();
  isAborted(): boolean;
  abort(): void;
  check(): void;
  reset(): void;
}
/**
 * Error emitted by [`Abortable`].
 * @category General
 */
export class Aborted {
  private constructor();
  free(): void;
}
/**
 * Kaspa [`Address`] struct that serializes to and from an address format string: `kaspa:qz0s...t8cv`.
 *
 * @category Address
 */
export class Address {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(address: string);
  static validate(address: string): boolean;
  /**
   * Convert an address to a string.
   */
  toString(): string;
  short(n: number): string;
  readonly version: string;
  readonly prefix: string;
  set setPrefix(value: string);
  readonly payload: string;
}
/**
 * @category General
 */
export class Hash {
  free(): void;
  constructor(hex_str: string);
  toString(): string;
}
/**
 * Kaspa Block Header
 *
 * @category Consensus
 */
export class Header {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(js_value: Header | IHeader | IRawHeader);
  /**
   * Finalizes the header and recomputes (updates) the header hash
   * @return { String } header hash
   */
  finalize(): string;
  /**
   * Obtain `JSON` representation of the header. JSON representation
   * should be obtained using WASM, to ensure proper serialization of
   * big integers.
   */
  asJSON(): string;
  getBlueWorkAsHex(): string;
  version: number;
  timestamp: bigint;
  bits: number;
  nonce: bigint;
  daaScore: bigint;
  blueScore: bigint;
  readonly hash: string;
  get hashMerkleRoot(): string;
  set hashMerkleRoot(value: any);
  get acceptedIdMerkleRoot(): string;
  set acceptedIdMerkleRoot(value: any);
  get utxoCommitment(): string;
  set utxoCommitment(value: any);
  get pruningPoint(): string;
  set pruningPoint(value: any);
  parentsByLevel: any;
  get blueWork(): bigint;
  set blueWork(value: any);
}
/**
 *
 * NetworkId is a unique identifier for a kaspa network instance.
 * It is composed of a network type and an optional suffix.
 *
 * @category Consensus
 */
export class NetworkId {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(value: any);
  toString(): string;
  addressPrefix(): string;
  type: NetworkType;
  get suffix(): number | undefined;
  set suffix(value: number | null | undefined);
  readonly id: string;
}
/**
 *
 * Data structure representing a Node connection endpoint
 * as provided by the {@link Resolver}.
 *
 * @category Node RPC
 */
export class NodeDescriptor {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * The unique identifier of the node.
   */
  uid: string;
  /**
   * The URL of the node WebSocket (wRPC URL).
   */
  url: string;
}
/**
 *
 * Resolver is a client for obtaining public Kaspa wRPC URL.
 *
 * Resolver queries a list of public Kaspa Resolver URLs using HTTP to fetch
 * wRPC endpoints for the given encoding, network identifier and other
 * parameters. It then provides this information to the {@link RpcClient}.
 *
 * Each time {@link RpcClient} disconnects, it will query the resolver
 * to fetch a new wRPC URL.
 *
 * ```javascript
 * // using integrated public URLs
 * let rpc = RpcClient({
 *     resolver: new Resolver(),
 *     networkId : "mainnet"
 * });
 *
 * // specifying custom resolver URLs
 * let rpc = RpcClient({
 *     resolver: new Resolver({urls: ["<resolver-url>",...]}),
 *     networkId : "mainnet"
 * });
 * ```
 *
 * @see {@link IResolverConfig}, {@link IResolverConnect}, {@link RpcClient}
 * @category Node RPC
 */
export class Resolver {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Fetches a public Kaspa wRPC endpoint for the given encoding and network identifier.
   * @see {@link Encoding}, {@link NetworkId}, {@link Node}
   */
  getNode(encoding: Encoding, network_id: NetworkId | string): Promise<NodeDescriptor>;
  /**
   * Fetches a public Kaspa wRPC endpoint URL for the given encoding and network identifier.
   * @see {@link Encoding}, {@link NetworkId}
   */
  getUrl(encoding: Encoding, network_id: NetworkId | string): Promise<string>;
  /**
   * Connect to a public Kaspa wRPC endpoint for the given encoding and network identifier
   * supplied via {@link IResolverConnect} interface.
   * @see {@link IResolverConnect}, {@link RpcClient}
   */
  connect(options: IResolverConnect | NetworkId | string): Promise<RpcClient>;
  /**
   * Creates a new Resolver client with the given
   * configuration supplied as {@link IResolverConfig}
   * interface. If not supplied, the default configuration
   * containing a list of community-operated resolvers
   * will be used.
   */
  constructor(args?: IResolverConfig | string[] | null);
  /**
   * List of public Kaspa Resolver URLs.
   */
  readonly urls: string[] | undefined;
}
/**
 *
 *
 * Kaspa RPC client uses ([wRPC](https://github.com/workflow-rs/workflow-rs/tree/master/rpc))
 * interface to connect directly with Kaspa Node. wRPC supports
 * two types of encodings: `borsh` (binary, default) and `json`.
 *
 * There are two ways to connect: Directly to any Kaspa Node or to a
 * community-maintained public node infrastructure using the {@link Resolver} class.
 *
 * **Connecting to a public node using a resolver**
 *
 * ```javascript
 * let rpc = new RpcClient({
 *    resolver : new Resolver(),
 *    networkId : "mainnet",
 * });
 *
 * await rpc.connect();
 * ```
 *
 * **Connecting to a Kaspa Node directly**
 *
 * ```javascript
 * let rpc = new RpcClient({
 *    // if port is not provided it will default
 *    // to the default port for the networkId
 *    url : "127.0.0.1",
 *    networkId : "mainnet",
 * });
 * ```
 *
 * **Example usage**
 *
 * ```javascript
 *
 * // Create a new RPC client with a URL
 * let rpc = new RpcClient({ url : "wss://<node-wrpc-address>" });
 *
 * // Create a new RPC client with a resolver
 * // (networkId is required when using a resolver)
 * let rpc = new RpcClient({
 *     resolver : new Resolver(),
 *     networkId : "mainnet",
 * });
 *
 * rpc.addEventListener("connect", async (event) => {
 *     console.log("Connected to", rpc.url);
 *     await rpc.subscribeDaaScore();
 * });
 *
 * rpc.addEventListener("disconnect", (event) => {
 *     console.log("Disconnected from", rpc.url);
 * });
 *
 * try {
 *     await rpc.connect();
 * } catch(err) {
 *     console.log("Error connecting:", err);
 * }
 *
 * ```
 *
 * You can register event listeners to receive notifications from the RPC client
 * using {@link RpcClient.addEventListener} and {@link RpcClient.removeEventListener} functions.
 *
 * **IMPORTANT:** If RPC is disconnected, upon reconnection you do not need
 * to re-register event listeners, but your have to re-subscribe for Kaspa node
 * notifications:
 *
 * ```typescript
 * rpc.addEventListener("connect", async (event) => {
 *     console.log("Connected to", rpc.url);
 *     // re-subscribe each time we connect
 *     await rpc.subscribeDaaScore();
 *     // ... perform wallet address subscriptions
 * });
 *
 * ```
 *
 * If using NodeJS, it is important that {@link RpcClient.disconnect} is called before
 * the process exits to ensure that the WebSocket connection is properly closed.
 * Failure to do this will prevent the process from exiting.
 *
 * @category Node RPC
 */
export class RpcClient {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Retrieves the current number of blocks in the Kaspa BlockDAG.
   * This is not a block count, not a "block height" and can not be
   * used for transaction validation.
   * Returned information: Current block count.
   * @see {@link IGetBlockCountRequest}, {@link IGetBlockCountResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getBlockCount(request?: IGetBlockCountRequest | null): Promise<IGetBlockCountResponse>;
  /**
   * Provides information about the Directed Acyclic Graph (DAG)
   * structure of the Kaspa BlockDAG.
   * Returned information: Number of blocks in the DAG,
   * number of tips in the DAG, hash of the selected parent block,
   * difficulty of the selected parent block, selected parent block
   * blue score, selected parent block time.
   * @see {@link IGetBlockDagInfoRequest}, {@link IGetBlockDagInfoResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getBlockDagInfo(request?: IGetBlockDagInfoRequest | null): Promise<IGetBlockDagInfoResponse>;
  /**
   * Returns the total current coin supply of Kaspa network.
   * Returned information: Total coin supply.
   * @see {@link IGetCoinSupplyRequest}, {@link IGetCoinSupplyResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getCoinSupply(request?: IGetCoinSupplyRequest | null): Promise<IGetCoinSupplyResponse>;
  /**
   * Retrieves information about the peers connected to the Kaspa node.
   * Returned information: Peer ID, IP address and port, connection
   * status, protocol version.
   * @see {@link IGetConnectedPeerInfoRequest}, {@link IGetConnectedPeerInfoResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getConnectedPeerInfo(request?: IGetConnectedPeerInfoRequest | null): Promise<IGetConnectedPeerInfoResponse>;
  /**
   * Retrieves general information about the Kaspa node.
   * Returned information: Version of the Kaspa node, protocol
   * version, network identifier.
   * This call is primarily used by gRPC clients.
   * For wRPC clients, use {@link RpcClient.getServerInfo}.
   * @see {@link IGetInfoRequest}, {@link IGetInfoResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getInfo(request?: IGetInfoRequest | null): Promise<IGetInfoResponse>;
  /**
   * Provides a list of addresses of known peers in the Kaspa
   * network that the node can potentially connect to.
   * Returned information: List of peer addresses.
   * @see {@link IGetPeerAddressesRequest}, {@link IGetPeerAddressesResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getPeerAddresses(request?: IGetPeerAddressesRequest | null): Promise<IGetPeerAddressesResponse>;
  /**
   * Retrieves various metrics and statistics related to the
   * performance and status of the Kaspa node.
   * Returned information: Memory usage, CPU usage, network activity.
   * @see {@link IGetMetricsRequest}, {@link IGetMetricsResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getMetrics(request?: IGetMetricsRequest | null): Promise<IGetMetricsResponse>;
  /**
   * Retrieves current number of network connections
   * @see {@link IGetConnectionsRequest}, {@link IGetConnectionsResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getConnections(request?: IGetConnectionsRequest | null): Promise<IGetConnectionsResponse>;
  /**
   * Retrieves the current sink block, which is the block with
   * the highest cumulative difficulty in the Kaspa BlockDAG.
   * Returned information: Sink block hash, sink block height.
   * @see {@link IGetSinkRequest}, {@link IGetSinkResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getSink(request?: IGetSinkRequest | null): Promise<IGetSinkResponse>;
  /**
   * Returns the blue score of the current sink block, indicating
   * the total amount of work that has been done on the main chain
   * leading up to that block.
   * Returned information: Blue score of the sink block.
   * @see {@link IGetSinkBlueScoreRequest}, {@link IGetSinkBlueScoreResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getSinkBlueScore(request?: IGetSinkBlueScoreRequest | null): Promise<IGetSinkBlueScoreResponse>;
  /**
   * Tests the connection and responsiveness of a Kaspa node.
   * Returned information: None.
   * @see {@link IPingRequest}, {@link IPingResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  ping(request?: IPingRequest | null): Promise<IPingResponse>;
  /**
   * Gracefully shuts down the Kaspa node.
   * Returned information: None.
   * @see {@link IShutdownRequest}, {@link IShutdownResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  shutdown(request?: IShutdownRequest | null): Promise<IShutdownResponse>;
  /**
   * Retrieves information about the Kaspa server.
   * Returned information: Version of the Kaspa server, protocol
   * version, network identifier.
   * @see {@link IGetServerInfoRequest}, {@link IGetServerInfoResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getServerInfo(request?: IGetServerInfoRequest | null): Promise<IGetServerInfoResponse>;
  /**
   * Obtains basic information about the synchronization status of the Kaspa node.
   * Returned information: Syncing status.
   * @see {@link IGetSyncStatusRequest}, {@link IGetSyncStatusResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getSyncStatus(request?: IGetSyncStatusRequest | null): Promise<IGetSyncStatusResponse>;
  /**
   * Feerate estimates
   * @see {@link IGetFeeEstimateRequest}, {@link IGetFeeEstimateResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getFeeEstimate(request?: IGetFeeEstimateRequest | null): Promise<IGetFeeEstimateResponse>;
  /**
   * Retrieves the current network configuration.
   * Returned information: Current network configuration.
   * @see {@link IGetCurrentNetworkRequest}, {@link IGetCurrentNetworkResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getCurrentNetwork(request?: IGetCurrentNetworkRequest | null): Promise<IGetCurrentNetworkResponse>;
  /**
   * Adds a peer to the Kaspa node's list of known peers.
   * Returned information: None.
   * @see {@link IAddPeerRequest}, {@link IAddPeerResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  addPeer(request: IAddPeerRequest): Promise<IAddPeerResponse>;
  /**
   * Bans a peer from connecting to the Kaspa node for a specified duration.
   * Returned information: None.
   * @see {@link IBanRequest}, {@link IBanResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  ban(request: IBanRequest): Promise<IBanResponse>;
  /**
   * Estimates the network's current hash rate in hashes per second.
   * Returned information: Estimated network hashes per second.
   * @see {@link IEstimateNetworkHashesPerSecondRequest}, {@link IEstimateNetworkHashesPerSecondResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  estimateNetworkHashesPerSecond(request: IEstimateNetworkHashesPerSecondRequest): Promise<IEstimateNetworkHashesPerSecondResponse>;
  /**
   * Retrieves the balance of a specific address in the Kaspa BlockDAG.
   * Returned information: Balance of the address.
   * @see {@link IGetBalanceByAddressRequest}, {@link IGetBalanceByAddressResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBalanceByAddress(request: IGetBalanceByAddressRequest): Promise<IGetBalanceByAddressResponse>;
  /**
   * Retrieves balances for multiple addresses in the Kaspa BlockDAG.
   * Returned information: Balances of the addresses.
   * @see {@link IGetBalancesByAddressesRequest}, {@link IGetBalancesByAddressesResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBalancesByAddresses(request: IGetBalancesByAddressesRequest | Address[] | string[]): Promise<IGetBalancesByAddressesResponse>;
  /**
   * Retrieves a specific block from the Kaspa BlockDAG.
   * Returned information: Block information.
   * @see {@link IGetBlockRequest}, {@link IGetBlockResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBlock(request: IGetBlockRequest): Promise<IGetBlockResponse>;
  /**
   * Retrieves multiple blocks from the Kaspa BlockDAG.
   * Returned information: List of block information.
   * @see {@link IGetBlocksRequest}, {@link IGetBlocksResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBlocks(request: IGetBlocksRequest): Promise<IGetBlocksResponse>;
  /**
   * Generates a new block template for mining.
   * Returned information: Block template information.
   * @see {@link IGetBlockTemplateRequest}, {@link IGetBlockTemplateResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBlockTemplate(request: IGetBlockTemplateRequest): Promise<IGetBlockTemplateResponse>;
  /**
   * Checks if block is blue or not.
   * Returned information: Block blueness.
   * @see {@link IGetCurrentBlockColorRequest}, {@link IGetCurrentBlockColorResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getCurrentBlockColor(request: IGetCurrentBlockColorRequest): Promise<IGetCurrentBlockColorResponse>;
  /**
   * Retrieves the estimated DAA (Difficulty Adjustment Algorithm)
   * score timestamp estimate.
   * Returned information: DAA score timestamp estimate.
   * @see {@link IGetDaaScoreTimestampEstimateRequest}, {@link IGetDaaScoreTimestampEstimateResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getDaaScoreTimestampEstimate(request: IGetDaaScoreTimestampEstimateRequest): Promise<IGetDaaScoreTimestampEstimateResponse>;
  /**
   * Feerate estimates (experimental)
   * @see {@link IGetFeeEstimateExperimentalRequest}, {@link IGetFeeEstimateExperimentalResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getFeeEstimateExperimental(request: IGetFeeEstimateExperimentalRequest): Promise<IGetFeeEstimateExperimentalResponse>;
  /**
   * Retrieves block headers from the Kaspa BlockDAG.
   * Returned information: List of block headers.
   * @see {@link IGetHeadersRequest}, {@link IGetHeadersResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getHeaders(request: IGetHeadersRequest): Promise<IGetHeadersResponse>;
  /**
   * Retrieves mempool entries from the Kaspa node's mempool.
   * Returned information: List of mempool entries.
   * @see {@link IGetMempoolEntriesRequest}, {@link IGetMempoolEntriesResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getMempoolEntries(request: IGetMempoolEntriesRequest): Promise<IGetMempoolEntriesResponse>;
  /**
   * Retrieves mempool entries associated with specific addresses.
   * Returned information: List of mempool entries.
   * @see {@link IGetMempoolEntriesByAddressesRequest}, {@link IGetMempoolEntriesByAddressesResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getMempoolEntriesByAddresses(request: IGetMempoolEntriesByAddressesRequest): Promise<IGetMempoolEntriesByAddressesResponse>;
  /**
   * Retrieves a specific mempool entry by transaction ID.
   * Returned information: Mempool entry information.
   * @see {@link IGetMempoolEntryRequest}, {@link IGetMempoolEntryResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getMempoolEntry(request: IGetMempoolEntryRequest): Promise<IGetMempoolEntryResponse>;
  /**
   * Retrieves information about a subnetwork in the Kaspa BlockDAG.
   * Returned information: Subnetwork information.
   * @see {@link IGetSubnetworkRequest}, {@link IGetSubnetworkResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getSubnetwork(request: IGetSubnetworkRequest): Promise<IGetSubnetworkResponse>;
  /**
   * Retrieves unspent transaction outputs (UTXOs) associated with
   * specific addresses.
   * Returned information: List of UTXOs.
   * @see {@link IGetUtxosByAddressesRequest}, {@link IGetUtxosByAddressesResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getUtxosByAddresses(request: IGetUtxosByAddressesRequest | Address[] | string[]): Promise<IGetUtxosByAddressesResponse>;
  /**
   * Retrieves the virtual chain corresponding to a specified block hash.
   * Returned information: Virtual chain information.
   * @see {@link IGetVirtualChainFromBlockRequest}, {@link IGetVirtualChainFromBlockResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getVirtualChainFromBlock(request: IGetVirtualChainFromBlockRequest): Promise<IGetVirtualChainFromBlockResponse>;
  /**
   * Resolves a finality conflict in the Kaspa BlockDAG.
   * Returned information: None.
   * @see {@link IResolveFinalityConflictRequest}, {@link IResolveFinalityConflictResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  resolveFinalityConflict(request: IResolveFinalityConflictRequest): Promise<IResolveFinalityConflictResponse>;
  /**
   * Submits a block to the Kaspa network.
   * Returned information: None.
   * @see {@link ISubmitBlockRequest}, {@link ISubmitBlockResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  submitBlock(request: ISubmitBlockRequest): Promise<ISubmitBlockResponse>;
  /**
   * Submits a transaction to the Kaspa network.
   * Returned information: Submitted Transaction Id.
   * @see {@link ISubmitTransactionRequest}, {@link ISubmitTransactionResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  submitTransaction(request: ISubmitTransactionRequest): Promise<ISubmitTransactionResponse>;
  /**
   * Submits an RBF transaction to the Kaspa network.
   * Returned information: Submitted Transaction Id, Transaction that was replaced.
   * @see {@link ISubmitTransactionReplacementRequest}, {@link ISubmitTransactionReplacementResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  submitTransactionReplacement(request: ISubmitTransactionReplacementRequest): Promise<ISubmitTransactionReplacementResponse>;
  /**
   * Unbans a previously banned peer, allowing it to connect
   * to the Kaspa node again.
   * Returned information: None.
   * @see {@link IUnbanRequest}, {@link IUnbanResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  unban(request: IUnbanRequest): Promise<IUnbanResponse>;
  /**
   * Manage subscription for a block added notification event.
   * Block added notification event is produced when a new
   * block is added to the Kaspa BlockDAG.
   */
  subscribeBlockAdded(): Promise<void>;
  unsubscribeBlockAdded(): Promise<void>;
  /**
   * Manage subscription for a finality conflict notification event.
   * Finality conflict notification event is produced when a finality
   * conflict occurs in the Kaspa BlockDAG.
   */
  subscribeFinalityConflict(): Promise<void>;
  unsubscribeFinalityConflict(): Promise<void>;
  /**
   * Manage subscription for a finality conflict resolved notification event.
   * Finality conflict resolved notification event is produced when a finality
   * conflict in the Kaspa BlockDAG is resolved.
   */
  subscribeFinalityConflictResolved(): Promise<void>;
  unsubscribeFinalityConflictResolved(): Promise<void>;
  /**
   * Manage subscription for a sink blue score changed notification event.
   * Sink blue score changed notification event is produced when the blue
   * score of the sink block changes in the Kaspa BlockDAG.
   */
  subscribeSinkBlueScoreChanged(): Promise<void>;
  unsubscribeSinkBlueScoreChanged(): Promise<void>;
  /**
   * Manage subscription for a pruning point UTXO set override notification event.
   * Pruning point UTXO set override notification event is produced when the
   * UTXO set override for the pruning point changes in the Kaspa BlockDAG.
   */
  subscribePruningPointUtxoSetOverride(): Promise<void>;
  unsubscribePruningPointUtxoSetOverride(): Promise<void>;
  /**
   * Manage subscription for a new block template notification event.
   * New block template notification event is produced when a new block
   * template is generated for mining in the Kaspa BlockDAG.
   */
  subscribeNewBlockTemplate(): Promise<void>;
  unsubscribeNewBlockTemplate(): Promise<void>;
  /**
   * Manage subscription for a virtual DAA score changed notification event.
   * Virtual DAA score changed notification event is produced when the virtual
   * Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
   */
  subscribeVirtualDaaScoreChanged(): Promise<void>;
  /**
   * Manage subscription for a virtual DAA score changed notification event.
   * Virtual DAA score changed notification event is produced when the virtual
   * Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
   */
  unsubscribeVirtualDaaScoreChanged(): Promise<void>;
  /**
   * Subscribe for a UTXOs changed notification event.
   * UTXOs changed notification event is produced when the set
   * of unspent transaction outputs (UTXOs) changes in the
   * Kaspa BlockDAG. The event notification will be scoped to the
   * provided list of addresses.
   */
  subscribeUtxosChanged(addresses: (Address | string)[]): Promise<void>;
  /**
   * Unsubscribe from UTXOs changed notification event
   * for a specific set of addresses.
   */
  unsubscribeUtxosChanged(addresses: (Address | string)[]): Promise<void>;
  /**
   * Manage subscription for a virtual chain changed notification event.
   * Virtual chain changed notification event is produced when the virtual
   * chain changes in the Kaspa BlockDAG.
   */
  subscribeVirtualChainChanged(include_accepted_transaction_ids: boolean): Promise<void>;
  /**
   * Manage subscription for a virtual chain changed notification event.
   * Virtual chain changed notification event is produced when the virtual
   * chain changes in the Kaspa BlockDAG.
   */
  unsubscribeVirtualChainChanged(include_accepted_transaction_ids: boolean): Promise<void>;
  static defaultPort(encoding: Encoding, network: NetworkType | NetworkId | string): number;
  /**
   * Constructs an WebSocket RPC URL given the partial URL or an IP, RPC encoding
   * and a network type.
   *
   * # Arguments
   *
   * * `url` - Partial URL or an IP address
   * * `encoding` - RPC encoding
   * * `network_type` - Network type
   */
  static parseUrl(url: string, encoding: Encoding, network: NetworkId): string;
  /**
   *
   * Create a new RPC client with optional {@link Encoding} and a `url`.
   *
   * @see {@link IRpcConfig} interface for more details.
   */
  constructor(config?: IRpcConfig | null);
  /**
   * Set the resolver for the RPC client.
   * This setting will take effect on the next connection.
   */
  setResolver(resolver: Resolver): void;
  /**
   * Set the network id for the RPC client.
   * This setting will take effect on the next connection.
   */
  setNetworkId(network_id: NetworkId | string): void;
  /**
   * Connect to the Kaspa RPC server. This function starts a background
   * task that connects and reconnects to the server if the connection
   * is terminated.  Use [`disconnect()`](Self::disconnect()) to
   * terminate the connection.
   * @see {@link IConnectOptions} interface for more details.
   */
  connect(args?: IConnectOptions | undefined | null): Promise<void>;
  /**
   * Disconnect from the Kaspa RPC server.
   */
  disconnect(): Promise<void>;
  /**
   * Start background RPC services (automatically started when invoking {@link RpcClient.connect}).
   */
  start(): Promise<void>;
  /**
   * Stop background RPC services (automatically stopped when invoking {@link RpcClient.disconnect}).
   */
  stop(): Promise<void>;
  /**
   * Triggers a disconnection on the underlying WebSocket
   * if the WebSocket is in connected state.
   * This is intended for debug purposes only.
   * Can be used to test application reconnection logic.
   */
  triggerAbort(): void;
  /**
   *
   * Unregister an event listener.
   * This function will remove the callback for the specified event.
   * If the `callback` is not supplied, all callbacks will be
   * removed for the specified event.
   *
   * @see {@link RpcClient.addEventListener}
   */
  removeEventListener(event: RpcEventType | string, callback?: RpcEventCallback | null): void;
  /**
   *
   * Unregister a single event listener callback from all events.
   *
   *
   */
  clearEventListener(callback: RpcEventCallback): void;
  /**
   *
   * Unregister all notification callbacks for all events.
   */
  removeAllEventListeners(): void;
  /**
   * The current URL of the RPC client.
   */
  readonly url: string | undefined;
  /**
   * Current rpc resolver
   */
  readonly resolver: Resolver | undefined;
  /**
   * The current connection status of the RPC client.
   */
  readonly isConnected: boolean;
  /**
   * The current protocol encoding.
   */
  readonly encoding: string;
  /**
   * Optional: Resolver node id.
   */
  readonly nodeId: string | undefined;
}
/**
 * Represents a Kaspad ScriptPublicKey
 * @category Consensus
 */
export class ScriptPublicKey {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(version: number, script: any);
  version: number;
  readonly script: string;
}
export class SigHashType {
  private constructor();
  free(): void;
}
/**
 * Represents a Kaspa transaction.
 * This is an artificial construct that includes additional
 * transaction-related data such as additional data from UTXOs
 * used by transaction inputs.
 * @category Consensus
 */
export class Transaction {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Determines whether or not a transaction is a coinbase transaction. A coinbase
   * transaction is a special transaction created by miners that distributes fees and block subsidy
   * to the previous blocks' miners, and specifies the script_pub_key that will be used to pay the current
   * miner in future blocks.
   */
  is_coinbase(): boolean;
  /**
   * Recompute and finalize the tx id based on updated tx fields
   */
  finalize(): Hash;
  constructor(js_value: ITransaction | Transaction);
  /**
   * Returns a list of unique addresses used by transaction inputs.
   * This method can be used to determine addresses used by transaction inputs
   * in order to select private keys needed for transaction signing.
   */
  addresses(network_type: NetworkType | NetworkId | string): Address[];
  /**
   * Serializes the transaction to a pure JavaScript Object.
   * The schema of the JavaScript object is defined by {@link ISerializableTransaction}.
   * @see {@link ISerializableTransaction}
   */
  serializeToObject(): ISerializableTransaction;
  /**
   * Serializes the transaction to a JSON string.
   * The schema of the JSON is defined by {@link ISerializableTransaction}.
   */
  serializeToJSON(): string;
  /**
   * Serializes the transaction to a "Safe" JSON schema where it converts all `bigint` values to `string` to avoid potential client-side precision loss.
   */
  serializeToSafeJSON(): string;
  /**
   * Deserialize the {@link Transaction} Object from a pure JavaScript Object.
   */
  static deserializeFromObject(js_value: any): Transaction;
  /**
   * Deserialize the {@link Transaction} Object from a JSON string.
   */
  static deserializeFromJSON(json: string): Transaction;
  /**
   * Deserialize the {@link Transaction} Object from a "Safe" JSON schema where all `bigint` values are represented as `string`.
   */
  static deserializeFromSafeJSON(json: string): Transaction;
  /**
   * Returns the transaction ID
   */
  readonly id: string;
  get inputs(): TransactionInput[];
  set inputs(value: (ITransactionInput | TransactionInput)[]);
  get outputs(): TransactionOutput[];
  set outputs(value: (ITransactionOutput | TransactionOutput)[]);
  version: number;
  lockTime: bigint;
  gas: bigint;
  get subnetworkId(): string;
  set subnetworkId(value: any);
  get payload(): string;
  set payload(value: any);
  mass: bigint;
}
/**
 * Represents a Kaspa transaction input
 * @category Consensus
 */
export class TransactionInput {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(value: ITransactionInput | TransactionInput);
  get previousOutpoint(): TransactionOutpoint;
  set previousOutpoint(value: any);
  get signatureScript(): string | undefined;
  set signatureScript(value: any);
  sequence: bigint;
  sigOpCount: number;
  readonly utxo: UtxoEntryReference | undefined;
}
/**
 * Represents a Kaspa transaction outpoint.
 * NOTE: This struct is immutable - to create a custom outpoint
 * use the `TransactionOutpoint::new` constructor. (in JavaScript
 * use `new TransactionOutpoint(transactionId, index)`).
 * @category Consensus
 */
export class TransactionOutpoint {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(transaction_id: Hash, index: number);
  getId(): string;
  readonly transactionId: string;
  readonly index: number;
}
/**
 * Represents a Kaspad transaction output
 * @category Consensus
 */
export class TransactionOutput {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * TransactionOutput constructor
   */
  constructor(value: bigint, script_public_key: ScriptPublicKey);
  value: bigint;
  scriptPublicKey: ScriptPublicKey;
}
/**
 * @category Wallet SDK
 */
export class TransactionSigningHash {
  free(): void;
  constructor();
  update(data: HexString | Uint8Array): void;
  finalize(): string;
}
/**
 * @category Wallet SDK
 */
export class TransactionSigningHashECDSA {
  free(): void;
  constructor();
  update(data: HexString | Uint8Array): void;
  finalize(): string;
}
/**
 * Holds details about an individual transaction output in a utxo
 * set such as whether or not it was contained in a coinbase tx, the daa
 * score of the block that accepts the tx, its public key script, and how
 * much it pays.
 * @category Consensus
 */
export class TransactionUtxoEntry {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  amount: bigint;
  scriptPublicKey: ScriptPublicKey;
  blockDaaScore: bigint;
  isCoinbase: boolean;
}
/**
 * A simple collection of UTXO entries. This struct is used to
 * retain a set of UTXO entries in the WASM memory for faster
 * processing. This struct keeps a list of entries represented
 * by `UtxoEntryReference` struct. This data structure is used
 * internally by the framework, but is exposed for convenience.
 * Please consider using `UtxoContext` instead.
 * @category Wallet SDK
 */
export class UtxoEntries {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Create a new `UtxoEntries` struct with a set of entries.
   */
  constructor(js_value: any);
  /**
   * Sort the contained entries by amount. Please note that
   * this function is not intended for use with large UTXO sets
   * as it duplicates the whole contained UTXO set while sorting.
   */
  sort(): void;
  amount(): bigint;
  items: any;
}
/**
 * [`UtxoEntry`] struct represents a client-side UTXO entry.
 *
 * @category Wallet SDK
 */
export class UtxoEntry {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  toString(): string;
  get address(): Address | undefined;
  set address(value: Address | null | undefined);
  outpoint: TransactionOutpoint;
  amount: bigint;
  scriptPublicKey: ScriptPublicKey;
  blockDaaScore: bigint;
  isCoinbase: boolean;
}
/**
 * [`Arc`] reference to a [`UtxoEntry`] used by the wallet subsystems.
 *
 * @category Wallet SDK
 */
export class UtxoEntryReference {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  toString(): string;
  readonly entry: UtxoEntry;
  readonly outpoint: TransactionOutpoint;
  readonly address: Address | undefined;
  readonly amount: bigint;
  readonly isCoinbase: boolean;
  readonly blockDaaScore: bigint;
  readonly scriptPublicKey: ScriptPublicKey;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly version: () => [number, number];
  readonly rpcclient_getBlockCount: (a: number, b: number) => any;
  readonly rpcclient_getBlockDagInfo: (a: number, b: number) => any;
  readonly rpcclient_getCoinSupply: (a: number, b: number) => any;
  readonly rpcclient_getConnectedPeerInfo: (a: number, b: number) => any;
  readonly rpcclient_getInfo: (a: number, b: number) => any;
  readonly rpcclient_getPeerAddresses: (a: number, b: number) => any;
  readonly rpcclient_getMetrics: (a: number, b: number) => any;
  readonly rpcclient_getConnections: (a: number, b: number) => any;
  readonly rpcclient_getSink: (a: number, b: number) => any;
  readonly rpcclient_getSinkBlueScore: (a: number, b: number) => any;
  readonly rpcclient_ping: (a: number, b: number) => any;
  readonly rpcclient_shutdown: (a: number, b: number) => any;
  readonly rpcclient_getServerInfo: (a: number, b: number) => any;
  readonly rpcclient_getSyncStatus: (a: number, b: number) => any;
  readonly rpcclient_getFeeEstimate: (a: number, b: number) => any;
  readonly rpcclient_getCurrentNetwork: (a: number, b: number) => any;
  readonly rpcclient_addPeer: (a: number, b: any) => any;
  readonly rpcclient_ban: (a: number, b: any) => any;
  readonly rpcclient_estimateNetworkHashesPerSecond: (a: number, b: any) => any;
  readonly rpcclient_getBalanceByAddress: (a: number, b: any) => any;
  readonly rpcclient_getBalancesByAddresses: (a: number, b: any) => any;
  readonly rpcclient_getBlock: (a: number, b: any) => any;
  readonly rpcclient_getBlocks: (a: number, b: any) => any;
  readonly rpcclient_getBlockTemplate: (a: number, b: any) => any;
  readonly rpcclient_getCurrentBlockColor: (a: number, b: any) => any;
  readonly rpcclient_getDaaScoreTimestampEstimate: (a: number, b: any) => any;
  readonly rpcclient_getFeeEstimateExperimental: (a: number, b: any) => any;
  readonly rpcclient_getHeaders: (a: number, b: any) => any;
  readonly rpcclient_getMempoolEntries: (a: number, b: any) => any;
  readonly rpcclient_getMempoolEntriesByAddresses: (a: number, b: any) => any;
  readonly rpcclient_getMempoolEntry: (a: number, b: any) => any;
  readonly rpcclient_getSubnetwork: (a: number, b: any) => any;
  readonly rpcclient_getUtxosByAddresses: (a: number, b: any) => any;
  readonly rpcclient_getVirtualChainFromBlock: (a: number, b: any) => any;
  readonly rpcclient_resolveFinalityConflict: (a: number, b: any) => any;
  readonly rpcclient_submitBlock: (a: number, b: any) => any;
  readonly rpcclient_submitTransaction: (a: number, b: any) => any;
  readonly rpcclient_submitTransactionReplacement: (a: number, b: any) => any;
  readonly rpcclient_unban: (a: number, b: any) => any;
  readonly rpcclient_subscribeBlockAdded: (a: number) => any;
  readonly rpcclient_unsubscribeBlockAdded: (a: number) => any;
  readonly rpcclient_subscribeFinalityConflict: (a: number) => any;
  readonly rpcclient_unsubscribeFinalityConflict: (a: number) => any;
  readonly rpcclient_subscribeFinalityConflictResolved: (a: number) => any;
  readonly rpcclient_unsubscribeFinalityConflictResolved: (a: number) => any;
  readonly rpcclient_subscribeSinkBlueScoreChanged: (a: number) => any;
  readonly rpcclient_unsubscribeSinkBlueScoreChanged: (a: number) => any;
  readonly rpcclient_subscribePruningPointUtxoSetOverride: (a: number) => any;
  readonly rpcclient_unsubscribePruningPointUtxoSetOverride: (a: number) => any;
  readonly rpcclient_subscribeNewBlockTemplate: (a: number) => any;
  readonly rpcclient_unsubscribeNewBlockTemplate: (a: number) => any;
  readonly rpcclient_subscribeVirtualDaaScoreChanged: (a: number) => any;
  readonly rpcclient_unsubscribeVirtualDaaScoreChanged: (a: number) => any;
  readonly rpcclient_subscribeUtxosChanged: (a: number, b: any) => any;
  readonly rpcclient_unsubscribeUtxosChanged: (a: number, b: any) => any;
  readonly rpcclient_subscribeVirtualChainChanged: (a: number, b: number) => any;
  readonly rpcclient_unsubscribeVirtualChainChanged: (a: number, b: number) => any;
  readonly rpcclient_defaultPort: (a: number, b: any) => [number, number, number];
  readonly rpcclient_parseUrl: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly rpcclient_ctor: (a: number) => [number, number, number];
  readonly rpcclient_url: (a: number) => [number, number];
  readonly rpcclient_resolver: (a: number) => number;
  readonly rpcclient_setResolver: (a: number, b: number) => [number, number];
  readonly rpcclient_setNetworkId: (a: number, b: any) => [number, number];
  readonly rpcclient_isConnected: (a: number) => number;
  readonly rpcclient_encoding: (a: number) => [number, number];
  readonly rpcclient_nodeId: (a: number) => [number, number];
  readonly rpcclient_connect: (a: number, b: number) => any;
  readonly rpcclient_disconnect: (a: number) => any;
  readonly rpcclient_start: (a: number) => any;
  readonly rpcclient_stop: (a: number) => any;
  readonly rpcclient_triggerAbort: (a: number) => void;
  readonly rpcclient_addEventListener: (a: number, b: any, c: number) => [number, number];
  readonly rpcclient_removeEventListener: (a: number, b: any, c: number) => [number, number];
  readonly rpcclient_clearEventListener: (a: number, b: any) => [number, number];
  readonly rpcclient_removeAllEventListeners: (a: number) => [number, number];
  readonly __wbg_rpcclient_free: (a: number, b: number) => void;
  readonly resolver_urls: (a: number) => any;
  readonly resolver_getNode: (a: number, b: number, c: any) => any;
  readonly resolver_getUrl: (a: number, b: number, c: any) => any;
  readonly resolver_connect: (a: number, b: any) => any;
  readonly resolver_ctor: (a: number) => [number, number, number];
  readonly __wbg_resolver_free: (a: number, b: number) => void;
  readonly __wbg_nodedescriptor_free: (a: number, b: number) => void;
  readonly __wbg_get_nodedescriptor_uid: (a: number) => [number, number];
  readonly __wbg_set_nodedescriptor_uid: (a: number, b: number, c: number) => void;
  readonly __wbg_get_nodedescriptor_url: (a: number) => [number, number];
  readonly __wbg_set_nodedescriptor_url: (a: number, b: number, c: number) => void;
  readonly __wbg_transactioninput_free: (a: number, b: number) => void;
  readonly transactioninput_constructor: (a: any) => [number, number, number];
  readonly transactioninput_get_previous_outpoint: (a: number) => number;
  readonly transactioninput_set_previous_outpoint: (a: number, b: any) => [number, number];
  readonly transactioninput_get_signature_script_as_hex: (a: number) => [number, number];
  readonly transactioninput_set_signature_script_from_js_value: (a: number, b: any) => [number, number];
  readonly transactioninput_get_sequence: (a: number) => bigint;
  readonly transactioninput_set_sequence: (a: number, b: bigint) => void;
  readonly transactioninput_get_sig_op_count: (a: number) => number;
  readonly transactioninput_set_sig_op_count: (a: number, b: number) => void;
  readonly transactioninput_get_utxo: (a: number) => number;
  readonly transactionsigninghashecdsa_new: () => number;
  readonly transactionsigninghashecdsa_update: (a: number, b: any) => [number, number];
  readonly transactionsigninghashecdsa_finalize: (a: number) => [number, number];
  readonly __wbg_transactionsigninghashecdsa_free: (a: number, b: number) => void;
  readonly transactionsigninghash_new: () => number;
  readonly transactionsigninghash_update: (a: number, b: any) => [number, number];
  readonly transactionsigninghash_finalize: (a: number) => [number, number];
  readonly __wbg_transactionsigninghash_free: (a: number, b: number) => void;
  readonly isScriptPayToScriptHash: (a: any) => [number, number, number];
  readonly isScriptPayToPubkeyECDSA: (a: any) => [number, number, number];
  readonly isScriptPayToPubkey: (a: any) => [number, number, number];
  readonly addressFromScriptPublicKey: (a: any, b: any) => [number, number, number];
  readonly payToScriptHashSignatureScript: (a: any, b: any) => [number, number, number];
  readonly payToScriptHashScript: (a: any) => [number, number, number];
  readonly payToAddressScript: (a: any) => [number, number, number];
  readonly __wbg_transaction_free: (a: number, b: number) => void;
  readonly transaction_is_coinbase: (a: number) => number;
  readonly transaction_finalize: (a: number) => [number, number, number];
  readonly transaction_id: (a: number) => [number, number];
  readonly transaction_constructor: (a: any) => [number, number, number];
  readonly transaction_get_inputs_as_js_array: (a: number) => any;
  readonly transaction_addresses: (a: number, b: any) => [number, number, number];
  readonly transaction_set_inputs_from_js_array: (a: number, b: any) => void;
  readonly transaction_get_outputs_as_js_array: (a: number) => any;
  readonly transaction_set_outputs_from_js_array: (a: number, b: any) => void;
  readonly transaction_version: (a: number) => number;
  readonly transaction_set_version: (a: number, b: number) => void;
  readonly transaction_lockTime: (a: number) => bigint;
  readonly transaction_set_lockTime: (a: number, b: bigint) => void;
  readonly transaction_gas: (a: number) => bigint;
  readonly transaction_set_gas: (a: number, b: bigint) => void;
  readonly transaction_get_subnetwork_id_as_hex: (a: number) => [number, number];
  readonly transaction_set_subnetwork_id_from_js_value: (a: number, b: any) => void;
  readonly transaction_get_payload_as_hex_string: (a: number) => [number, number];
  readonly transaction_set_payload_from_js_value: (a: number, b: any) => void;
  readonly transaction_get_mass: (a: number) => bigint;
  readonly transaction_set_mass: (a: number, b: bigint) => void;
  readonly transaction_serializeToObject: (a: number) => [number, number, number];
  readonly transaction_serializeToJSON: (a: number) => [number, number, number, number];
  readonly transaction_serializeToSafeJSON: (a: number) => [number, number, number, number];
  readonly transaction_deserializeFromObject: (a: any) => [number, number, number];
  readonly transaction_deserializeFromJSON: (a: number, b: number) => [number, number, number];
  readonly transaction_deserializeFromSafeJSON: (a: number, b: number) => [number, number, number];
  readonly __wbg_transactionoutpoint_free: (a: number, b: number) => void;
  readonly transactionoutpoint_ctor: (a: number, b: number) => number;
  readonly transactionoutpoint_getId: (a: number) => [number, number];
  readonly transactionoutpoint_transactionId: (a: number) => [number, number];
  readonly transactionoutpoint_index: (a: number) => number;
  readonly __wbg_transactionoutput_free: (a: number, b: number) => void;
  readonly transactionoutput_ctor: (a: bigint, b: number) => number;
  readonly transactionoutput_value: (a: number) => bigint;
  readonly transactionoutput_set_value: (a: number, b: bigint) => void;
  readonly transactionoutput_scriptPublicKey: (a: number) => number;
  readonly transactionoutput_set_scriptPublicKey: (a: number, b: number) => void;
  readonly __wbg_utxoentry_free: (a: number, b: number) => void;
  readonly __wbg_get_utxoentry_address: (a: number) => number;
  readonly __wbg_set_utxoentry_address: (a: number, b: number) => void;
  readonly __wbg_get_utxoentry_outpoint: (a: number) => number;
  readonly __wbg_set_utxoentry_outpoint: (a: number, b: number) => void;
  readonly __wbg_get_utxoentry_amount: (a: number) => bigint;
  readonly __wbg_set_utxoentry_amount: (a: number, b: bigint) => void;
  readonly __wbg_get_utxoentry_scriptPublicKey: (a: number) => number;
  readonly __wbg_set_utxoentry_scriptPublicKey: (a: number, b: number) => void;
  readonly __wbg_get_utxoentry_blockDaaScore: (a: number) => bigint;
  readonly __wbg_set_utxoentry_blockDaaScore: (a: number, b: bigint) => void;
  readonly __wbg_get_utxoentry_isCoinbase: (a: number) => number;
  readonly __wbg_set_utxoentry_isCoinbase: (a: number, b: number) => void;
  readonly utxoentry_toString: (a: number) => [number, number, number];
  readonly __wbg_utxoentryreference_free: (a: number, b: number) => void;
  readonly utxoentryreference_toString: (a: number) => [number, number, number];
  readonly utxoentryreference_entry: (a: number) => number;
  readonly utxoentryreference_outpoint: (a: number) => number;
  readonly utxoentryreference_address: (a: number) => number;
  readonly utxoentryreference_amount: (a: number) => bigint;
  readonly utxoentryreference_isCoinbase: (a: number) => number;
  readonly utxoentryreference_blockDaaScore: (a: number) => bigint;
  readonly utxoentryreference_scriptPublicKey: (a: number) => number;
  readonly __wbg_utxoentries_free: (a: number, b: number) => void;
  readonly utxoentries_js_ctor: (a: any) => [number, number, number];
  readonly utxoentries_get_items_as_js_array: (a: number) => any;
  readonly utxoentries_set_items_from_js_array: (a: number, b: any) => void;
  readonly utxoentries_sort: (a: number) => void;
  readonly utxoentries_amount: (a: number) => bigint;
  readonly header_constructor: (a: any) => [number, number, number];
  readonly header_finalize: (a: number) => [number, number];
  readonly header_asJSON: (a: number) => [number, number];
  readonly header_get_version: (a: number) => number;
  readonly header_set_version: (a: number, b: number) => void;
  readonly header_get_timestamp: (a: number) => bigint;
  readonly header_set_timestamp: (a: number, b: bigint) => void;
  readonly header_bits: (a: number) => number;
  readonly header_set_bits: (a: number, b: number) => void;
  readonly header_nonce: (a: number) => bigint;
  readonly header_set_nonce: (a: number, b: bigint) => void;
  readonly header_daa_score: (a: number) => bigint;
  readonly header_set_daa_score: (a: number, b: bigint) => void;
  readonly header_blue_score: (a: number) => bigint;
  readonly header_set_blue_score: (a: number, b: bigint) => void;
  readonly header_get_hash_as_hex: (a: number) => [number, number];
  readonly header_get_hash_merkle_root_as_hex: (a: number) => [number, number];
  readonly header_set_hash_merkle_root_from_js_value: (a: number, b: any) => void;
  readonly header_get_accepted_id_merkle_root_as_hex: (a: number) => [number, number];
  readonly header_set_accepted_id_merkle_root_from_js_value: (a: number, b: any) => void;
  readonly header_get_utxo_commitment_as_hex: (a: number) => [number, number];
  readonly header_set_utxo_commitment_from_js_value: (a: number, b: any) => void;
  readonly header_get_pruning_point_as_hex: (a: number) => [number, number];
  readonly header_set_pruning_point_from_js_value: (a: number, b: any) => void;
  readonly header_get_parents_by_level_as_js_value: (a: number) => any;
  readonly header_set_parents_by_level_from_js_value: (a: number, b: any) => void;
  readonly header_blue_work: (a: number) => any;
  readonly header_getBlueWorkAsHex: (a: number) => [number, number];
  readonly header_set_blue_work_from_js_value: (a: number, b: any) => void;
  readonly __wbg_header_free: (a: number, b: number) => void;
  readonly __wbg_transactionutxoentry_free: (a: number, b: number) => void;
  readonly __wbg_get_transactionutxoentry_amount: (a: number) => bigint;
  readonly __wbg_set_transactionutxoentry_amount: (a: number, b: bigint) => void;
  readonly __wbg_get_transactionutxoentry_scriptPublicKey: (a: number) => number;
  readonly __wbg_set_transactionutxoentry_scriptPublicKey: (a: number, b: number) => void;
  readonly __wbg_get_transactionutxoentry_blockDaaScore: (a: number) => bigint;
  readonly __wbg_set_transactionutxoentry_blockDaaScore: (a: number, b: bigint) => void;
  readonly __wbg_get_transactionutxoentry_isCoinbase: (a: number) => number;
  readonly __wbg_set_transactionutxoentry_isCoinbase: (a: number, b: number) => void;
  readonly __wbg_sighashtype_free: (a: number, b: number) => void;
  readonly __wbg_scriptpublickey_free: (a: number, b: number) => void;
  readonly __wbg_get_scriptpublickey_version: (a: number) => number;
  readonly __wbg_set_scriptpublickey_version: (a: number, b: number) => void;
  readonly scriptpublickey_constructor: (a: number, b: any) => [number, number, number];
  readonly scriptpublickey_script_as_hex: (a: number) => [number, number];
  readonly __wbg_networkid_free: (a: number, b: number) => void;
  readonly __wbg_get_networkid_type: (a: number) => number;
  readonly __wbg_set_networkid_type: (a: number, b: number) => void;
  readonly __wbg_get_networkid_suffix: (a: number) => number;
  readonly __wbg_set_networkid_suffix: (a: number, b: number) => void;
  readonly networkid_ctor: (a: any) => [number, number, number];
  readonly networkid_id: (a: number) => [number, number];
  readonly networkid_toString: (a: number) => [number, number];
  readonly networkid_addressPrefix: (a: number) => [number, number];
  readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (a: number, b: number) => void;
  readonly __wbg_hash_free: (a: number, b: number) => void;
  readonly hash_constructor: (a: number, b: number) => number;
  readonly hash_toString: (a: number) => [number, number];
  readonly __wbg_address_free: (a: number, b: number) => void;
  readonly address_constructor: (a: number, b: number) => number;
  readonly address_validate: (a: number, b: number) => number;
  readonly address_toString: (a: number) => [number, number];
  readonly address_version: (a: number) => [number, number];
  readonly address_prefix: (a: number) => [number, number];
  readonly address_set_setPrefix: (a: number, b: number, c: number) => void;
  readonly address_payload: (a: number) => [number, number];
  readonly address_short: (a: number, b: number) => [number, number];
  readonly initWASM32Bindings: (a: any) => [number, number];
  readonly initConsolePanicHook: () => void;
  readonly initBrowserPanicHook: () => void;
  readonly presentPanicHookLogs: () => void;
  readonly defer: () => any;
  readonly __wbg_aborted_free: (a: number, b: number) => void;
  readonly __wbg_abortable_free: (a: number, b: number) => void;
  readonly abortable_new: () => number;
  readonly abortable_isAborted: (a: number) => number;
  readonly abortable_abort: (a: number) => void;
  readonly abortable_check: (a: number) => [number, number];
  readonly abortable_reset: (a: number) => void;
  readonly setLogLevel: (a: any) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_6: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hdf6bbd897e794961: (a: number, b: number, c: number) => void;
  readonly closure76_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure78_externref_shim: (a: number, b: number, c: any, d: number) => any;
  readonly closure139_externref_shim: (a: number, b: number, c: any) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h4c8a84c1cdb1a6ea: (a: number, b: number) => void;
  readonly closure1031_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure1033_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure173_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

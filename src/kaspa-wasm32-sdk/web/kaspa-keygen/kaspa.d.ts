/* tslint:disable */
/* eslint-disable */
/**
 * Returns the version of the Rusty Kaspa framework.
 * @category General
 */
export function version(): string;
/**
 * Set the logger log level using a string representation.
 * Available variants are: 'off', 'error', 'warn', 'info', 'debug', 'trace'
 * @category General
 */
export function setLogLevel(level: "off" | "error" | "warn" | "info" | "debug" | "trace"): void;
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
 *
 * Languages supported by BIP39.
 *
 * Presently only English is specified by the BIP39 standard.
 *
 * @see {@link Mnemonic}
 *
 * @category Wallet SDK
 */
export enum Language {
  /**
   * English is presently the only supported language
   */
  English = 0,
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
 * Interface defines the structure of a Script Public Key.
 * 
 * @category Consensus
 */
export interface IScriptPublicKey {
    version : number;
    script: HexString;
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
 * A string containing a hexadecimal representation of the data (typically representing for IDs or Hashes).
 * 
 * @category General
 */ 
export type HexString = string;



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
 *
 * Key derivation path
 *
 * @category Wallet SDK
 */
export class DerivationPath {
  free(): void;
  constructor(path: string);
  /**
   * Is this derivation path empty? (i.e. the root)
   */
  isEmpty(): boolean;
  /**
   * Get the count of [`ChildNumber`] values in this derivation path.
   */
  length(): number;
  /**
   * Get the parent [`DerivationPath`] for the current one.
   *
   * Returns `Undefined` if this is already the root path.
   */
  parent(): DerivationPath | undefined;
  /**
   * Push a [`ChildNumber`] onto an existing derivation path.
   */
  push(child_number: number, hardened?: boolean | null): void;
  toString(): string;
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
 * Data structure that contains a secret and public keys.
 * @category Wallet SDK
 */
export class Keypair {
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
   * Get the [`Address`] of this Keypair's [`PublicKey`].
   * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
   * to determine the prefix of the address.
   * JavaScript: `let address = keypair.toAddress(NetworkType.MAINNET);`.
   */
  toAddress(network: NetworkType | NetworkId | string): Address;
  /**
   * Get `ECDSA` [`Address`] of this Keypair's [`PublicKey`].
   * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
   * to determine the prefix of the address.
   * JavaScript: `let address = keypair.toAddress(NetworkType.MAINNET);`.
   */
  toAddressECDSA(network: NetworkType | NetworkId | string): Address;
  /**
   * Create a new random [`Keypair`].
   * JavaScript: `let keypair = Keypair::random();`.
   */
  static random(): Keypair;
  /**
   * Create a new [`Keypair`] from a [`PrivateKey`].
   * JavaScript: `let privkey = new PrivateKey(hexString); let keypair = privkey.toKeypair();`.
   */
  static fromPrivateKey(secret_key: PrivateKey): Keypair;
  /**
   * Get the [`PublicKey`] of this [`Keypair`].
   */
  readonly publicKey: string;
  /**
   * Get the [`PrivateKey`] of this [`Keypair`].
   */
  readonly privateKey: string;
  /**
   * Get the `XOnlyPublicKey` of this [`Keypair`].
   */
  readonly xOnlyPublicKey: any;
}
/**
 * BIP39 mnemonic phrases: sequences of words representing cryptographic keys.
 * @category Wallet SDK
 */
export class Mnemonic {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(phrase: string, language?: Language | null);
  /**
   * Validate mnemonic phrase. Returns `true` if the phrase is valid, `false` otherwise.
   */
  static validate(phrase: string, language?: Language | null): boolean;
  static random(word_count?: number | null): Mnemonic;
  toSeed(password?: string | null): string;
  entropy: string;
  phrase: string;
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
 * Data structure that envelops a Private Key.
 * @category Wallet SDK
 */
export class PrivateKey {
  free(): void;
  /**
   * Create a new [`PrivateKey`] from a hex-encoded string.
   */
  constructor(key: string);
  /**
   * Returns the [`PrivateKey`] key encoded as a hex string.
   */
  toString(): string;
  /**
   * Generate a [`Keypair`] from this [`PrivateKey`].
   */
  toKeypair(): Keypair;
  toPublicKey(): PublicKey;
  /**
   * Get the [`Address`] of the PublicKey generated from this PrivateKey.
   * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
   * to determine the prefix of the address.
   * JavaScript: `let address = privateKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddress(network: NetworkType | NetworkId | string): Address;
  /**
   * Get `ECDSA` [`Address`] of the PublicKey generated from this PrivateKey.
   * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
   * to determine the prefix of the address.
   * JavaScript: `let address = privateKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddressECDSA(network: NetworkType | NetworkId | string): Address;
}
/**
 *
 * Helper class to generate private keys from an extended private key (XPrv).
 * This class accepts the master Kaspa XPrv string (e.g. `xprv1...`) and generates
 * private keys for the receive and change paths given the pre-set parameters
 * such as account index, multisig purpose and cosigner index.
 *
 * Please note that in Kaspa master private keys use `kprv` prefix.
 *
 * @see {@link PublicKeyGenerator}, {@link XPub}, {@link XPrv}, {@link Mnemonic}
 * @category Wallet SDK
 */
export class PrivateKeyGenerator {
  free(): void;
  constructor(xprv: XPrv | string, is_multisig: boolean, account_index: bigint, cosigner_index?: number | null);
  receiveKey(index: number): PrivateKey;
  changeKey(index: number): PrivateKey;
}
/**
 * Data structure that envelopes a PublicKey.
 * Only supports Schnorr-based addresses.
 * @category Wallet SDK
 */
export class PublicKey {
  free(): void;
  /**
   * Create a new [`PublicKey`] from a hex-encoded string.
   */
  constructor(key: string);
  toString(): string;
  /**
   * Get the [`Address`] of this PublicKey.
   * Receives a [`NetworkType`] to determine the prefix of the address.
   * JavaScript: `let address = publicKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddress(network: NetworkType | NetworkId | string): Address;
  /**
   * Get `ECDSA` [`Address`] of this PublicKey.
   * Receives a [`NetworkType`] to determine the prefix of the address.
   * JavaScript: `let address = publicKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddressECDSA(network: NetworkType | NetworkId | string): Address;
  toXOnlyPublicKey(): XOnlyPublicKey;
  /**
   * Compute a 4-byte key fingerprint for this public key as a hex string.
   * Default implementation uses `RIPEMD160(SHA256(public_key))`.
   */
  fingerprint(): HexString | undefined;
}
/**
 *
 * Helper class to generate public keys from an extended public key (XPub)
 * that has been derived up to the co-signer index.
 *
 * Please note that in Kaspa master public keys use `kpub` prefix.
 *
 * @see {@link PrivateKeyGenerator}, {@link XPub}, {@link XPrv}, {@link Mnemonic}
 * @category Wallet SDK
 */
export class PublicKeyGenerator {
  private constructor();
  free(): void;
  static fromXPub(kpub: XPub | string, cosigner_index?: number | null): PublicKeyGenerator;
  static fromMasterXPrv(xprv: XPrv | string, is_multisig: boolean, account_index: bigint, cosigner_index?: number | null): PublicKeyGenerator;
  /**
   * Generate Receive Public Key derivations for a given range.
   */
  receivePubkeys(start: number, end: number): (PublicKey | string)[];
  /**
   * Generate a single Receive Public Key derivation at a given index.
   */
  receivePubkey(index: number): PublicKey;
  /**
   * Generate a range of Receive Public Key derivations and return them as strings.
   */
  receivePubkeysAsStrings(start: number, end: number): Array<string>;
  /**
   * Generate a single Receive Public Key derivation at a given index and return it as a string.
   */
  receivePubkeyAsString(index: number): string;
  /**
   * Generate Receive Address derivations for a given range.
   */
  receiveAddresses(networkType: NetworkType | NetworkId | string, start: number, end: number): Address[];
  /**
   * Generate a single Receive Address derivation at a given index.
   */
  receiveAddress(networkType: NetworkType | NetworkId | string, index: number): Address;
  /**
   * Generate a range of Receive Address derivations and return them as strings.
   */
  receiveAddressAsStrings(networkType: NetworkType | NetworkId | string, start: number, end: number): Array<string>;
  /**
   * Generate a single Receive Address derivation at a given index and return it as a string.
   */
  receiveAddressAsString(networkType: NetworkType | NetworkId | string, index: number): string;
  /**
   * Generate Change Public Key derivations for a given range.
   */
  changePubkeys(start: number, end: number): (PublicKey | string)[];
  /**
   * Generate a single Change Public Key derivation at a given index.
   */
  changePubkey(index: number): PublicKey;
  /**
   * Generate a range of Change Public Key derivations and return them as strings.
   */
  changePubkeysAsStrings(start: number, end: number): Array<string>;
  /**
   * Generate a single Change Public Key derivation at a given index and return it as a string.
   */
  changePubkeyAsString(index: number): string;
  /**
   * Generate Change Address derivations for a given range.
   */
  changeAddresses(networkType: NetworkType | NetworkId | string, start: number, end: number): Address[];
  /**
   * Generate a single Change Address derivation at a given index.
   */
  changeAddress(networkType: NetworkType | NetworkId | string, index: number): Address;
  /**
   * Generate a range of Change Address derivations and return them as strings.
   */
  changeAddressAsStrings(networkType: NetworkType | NetworkId | string, start: number, end: number): Array<string>;
  /**
   * Generate a single Change Address derivation at a given index and return it as a string.
   */
  changeAddressAsString(networkType: NetworkType | NetworkId | string, index: number): string;
  toString(): string;
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
 *
 * Data structure that envelopes a XOnlyPublicKey.
 *
 * XOnlyPublicKey is used as a payload part of the {@link Address}.
 *
 * @see {@link PublicKey}
 * @category Wallet SDK
 */
export class XOnlyPublicKey {
  free(): void;
  constructor(key: string);
  toString(): string;
  /**
   * Get the [`Address`] of this XOnlyPublicKey.
   * Receives a [`NetworkType`] to determine the prefix of the address.
   * JavaScript: `let address = xOnlyPublicKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddress(network: NetworkType | NetworkId | string): Address;
  /**
   * Get `ECDSA` [`Address`] of this XOnlyPublicKey.
   * Receives a [`NetworkType`] to determine the prefix of the address.
   * JavaScript: `let address = xOnlyPublicKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddressECDSA(network: NetworkType | NetworkId | string): Address;
  static fromAddress(address: Address): XOnlyPublicKey;
}
/**
 *
 * Extended private key (XPrv).
 *
 * This class allows accepts a master seed and provides
 * functions for derivation of dependent child private keys.
 *
 * Please note that Kaspa extended private keys use `kprv` prefix.
 *
 * @see {@link PrivateKeyGenerator}, {@link PublicKeyGenerator}, {@link XPub}, {@link Mnemonic}
 * @category Wallet SDK
 */
export class XPrv {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(seed: HexString);
  /**
   * Create {@link XPrv} from `xprvxxxx..` string
   */
  static fromXPrv(xprv: string): XPrv;
  deriveChild(child_number: number, hardened?: boolean | null): XPrv;
  derivePath(path: any): XPrv;
  intoString(prefix: string): string;
  toString(): string;
  toXPub(): XPub;
  toPrivateKey(): PrivateKey;
  readonly xprv: string;
  readonly privateKey: string;
  readonly depth: number;
  readonly parentFingerprint: string;
  readonly childNumber: number;
  readonly chainCode: string;
}
/**
 *
 * Extended public key (XPub).
 *
 * This class allows accepts another XPub and and provides
 * functions for derivation of dependent child public keys.
 *
 * Please note that Kaspa extended public keys use `kpub` prefix.
 *
 * @see {@link PrivateKeyGenerator}, {@link PublicKeyGenerator}, {@link XPrv}, {@link Mnemonic}
 * @category Wallet SDK
 */
export class XPub {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(xpub: string);
  deriveChild(child_number: number, hardened?: boolean | null): XPub;
  derivePath(path: any): XPub;
  intoString(prefix: string): string;
  toPublicKey(): PublicKey;
  readonly xpub: string;
  readonly depth: number;
  readonly parentFingerprint: string;
  readonly childNumber: number;
  readonly chainCode: string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_address_free: (a: number, b: number) => void;
  readonly address_constructor: (a: number, b: number) => number;
  readonly address_validate: (a: number, b: number) => number;
  readonly address_toString: (a: number, b: number) => void;
  readonly address_version: (a: number, b: number) => void;
  readonly address_prefix: (a: number, b: number) => void;
  readonly address_set_setPrefix: (a: number, b: number, c: number) => void;
  readonly address_payload: (a: number, b: number) => void;
  readonly address_short: (a: number, b: number, c: number) => void;
  readonly __wbg_mnemonic_free: (a: number, b: number) => void;
  readonly mnemonic_constructor: (a: number, b: number, c: number, d: number) => void;
  readonly mnemonic_validate: (a: number, b: number, c: number) => number;
  readonly mnemonic_entropy: (a: number, b: number) => void;
  readonly mnemonic_set_entropy: (a: number, b: number, c: number) => void;
  readonly mnemonic_random: (a: number, b: number) => void;
  readonly mnemonic_phrase: (a: number, b: number) => void;
  readonly mnemonic_set_phrase: (a: number, b: number, c: number) => void;
  readonly mnemonic_toSeed: (a: number, b: number, c: number, d: number) => void;
  readonly __wbg_networkid_free: (a: number, b: number) => void;
  readonly __wbg_get_networkid_type: (a: number) => number;
  readonly __wbg_set_networkid_type: (a: number, b: number) => void;
  readonly __wbg_get_networkid_suffix: (a: number) => number;
  readonly __wbg_set_networkid_suffix: (a: number, b: number) => void;
  readonly networkid_ctor: (a: number, b: number) => void;
  readonly networkid_id: (a: number, b: number) => void;
  readonly networkid_addressPrefix: (a: number, b: number) => void;
  readonly networkid_toString: (a: number, b: number) => void;
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
  readonly scriptpublickey_constructor: (a: number, b: number, c: number) => void;
  readonly scriptpublickey_script_as_hex: (a: number, b: number) => void;
  readonly __wbg_hash_free: (a: number, b: number) => void;
  readonly hash_constructor: (a: number, b: number) => number;
  readonly hash_toString: (a: number, b: number) => void;
  readonly __wbg_publickey_free: (a: number, b: number) => void;
  readonly publickey_try_new: (a: number, b: number, c: number) => void;
  readonly publickey_toString: (a: number, b: number) => void;
  readonly publickey_toAddress: (a: number, b: number, c: number) => void;
  readonly publickey_toAddressECDSA: (a: number, b: number, c: number) => void;
  readonly publickey_toXOnlyPublicKey: (a: number) => number;
  readonly publickey_fingerprint: (a: number) => number;
  readonly __wbg_xonlypublickey_free: (a: number, b: number) => void;
  readonly xonlypublickey_try_new: (a: number, b: number, c: number) => void;
  readonly xonlypublickey_toString: (a: number, b: number) => void;
  readonly xonlypublickey_toAddress: (a: number, b: number, c: number) => void;
  readonly xonlypublickey_toAddressECDSA: (a: number, b: number, c: number) => void;
  readonly xonlypublickey_fromAddress: (a: number, b: number) => void;
  readonly __wbg_privatekey_free: (a: number, b: number) => void;
  readonly privatekey_try_new: (a: number, b: number, c: number) => void;
  readonly privatekey_toString: (a: number, b: number) => void;
  readonly privatekey_toKeypair: (a: number, b: number) => void;
  readonly privatekey_toPublicKey: (a: number, b: number) => void;
  readonly privatekey_toAddress: (a: number, b: number, c: number) => void;
  readonly privatekey_toAddressECDSA: (a: number, b: number, c: number) => void;
  readonly __wbg_xprv_free: (a: number, b: number) => void;
  readonly xprv_try_new: (a: number, b: number) => void;
  readonly xprv_fromXPrv: (a: number, b: number, c: number) => void;
  readonly xprv_deriveChild: (a: number, b: number, c: number, d: number) => void;
  readonly xprv_derivePath: (a: number, b: number, c: number) => void;
  readonly xprv_intoString: (a: number, b: number, c: number, d: number) => void;
  readonly xprv_toString: (a: number, b: number) => void;
  readonly xprv_toXPub: (a: number, b: number) => void;
  readonly xprv_toPrivateKey: (a: number, b: number) => void;
  readonly xprv_privateKey: (a: number, b: number) => void;
  readonly xprv_depth: (a: number) => number;
  readonly xprv_parentFingerprint: (a: number, b: number) => void;
  readonly xprv_childNumber: (a: number) => number;
  readonly xprv_chainCode: (a: number, b: number) => void;
  readonly xprv_xprv: (a: number, b: number) => void;
  readonly __wbg_keypair_free: (a: number, b: number) => void;
  readonly keypair_get_public_key: (a: number, b: number) => void;
  readonly keypair_get_private_key: (a: number, b: number) => void;
  readonly keypair_get_xonly_public_key: (a: number) => number;
  readonly keypair_toAddress: (a: number, b: number, c: number) => void;
  readonly keypair_toAddressECDSA: (a: number, b: number, c: number) => void;
  readonly keypair_random: (a: number) => void;
  readonly keypair_fromPrivateKey: (a: number, b: number) => void;
  readonly __wbg_xpub_free: (a: number, b: number) => void;
  readonly xpub_try_new: (a: number, b: number, c: number) => void;
  readonly xpub_deriveChild: (a: number, b: number, c: number, d: number) => void;
  readonly xpub_derivePath: (a: number, b: number, c: number) => void;
  readonly xpub_intoString: (a: number, b: number, c: number, d: number) => void;
  readonly xpub_toPublicKey: (a: number) => number;
  readonly xpub_xpub: (a: number, b: number) => void;
  readonly xpub_depth: (a: number) => number;
  readonly xpub_parentFingerprint: (a: number, b: number) => void;
  readonly xpub_childNumber: (a: number) => number;
  readonly xpub_chainCode: (a: number, b: number) => void;
  readonly __wbg_publickeygenerator_free: (a: number, b: number) => void;
  readonly publickeygenerator_fromXPub: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_fromMasterXPrv: (a: number, b: number, c: number, d: bigint, e: number) => void;
  readonly publickeygenerator_receivePubkeys: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_receivePubkey: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_receivePubkeysAsStrings: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_receivePubkeyAsString: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_receiveAddresses: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly publickeygenerator_receiveAddress: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_receiveAddressAsStrings: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly publickeygenerator_receiveAddressAsString: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_changePubkeys: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_changePubkey: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_changePubkeysAsStrings: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_changePubkeyAsString: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_changeAddresses: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly publickeygenerator_changeAddress: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_changeAddressAsStrings: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly publickeygenerator_changeAddressAsString: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_toString: (a: number, b: number) => void;
  readonly __wbg_privatekeygenerator_free: (a: number, b: number) => void;
  readonly privatekeygenerator_new: (a: number, b: number, c: number, d: bigint, e: number) => void;
  readonly privatekeygenerator_receiveKey: (a: number, b: number, c: number) => void;
  readonly privatekeygenerator_changeKey: (a: number, b: number, c: number) => void;
  readonly __wbg_derivationpath_free: (a: number, b: number) => void;
  readonly derivationpath_new: (a: number, b: number, c: number) => void;
  readonly derivationpath_isEmpty: (a: number) => number;
  readonly derivationpath_length: (a: number) => number;
  readonly derivationpath_parent: (a: number) => number;
  readonly derivationpath_push: (a: number, b: number, c: number, d: number) => void;
  readonly derivationpath_toString: (a: number, b: number) => void;
  readonly version: (a: number) => void;
  readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (a: number, b: number) => void;
  readonly __wbg_aborted_free: (a: number, b: number) => void;
  readonly __wbg_abortable_free: (a: number, b: number) => void;
  readonly abortable_new: () => number;
  readonly abortable_isAborted: (a: number) => number;
  readonly abortable_abort: (a: number) => void;
  readonly abortable_check: (a: number, b: number) => void;
  readonly abortable_reset: (a: number) => void;
  readonly setLogLevel: (a: number) => void;
  readonly initWASM32Bindings: (a: number, b: number) => void;
  readonly initConsolePanicHook: () => void;
  readonly initBrowserPanicHook: () => void;
  readonly presentPanicHookLogs: () => void;
  readonly defer: () => number;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
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

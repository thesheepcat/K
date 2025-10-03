let wasm;

function logError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        let error = (function () {
            try {
                return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
            } catch(_) {
                return "<failed to stringify thrown value>";
            }
        }());
        console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
        throw e;
    }
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (typeof(arg) !== 'string') throw new Error(`expected a string argument, found ${typeof(arg)}`);

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);
        if (ret.read !== arg.length) throw new Error('failed to pass whole string');
        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function _assertBoolean(n) {
    if (typeof(n) !== 'boolean') {
        throw new Error(`expected a boolean argument, found ${typeof(n)}`);
    }
}

function _assertNum(n) {
    if (typeof(n) !== 'number') throw new Error(`expected a number argument, found ${typeof(n)}`);
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}
/**
 * Returns the version of the Rusty Kaspa framework.
 * @category General
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * Configuration for the WASM32 bindings runtime interface.
 * @see {@link IWASM32BindingsConfig}
 * @category General
 * @param {IWASM32BindingsConfig} config
 */
export function initWASM32Bindings(config) {
    const ret = wasm.initWASM32Bindings(config);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Initialize Rust panic handler in console mode.
 *
 * This will output additional debug information during a panic to the console.
 * This function should be called right after loading WASM libraries.
 * @category General
 */
export function initConsolePanicHook() {
    wasm.initConsolePanicHook();
}

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
export function initBrowserPanicHook() {
    wasm.initBrowserPanicHook();
}

/**
 * Present panic logs to the user in the browser.
 *
 * This function should be called after a panic has occurred and the
 * browser-based panic hook has been activated. It will present the
 * collected panic logs in a full-screen `DIV` in the browser.
 * @see {@link initBrowserPanicHook}
 * @category General
 */
export function presentPanicHookLogs() {
    wasm.presentPanicHookLogs();
}

/**
 * r" Deferred promise - an object that has `resolve()` and `reject()`
 * r" functions that can be called outside of the promise body.
 * r" WARNING: This function uses `eval` and can not be used in environments
 * r" where dynamically-created code can not be executed such as web browser
 * r" extensions.
 * r" @category General
 * @returns {Promise<any>}
 */
export function defer() {
    const ret = wasm.defer();
    return ret;
}

/**
 * Set the logger log level using a string representation.
 * Available variants are: 'off', 'error', 'warn', 'info', 'debug', 'trace'
 * @category General
 * @param {"off" | "error" | "warn" | "info" | "debug" | "trace"} level
 */
export function setLogLevel(level) {
    wasm.setLogLevel(level);
}

function _assertBigInt(n) {
    if (typeof(n) !== 'bigint') throw new Error(`expected a bigint argument, found ${typeof(n)}`);
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}
/**
 *
 *  Kaspa `Address` version (`PubKey`, `PubKey ECDSA`, `ScriptHash`)
 *
 * @category Address
 * @enum {0 | 1 | 8}
 */
export const AddressVersion = Object.freeze({
    /**
     * PubKey addresses always have the version byte set to 0
     */
    PubKey: 0, "0": "PubKey",
    /**
     * PubKey ECDSA addresses always have the version byte set to 1
     */
    PubKeyECDSA: 1, "1": "PubKeyECDSA",
    /**
     * ScriptHash addresses always have the version byte set to 8
     */
    ScriptHash: 8, "8": "ScriptHash",
});
/**
 *
 * Languages supported by BIP39.
 *
 * Presently only English is specified by the BIP39 standard.
 *
 * @see {@link Mnemonic}
 *
 * @category Wallet SDK
 * @enum {0}
 */
export const Language = Object.freeze({
    /**
     * English is presently the only supported language
     */
    English: 0, "0": "English",
});
/**
 * @category Consensus
 * @enum {0 | 1 | 2 | 3}
 */
export const NetworkType = Object.freeze({
    Mainnet: 0, "0": "Mainnet",
    Testnet: 1, "1": "Testnet",
    Devnet: 2, "2": "Devnet",
    Simnet: 3, "3": "Simnet",
});
/**
 * Kaspa Sighash types allowed by consensus
 * @category Consensus
 * @enum {0 | 1 | 2 | 3 | 4 | 5}
 */
export const SighashType = Object.freeze({
    All: 0, "0": "All",
    None: 1, "1": "None",
    Single: 2, "2": "Single",
    AllAnyOneCanPay: 3, "3": "AllAnyOneCanPay",
    NoneAnyOneCanPay: 4, "4": "NoneAnyOneCanPay",
    SingleAnyOneCanPay: 5, "5": "SingleAnyOneCanPay",
});

const AbortableFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_abortable_free(ptr >>> 0, 1));
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

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AbortableFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_abortable_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.abortable_new();
        this.__wbg_ptr = ret >>> 0;
        AbortableFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {boolean}
     */
    isAborted() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.abortable_isAborted(this.__wbg_ptr);
        return ret !== 0;
    }
    abort() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.abortable_abort(this.__wbg_ptr);
    }
    check() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.abortable_check(this.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    reset() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.abortable_reset(this.__wbg_ptr);
    }
}

const AbortedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_aborted_free(ptr >>> 0, 1));
/**
 * Error emitted by [`Abortable`].
 * @category General
 */
export class Aborted {

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Aborted.prototype);
        obj.__wbg_ptr = ptr;
        AbortedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AbortedFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_aborted_free(ptr, 0);
    }
}

const AddressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_address_free(ptr >>> 0, 1));
/**
 * Kaspa [`Address`] struct that serializes to and from an address format string: `kaspa:qz0s...t8cv`.
 *
 * @category Address
 */
export class Address {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Address.prototype);
        obj.__wbg_ptr = ptr;
        AddressFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            version: this.version,
            prefix: this.prefix,
            payload: this.payload,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AddressFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_address_free(ptr, 0);
    }
    /**
     * @param {string} address
     */
    constructor(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.address_constructor(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        AddressFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} address
     * @returns {boolean}
     */
    static validate(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.address_validate(ptr0, len0);
        return ret !== 0;
    }
    /**
     * Convert an address to a string.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.address_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get version() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.address_version(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get prefix() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.address_prefix(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} prefix
     */
    set setPrefix(prefix) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(prefix, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.address_set_setPrefix(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get payload() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.address_payload(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {number} n
     * @returns {string}
     */
    short(n) {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            _assertNum(n);
            const ret = wasm.address_short(this.__wbg_ptr, n);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const DerivationPathFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_derivationpath_free(ptr >>> 0, 1));
/**
 *
 * Key derivation path
 *
 * @category Wallet SDK
 */
export class DerivationPath {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DerivationPath.prototype);
        obj.__wbg_ptr = ptr;
        DerivationPathFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DerivationPathFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_derivationpath_free(ptr, 0);
    }
    /**
     * @param {string} path
     */
    constructor(path) {
        const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.derivationpath_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        DerivationPathFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Is this derivation path empty? (i.e. the root)
     * @returns {boolean}
     */
    isEmpty() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.derivationpath_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the count of [`ChildNumber`] values in this derivation path.
     * @returns {number}
     */
    length() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.derivationpath_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get the parent [`DerivationPath`] for the current one.
     *
     * Returns `Undefined` if this is already the root path.
     * @returns {DerivationPath | undefined}
     */
    parent() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.derivationpath_parent(this.__wbg_ptr);
        return ret === 0 ? undefined : DerivationPath.__wrap(ret);
    }
    /**
     * Push a [`ChildNumber`] onto an existing derivation path.
     * @param {number} child_number
     * @param {boolean | null} [hardened]
     */
    push(child_number, hardened) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(child_number);
        if (!isLikeNone(hardened)) {
            _assertBoolean(hardened);
        }
        const ret = wasm.derivationpath_push(this.__wbg_ptr, child_number, isLikeNone(hardened) ? 0xFFFFFF : hardened ? 1 : 0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.derivationpath_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const HashFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hash_free(ptr >>> 0, 1));
/**
 * @category General
 */
export class Hash {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HashFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hash_free(ptr, 0);
    }
    /**
     * @param {string} hex_str
     */
    constructor(hex_str) {
        const ptr0 = passStringToWasm0(hex_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.hash_constructor(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        HashFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.hash_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const KeypairFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_keypair_free(ptr >>> 0, 1));
/**
 * Data structure that contains a secret and public keys.
 * @category Wallet SDK
 */
export class Keypair {

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Keypair.prototype);
        obj.__wbg_ptr = ptr;
        KeypairFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            publicKey: this.publicKey,
            privateKey: this.privateKey,
            xOnlyPublicKey: this.xOnlyPublicKey,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KeypairFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_keypair_free(ptr, 0);
    }
    /**
     * Get the [`PublicKey`] of this [`Keypair`].
     * @returns {string}
     */
    get publicKey() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.keypair_get_public_key(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get the [`PrivateKey`] of this [`Keypair`].
     * @returns {string}
     */
    get privateKey() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.keypair_get_private_key(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get the `XOnlyPublicKey` of this [`Keypair`].
     * @returns {any}
     */
    get xOnlyPublicKey() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.keypair_get_xonly_public_key(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get the [`Address`] of this Keypair's [`PublicKey`].
     * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
     * to determine the prefix of the address.
     * JavaScript: `let address = keypair.toAddress(NetworkType.MAINNET);`.
     * @param {NetworkType | NetworkId | string} network
     * @returns {Address}
     */
    toAddress(network) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.keypair_toAddress(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Get `ECDSA` [`Address`] of this Keypair's [`PublicKey`].
     * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
     * to determine the prefix of the address.
     * JavaScript: `let address = keypair.toAddress(NetworkType.MAINNET);`.
     * @param {NetworkType | NetworkId | string} network
     * @returns {Address}
     */
    toAddressECDSA(network) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.keypair_toAddressECDSA(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Create a new random [`Keypair`].
     * JavaScript: `let keypair = Keypair::random();`.
     * @returns {Keypair}
     */
    static random() {
        const ret = wasm.keypair_random();
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Keypair.__wrap(ret[0]);
    }
    /**
     * Create a new [`Keypair`] from a [`PrivateKey`].
     * JavaScript: `let privkey = new PrivateKey(hexString); let keypair = privkey.toKeypair();`.
     * @param {PrivateKey} secret_key
     * @returns {Keypair}
     */
    static fromPrivateKey(secret_key) {
        _assertClass(secret_key, PrivateKey);
        if (secret_key.__wbg_ptr === 0) {
            throw new Error('Attempt to use a moved value');
        }
        const ret = wasm.keypair_fromPrivateKey(secret_key.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Keypair.__wrap(ret[0]);
    }
}

const MnemonicFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mnemonic_free(ptr >>> 0, 1));
/**
 * BIP39 mnemonic phrases: sequences of words representing cryptographic keys.
 * @category Wallet SDK
 */
export class Mnemonic {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Mnemonic.prototype);
        obj.__wbg_ptr = ptr;
        MnemonicFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            entropy: this.entropy,
            phrase: this.phrase,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MnemonicFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mnemonic_free(ptr, 0);
    }
    /**
     * @param {string} phrase
     * @param {Language | null} [language]
     */
    constructor(phrase, language) {
        const ptr0 = passStringToWasm0(phrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        if (!isLikeNone(language)) {
            _assertNum(language);
        }
        const ret = wasm.mnemonic_constructor(ptr0, len0, isLikeNone(language) ? 1 : language);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        MnemonicFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Validate mnemonic phrase. Returns `true` if the phrase is valid, `false` otherwise.
     * @param {string} phrase
     * @param {Language | null} [language]
     * @returns {boolean}
     */
    static validate(phrase, language) {
        const ptr0 = passStringToWasm0(phrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        if (!isLikeNone(language)) {
            _assertNum(language);
        }
        const ret = wasm.mnemonic_validate(ptr0, len0, isLikeNone(language) ? 1 : language);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get entropy() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.mnemonic_entropy(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} entropy
     */
    set entropy(entropy) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(entropy, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.mnemonic_set_entropy(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {number | null} [word_count]
     * @returns {Mnemonic}
     */
    static random(word_count) {
        if (!isLikeNone(word_count)) {
            _assertNum(word_count);
        }
        const ret = wasm.mnemonic_random(isLikeNone(word_count) ? 0x100000001 : (word_count) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Mnemonic.__wrap(ret[0]);
    }
    /**
     * @returns {string}
     */
    get phrase() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.mnemonic_phrase(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} phrase
     */
    set phrase(phrase) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(phrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.mnemonic_set_phrase(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string | null} [password]
     * @returns {string}
     */
    toSeed(password) {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            var ptr0 = isLikeNone(password) ? 0 : passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            const ret = wasm.mnemonic_toSeed(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}

const NetworkIdFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_networkid_free(ptr >>> 0, 1));
/**
 *
 * NetworkId is a unique identifier for a kaspa network instance.
 * It is composed of a network type and an optional suffix.
 *
 * @category Consensus
 */
export class NetworkId {

    toJSON() {
        return {
            type: this.type,
            suffix: this.suffix,
            id: this.id,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NetworkIdFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_networkid_free(ptr, 0);
    }
    /**
     * @returns {NetworkType}
     */
    get type() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_networkid_type(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {NetworkType} arg0
     */
    set type(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(arg0);
        wasm.__wbg_set_networkid_type(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number | undefined}
     */
    get suffix() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_networkid_suffix(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * @param {number | null} [arg0]
     */
    set suffix(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        if (!isLikeNone(arg0)) {
            _assertNum(arg0);
        }
        wasm.__wbg_set_networkid_suffix(this.__wbg_ptr, isLikeNone(arg0) ? 0x100000001 : (arg0) >>> 0);
    }
    /**
     * @param {any} value
     */
    constructor(value) {
        const ret = wasm.networkid_ctor(value);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        NetworkIdFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    get id() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.networkid_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.networkid_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    addressPrefix() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.networkid_addressPrefix(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const PrivateKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_privatekey_free(ptr >>> 0, 1));
/**
 * Data structure that envelops a Private Key.
 * @category Wallet SDK
 */
export class PrivateKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PrivateKey.prototype);
        obj.__wbg_ptr = ptr;
        PrivateKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PrivateKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_privatekey_free(ptr, 0);
    }
    /**
     * Create a new [`PrivateKey`] from a hex-encoded string.
     * @param {string} key
     */
    constructor(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.privatekey_try_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        PrivateKeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the [`PrivateKey`] key encoded as a hex string.
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.privatekey_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Generate a [`Keypair`] from this [`PrivateKey`].
     * @returns {Keypair}
     */
    toKeypair() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.privatekey_toKeypair(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Keypair.__wrap(ret[0]);
    }
    /**
     * @returns {PublicKey}
     */
    toPublicKey() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.privatekey_toPublicKey(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PublicKey.__wrap(ret[0]);
    }
    /**
     * Get the [`Address`] of the PublicKey generated from this PrivateKey.
     * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
     * to determine the prefix of the address.
     * JavaScript: `let address = privateKey.toAddress(NetworkType.MAINNET);`.
     * @param {NetworkType | NetworkId | string} network
     * @returns {Address}
     */
    toAddress(network) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.privatekey_toAddress(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Get `ECDSA` [`Address`] of the PublicKey generated from this PrivateKey.
     * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
     * to determine the prefix of the address.
     * JavaScript: `let address = privateKey.toAddress(NetworkType.MAINNET);`.
     * @param {NetworkType | NetworkId | string} network
     * @returns {Address}
     */
    toAddressECDSA(network) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.privatekey_toAddressECDSA(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
}

const PrivateKeyGeneratorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_privatekeygenerator_free(ptr >>> 0, 1));
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

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PrivateKeyGeneratorFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_privatekeygenerator_free(ptr, 0);
    }
    /**
     * @param {XPrv | string} xprv
     * @param {boolean} is_multisig
     * @param {bigint} account_index
     * @param {number | null} [cosigner_index]
     */
    constructor(xprv, is_multisig, account_index, cosigner_index) {
        _assertBoolean(is_multisig);
        _assertBigInt(account_index);
        if (!isLikeNone(cosigner_index)) {
            _assertNum(cosigner_index);
        }
        const ret = wasm.privatekeygenerator_new(xprv, is_multisig, account_index, isLikeNone(cosigner_index) ? 0x100000001 : (cosigner_index) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        PrivateKeyGeneratorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} index
     * @returns {PrivateKey}
     */
    receiveKey(index) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(index);
        const ret = wasm.privatekeygenerator_receiveKey(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PrivateKey.__wrap(ret[0]);
    }
    /**
     * @param {number} index
     * @returns {PrivateKey}
     */
    changeKey(index) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(index);
        const ret = wasm.privatekeygenerator_changeKey(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PrivateKey.__wrap(ret[0]);
    }
}

const PublicKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_publickey_free(ptr >>> 0, 1));
/**
 * Data structure that envelopes a PublicKey.
 * Only supports Schnorr-based addresses.
 * @category Wallet SDK
 */
export class PublicKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PublicKey.prototype);
        obj.__wbg_ptr = ptr;
        PublicKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PublicKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_publickey_free(ptr, 0);
    }
    /**
     * Create a new [`PublicKey`] from a hex-encoded string.
     * @param {string} key
     */
    constructor(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.publickey_try_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        PublicKeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.publickey_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get the [`Address`] of this PublicKey.
     * Receives a [`NetworkType`] to determine the prefix of the address.
     * JavaScript: `let address = publicKey.toAddress(NetworkType.MAINNET);`.
     * @param {NetworkType | NetworkId | string} network
     * @returns {Address}
     */
    toAddress(network) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.publickey_toAddress(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Get `ECDSA` [`Address`] of this PublicKey.
     * Receives a [`NetworkType`] to determine the prefix of the address.
     * JavaScript: `let address = publicKey.toAddress(NetworkType.MAINNET);`.
     * @param {NetworkType | NetworkId | string} network
     * @returns {Address}
     */
    toAddressECDSA(network) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.publickey_toAddressECDSA(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * @returns {XOnlyPublicKey}
     */
    toXOnlyPublicKey() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.publickey_toXOnlyPublicKey(this.__wbg_ptr);
        return XOnlyPublicKey.__wrap(ret);
    }
    /**
     * Compute a 4-byte key fingerprint for this public key as a hex string.
     * Default implementation uses `RIPEMD160(SHA256(public_key))`.
     * @returns {HexString | undefined}
     */
    fingerprint() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.publickey_fingerprint(this.__wbg_ptr);
        return ret;
    }
}

const PublicKeyGeneratorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_publickeygenerator_free(ptr >>> 0, 1));
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

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PublicKeyGenerator.prototype);
        obj.__wbg_ptr = ptr;
        PublicKeyGeneratorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PublicKeyGeneratorFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_publickeygenerator_free(ptr, 0);
    }
    /**
     * @param {XPub | string} kpub
     * @param {number | null} [cosigner_index]
     * @returns {PublicKeyGenerator}
     */
    static fromXPub(kpub, cosigner_index) {
        if (!isLikeNone(cosigner_index)) {
            _assertNum(cosigner_index);
        }
        const ret = wasm.publickeygenerator_fromXPub(kpub, isLikeNone(cosigner_index) ? 0x100000001 : (cosigner_index) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PublicKeyGenerator.__wrap(ret[0]);
    }
    /**
     * @param {XPrv | string} xprv
     * @param {boolean} is_multisig
     * @param {bigint} account_index
     * @param {number | null} [cosigner_index]
     * @returns {PublicKeyGenerator}
     */
    static fromMasterXPrv(xprv, is_multisig, account_index, cosigner_index) {
        _assertBoolean(is_multisig);
        _assertBigInt(account_index);
        if (!isLikeNone(cosigner_index)) {
            _assertNum(cosigner_index);
        }
        const ret = wasm.publickeygenerator_fromMasterXPrv(xprv, is_multisig, account_index, isLikeNone(cosigner_index) ? 0x100000001 : (cosigner_index) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PublicKeyGenerator.__wrap(ret[0]);
    }
    /**
     * Generate Receive Public Key derivations for a given range.
     * @param {number} start
     * @param {number} end
     * @returns {(PublicKey | string)[]}
     */
    receivePubkeys(start, end) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(start);
        _assertNum(end);
        const ret = wasm.publickeygenerator_receivePubkeys(this.__wbg_ptr, start, end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate a single Receive Public Key derivation at a given index.
     * @param {number} index
     * @returns {PublicKey}
     */
    receivePubkey(index) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(index);
        const ret = wasm.publickeygenerator_receivePubkey(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PublicKey.__wrap(ret[0]);
    }
    /**
     * Generate a range of Receive Public Key derivations and return them as strings.
     * @param {number} start
     * @param {number} end
     * @returns {Array<string>}
     */
    receivePubkeysAsStrings(start, end) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(start);
        _assertNum(end);
        const ret = wasm.publickeygenerator_receivePubkeysAsStrings(this.__wbg_ptr, start, end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate a single Receive Public Key derivation at a given index and return it as a string.
     * @param {number} index
     * @returns {string}
     */
    receivePubkeyAsString(index) {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            _assertNum(index);
            const ret = wasm.publickeygenerator_receivePubkeyAsString(this.__wbg_ptr, index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Generate Receive Address derivations for a given range.
     * @param {NetworkType | NetworkId | string} networkType
     * @param {number} start
     * @param {number} end
     * @returns {Address[]}
     */
    receiveAddresses(networkType, start, end) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(start);
        _assertNum(end);
        const ret = wasm.publickeygenerator_receiveAddresses(this.__wbg_ptr, networkType, start, end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate a single Receive Address derivation at a given index.
     * @param {NetworkType | NetworkId | string} networkType
     * @param {number} index
     * @returns {Address}
     */
    receiveAddress(networkType, index) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(index);
        const ret = wasm.publickeygenerator_receiveAddress(this.__wbg_ptr, networkType, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Generate a range of Receive Address derivations and return them as strings.
     * @param {NetworkType | NetworkId | string} networkType
     * @param {number} start
     * @param {number} end
     * @returns {Array<string>}
     */
    receiveAddressAsStrings(networkType, start, end) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(start);
        _assertNum(end);
        const ret = wasm.publickeygenerator_receiveAddressAsStrings(this.__wbg_ptr, networkType, start, end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate a single Receive Address derivation at a given index and return it as a string.
     * @param {NetworkType | NetworkId | string} networkType
     * @param {number} index
     * @returns {string}
     */
    receiveAddressAsString(networkType, index) {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            _assertNum(index);
            const ret = wasm.publickeygenerator_receiveAddressAsString(this.__wbg_ptr, networkType, index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Generate Change Public Key derivations for a given range.
     * @param {number} start
     * @param {number} end
     * @returns {(PublicKey | string)[]}
     */
    changePubkeys(start, end) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(start);
        _assertNum(end);
        const ret = wasm.publickeygenerator_changePubkeys(this.__wbg_ptr, start, end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate a single Change Public Key derivation at a given index.
     * @param {number} index
     * @returns {PublicKey}
     */
    changePubkey(index) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(index);
        const ret = wasm.publickeygenerator_changePubkey(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PublicKey.__wrap(ret[0]);
    }
    /**
     * Generate a range of Change Public Key derivations and return them as strings.
     * @param {number} start
     * @param {number} end
     * @returns {Array<string>}
     */
    changePubkeysAsStrings(start, end) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(start);
        _assertNum(end);
        const ret = wasm.publickeygenerator_changePubkeysAsStrings(this.__wbg_ptr, start, end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate a single Change Public Key derivation at a given index and return it as a string.
     * @param {number} index
     * @returns {string}
     */
    changePubkeyAsString(index) {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            _assertNum(index);
            const ret = wasm.publickeygenerator_changePubkeyAsString(this.__wbg_ptr, index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Generate Change Address derivations for a given range.
     * @param {NetworkType | NetworkId | string} networkType
     * @param {number} start
     * @param {number} end
     * @returns {Address[]}
     */
    changeAddresses(networkType, start, end) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(start);
        _assertNum(end);
        const ret = wasm.publickeygenerator_changeAddresses(this.__wbg_ptr, networkType, start, end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate a single Change Address derivation at a given index.
     * @param {NetworkType | NetworkId | string} networkType
     * @param {number} index
     * @returns {Address}
     */
    changeAddress(networkType, index) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(index);
        const ret = wasm.publickeygenerator_changeAddress(this.__wbg_ptr, networkType, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Generate a range of Change Address derivations and return them as strings.
     * @param {NetworkType | NetworkId | string} networkType
     * @param {number} start
     * @param {number} end
     * @returns {Array<string>}
     */
    changeAddressAsStrings(networkType, start, end) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(start);
        _assertNum(end);
        const ret = wasm.publickeygenerator_changeAddressAsStrings(this.__wbg_ptr, networkType, start, end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate a single Change Address derivation at a given index and return it as a string.
     * @param {NetworkType | NetworkId | string} networkType
     * @param {number} index
     * @returns {string}
     */
    changeAddressAsString(networkType, index) {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            _assertNum(index);
            const ret = wasm.publickeygenerator_changeAddressAsString(this.__wbg_ptr, networkType, index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.publickeygenerator_toString(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}

const ScriptPublicKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_scriptpublickey_free(ptr >>> 0, 1));
/**
 * Represents a Kaspad ScriptPublicKey
 * @category Consensus
 */
export class ScriptPublicKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ScriptPublicKey.prototype);
        obj.__wbg_ptr = ptr;
        ScriptPublicKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            version: this.version,
            script: this.script,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ScriptPublicKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_scriptpublickey_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get version() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_scriptpublickey_version(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set version(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(arg0);
        wasm.__wbg_set_scriptpublickey_version(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} version
     * @param {any} script
     */
    constructor(version, script) {
        _assertNum(version);
        const ret = wasm.scriptpublickey_constructor(version, script);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        ScriptPublicKeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    get script() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.scriptpublickey_script_as_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const SigHashTypeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sighashtype_free(ptr >>> 0, 1));

export class SigHashType {

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SigHashTypeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sighashtype_free(ptr, 0);
    }
}

const TransactionUtxoEntryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionutxoentry_free(ptr >>> 0, 1));
/**
 * Holds details about an individual transaction output in a utxo
 * set such as whether or not it was contained in a coinbase tx, the daa
 * score of the block that accepts the tx, its public key script, and how
 * much it pays.
 * @category Consensus
 */
export class TransactionUtxoEntry {

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

    toJSON() {
        return {
            amount: this.amount,
            scriptPublicKey: this.scriptPublicKey,
            blockDaaScore: this.blockDaaScore,
            isCoinbase: this.isCoinbase,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionUtxoEntryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionutxoentry_free(ptr, 0);
    }
    /**
     * @returns {bigint}
     */
    get amount() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_transactionutxoentry_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set amount(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBigInt(arg0);
        wasm.__wbg_set_transactionutxoentry_amount(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {ScriptPublicKey}
     */
    get scriptPublicKey() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_transactionutxoentry_scriptPublicKey(this.__wbg_ptr);
        return ScriptPublicKey.__wrap(ret);
    }
    /**
     * @param {ScriptPublicKey} arg0
     */
    set scriptPublicKey(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertClass(arg0, ScriptPublicKey);
        if (arg0.__wbg_ptr === 0) {
            throw new Error('Attempt to use a moved value');
        }
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_transactionutxoentry_scriptPublicKey(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {bigint}
     */
    get blockDaaScore() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_transactionutxoentry_blockDaaScore(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set blockDaaScore(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBigInt(arg0);
        wasm.__wbg_set_transactionutxoentry_blockDaaScore(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {boolean}
     */
    get isCoinbase() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.__wbg_get_transactionutxoentry_isCoinbase(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} arg0
     */
    set isCoinbase(arg0) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBoolean(arg0);
        wasm.__wbg_set_transactionutxoentry_isCoinbase(this.__wbg_ptr, arg0);
    }
}

const XOnlyPublicKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_xonlypublickey_free(ptr >>> 0, 1));
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

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(XOnlyPublicKey.prototype);
        obj.__wbg_ptr = ptr;
        XOnlyPublicKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        XOnlyPublicKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_xonlypublickey_free(ptr, 0);
    }
    /**
     * @param {string} key
     */
    constructor(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.xonlypublickey_try_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        XOnlyPublicKeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xonlypublickey_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get the [`Address`] of this XOnlyPublicKey.
     * Receives a [`NetworkType`] to determine the prefix of the address.
     * JavaScript: `let address = xOnlyPublicKey.toAddress(NetworkType.MAINNET);`.
     * @param {NetworkType | NetworkId | string} network
     * @returns {Address}
     */
    toAddress(network) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xonlypublickey_toAddress(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * Get `ECDSA` [`Address`] of this XOnlyPublicKey.
     * Receives a [`NetworkType`] to determine the prefix of the address.
     * JavaScript: `let address = xOnlyPublicKey.toAddress(NetworkType.MAINNET);`.
     * @param {NetworkType | NetworkId | string} network
     * @returns {Address}
     */
    toAddressECDSA(network) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xonlypublickey_toAddressECDSA(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Address.__wrap(ret[0]);
    }
    /**
     * @param {Address} address
     * @returns {XOnlyPublicKey}
     */
    static fromAddress(address) {
        _assertClass(address, Address);
        if (address.__wbg_ptr === 0) {
            throw new Error('Attempt to use a moved value');
        }
        const ret = wasm.xonlypublickey_fromAddress(address.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return XOnlyPublicKey.__wrap(ret[0]);
    }
}

const XPrvFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_xprv_free(ptr >>> 0, 1));
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

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(XPrv.prototype);
        obj.__wbg_ptr = ptr;
        XPrvFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            xprv: this.xprv,
            privateKey: this.privateKey,
            depth: this.depth,
            parentFingerprint: this.parentFingerprint,
            childNumber: this.childNumber,
            chainCode: this.chainCode,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        XPrvFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_xprv_free(ptr, 0);
    }
    /**
     * @param {HexString} seed
     */
    constructor(seed) {
        const ret = wasm.xprv_try_new(seed);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        XPrvFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Create {@link XPrv} from `xprvxxxx..` string
     * @param {string} xprv
     * @returns {XPrv}
     */
    static fromXPrv(xprv) {
        const ptr0 = passStringToWasm0(xprv, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.xprv_fromXPrv(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return XPrv.__wrap(ret[0]);
    }
    /**
     * @param {number} child_number
     * @param {boolean | null} [hardened]
     * @returns {XPrv}
     */
    deriveChild(child_number, hardened) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(child_number);
        if (!isLikeNone(hardened)) {
            _assertBoolean(hardened);
        }
        const ret = wasm.xprv_deriveChild(this.__wbg_ptr, child_number, isLikeNone(hardened) ? 0xFFFFFF : hardened ? 1 : 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return XPrv.__wrap(ret[0]);
    }
    /**
     * @param {any} path
     * @returns {XPrv}
     */
    derivePath(path) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xprv_derivePath(this.__wbg_ptr, path);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return XPrv.__wrap(ret[0]);
    }
    /**
     * @param {string} prefix
     * @returns {string}
     */
    intoString(prefix) {
        let deferred3_0;
        let deferred3_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ptr0 = passStringToWasm0(prefix, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.xprv_intoString(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xprv_toString(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {XPub}
     */
    toXPub() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xprv_toXPub(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return XPub.__wrap(ret[0]);
    }
    /**
     * @returns {PrivateKey}
     */
    toPrivateKey() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xprv_toPrivateKey(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PrivateKey.__wrap(ret[0]);
    }
    /**
     * @returns {string}
     */
    get xprv() {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xprv_xprv(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get privateKey() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xprv_privateKey(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get depth() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xprv_depth(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    get parentFingerprint() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xprv_parentFingerprint(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get childNumber() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xprv_childNumber(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string}
     */
    get chainCode() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xprv_chainCode(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const XPubFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_xpub_free(ptr >>> 0, 1));
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

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(XPub.prototype);
        obj.__wbg_ptr = ptr;
        XPubFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            xpub: this.xpub,
            depth: this.depth,
            parentFingerprint: this.parentFingerprint,
            childNumber: this.childNumber,
            chainCode: this.chainCode,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        XPubFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_xpub_free(ptr, 0);
    }
    /**
     * @param {string} xpub
     */
    constructor(xpub) {
        const ptr0 = passStringToWasm0(xpub, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.xpub_try_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        XPubFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} child_number
     * @param {boolean | null} [hardened]
     * @returns {XPub}
     */
    deriveChild(child_number, hardened) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(child_number);
        if (!isLikeNone(hardened)) {
            _assertBoolean(hardened);
        }
        const ret = wasm.xpub_deriveChild(this.__wbg_ptr, child_number, isLikeNone(hardened) ? 0xFFFFFF : hardened ? 1 : 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return XPub.__wrap(ret[0]);
    }
    /**
     * @param {any} path
     * @returns {XPub}
     */
    derivePath(path) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xpub_derivePath(this.__wbg_ptr, path);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return XPub.__wrap(ret[0]);
    }
    /**
     * @param {string} prefix
     * @returns {string}
     */
    intoString(prefix) {
        let deferred3_0;
        let deferred3_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ptr0 = passStringToWasm0(prefix, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.xpub_intoString(this.__wbg_ptr, ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @returns {PublicKey}
     */
    toPublicKey() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xpub_toPublicKey(this.__wbg_ptr);
        return PublicKey.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    get xpub() {
        let deferred2_0;
        let deferred2_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xpub_xpub(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get depth() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xpub_depth(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    get parentFingerprint() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xpub_parentFingerprint(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get childNumber() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.xpub_childNumber(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string}
     */
    get chainCode() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.xpub_chainCode(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_aborted_new = function() { return logError(function (arg0) {
        const ret = Aborted.__wrap(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_address_new = function() { return logError(function (arg0) {
        const ret = Address.__wrap(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_appendChild_8204974b7328bf98 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.appendChild(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_body_942ea927546a04ba = function() { return logError(function (arg0) {
        const ret = arg0.body;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_buffer_609cc3eee51ed158 = function() { return logError(function (arg0) {
        const ret = arg0.buffer;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createElement_8c9931a732ee2fea = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.createElement(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_crypto_ed58b8e10a292839 = function() { return logError(function (arg0) {
        const ret = arg0.crypto;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_document_d249400bd7bd996d = function() { return logError(function (arg0) {
        const ret = arg0.document;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_error_5edc95999c70d386 = function() { return logError(function (arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_bcb4912f16000dc4 = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_get_67b2ba62fc30de12 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_innerHTML_e1553352fe93921a = function() { return logError(function (arg0, arg1) {
        const ret = arg1.innerHTML;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_instanceof_Window_def73ea0955fc569 = function() { return logError(function (arg0) {
        let result;
        try {
            result = arg0 instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        _assertBoolean(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_length_a446193dc22c12f8 = function() { return logError(function (arg0) {
        const ret = arg0.length;
        _assertNum(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_msCrypto_0a36e2ec3a343d26 = function() { return logError(function (arg0) {
        const ret = arg0.msCrypto;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_78feb108b6472713 = function() { return logError(function () {
        const ret = new Array();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_a12002a7f91c75be = function() { return logError(function (arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_f5f8a7325e1cb479 = function() { return logError(function () {
        const ret = new Error();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newnoargs_105ed471475aaf50 = function() { return logError(function (arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function() { return logError(function (arg0, arg1, arg2) {
        const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithlength_a381634e90c276d4 = function() { return logError(function (arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_node_02999533c4ea02e3 = function() { return logError(function (arg0) {
        const ret = arg0.node;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_process_5c1d670bc53614b8 = function() { return logError(function (arg0) {
        const ret = arg0.process;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_publickey_new = function() { return logError(function (arg0) {
        const ret = PublicKey.__wrap(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_push_737cfc8c1432c2c6 = function() { return logError(function (arg0, arg1) {
        const ret = arg0.push(arg1);
        _assertNum(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_randomFillSync_ab2cfe79ebbf2740 = function() { return handleError(function (arg0, arg1) {
        arg0.randomFillSync(arg1);
    }, arguments) };
    imports.wbg.__wbg_removeAttribute_e419cd6726b4c62f = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.removeAttribute(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_require_79b1e9274cde3c87 = function() { return handleError(function () {
        const ret = module.require;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setAttribute_2704501201f15687 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_set_37837023f3d740e8 = function() { return logError(function (arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    }, arguments) };
    imports.wbg.__wbg_set_65595bdd868b3009 = function() { return logError(function (arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setinnerHTML_31bde41f835786f7 = function() { return logError(function (arg0, arg1, arg2) {
        arg0.innerHTML = getStringFromWasm0(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_stack_c99a96ed42647c4c = function() { return logError(function (arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() { return logError(function () {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() { return logError(function () {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() { return logError(function () {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() { return logError(function () {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_subarray_aa9065fa9dc5df96 = function() { return logError(function (arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_versions_c71aa1626a93e0a1 = function() { return logError(function (arg0) {
        const ret = arg0.versions;
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = arg0;
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        _assertNum(ret);
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(arg0) === 'function';
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbindgen_is_null = function(arg0) {
        const ret = arg0 === null;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(arg0) === 'string';
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = arg0 === undefined;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'number' ? obj : undefined;
        if (!isLikeNone(ret)) {
            _assertNum(ret);
        }
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_try_into_number = function(arg0) {
        let result;
        try { result = +arg0 } catch (e) { result = e }
        const ret = result;
        return ret;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('kaspa_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;

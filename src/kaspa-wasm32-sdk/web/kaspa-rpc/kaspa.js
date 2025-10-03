let wasm;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export_0(addHeapObject(e));
    }
}

let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

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

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_4.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_4.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
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

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}
/**
 * Returns true if the script passed is a pay-to-script-hash (P2SH) format, false otherwise.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 * @param {HexString | Uint8Array} script
 * @returns {boolean}
 */
export function isScriptPayToScriptHash(script) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.isScriptPayToScriptHash(retptr, addHeapObject(script));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return r0 !== 0;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Returns returns true if the script passed is an ECDSA pay-to-pubkey.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 * @param {HexString | Uint8Array} script
 * @returns {boolean}
 */
export function isScriptPayToPubkeyECDSA(script) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.isScriptPayToPubkeyECDSA(retptr, addHeapObject(script));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return r0 !== 0;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Returns true if the script passed is a pay-to-pubkey.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 * @param {HexString | Uint8Array} script
 * @returns {boolean}
 */
export function isScriptPayToPubkey(script) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.isScriptPayToPubkey(retptr, addHeapObject(script));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return r0 !== 0;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Returns the address encoded in a script public key.
 * @param script_public_key - The script public key ({@link ScriptPublicKey}).
 * @param network - The network type.
 * @category Wallet SDK
 * @param {ScriptPublicKey | HexString} script_public_key
 * @param {NetworkType | NetworkId | string} network
 * @returns {Address | undefined}
 */
export function addressFromScriptPublicKey(script_public_key, network) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.addressFromScriptPublicKey(retptr, addBorrowedObject(script_public_key), addBorrowedObject(network));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        heap[stack_pointer++] = undefined;
        heap[stack_pointer++] = undefined;
    }
}

/**
 * Generates a signature script that fits a pay-to-script-hash script.
 * @param redeem_script - The redeem script ({@link HexString} or Uint8Array).
 * @param signature - The signature ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 * @param {HexString | Uint8Array} redeem_script
 * @param {HexString | Uint8Array} signature
 * @returns {HexString}
 */
export function payToScriptHashSignatureScript(redeem_script, signature) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.payToScriptHashSignatureScript(retptr, addHeapObject(redeem_script), addHeapObject(signature));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Takes a script and returns an equivalent pay-to-script-hash script.
 * @param redeem_script - The redeem script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 * @param {HexString | Uint8Array} redeem_script
 * @returns {ScriptPublicKey}
 */
export function payToScriptHashScript(redeem_script) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.payToScriptHashScript(retptr, addHeapObject(redeem_script));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return ScriptPublicKey.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Creates a new script to pay a transaction output to the specified address.
 * @category Wallet SDK
 * @param {Address | string} address
 * @returns {ScriptPublicKey}
 */
export function payToAddressScript(address) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.payToAddressScript(retptr, addBorrowedObject(address));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return ScriptPublicKey.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        heap[stack_pointer++] = undefined;
    }
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
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.version(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Set the logger log level using a string representation.
 * Available variants are: 'off', 'error', 'warn', 'info', 'debug', 'trace'
 * @category General
 * @param {"off" | "error" | "warn" | "info" | "debug" | "trace"} level
 */
export function setLogLevel(level) {
    wasm.setLogLevel(addHeapObject(level));
}

/**
 * Configuration for the WASM32 bindings runtime interface.
 * @see {@link IWASM32BindingsConfig}
 * @category General
 * @param {IWASM32BindingsConfig} config
 */
export function initWASM32Bindings(config) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.initWASM32Bindings(retptr, addHeapObject(config));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
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
    return takeObject(ret);
}

function __wbg_adapter_58(arg0, arg1) {
    wasm.__wbindgen_export_5(arg0, arg1);
}

function __wbg_adapter_61(arg0, arg1, arg2) {
    wasm.__wbindgen_export_6(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_64(arg0, arg1, arg2, arg3) {
    const ret = wasm.__wbindgen_export_7(arg0, arg1, addHeapObject(arg2), arg3);
    return takeObject(ret);
}

function __wbg_adapter_67(arg0, arg1, arg2) {
    wasm.__wbindgen_export_8(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_70(arg0, arg1, arg2) {
    wasm.__wbindgen_export_8(arg0, arg1, arg2);
}

function __wbg_adapter_73(arg0, arg1, arg2) {
    wasm.__wbindgen_export_9(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_150(arg0, arg1, arg2, arg3) {
    wasm.__wbindgen_export_10(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
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
 * `ConnectionStrategy` specifies how the WebSocket `async fn connect()`
 * function should behave during the first-time connectivity phase.
 * @category WebSocket
 * @enum {0 | 1}
 */
export const ConnectStrategy = Object.freeze({
    /**
     * Continuously attempt to connect to the server. This behavior will
     * block `connect()` function until the connection is established.
     */
    Retry: 0, "0": "Retry",
    /**
     * Causes `connect()` to return immediately if the first-time connection
     * has failed.
     */
    Fallback: 1, "1": "Fallback",
});
/**
 * wRPC protocol encoding: `Borsh` or `JSON`
 * @category Transport
 * @enum {0 | 1}
 */
export const Encoding = Object.freeze({
    Borsh: 0, "0": "Borsh",
    SerdeJson: 1, "1": "SerdeJson",
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

const __wbindgen_enum_BinaryType = ["blob", "arraybuffer"];

const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

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
        const ret = wasm.abortable_isAborted(this.__wbg_ptr);
        return ret !== 0;
    }
    abort() {
        wasm.abortable_abort(this.__wbg_ptr);
    }
    check() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.abortable_check(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    reset() {
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
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
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
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get version() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_version(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get prefix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_prefix(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} prefix
     */
    set setPrefix(prefix) {
        const ptr0 = passStringToWasm0(prefix, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_payload(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.address_short(retptr, this.__wbg_ptr, n);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
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

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Hash.prototype);
        obj.__wbg_ptr = ptr;
        HashFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

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
        const ptr0 = passStringToWasm0(hex_str, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.hash_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
}

const HeaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_header_free(ptr >>> 0, 1));
/**
 * Kaspa Block Header
 *
 * @category Consensus
 */
export class Header {

    toJSON() {
        return {
            version: this.version,
            timestamp: this.timestamp,
            bits: this.bits,
            nonce: this.nonce,
            daaScore: this.daaScore,
            blueScore: this.blueScore,
            hash: this.hash,
            hashMerkleRoot: this.hashMerkleRoot,
            acceptedIdMerkleRoot: this.acceptedIdMerkleRoot,
            utxoCommitment: this.utxoCommitment,
            pruningPoint: this.pruningPoint,
            parentsByLevel: this.parentsByLevel,
            blueWork: this.blueWork,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HeaderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_header_free(ptr, 0);
    }
    /**
     * @param {Header | IHeader | IRawHeader} js_value
     */
    constructor(js_value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_constructor(retptr, addHeapObject(js_value));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            HeaderFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Finalizes the header and recomputes (updates) the header hash
     * @return { String } header hash
     * @returns {string}
     */
    finalize() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_finalize(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Obtain `JSON` representation of the header. JSON representation
     * should be obtained using WASM, to ensure proper serialization of
     * big integers.
     * @returns {string}
     */
    asJSON() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_asJSON(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get version() {
        const ret = wasm.header_get_version(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} version
     */
    set version(version) {
        wasm.header_set_version(this.__wbg_ptr, version);
    }
    /**
     * @returns {bigint}
     */
    get timestamp() {
        const ret = wasm.header_get_timestamp(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} timestamp
     */
    set timestamp(timestamp) {
        wasm.header_set_timestamp(this.__wbg_ptr, timestamp);
    }
    /**
     * @returns {number}
     */
    get bits() {
        const ret = wasm.header_bits(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} bits
     */
    set bits(bits) {
        wasm.header_set_bits(this.__wbg_ptr, bits);
    }
    /**
     * @returns {bigint}
     */
    get nonce() {
        const ret = wasm.header_nonce(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} nonce
     */
    set nonce(nonce) {
        wasm.header_set_nonce(this.__wbg_ptr, nonce);
    }
    /**
     * @returns {bigint}
     */
    get daaScore() {
        const ret = wasm.header_daa_score(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} daa_score
     */
    set daaScore(daa_score) {
        wasm.header_set_daa_score(this.__wbg_ptr, daa_score);
    }
    /**
     * @returns {bigint}
     */
    get blueScore() {
        const ret = wasm.header_blue_score(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} blue_score
     */
    set blueScore(blue_score) {
        wasm.header_set_blue_score(this.__wbg_ptr, blue_score);
    }
    /**
     * @returns {string}
     */
    get hash() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_get_hash_as_hex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get hashMerkleRoot() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_get_hash_merkle_root_as_hex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {any} js_value
     */
    set hashMerkleRoot(js_value) {
        wasm.header_set_hash_merkle_root_from_js_value(this.__wbg_ptr, addHeapObject(js_value));
    }
    /**
     * @returns {string}
     */
    get acceptedIdMerkleRoot() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_get_accepted_id_merkle_root_as_hex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {any} js_value
     */
    set acceptedIdMerkleRoot(js_value) {
        wasm.header_set_accepted_id_merkle_root_from_js_value(this.__wbg_ptr, addHeapObject(js_value));
    }
    /**
     * @returns {string}
     */
    get utxoCommitment() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_get_utxo_commitment_as_hex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {any} js_value
     */
    set utxoCommitment(js_value) {
        wasm.header_set_utxo_commitment_from_js_value(this.__wbg_ptr, addHeapObject(js_value));
    }
    /**
     * @returns {string}
     */
    get pruningPoint() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_get_pruning_point_as_hex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {any} js_value
     */
    set pruningPoint(js_value) {
        wasm.header_set_pruning_point_from_js_value(this.__wbg_ptr, addHeapObject(js_value));
    }
    /**
     * @returns {any}
     */
    get parentsByLevel() {
        const ret = wasm.header_get_parents_by_level_as_js_value(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {any} js_value
     */
    set parentsByLevel(js_value) {
        wasm.header_set_parents_by_level_from_js_value(this.__wbg_ptr, addHeapObject(js_value));
    }
    /**
     * @returns {bigint}
     */
    get blueWork() {
        const ret = wasm.header_blue_work(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {string}
     */
    getBlueWorkAsHex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.header_getBlueWorkAsHex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {any} js_value
     */
    set blueWork(js_value) {
        wasm.header_set_blue_work_from_js_value(this.__wbg_ptr, addHeapObject(js_value));
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
        const ret = wasm.__wbg_get_networkid_type(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {NetworkType} arg0
     */
    set type(arg0) {
        wasm.__wbg_set_networkid_type(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number | undefined}
     */
    get suffix() {
        const ret = wasm.__wbg_get_networkid_suffix(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * @param {number | null} [arg0]
     */
    set suffix(arg0) {
        wasm.__wbg_set_networkid_suffix(this.__wbg_ptr, isLikeNone(arg0) ? 0x100000001 : (arg0) >>> 0);
    }
    /**
     * @param {any} value
     */
    constructor(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.networkid_ctor(retptr, addBorrowedObject(value));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            NetworkIdFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @returns {string}
     */
    get id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.networkid_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.networkid_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    addressPrefix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.networkid_addressPrefix(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
}

const NodeDescriptorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_nodedescriptor_free(ptr >>> 0, 1));
/**
 *
 * Data structure representing a Node connection endpoint
 * as provided by the {@link Resolver}.
 *
 * @category Node RPC
 */
export class NodeDescriptor {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NodeDescriptor.prototype);
        obj.__wbg_ptr = ptr;
        NodeDescriptorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            uid: this.uid,
            url: this.url,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NodeDescriptorFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_nodedescriptor_free(ptr, 0);
    }
    /**
     * The unique identifier of the node.
     * @returns {string}
     */
    get uid() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_nodedescriptor_uid(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The unique identifier of the node.
     * @param {string} arg0
     */
    set uid(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_nodedescriptor_uid(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The URL of the node WebSocket (wRPC URL).
     * @returns {string}
     */
    get url() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_nodedescriptor_url(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The URL of the node WebSocket (wRPC URL).
     * @param {string} arg0
     */
    set url(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_nodedescriptor_url(this.__wbg_ptr, ptr0, len0);
    }
}

const ResolverFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_resolver_free(ptr >>> 0, 1));
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

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Resolver.prototype);
        obj.__wbg_ptr = ptr;
        ResolverFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            urls: this.urls,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ResolverFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_resolver_free(ptr, 0);
    }
    /**
     * List of public Kaspa Resolver URLs.
     * @returns {string[] | undefined}
     */
    get urls() {
        const ret = wasm.resolver_urls(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Fetches a public Kaspa wRPC endpoint for the given encoding and network identifier.
     * @see {@link Encoding}, {@link NetworkId}, {@link Node}
     * @param {Encoding} encoding
     * @param {NetworkId | string} network_id
     * @returns {Promise<NodeDescriptor>}
     */
    getNode(encoding, network_id) {
        const ret = wasm.resolver_getNode(this.__wbg_ptr, encoding, addHeapObject(network_id));
        return takeObject(ret);
    }
    /**
     * Fetches a public Kaspa wRPC endpoint URL for the given encoding and network identifier.
     * @see {@link Encoding}, {@link NetworkId}
     * @param {Encoding} encoding
     * @param {NetworkId | string} network_id
     * @returns {Promise<string>}
     */
    getUrl(encoding, network_id) {
        const ret = wasm.resolver_getUrl(this.__wbg_ptr, encoding, addHeapObject(network_id));
        return takeObject(ret);
    }
    /**
     * Connect to a public Kaspa wRPC endpoint for the given encoding and network identifier
     * supplied via {@link IResolverConnect} interface.
     * @see {@link IResolverConnect}, {@link RpcClient}
     * @param {IResolverConnect | NetworkId | string} options
     * @returns {Promise<RpcClient>}
     */
    connect(options) {
        const ret = wasm.resolver_connect(this.__wbg_ptr, addHeapObject(options));
        return takeObject(ret);
    }
    /**
     * Creates a new Resolver client with the given
     * configuration supplied as {@link IResolverConfig}
     * interface. If not supplied, the default configuration
     * containing a list of community-operated resolvers
     * will be used.
     * @param {IResolverConfig | string[] | null} [args]
     */
    constructor(args) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.resolver_ctor(retptr, isLikeNone(args) ? 0 : addHeapObject(args));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            ResolverFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const RpcClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rpcclient_free(ptr >>> 0, 1));
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

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RpcClient.prototype);
        obj.__wbg_ptr = ptr;
        RpcClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            url: this.url,
            resolver: this.resolver,
            isConnected: this.isConnected,
            encoding: this.encoding,
            nodeId: this.nodeId,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RpcClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rpcclient_free(ptr, 0);
    }
    /**
     * Retrieves the current number of blocks in the Kaspa BlockDAG.
     * This is not a block count, not a "block height" and can not be
     * used for transaction validation.
     * Returned information: Current block count.
     * @see {@link IGetBlockCountRequest}, {@link IGetBlockCountResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetBlockCountRequest | null} [request]
     * @returns {Promise<IGetBlockCountResponse>}
     */
    getBlockCount(request) {
        const ret = wasm.rpcclient_getBlockCount(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Provides information about the Directed Acyclic Graph (DAG)
     * structure of the Kaspa BlockDAG.
     * Returned information: Number of blocks in the DAG,
     * number of tips in the DAG, hash of the selected parent block,
     * difficulty of the selected parent block, selected parent block
     * blue score, selected parent block time.
     * @see {@link IGetBlockDagInfoRequest}, {@link IGetBlockDagInfoResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetBlockDagInfoRequest | null} [request]
     * @returns {Promise<IGetBlockDagInfoResponse>}
     */
    getBlockDagInfo(request) {
        const ret = wasm.rpcclient_getBlockDagInfo(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Returns the total current coin supply of Kaspa network.
     * Returned information: Total coin supply.
     * @see {@link IGetCoinSupplyRequest}, {@link IGetCoinSupplyResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetCoinSupplyRequest | null} [request]
     * @returns {Promise<IGetCoinSupplyResponse>}
     */
    getCoinSupply(request) {
        const ret = wasm.rpcclient_getCoinSupply(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves information about the peers connected to the Kaspa node.
     * Returned information: Peer ID, IP address and port, connection
     * status, protocol version.
     * @see {@link IGetConnectedPeerInfoRequest}, {@link IGetConnectedPeerInfoResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetConnectedPeerInfoRequest | null} [request]
     * @returns {Promise<IGetConnectedPeerInfoResponse>}
     */
    getConnectedPeerInfo(request) {
        const ret = wasm.rpcclient_getConnectedPeerInfo(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves general information about the Kaspa node.
     * Returned information: Version of the Kaspa node, protocol
     * version, network identifier.
     * This call is primarily used by gRPC clients.
     * For wRPC clients, use {@link RpcClient.getServerInfo}.
     * @see {@link IGetInfoRequest}, {@link IGetInfoResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetInfoRequest | null} [request]
     * @returns {Promise<IGetInfoResponse>}
     */
    getInfo(request) {
        const ret = wasm.rpcclient_getInfo(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Provides a list of addresses of known peers in the Kaspa
     * network that the node can potentially connect to.
     * Returned information: List of peer addresses.
     * @see {@link IGetPeerAddressesRequest}, {@link IGetPeerAddressesResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetPeerAddressesRequest | null} [request]
     * @returns {Promise<IGetPeerAddressesResponse>}
     */
    getPeerAddresses(request) {
        const ret = wasm.rpcclient_getPeerAddresses(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves various metrics and statistics related to the
     * performance and status of the Kaspa node.
     * Returned information: Memory usage, CPU usage, network activity.
     * @see {@link IGetMetricsRequest}, {@link IGetMetricsResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetMetricsRequest | null} [request]
     * @returns {Promise<IGetMetricsResponse>}
     */
    getMetrics(request) {
        const ret = wasm.rpcclient_getMetrics(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves current number of network connections
     * @see {@link IGetConnectionsRequest}, {@link IGetConnectionsResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetConnectionsRequest | null} [request]
     * @returns {Promise<IGetConnectionsResponse>}
     */
    getConnections(request) {
        const ret = wasm.rpcclient_getConnections(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves the current sink block, which is the block with
     * the highest cumulative difficulty in the Kaspa BlockDAG.
     * Returned information: Sink block hash, sink block height.
     * @see {@link IGetSinkRequest}, {@link IGetSinkResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetSinkRequest | null} [request]
     * @returns {Promise<IGetSinkResponse>}
     */
    getSink(request) {
        const ret = wasm.rpcclient_getSink(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Returns the blue score of the current sink block, indicating
     * the total amount of work that has been done on the main chain
     * leading up to that block.
     * Returned information: Blue score of the sink block.
     * @see {@link IGetSinkBlueScoreRequest}, {@link IGetSinkBlueScoreResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetSinkBlueScoreRequest | null} [request]
     * @returns {Promise<IGetSinkBlueScoreResponse>}
     */
    getSinkBlueScore(request) {
        const ret = wasm.rpcclient_getSinkBlueScore(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Tests the connection and responsiveness of a Kaspa node.
     * Returned information: None.
     * @see {@link IPingRequest}, {@link IPingResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IPingRequest | null} [request]
     * @returns {Promise<IPingResponse>}
     */
    ping(request) {
        const ret = wasm.rpcclient_ping(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Gracefully shuts down the Kaspa node.
     * Returned information: None.
     * @see {@link IShutdownRequest}, {@link IShutdownResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IShutdownRequest | null} [request]
     * @returns {Promise<IShutdownResponse>}
     */
    shutdown(request) {
        const ret = wasm.rpcclient_shutdown(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves information about the Kaspa server.
     * Returned information: Version of the Kaspa server, protocol
     * version, network identifier.
     * @see {@link IGetServerInfoRequest}, {@link IGetServerInfoResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetServerInfoRequest | null} [request]
     * @returns {Promise<IGetServerInfoResponse>}
     */
    getServerInfo(request) {
        const ret = wasm.rpcclient_getServerInfo(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Obtains basic information about the synchronization status of the Kaspa node.
     * Returned information: Syncing status.
     * @see {@link IGetSyncStatusRequest}, {@link IGetSyncStatusResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetSyncStatusRequest | null} [request]
     * @returns {Promise<IGetSyncStatusResponse>}
     */
    getSyncStatus(request) {
        const ret = wasm.rpcclient_getSyncStatus(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Feerate estimates
     * @see {@link IGetFeeEstimateRequest}, {@link IGetFeeEstimateResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetFeeEstimateRequest | null} [request]
     * @returns {Promise<IGetFeeEstimateResponse>}
     */
    getFeeEstimate(request) {
        const ret = wasm.rpcclient_getFeeEstimate(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves the current network configuration.
     * Returned information: Current network configuration.
     * @see {@link IGetCurrentNetworkRequest}, {@link IGetCurrentNetworkResponse}
     * @throws `string` on an RPC error or a server-side error.
     * @param {IGetCurrentNetworkRequest | null} [request]
     * @returns {Promise<IGetCurrentNetworkResponse>}
     */
    getCurrentNetwork(request) {
        const ret = wasm.rpcclient_getCurrentNetwork(this.__wbg_ptr, isLikeNone(request) ? 0 : addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Adds a peer to the Kaspa node's list of known peers.
     * Returned information: None.
     * @see {@link IAddPeerRequest}, {@link IAddPeerResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IAddPeerRequest} request
     * @returns {Promise<IAddPeerResponse>}
     */
    addPeer(request) {
        const ret = wasm.rpcclient_addPeer(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Bans a peer from connecting to the Kaspa node for a specified duration.
     * Returned information: None.
     * @see {@link IBanRequest}, {@link IBanResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IBanRequest} request
     * @returns {Promise<IBanResponse>}
     */
    ban(request) {
        const ret = wasm.rpcclient_ban(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Estimates the network's current hash rate in hashes per second.
     * Returned information: Estimated network hashes per second.
     * @see {@link IEstimateNetworkHashesPerSecondRequest}, {@link IEstimateNetworkHashesPerSecondResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IEstimateNetworkHashesPerSecondRequest} request
     * @returns {Promise<IEstimateNetworkHashesPerSecondResponse>}
     */
    estimateNetworkHashesPerSecond(request) {
        const ret = wasm.rpcclient_estimateNetworkHashesPerSecond(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves the balance of a specific address in the Kaspa BlockDAG.
     * Returned information: Balance of the address.
     * @see {@link IGetBalanceByAddressRequest}, {@link IGetBalanceByAddressResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetBalanceByAddressRequest} request
     * @returns {Promise<IGetBalanceByAddressResponse>}
     */
    getBalanceByAddress(request) {
        const ret = wasm.rpcclient_getBalanceByAddress(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves balances for multiple addresses in the Kaspa BlockDAG.
     * Returned information: Balances of the addresses.
     * @see {@link IGetBalancesByAddressesRequest}, {@link IGetBalancesByAddressesResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetBalancesByAddressesRequest | Address[] | string[]} request
     * @returns {Promise<IGetBalancesByAddressesResponse>}
     */
    getBalancesByAddresses(request) {
        const ret = wasm.rpcclient_getBalancesByAddresses(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves a specific block from the Kaspa BlockDAG.
     * Returned information: Block information.
     * @see {@link IGetBlockRequest}, {@link IGetBlockResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetBlockRequest} request
     * @returns {Promise<IGetBlockResponse>}
     */
    getBlock(request) {
        const ret = wasm.rpcclient_getBlock(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves multiple blocks from the Kaspa BlockDAG.
     * Returned information: List of block information.
     * @see {@link IGetBlocksRequest}, {@link IGetBlocksResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetBlocksRequest} request
     * @returns {Promise<IGetBlocksResponse>}
     */
    getBlocks(request) {
        const ret = wasm.rpcclient_getBlocks(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Generates a new block template for mining.
     * Returned information: Block template information.
     * @see {@link IGetBlockTemplateRequest}, {@link IGetBlockTemplateResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetBlockTemplateRequest} request
     * @returns {Promise<IGetBlockTemplateResponse>}
     */
    getBlockTemplate(request) {
        const ret = wasm.rpcclient_getBlockTemplate(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Checks if block is blue or not.
     * Returned information: Block blueness.
     * @see {@link IGetCurrentBlockColorRequest}, {@link IGetCurrentBlockColorResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetCurrentBlockColorRequest} request
     * @returns {Promise<IGetCurrentBlockColorResponse>}
     */
    getCurrentBlockColor(request) {
        const ret = wasm.rpcclient_getCurrentBlockColor(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves the estimated DAA (Difficulty Adjustment Algorithm)
     * score timestamp estimate.
     * Returned information: DAA score timestamp estimate.
     * @see {@link IGetDaaScoreTimestampEstimateRequest}, {@link IGetDaaScoreTimestampEstimateResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetDaaScoreTimestampEstimateRequest} request
     * @returns {Promise<IGetDaaScoreTimestampEstimateResponse>}
     */
    getDaaScoreTimestampEstimate(request) {
        const ret = wasm.rpcclient_getDaaScoreTimestampEstimate(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Feerate estimates (experimental)
     * @see {@link IGetFeeEstimateExperimentalRequest}, {@link IGetFeeEstimateExperimentalResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetFeeEstimateExperimentalRequest} request
     * @returns {Promise<IGetFeeEstimateExperimentalResponse>}
     */
    getFeeEstimateExperimental(request) {
        const ret = wasm.rpcclient_getFeeEstimateExperimental(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves block headers from the Kaspa BlockDAG.
     * Returned information: List of block headers.
     * @see {@link IGetHeadersRequest}, {@link IGetHeadersResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetHeadersRequest} request
     * @returns {Promise<IGetHeadersResponse>}
     */
    getHeaders(request) {
        const ret = wasm.rpcclient_getHeaders(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves mempool entries from the Kaspa node's mempool.
     * Returned information: List of mempool entries.
     * @see {@link IGetMempoolEntriesRequest}, {@link IGetMempoolEntriesResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetMempoolEntriesRequest} request
     * @returns {Promise<IGetMempoolEntriesResponse>}
     */
    getMempoolEntries(request) {
        const ret = wasm.rpcclient_getMempoolEntries(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves mempool entries associated with specific addresses.
     * Returned information: List of mempool entries.
     * @see {@link IGetMempoolEntriesByAddressesRequest}, {@link IGetMempoolEntriesByAddressesResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetMempoolEntriesByAddressesRequest} request
     * @returns {Promise<IGetMempoolEntriesByAddressesResponse>}
     */
    getMempoolEntriesByAddresses(request) {
        const ret = wasm.rpcclient_getMempoolEntriesByAddresses(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves a specific mempool entry by transaction ID.
     * Returned information: Mempool entry information.
     * @see {@link IGetMempoolEntryRequest}, {@link IGetMempoolEntryResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetMempoolEntryRequest} request
     * @returns {Promise<IGetMempoolEntryResponse>}
     */
    getMempoolEntry(request) {
        const ret = wasm.rpcclient_getMempoolEntry(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves information about a subnetwork in the Kaspa BlockDAG.
     * Returned information: Subnetwork information.
     * @see {@link IGetSubnetworkRequest}, {@link IGetSubnetworkResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetSubnetworkRequest} request
     * @returns {Promise<IGetSubnetworkResponse>}
     */
    getSubnetwork(request) {
        const ret = wasm.rpcclient_getSubnetwork(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves unspent transaction outputs (UTXOs) associated with
     * specific addresses.
     * Returned information: List of UTXOs.
     * @see {@link IGetUtxosByAddressesRequest}, {@link IGetUtxosByAddressesResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetUtxosByAddressesRequest | Address[] | string[]} request
     * @returns {Promise<IGetUtxosByAddressesResponse>}
     */
    getUtxosByAddresses(request) {
        const ret = wasm.rpcclient_getUtxosByAddresses(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Retrieves the virtual chain corresponding to a specified block hash.
     * Returned information: Virtual chain information.
     * @see {@link IGetVirtualChainFromBlockRequest}, {@link IGetVirtualChainFromBlockResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IGetVirtualChainFromBlockRequest} request
     * @returns {Promise<IGetVirtualChainFromBlockResponse>}
     */
    getVirtualChainFromBlock(request) {
        const ret = wasm.rpcclient_getVirtualChainFromBlock(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Resolves a finality conflict in the Kaspa BlockDAG.
     * Returned information: None.
     * @see {@link IResolveFinalityConflictRequest}, {@link IResolveFinalityConflictResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IResolveFinalityConflictRequest} request
     * @returns {Promise<IResolveFinalityConflictResponse>}
     */
    resolveFinalityConflict(request) {
        const ret = wasm.rpcclient_resolveFinalityConflict(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Submits a block to the Kaspa network.
     * Returned information: None.
     * @see {@link ISubmitBlockRequest}, {@link ISubmitBlockResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {ISubmitBlockRequest} request
     * @returns {Promise<ISubmitBlockResponse>}
     */
    submitBlock(request) {
        const ret = wasm.rpcclient_submitBlock(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Submits a transaction to the Kaspa network.
     * Returned information: Submitted Transaction Id.
     * @see {@link ISubmitTransactionRequest}, {@link ISubmitTransactionResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {ISubmitTransactionRequest} request
     * @returns {Promise<ISubmitTransactionResponse>}
     */
    submitTransaction(request) {
        const ret = wasm.rpcclient_submitTransaction(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Submits an RBF transaction to the Kaspa network.
     * Returned information: Submitted Transaction Id, Transaction that was replaced.
     * @see {@link ISubmitTransactionReplacementRequest}, {@link ISubmitTransactionReplacementResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {ISubmitTransactionReplacementRequest} request
     * @returns {Promise<ISubmitTransactionReplacementResponse>}
     */
    submitTransactionReplacement(request) {
        const ret = wasm.rpcclient_submitTransactionReplacement(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Unbans a previously banned peer, allowing it to connect
     * to the Kaspa node again.
     * Returned information: None.
     * @see {@link IUnbanRequest}, {@link IUnbanResponse}
     * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
     * @param {IUnbanRequest} request
     * @returns {Promise<IUnbanResponse>}
     */
    unban(request) {
        const ret = wasm.rpcclient_unban(this.__wbg_ptr, addHeapObject(request));
        return takeObject(ret);
    }
    /**
     * Manage subscription for a block added notification event.
     * Block added notification event is produced when a new
     * block is added to the Kaspa BlockDAG.
     * @returns {Promise<void>}
     */
    subscribeBlockAdded() {
        const ret = wasm.rpcclient_subscribeBlockAdded(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<void>}
     */
    unsubscribeBlockAdded() {
        const ret = wasm.rpcclient_unsubscribeBlockAdded(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Manage subscription for a finality conflict notification event.
     * Finality conflict notification event is produced when a finality
     * conflict occurs in the Kaspa BlockDAG.
     * @returns {Promise<void>}
     */
    subscribeFinalityConflict() {
        const ret = wasm.rpcclient_subscribeFinalityConflict(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<void>}
     */
    unsubscribeFinalityConflict() {
        const ret = wasm.rpcclient_unsubscribeFinalityConflict(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Manage subscription for a finality conflict resolved notification event.
     * Finality conflict resolved notification event is produced when a finality
     * conflict in the Kaspa BlockDAG is resolved.
     * @returns {Promise<void>}
     */
    subscribeFinalityConflictResolved() {
        const ret = wasm.rpcclient_subscribeFinalityConflictResolved(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<void>}
     */
    unsubscribeFinalityConflictResolved() {
        const ret = wasm.rpcclient_unsubscribeFinalityConflictResolved(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Manage subscription for a sink blue score changed notification event.
     * Sink blue score changed notification event is produced when the blue
     * score of the sink block changes in the Kaspa BlockDAG.
     * @returns {Promise<void>}
     */
    subscribeSinkBlueScoreChanged() {
        const ret = wasm.rpcclient_subscribeSinkBlueScoreChanged(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<void>}
     */
    unsubscribeSinkBlueScoreChanged() {
        const ret = wasm.rpcclient_unsubscribeSinkBlueScoreChanged(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Manage subscription for a pruning point UTXO set override notification event.
     * Pruning point UTXO set override notification event is produced when the
     * UTXO set override for the pruning point changes in the Kaspa BlockDAG.
     * @returns {Promise<void>}
     */
    subscribePruningPointUtxoSetOverride() {
        const ret = wasm.rpcclient_subscribePruningPointUtxoSetOverride(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<void>}
     */
    unsubscribePruningPointUtxoSetOverride() {
        const ret = wasm.rpcclient_unsubscribePruningPointUtxoSetOverride(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Manage subscription for a new block template notification event.
     * New block template notification event is produced when a new block
     * template is generated for mining in the Kaspa BlockDAG.
     * @returns {Promise<void>}
     */
    subscribeNewBlockTemplate() {
        const ret = wasm.rpcclient_subscribeNewBlockTemplate(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<void>}
     */
    unsubscribeNewBlockTemplate() {
        const ret = wasm.rpcclient_unsubscribeNewBlockTemplate(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Manage subscription for a virtual DAA score changed notification event.
     * Virtual DAA score changed notification event is produced when the virtual
     * Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
     * @returns {Promise<void>}
     */
    subscribeVirtualDaaScoreChanged() {
        const ret = wasm.rpcclient_subscribeVirtualDaaScoreChanged(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Manage subscription for a virtual DAA score changed notification event.
     * Virtual DAA score changed notification event is produced when the virtual
     * Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
     * @returns {Promise<void>}
     */
    unsubscribeVirtualDaaScoreChanged() {
        const ret = wasm.rpcclient_unsubscribeVirtualDaaScoreChanged(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Subscribe for a UTXOs changed notification event.
     * UTXOs changed notification event is produced when the set
     * of unspent transaction outputs (UTXOs) changes in the
     * Kaspa BlockDAG. The event notification will be scoped to the
     * provided list of addresses.
     * @param {(Address | string)[]} addresses
     * @returns {Promise<void>}
     */
    subscribeUtxosChanged(addresses) {
        const ret = wasm.rpcclient_subscribeUtxosChanged(this.__wbg_ptr, addHeapObject(addresses));
        return takeObject(ret);
    }
    /**
     * Unsubscribe from UTXOs changed notification event
     * for a specific set of addresses.
     * @param {(Address | string)[]} addresses
     * @returns {Promise<void>}
     */
    unsubscribeUtxosChanged(addresses) {
        const ret = wasm.rpcclient_unsubscribeUtxosChanged(this.__wbg_ptr, addHeapObject(addresses));
        return takeObject(ret);
    }
    /**
     * Manage subscription for a virtual chain changed notification event.
     * Virtual chain changed notification event is produced when the virtual
     * chain changes in the Kaspa BlockDAG.
     * @param {boolean} include_accepted_transaction_ids
     * @returns {Promise<void>}
     */
    subscribeVirtualChainChanged(include_accepted_transaction_ids) {
        const ret = wasm.rpcclient_subscribeVirtualChainChanged(this.__wbg_ptr, include_accepted_transaction_ids);
        return takeObject(ret);
    }
    /**
     * Manage subscription for a virtual chain changed notification event.
     * Virtual chain changed notification event is produced when the virtual
     * chain changes in the Kaspa BlockDAG.
     * @param {boolean} include_accepted_transaction_ids
     * @returns {Promise<void>}
     */
    unsubscribeVirtualChainChanged(include_accepted_transaction_ids) {
        const ret = wasm.rpcclient_unsubscribeVirtualChainChanged(this.__wbg_ptr, include_accepted_transaction_ids);
        return takeObject(ret);
    }
    /**
     * @param {Encoding} encoding
     * @param {NetworkType | NetworkId | string} network
     * @returns {number}
     */
    static defaultPort(encoding, network) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_defaultPort(retptr, encoding, addBorrowedObject(network));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Constructs an WebSocket RPC URL given the partial URL or an IP, RPC encoding
     * and a network type.
     *
     * # Arguments
     *
     * * `url` - Partial URL or an IP address
     * * `encoding` - RPC encoding
     * * `network_type` - Network type
     * @param {string} url
     * @param {Encoding} encoding
     * @param {NetworkId} network
     * @returns {string}
     */
    static parseUrl(url, encoding, network) {
        let deferred4_0;
        let deferred4_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(url, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
            const len0 = WASM_VECTOR_LEN;
            _assertClass(network, NetworkId);
            var ptr1 = network.__destroy_into_raw();
            wasm.rpcclient_parseUrl(retptr, ptr0, len0, encoding, ptr1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr3 = r0;
            var len3 = r1;
            if (r3) {
                ptr3 = 0; len3 = 0;
                throw takeObject(r2);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     *
     * Create a new RPC client with optional {@link Encoding} and a `url`.
     *
     * @see {@link IRpcConfig} interface for more details.
     * @param {IRpcConfig | null} [config]
     */
    constructor(config) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_ctor(retptr, isLikeNone(config) ? 0 : addHeapObject(config));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            RpcClientFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * The current URL of the RPC client.
     * @returns {string | undefined}
     */
    get url() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_url(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_export_3(r0, r1 * 1, 1);
            }
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Current rpc resolver
     * @returns {Resolver | undefined}
     */
    get resolver() {
        const ret = wasm.rpcclient_resolver(this.__wbg_ptr);
        return ret === 0 ? undefined : Resolver.__wrap(ret);
    }
    /**
     * Set the resolver for the RPC client.
     * This setting will take effect on the next connection.
     * @param {Resolver} resolver
     */
    setResolver(resolver) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(resolver, Resolver);
            var ptr0 = resolver.__destroy_into_raw();
            wasm.rpcclient_setResolver(retptr, this.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Set the network id for the RPC client.
     * This setting will take effect on the next connection.
     * @param {NetworkId | string} network_id
     */
    setNetworkId(network_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_setNetworkId(retptr, this.__wbg_ptr, addBorrowedObject(network_id));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * The current connection status of the RPC client.
     * @returns {boolean}
     */
    get isConnected() {
        const ret = wasm.rpcclient_isConnected(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * The current protocol encoding.
     * @returns {string}
     */
    get encoding() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_encoding(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Optional: Resolver node id.
     * @returns {string | undefined}
     */
    get nodeId() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_nodeId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_export_3(r0, r1 * 1, 1);
            }
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Connect to the Kaspa RPC server. This function starts a background
     * task that connects and reconnects to the server if the connection
     * is terminated.  Use [`disconnect()`](Self::disconnect()) to
     * terminate the connection.
     * @see {@link IConnectOptions} interface for more details.
     * @param {IConnectOptions | undefined | null} [args]
     * @returns {Promise<void>}
     */
    connect(args) {
        const ret = wasm.rpcclient_connect(this.__wbg_ptr, isLikeNone(args) ? 0 : addHeapObject(args));
        return takeObject(ret);
    }
    /**
     * Disconnect from the Kaspa RPC server.
     * @returns {Promise<void>}
     */
    disconnect() {
        const ret = wasm.rpcclient_disconnect(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Start background RPC services (automatically started when invoking {@link RpcClient.connect}).
     * @returns {Promise<void>}
     */
    start() {
        const ret = wasm.rpcclient_start(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Stop background RPC services (automatically stopped when invoking {@link RpcClient.disconnect}).
     * @returns {Promise<void>}
     */
    stop() {
        const ret = wasm.rpcclient_stop(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Triggers a disconnection on the underlying WebSocket
     * if the WebSocket is in connected state.
     * This is intended for debug purposes only.
     * Can be used to test application reconnection logic.
     */
    triggerAbort() {
        wasm.rpcclient_triggerAbort(this.__wbg_ptr);
    }
    /**
     *
     * Register an event listener callback.
     *
     * Registers a callback function to be executed when a specific event occurs.
     * The callback function will receive an {@link RpcEvent} object with the event `type` and `data`.
     *
     * **RPC Subscriptions vs Event Listeners**
     *
     * Subscriptions are used to receive notifications from the RPC client.
     * Event listeners are client-side application registrations that are
     * triggered when notifications are received.
     *
     * If node is disconnected, upon reconnection you do not need to re-register event listeners,
     * however, you have to re-subscribe for Kaspa node notifications. As such, it is recommended
     * to register event listeners when the RPC `open` event is received.
     *
     * ```javascript
     * rpc.addEventListener("connect", async (event) => {
     *     console.log("Connected to", rpc.url);
     *     await rpc.subscribeDaaScore();
     *     // ... perform wallet address subscriptions
     * });
     * ```
     *
     * **Multiple events and listeners**
     *
     * `addEventListener` can be used to register multiple event listeners for the same event
     * as well as the same event listener for multiple events.
     *
     * ```javascript
     * // Registering a single event listener for multiple events:
     * rpc.addEventListener(["connect", "disconnect"], (event) => {
     *     console.log(event);
     * });
     *
     * // Registering event listener for all events:
     * // (by omitting the event type)
     * rpc.addEventListener((event) => {
     *     console.log(event);
     * });
     *
     * // Registering multiple event listeners for the same event:
     * rpc.addEventListener("connect", (event) => { // first listener
     *     console.log(event);
     * });
     * rpc.addEventListener("connect", (event) => { // second listener
     *     console.log(event);
     * });
     * ```
     *
     * **Use of context objects**
     *
     * You can also register an event with a `context` object. When the event is triggered,
     * the `handleEvent` method of the `context` object will be called while `this` value
     * will be set to the `context` object.
     * ```javascript
     * // Registering events with a context object:
     *
     * const context = {
     *     someProperty: "someValue",
     *     handleEvent: (event) => {
     *         // the following will log "someValue"
     *         console.log(this.someProperty);
     *         console.log(event);
     *     }
     * };
     * rpc.addEventListener(["connect","disconnect"], context);
     *
     * ```
     *
     * **General use examples**
     *
     * In TypeScript you can use {@link RpcEventType} enum (such as `RpcEventType.Connect`)
     * or `string` (such as "connect") to register event listeners.
     * In JavaScript you can only use `string`.
     *
     * ```typescript
     * // Example usage (TypeScript):
     *
     * rpc.addEventListener(RpcEventType.Connect, (event) => {
     *     console.log("Connected to", rpc.url);
     * });
     *
     * rpc.addEventListener(RpcEventType.VirtualDaaScoreChanged, (event) => {
     *     console.log(event.type,event.data);
     * });
     * await rpc.subscribeDaaScore();
     *
     * rpc.addEventListener(RpcEventType.BlockAdded, (event) => {
     *     console.log(event.type,event.data);
     * });
     * await rpc.subscribeBlockAdded();
     *
     * // Example usage (JavaScript):
     *
     * rpc.addEventListener("virtual-daa-score-changed", (event) => {
     *     console.log(event.type,event.data);
     * });
     *
     * await rpc.subscribeDaaScore();
     * rpc.addEventListener("block-added", (event) => {
     *     console.log(event.type,event.data);
     * });
     * await rpc.subscribeBlockAdded();
     * ```
     *
     * @see {@link RpcEventType} for a list of supported events.
     * @see {@link RpcEventData} for the event data interface specification.
     * @see {@link RpcClient.removeEventListener}, {@link RpcClient.removeAllEventListeners}
     * @param {RpcEventType | string | RpcEventCallback} event
     * @param {RpcEventCallback | null} [callback]
     */
    addEventListener(event, callback) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_addEventListener(retptr, this.__wbg_ptr, addHeapObject(event), isLikeNone(callback) ? 0 : addHeapObject(callback));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     *
     * Unregister an event listener.
     * This function will remove the callback for the specified event.
     * If the `callback` is not supplied, all callbacks will be
     * removed for the specified event.
     *
     * @see {@link RpcClient.addEventListener}
     * @param {RpcEventType | string} event
     * @param {RpcEventCallback | null} [callback]
     */
    removeEventListener(event, callback) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_removeEventListener(retptr, this.__wbg_ptr, addHeapObject(event), isLikeNone(callback) ? 0 : addHeapObject(callback));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     *
     * Unregister a single event listener callback from all events.
     *
     *
     * @param {RpcEventCallback} callback
     */
    clearEventListener(callback) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_clearEventListener(retptr, this.__wbg_ptr, addHeapObject(callback));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     *
     * Unregister all notification callbacks for all events.
     */
    removeAllEventListeners() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.rpcclient_removeAllEventListeners(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
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
        const ret = wasm.__wbg_get_scriptpublickey_version(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set version(arg0) {
        wasm.__wbg_set_scriptpublickey_version(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} version
     * @param {any} script
     */
    constructor(version, script) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scriptpublickey_constructor(retptr, version, addHeapObject(script));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            ScriptPublicKeyFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {string}
     */
    get script() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.scriptpublickey_script_as_hex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
}

const SigHashTypeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sighashtype_free(ptr >>> 0, 1));

export class SigHashType {

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

const TransactionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transaction_free(ptr >>> 0, 1));
/**
 * Represents a Kaspa transaction.
 * This is an artificial construct that includes additional
 * transaction-related data such as additional data from UTXOs
 * used by transaction inputs.
 * @category Consensus
 */
export class Transaction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Transaction.prototype);
        obj.__wbg_ptr = ptr;
        TransactionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            id: this.id,
            inputs: this.inputs,
            outputs: this.outputs,
            version: this.version,
            lockTime: this.lockTime,
            gas: this.gas,
            subnetworkId: this.subnetworkId,
            payload: this.payload,
            mass: this.mass,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transaction_free(ptr, 0);
    }
    /**
     * Determines whether or not a transaction is a coinbase transaction. A coinbase
     * transaction is a special transaction created by miners that distributes fees and block subsidy
     * to the previous blocks' miners, and specifies the script_pub_key that will be used to pay the current
     * miner in future blocks.
     * @returns {boolean}
     */
    is_coinbase() {
        const ret = wasm.transaction_is_coinbase(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Recompute and finalize the tx id based on updated tx fields
     * @returns {Hash}
     */
    finalize() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_finalize(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Hash.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the transaction ID
     * @returns {string}
     */
    get id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {ITransaction | Transaction} js_value
     */
    constructor(js_value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_constructor(retptr, addBorrowedObject(js_value));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            TransactionFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @returns {TransactionInput[]}
     */
    get inputs() {
        const ret = wasm.transaction_get_inputs_as_js_array(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Returns a list of unique addresses used by transaction inputs.
     * This method can be used to determine addresses used by transaction inputs
     * in order to select private keys needed for transaction signing.
     * @param {NetworkType | NetworkId | string} network_type
     * @returns {Address[]}
     */
    addresses(network_type) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_addresses(retptr, this.__wbg_ptr, addBorrowedObject(network_type));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @param {(ITransactionInput | TransactionInput)[]} js_value
     */
    set inputs(js_value) {
        try {
            wasm.transaction_set_inputs_from_js_array(this.__wbg_ptr, addBorrowedObject(js_value));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @returns {TransactionOutput[]}
     */
    get outputs() {
        const ret = wasm.transaction_get_outputs_as_js_array(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {(ITransactionOutput | TransactionOutput)[]} js_value
     */
    set outputs(js_value) {
        try {
            wasm.transaction_set_outputs_from_js_array(this.__wbg_ptr, addBorrowedObject(js_value));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @returns {number}
     */
    get version() {
        const ret = wasm.transaction_version(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} v
     */
    set version(v) {
        wasm.transaction_set_version(this.__wbg_ptr, v);
    }
    /**
     * @returns {bigint}
     */
    get lockTime() {
        const ret = wasm.transaction_lockTime(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} v
     */
    set lockTime(v) {
        wasm.transaction_set_lockTime(this.__wbg_ptr, v);
    }
    /**
     * @returns {bigint}
     */
    get gas() {
        const ret = wasm.transaction_gas(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} v
     */
    set gas(v) {
        wasm.transaction_set_gas(this.__wbg_ptr, v);
    }
    /**
     * @returns {string}
     */
    get subnetworkId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_get_subnetwork_id_as_hex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {any} js_value
     */
    set subnetworkId(js_value) {
        wasm.transaction_set_subnetwork_id_from_js_value(this.__wbg_ptr, addHeapObject(js_value));
    }
    /**
     * @returns {string}
     */
    get payload() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_get_payload_as_hex_string(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {any} js_value
     */
    set payload(js_value) {
        wasm.transaction_set_payload_from_js_value(this.__wbg_ptr, addHeapObject(js_value));
    }
    /**
     * @returns {bigint}
     */
    get mass() {
        const ret = wasm.transaction_get_mass(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} v
     */
    set mass(v) {
        wasm.transaction_set_mass(this.__wbg_ptr, v);
    }
    /**
     * Serializes the transaction to a pure JavaScript Object.
     * The schema of the JavaScript object is defined by {@link ISerializableTransaction}.
     * @see {@link ISerializableTransaction}
     * @returns {ISerializableTransaction}
     */
    serializeToObject() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_serializeToObject(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Serializes the transaction to a JSON string.
     * The schema of the JSON is defined by {@link ISerializableTransaction}.
     * @returns {string}
     */
    serializeToJSON() {
        let deferred2_0;
        let deferred2_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_serializeToJSON(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr1 = r0;
            var len1 = r1;
            if (r3) {
                ptr1 = 0; len1 = 0;
                throw takeObject(r2);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Serializes the transaction to a "Safe" JSON schema where it converts all `bigint` values to `string` to avoid potential client-side precision loss.
     * @returns {string}
     */
    serializeToSafeJSON() {
        let deferred2_0;
        let deferred2_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_serializeToSafeJSON(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            var ptr1 = r0;
            var len1 = r1;
            if (r3) {
                ptr1 = 0; len1 = 0;
                throw takeObject(r2);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Deserialize the {@link Transaction} Object from a pure JavaScript Object.
     * @param {any} js_value
     * @returns {Transaction}
     */
    static deserializeFromObject(js_value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transaction_deserializeFromObject(retptr, addBorrowedObject(js_value));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Deserialize the {@link Transaction} Object from a JSON string.
     * @param {string} json
     * @returns {Transaction}
     */
    static deserializeFromJSON(json) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(json, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
            const len0 = WASM_VECTOR_LEN;
            wasm.transaction_deserializeFromJSON(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Deserialize the {@link Transaction} Object from a "Safe" JSON schema where all `bigint` values are represented as `string`.
     * @param {string} json
     * @returns {Transaction}
     */
    static deserializeFromSafeJSON(json) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(json, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
            const len0 = WASM_VECTOR_LEN;
            wasm.transaction_deserializeFromSafeJSON(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Transaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const TransactionInputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactioninput_free(ptr >>> 0, 1));
/**
 * Represents a Kaspa transaction input
 * @category Consensus
 */
export class TransactionInput {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionInput.prototype);
        obj.__wbg_ptr = ptr;
        TransactionInputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            previousOutpoint: this.previousOutpoint,
            signatureScript: this.signatureScript,
            sequence: this.sequence,
            sigOpCount: this.sigOpCount,
            utxo: this.utxo,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionInputFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactioninput_free(ptr, 0);
    }
    /**
     * @param {ITransactionInput | TransactionInput} value
     */
    constructor(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactioninput_constructor(retptr, addBorrowedObject(value));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            TransactionInputFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @returns {TransactionOutpoint}
     */
    get previousOutpoint() {
        const ret = wasm.transactioninput_get_previous_outpoint(this.__wbg_ptr);
        return TransactionOutpoint.__wrap(ret);
    }
    /**
     * @param {any} js_value
     */
    set previousOutpoint(js_value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactioninput_set_previous_outpoint(retptr, this.__wbg_ptr, addBorrowedObject(js_value));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @returns {string | undefined}
     */
    get signatureScript() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactioninput_get_signature_script_as_hex(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_export_3(r0, r1 * 1, 1);
            }
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {any} js_value
     */
    set signatureScript(js_value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactioninput_set_signature_script_from_js_value(retptr, this.__wbg_ptr, addHeapObject(js_value));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {bigint}
     */
    get sequence() {
        const ret = wasm.transactioninput_get_sequence(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} sequence
     */
    set sequence(sequence) {
        wasm.transactioninput_set_sequence(this.__wbg_ptr, sequence);
    }
    /**
     * @returns {number}
     */
    get sigOpCount() {
        const ret = wasm.transactioninput_get_sig_op_count(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} sig_op_count
     */
    set sigOpCount(sig_op_count) {
        wasm.transactioninput_set_sig_op_count(this.__wbg_ptr, sig_op_count);
    }
    /**
     * @returns {UtxoEntryReference | undefined}
     */
    get utxo() {
        const ret = wasm.transactioninput_get_utxo(this.__wbg_ptr);
        return ret === 0 ? undefined : UtxoEntryReference.__wrap(ret);
    }
}

const TransactionOutpointFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionoutpoint_free(ptr >>> 0, 1));
/**
 * Represents a Kaspa transaction outpoint.
 * NOTE: This struct is immutable - to create a custom outpoint
 * use the `TransactionOutpoint::new` constructor. (in JavaScript
 * use `new TransactionOutpoint(transactionId, index)`).
 * @category Consensus
 */
export class TransactionOutpoint {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionOutpoint.prototype);
        obj.__wbg_ptr = ptr;
        TransactionOutpointFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            transactionId: this.transactionId,
            index: this.index,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionOutpointFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionoutpoint_free(ptr, 0);
    }
    /**
     * @param {Hash} transaction_id
     * @param {number} index
     */
    constructor(transaction_id, index) {
        _assertClass(transaction_id, Hash);
        var ptr0 = transaction_id.__destroy_into_raw();
        const ret = wasm.transactionoutpoint_ctor(ptr0, index);
        this.__wbg_ptr = ret >>> 0;
        TransactionOutpointFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    getId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactionoutpoint_getId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get transactionId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactionoutpoint_transactionId(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get index() {
        const ret = wasm.transactionoutpoint_index(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const TransactionOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionoutput_free(ptr >>> 0, 1));
/**
 * Represents a Kaspad transaction output
 * @category Consensus
 */
export class TransactionOutput {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TransactionOutput.prototype);
        obj.__wbg_ptr = ptr;
        TransactionOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            value: this.value,
            scriptPublicKey: this.scriptPublicKey,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionOutputFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionoutput_free(ptr, 0);
    }
    /**
     * TransactionOutput constructor
     * @param {bigint} value
     * @param {ScriptPublicKey} script_public_key
     */
    constructor(value, script_public_key) {
        _assertClass(script_public_key, ScriptPublicKey);
        const ret = wasm.transactionoutput_ctor(value, script_public_key.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        TransactionOutputFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {bigint}
     */
    get value() {
        const ret = wasm.transactionoutput_value(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} v
     */
    set value(v) {
        wasm.transactionoutput_set_value(this.__wbg_ptr, v);
    }
    /**
     * @returns {ScriptPublicKey}
     */
    get scriptPublicKey() {
        const ret = wasm.transactionoutput_scriptPublicKey(this.__wbg_ptr);
        return ScriptPublicKey.__wrap(ret);
    }
    /**
     * @param {ScriptPublicKey} v
     */
    set scriptPublicKey(v) {
        _assertClass(v, ScriptPublicKey);
        wasm.transactionoutput_set_scriptPublicKey(this.__wbg_ptr, v.__wbg_ptr);
    }
}

const TransactionSigningHashFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionsigninghash_free(ptr >>> 0, 1));
/**
 * @category Wallet SDK
 */
export class TransactionSigningHash {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionSigningHashFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionsigninghash_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.transactionsigninghash_new();
        this.__wbg_ptr = ret >>> 0;
        TransactionSigningHashFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {HexString | Uint8Array} data
     */
    update(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactionsigninghash_update(retptr, this.__wbg_ptr, addHeapObject(data));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {string}
     */
    finalize() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactionsigninghash_finalize(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
    }
}

const TransactionSigningHashECDSAFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transactionsigninghashecdsa_free(ptr >>> 0, 1));
/**
 * @category Wallet SDK
 */
export class TransactionSigningHashECDSA {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TransactionSigningHashECDSAFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transactionsigninghashecdsa_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.transactionsigninghashecdsa_new();
        this.__wbg_ptr = ret >>> 0;
        TransactionSigningHashECDSAFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {HexString | Uint8Array} data
     */
    update(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactionsigninghashecdsa_update(retptr, this.__wbg_ptr, addHeapObject(data));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {string}
     */
    finalize() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transactionsigninghashecdsa_finalize(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_3(deferred1_0, deferred1_1, 1);
        }
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
        const ret = wasm.__wbg_get_transactionutxoentry_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set amount(arg0) {
        wasm.__wbg_set_transactionutxoentry_amount(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {ScriptPublicKey}
     */
    get scriptPublicKey() {
        const ret = wasm.__wbg_get_transactionutxoentry_scriptPublicKey(this.__wbg_ptr);
        return ScriptPublicKey.__wrap(ret);
    }
    /**
     * @param {ScriptPublicKey} arg0
     */
    set scriptPublicKey(arg0) {
        _assertClass(arg0, ScriptPublicKey);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_transactionutxoentry_scriptPublicKey(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {bigint}
     */
    get blockDaaScore() {
        const ret = wasm.__wbg_get_transactionutxoentry_blockDaaScore(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set blockDaaScore(arg0) {
        wasm.__wbg_set_transactionutxoentry_blockDaaScore(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {boolean}
     */
    get isCoinbase() {
        const ret = wasm.__wbg_get_transactionutxoentry_isCoinbase(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} arg0
     */
    set isCoinbase(arg0) {
        wasm.__wbg_set_transactionutxoentry_isCoinbase(this.__wbg_ptr, arg0);
    }
}

const UtxoEntriesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_utxoentries_free(ptr >>> 0, 1));
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

    toJSON() {
        return {
            items: this.items,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        UtxoEntriesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_utxoentries_free(ptr, 0);
    }
    /**
     * Create a new `UtxoEntries` struct with a set of entries.
     * @param {any} js_value
     */
    constructor(js_value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.utxoentries_js_ctor(retptr, addHeapObject(js_value));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            UtxoEntriesFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {any}
     */
    get items() {
        const ret = wasm.utxoentries_get_items_as_js_array(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {any} js_value
     */
    set items(js_value) {
        try {
            wasm.utxoentries_set_items_from_js_array(this.__wbg_ptr, addBorrowedObject(js_value));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Sort the contained entries by amount. Please note that
     * this function is not intended for use with large UTXO sets
     * as it duplicates the whole contained UTXO set while sorting.
     */
    sort() {
        wasm.utxoentries_sort(this.__wbg_ptr);
    }
    /**
     * @returns {bigint}
     */
    amount() {
        const ret = wasm.utxoentries_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
}

const UtxoEntryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_utxoentry_free(ptr >>> 0, 1));
/**
 * [`UtxoEntry`] struct represents a client-side UTXO entry.
 *
 * @category Wallet SDK
 */
export class UtxoEntry {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(UtxoEntry.prototype);
        obj.__wbg_ptr = ptr;
        UtxoEntryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            address: this.address,
            outpoint: this.outpoint,
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
        UtxoEntryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_utxoentry_free(ptr, 0);
    }
    /**
     * @returns {Address | undefined}
     */
    get address() {
        const ret = wasm.__wbg_get_utxoentry_address(this.__wbg_ptr);
        return ret === 0 ? undefined : Address.__wrap(ret);
    }
    /**
     * @param {Address | null} [arg0]
     */
    set address(arg0) {
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, Address);
            ptr0 = arg0.__destroy_into_raw();
        }
        wasm.__wbg_set_utxoentry_address(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {TransactionOutpoint}
     */
    get outpoint() {
        const ret = wasm.__wbg_get_utxoentry_outpoint(this.__wbg_ptr);
        return TransactionOutpoint.__wrap(ret);
    }
    /**
     * @param {TransactionOutpoint} arg0
     */
    set outpoint(arg0) {
        _assertClass(arg0, TransactionOutpoint);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_utxoentry_outpoint(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {bigint}
     */
    get amount() {
        const ret = wasm.__wbg_get_utxoentry_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set amount(arg0) {
        wasm.__wbg_set_utxoentry_amount(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {ScriptPublicKey}
     */
    get scriptPublicKey() {
        const ret = wasm.__wbg_get_utxoentry_scriptPublicKey(this.__wbg_ptr);
        return ScriptPublicKey.__wrap(ret);
    }
    /**
     * @param {ScriptPublicKey} arg0
     */
    set scriptPublicKey(arg0) {
        _assertClass(arg0, ScriptPublicKey);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_utxoentry_scriptPublicKey(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {bigint}
     */
    get blockDaaScore() {
        const ret = wasm.__wbg_get_utxoentry_blockDaaScore(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set blockDaaScore(arg0) {
        wasm.__wbg_set_utxoentry_blockDaaScore(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {boolean}
     */
    get isCoinbase() {
        const ret = wasm.__wbg_get_utxoentry_isCoinbase(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} arg0
     */
    set isCoinbase(arg0) {
        wasm.__wbg_set_utxoentry_isCoinbase(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {string}
     */
    toString() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.utxoentry_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const UtxoEntryReferenceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_utxoentryreference_free(ptr >>> 0, 1));
/**
 * [`Arc`] reference to a [`UtxoEntry`] used by the wallet subsystems.
 *
 * @category Wallet SDK
 */
export class UtxoEntryReference {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(UtxoEntryReference.prototype);
        obj.__wbg_ptr = ptr;
        UtxoEntryReferenceFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    toJSON() {
        return {
            entry: this.entry,
            outpoint: this.outpoint,
            address: this.address,
            amount: this.amount,
            isCoinbase: this.isCoinbase,
            blockDaaScore: this.blockDaaScore,
            scriptPublicKey: this.scriptPublicKey,
        };
    }

    toString() {
        return JSON.stringify(this);
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        UtxoEntryReferenceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_utxoentryreference_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    toString() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.utxoentryreference_toString(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {UtxoEntry}
     */
    get entry() {
        const ret = wasm.utxoentryreference_entry(this.__wbg_ptr);
        return UtxoEntry.__wrap(ret);
    }
    /**
     * @returns {TransactionOutpoint}
     */
    get outpoint() {
        const ret = wasm.utxoentryreference_outpoint(this.__wbg_ptr);
        return TransactionOutpoint.__wrap(ret);
    }
    /**
     * @returns {Address | undefined}
     */
    get address() {
        const ret = wasm.utxoentryreference_address(this.__wbg_ptr);
        return ret === 0 ? undefined : Address.__wrap(ret);
    }
    /**
     * @returns {bigint}
     */
    get amount() {
        const ret = wasm.utxoentryreference_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {boolean}
     */
    get isCoinbase() {
        const ret = wasm.utxoentryreference_isCoinbase(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {bigint}
     */
    get blockDaaScore() {
        const ret = wasm.utxoentryreference_blockDaaScore(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {ScriptPublicKey}
     */
    get scriptPublicKey() {
        const ret = wasm.utxoentryreference_scriptPublicKey(this.__wbg_ptr);
        return ScriptPublicKey.__wrap(ret);
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
    imports.wbg.__wbg_BigInt_ddea6d2f55558acb = function() { return handleError(function (arg0) {
        const ret = BigInt(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_String_8f0eb39a4a4c2f66 = function(arg0, arg1) {
        const ret = String(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_abort_775ef1d17fc65868 = function(arg0) {
        getObject(arg0).abort();
    };
    imports.wbg.__wbg_aborted_new = function(arg0) {
        const ret = Aborted.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_address_new = function(arg0) {
        const ret = Address.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_appendChild_8204974b7328bf98 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).appendChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_append_8c7dd8d641a5f01b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_body_942ea927546a04ba = function(arg0) {
        const ret = getObject(arg0).body;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_buffer_609cc3eee51ed158 = function(arg0) {
        const ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_clearTimeout_c5ac0f4b6a07b59e = function() { return handleError(function (arg0) {
        clearTimeout(getObject(arg0));
    }, arguments) };
    imports.wbg.__wbg_close_0880036443561527 = function() { return handleError(function (arg0) {
        getObject(arg0).close();
    }, arguments) };
    imports.wbg.__wbg_createElement_8c9931a732ee2fea = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_createObjectURL_6e98d2f9c7bd9764 = function() { return handleError(function (arg0, arg1) {
        const ret = URL.createObjectURL(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_crypto_ed58b8e10a292839 = function(arg0) {
        const ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_data_432d9c3df2630942 = function(arg0) {
        const ret = getObject(arg0).data;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_delete_36c8630e530a2a1a = function(arg0, arg1) {
        const ret = getObject(arg0).delete(getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_document_d249400bd7bd996d = function(arg0) {
        const ret = getObject(arg0).document;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_done_769e5ede4b31c67b = function(arg0) {
        const ret = getObject(arg0).done;
        return ret;
    };
    imports.wbg.__wbg_entries_3265d4158b33e5dc = function(arg0) {
        const ret = Object.entries(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_error_5edc95999c70d386 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_export_3(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_error_b5d62a6100a65a3b = function(arg0, arg1) {
        console.error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_fetch_509096533071c657 = function(arg0, arg1) {
        const ret = getObject(arg0).fetch(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_fetch_7bb58c5ed3c31810 = function(arg0) {
        const ret = fetch(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_from_2a5d3e218e67aa85 = function(arg0) {
        const ret = Array.from(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getRandomValues_bcb4912f16000dc4 = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_get_13495dac72693ecc = function(arg0, arg1) {
        const ret = getObject(arg0).get(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_get_67b2ba62fc30de12 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_b9b93047fe3cf45b = function(arg0, arg1) {
        const ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getwithrefkey_1dc361bd10053bfe = function(arg0, arg1) {
        const ret = getObject(arg0)[getObject(arg1)];
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_has_a5ea9117f258a0ec = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.has(getObject(arg0), getObject(arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_hash_new = function(arg0) {
        const ret = Hash.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_headers_9cb51cfd2ac780a4 = function(arg0) {
        const ret = getObject(arg0).headers;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_innerHTML_e1553352fe93921a = function(arg0, arg1) {
        const ret = getObject(arg1).innerHTML;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_instanceof_ArrayBuffer_e14585432e3737fc = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof ArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Map_f3469ce2244d2430 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Map;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Object_7f2dcef8f78644a4 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Object;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Response_f2cc20d9f7dfd644 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Response;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8Array_17156bcf118086a9 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_def73ea0955fc569 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_isArray_a1eab7e0d067391b = function(arg0) {
        const ret = Array.isArray(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_isSafeInteger_343e2beeeece1bb0 = function(arg0) {
        const ret = Number.isSafeInteger(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_is_c7481c65e7e5df9e = function(arg0, arg1) {
        const ret = Object.is(getObject(arg0), getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_iterator_9a24c88df860dc65 = function() {
        const ret = Symbol.iterator;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_a446193dc22c12f8 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_length_e2d2a49132c1b256 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_location_350d99456c2f3693 = function(arg0) {
        const ret = getObject(arg0).location;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_log_6c164928aa7b57f4 = function(arg0, arg1) {
        console.log(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_msCrypto_0a36e2ec3a343d26 = function(arg0) {
        const ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_018dcc2d6c8c2f6a = function() { return handleError(function () {
        const ret = new Headers();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_0b790fd655ff1a97 = function() { return handleError(function (arg0, arg1) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_23a2665fac83c611 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_150(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            const ret = new Promise(cb0);
            return addHeapObject(ret);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_new_405e22f390576ce2 = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_5e0be73521bc8c17 = function() {
        const ret = new Map();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_757fd34d47ff40d2 = function(arg0) {
        const ret = new ArrayBuffer(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_78feb108b6472713 = function() {
        const ret = new Array();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_a12002a7f91c75be = function(arg0) {
        const ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_b1a33e5095abf678 = function() { return handleError(function (arg0, arg1) {
        const ret = new Worker(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_e25e5aab09ff45db = function() { return handleError(function () {
        const ret = new AbortController();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_f5f8a7325e1cb479 = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newnoargs_105ed471475aaf50 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithlength_a381634e90c276d4 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithnodejsconfigimpl_b0a2d4e5b0763676 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1), takeObject(arg2), takeObject(arg3), takeObject(arg4), takeObject(arg5), takeObject(arg6));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_newwithstrandinit_06c535e0a867c635 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_newwithstrsequenceandoptions_aaff55b467c81b63 = function() { return handleError(function (arg0, arg1) {
        const ret = new Blob(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_next_25feadfc0913fea9 = function(arg0) {
        const ret = getObject(arg0).next;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_next_6574e1a8a62d1055 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).next();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_node_02999533c4ea02e3 = function(arg0) {
        const ret = getObject(arg0).node;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_nodedescriptor_new = function(arg0) {
        const ret = NodeDescriptor.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_now_d18023d54d4e5500 = function(arg0) {
        const ret = getObject(arg0).now();
        return ret;
    };
    imports.wbg.__wbg_postMessage_6edafa8f7b9c2f52 = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).postMessage(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_process_5c1d670bc53614b8 = function(arg0) {
        const ret = getObject(arg0).process;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_protocol_faa0494a9b2554cb = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg1).protocol;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_push_737cfc8c1432c2c6 = function(arg0, arg1) {
        const ret = getObject(arg0).push(getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_queueMicrotask_97d92b4fcc8a61c5 = function(arg0) {
        queueMicrotask(getObject(arg0));
    };
    imports.wbg.__wbg_queueMicrotask_d3219def82552485 = function(arg0) {
        const ret = getObject(arg0).queueMicrotask;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_randomFillSync_ab2cfe79ebbf2740 = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).randomFillSync(takeObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_readyState_6c28968f3e6c1e47 = function(arg0) {
        const ret = getObject(arg0).readyState;
        return ret;
    };
    imports.wbg.__wbg_removeAttribute_e419cd6726b4c62f = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).removeAttribute(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_require_79b1e9274cde3c87 = function() { return handleError(function () {
        const ret = module.require;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_resolve_4851785c9c5f573d = function(arg0) {
        const ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_rpcclient_new = function(arg0) {
        const ret = RpcClient.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_send_17f8c8c8e084cc5e = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).send(getArrayU8FromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_send_9a57107cc0d7eafa = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).send(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_send_afb0c27f2d9698e3 = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).send(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_setAttribute_2704501201f15687 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_setTimeout_430dd4984e76f6c3 = function() { return handleError(function (arg0, arg1) {
        const ret = setTimeout(getObject(arg0), arg1 >>> 0);
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_set_37837023f3d740e8 = function(arg0, arg1, arg2) {
        getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
    };
    imports.wbg.__wbg_set_3f1d0b984ed272ed = function(arg0, arg1, arg2) {
        getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
    };
    imports.wbg.__wbg_set_65595bdd868b3009 = function(arg0, arg1, arg2) {
        getObject(arg0).set(getObject(arg1), arg2 >>> 0);
    };
    imports.wbg.__wbg_set_8fc6bf8a5b1071d1 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_bb8cecf6a62b9f46 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setbinaryType_9981a6ba2bd58b94 = function(arg0, arg1) {
        getObject(arg0).binaryType = __wbindgen_enum_BinaryType[arg1];
    };
    imports.wbg.__wbg_setbody_5923b78a95eedf29 = function(arg0, arg1) {
        getObject(arg0).body = getObject(arg1);
    };
    imports.wbg.__wbg_setcredentials_c3a22f1cd105a2c6 = function(arg0, arg1) {
        getObject(arg0).credentials = __wbindgen_enum_RequestCredentials[arg1];
    };
    imports.wbg.__wbg_setheaders_834c0bdb6a8949ad = function(arg0, arg1) {
        getObject(arg0).headers = getObject(arg1);
    };
    imports.wbg.__wbg_setinnerHTML_31bde41f835786f7 = function(arg0, arg1, arg2) {
        getObject(arg0).innerHTML = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setmethod_3c5280fe5d890842 = function(arg0, arg1, arg2) {
        getObject(arg0).method = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setmode_5dc300b865044b65 = function(arg0, arg1) {
        getObject(arg0).mode = __wbindgen_enum_RequestMode[arg1];
    };
    imports.wbg.__wbg_setonclose_b15bdabd419b6357 = function(arg0, arg1) {
        getObject(arg0).onclose = getObject(arg1);
    };
    imports.wbg.__wbg_setonerror_e2c5c0fa6fbf6d99 = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    };
    imports.wbg.__wbg_setonmessage_007594843a0b97e8 = function(arg0, arg1) {
        getObject(arg0).onmessage = getObject(arg1);
    };
    imports.wbg.__wbg_setonmessage_5a885b16bdc6dca6 = function(arg0, arg1) {
        getObject(arg0).onmessage = getObject(arg1);
    };
    imports.wbg.__wbg_setonopen_c42cfdbb28b087c4 = function(arg0, arg1) {
        getObject(arg0).onopen = getObject(arg1);
    };
    imports.wbg.__wbg_setsignal_75b21ef3a81de905 = function(arg0, arg1) {
        getObject(arg0).signal = getObject(arg1);
    };
    imports.wbg.__wbg_settype_39ed370d3edd403c = function(arg0, arg1, arg2) {
        getObject(arg0).type = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_signal_aaf9ad74119f20a4 = function(arg0) {
        const ret = getObject(arg0).signal;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_c99a96ed42647c4c = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_status_f6360336ca686bf0 = function(arg0) {
        const ret = getObject(arg0).status;
        return ret;
    };
    imports.wbg.__wbg_stringify_f7ed6987935b4a24 = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(getObject(arg0));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_subarray_aa9065fa9dc5df96 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_text_7805bea50de2af49 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).text();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_then_44b73946d2fb3e7d = function(arg0, arg1) {
        const ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_48b406749878a531 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_toString_b5d4438bc26b267c = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).toString(arg1);
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_transaction_new = function(arg0) {
        const ret = Transaction.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_transactioninput_new = function(arg0) {
        const ret = TransactionInput.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_transactionoutput_new = function(arg0) {
        const ret = TransactionOutput.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_url_ae10c34ca209681d = function(arg0, arg1) {
        const ret = getObject(arg1).url;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_utxoentryreference_new = function(arg0) {
        const ret = UtxoEntryReference.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_value_cd1ffa7b1ab794f1 = function(arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_versions_c71aa1626a93e0a1 = function(arg0) {
        const ret = getObject(arg0).versions;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_warn_28319e260c89a4f8 = function(arg0, arg1) {
        console.warn(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_as_number = function(arg0) {
        const ret = +getObject(arg0);
        return ret;
    };
    imports.wbg.__wbindgen_bigint_from_i64 = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_bigint_from_u64 = function(arg0) {
        const ret = BigInt.asUintN(64, arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_bigint_get_as_i64 = function(arg0, arg1) {
        const v = getObject(arg1);
        const ret = typeof(v) === 'bigint' ? v : undefined;
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = getObject(arg0);
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        return ret;
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper432 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 74, __wbg_adapter_58);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper6279 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 1940, __wbg_adapter_61);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper7013 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 1964, __wbg_adapter_64);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper7015 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 1964, __wbg_adapter_67);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper7017 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 1964, __wbg_adapter_70);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper7328 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 2075, __wbg_adapter_73);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper7329 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 2075, __wbg_adapter_73);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_in = function(arg0, arg1) {
        const ret = getObject(arg0) in getObject(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_is_array = function(arg0) {
        const ret = Array.isArray(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbindgen_is_bigint = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'bigint';
        return ret;
    };
    imports.wbg.__wbindgen_is_falsy = function(arg0) {
        const ret = !getObject(arg0);
        return ret;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_null = function(arg0) {
        const ret = getObject(arg0) === null;
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = getObject(arg0);
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'string';
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_jsval_eq = function(arg0, arg1) {
        const ret = getObject(arg0) === getObject(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_jsval_loose_eq = function(arg0, arg1) {
        const ret = getObject(arg0) == getObject(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export_1, wasm.__wbindgen_export_2);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_try_into_number = function(arg0) {
        let result;
        try { result = +getObject(arg0) } catch (e) { result = e }
        const ret = result;
        return addHeapObject(ret);
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

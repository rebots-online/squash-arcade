import { Channel, invoke, isTauri } from '@tauri-apps/api/core';

const PLUGIN = 'plugin:play-billing|';
let platformRequest;

/** A browser/PWA on Android is not a native Play distribution. Failure stays failure. */
export async function isNativeAndroid() {
    if (!isTauri()) return false;
    if (!platformRequest) {
        platformRequest = invoke(`${PLUGIN}platform`).catch((error) => {
            platformRequest = undefined;
            throw error;
        });
    }
    return (await platformRequest) === 'android';
}

async function androidInvoke(command, args) {
    if (!(await isNativeAndroid())) throw new Error('Google Play checkout requires the native Android application.');
    return invoke(`${PLUGIN}${command}`, args);
}

/** Input is the real /catalog Android binding; output prices and tokens come from Play. */
export async function queryPlayProducts(offers) {
    const result = await androidInvoke('queryProducts', { offers });
    return result.offers;
}

/** Returns store evidence, never an entitlement. Verify purchased tokens on the backend. */
export async function queryPlayPurchases() {
    const result = await androidInvoke('queryPurchases');
    return result.purchases;
}

/** Resolves when the sheet opens. Only the server may confirm paid access afterward. */
export async function purchasePlayOffer(offer, obfuscatedAccountId) {
    return androidInvoke('purchase', { offer, obfuscatedAccountId });
}

/** Register once before restoring; callbacks also arrive when the activity resumes. */
export async function listenPlayPurchases(callback) {
    if (!(await isNativeAndroid())) throw new Error('Play purchase listeners require native Android.');
    let active = true;
    const channel = new Channel((event) => { if (active) callback(event); });
    await invoke(`${PLUGIN}registerListener`, { event: 'purchases', handler: channel });
    return async () => {
        active = false;
        await invoke(`${PLUGIN}removeListener`, { event: 'purchases', channelId: channel.id });
    };
}

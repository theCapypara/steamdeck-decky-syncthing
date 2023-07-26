import {
    SyncthingProcessState,
    WATCHDOG_PROXY_URL,
    WATCHDOG_RELOAD_CONFIG_ROUTE, WATCHDOG_START_ROUTE,
    WATCHDOG_STATE_ROUTE, WATCHDOG_STOP_ROUTE
} from "../consts";
import {sleep} from "decky-frontend-lib";

export class WatchdogApi {
    private readonly baseUrl: string;

    constructor(baseUrl: string = WATCHDOG_PROXY_URL) {
        this.baseUrl = baseUrl;
    }

    async getState(): Promise<SyncthingProcessState> {
        let result;
        try {
             result = await fetch(`${this.baseUrl}${WATCHDOG_STATE_ROUTE}`);
        } catch (_) {
            // we retry fetching the state once, because the watchdog may still be starting.
            await sleep(1000);
            result = await fetch(`${this.baseUrl}${WATCHDOG_STATE_ROUTE}`);
        }
        if (result.ok) {
            let text = (await result.text()).trim();
            switch (text) {
                case SyncthingProcessState.Stopped:
                case SyncthingProcessState.Failed:
                case SyncthingProcessState.Running:
                case SyncthingProcessState.Wait:
                    return text as SyncthingProcessState;
                default:
                    throw new Error(`State request failed. Got unknown state: ${text}`);
            }
        } else {
            throw new Error(`State request failed. Status: ${result.status} ${result.statusText}. Response: ${await result.text()}`);
        }
    }

    async reloadSettings(): Promise<void> {
        let result = await fetch(`${this.baseUrl}${WATCHDOG_RELOAD_CONFIG_ROUTE}`,  {method: "POST"});
        if (!result.ok) {
            throw new Error(`Settings reload request failed. Status: ${result.status} ${result.statusText}. Response: ${await result.text()}`);
        }
    }

    async start(): Promise<void> {
        let result = await fetch(`${this.baseUrl}${WATCHDOG_START_ROUTE}`,  {method: "POST"});
        if (!result.ok) {
            throw new Error(`Start request failed. Status: ${result.status} ${result.statusText}. Response: ${await result.text()}`);
        }
    }

    async stop(): Promise<void> {
        let result = await fetch(`${this.baseUrl}${WATCHDOG_STOP_ROUTE}`,  {method: "POST"});
        if (!result.ok) {
            throw new Error(`Stop request failed. Status: ${result.status} ${result.statusText}. Response: ${await result.text()}`);
        }
    }

    /**
     * Checks if Syncthing is up, by calling the / of the watchdog proxy. This will return a HTTP `425 Too Early` if
     * the Syncthing API is not up yet. Then it will return false. If a status code >= 500 is returned or the request
     * fails, an error is thrown. Otherwise, true is returned.
     */
    async checkIfUp(): Promise<boolean> {
        let result = await fetch(`${this.baseUrl}`,  {method: "POST"});
        if (result.status >= 500) {
            throw new Error(`Check failed. Status: ${result.status} ${result.statusText}. Response: ${await result.text()}`);
        } else if (result.status == 425) {
            return false;
        }
        return true;
    }
}

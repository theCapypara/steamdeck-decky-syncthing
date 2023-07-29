import {WATCHDOG_PROXY_URL} from "../consts";

export class SyncthingError extends Error {
    public readonly status: number;
    public readonly response: string;

    constructor(status: number, response: string) {
        super(`HTTP ${status}: ${response}`);
        this.status = status;
        this.response = response;
        this.name = this.constructor.name;
    }
}

export interface StStatus {
    myID?: string;
}

export interface StConfigDevice {
    deviceID?: string;
    name?: string;
    paused?: boolean;
}

export interface StStatsDevice {
    lastSeen?: string;
}

export interface StConfigFolder {
    id?: string;
    label?: string;
    paused?: boolean;
}

export interface StStatsFolder {
    lastScan?: string; // ISO 8601
}

export interface StDbStatus {
    errors?: number;
    pullErrors?: number;
    needTotalItems?: number;
    state?: string;
    stateChanged?: string; // ISO 8601
    error?: string;

}

export class SyncthingApi {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(apiKey: string, baseUrl: string = WATCHDOG_PROXY_URL) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    status(): Promise<StStatus> {
        return this.get("rest/system/status");
    }

    configDevices(): Promise<StConfigDevice[]> {
        return this.get("rest/config/devices");
    }

    statsDevices(): Promise<Record<string, StStatsDevice>> {
        return this.get("rest/stats/device");
    }

    configFolders(): Promise<StConfigFolder[]> {
        return this.get("rest/config/folders");
    }

    statsFolders(): Promise<Record<string, StStatsFolder>> {
        return this.get("rest/stats/folder");
    }

    dbStatus(folderId: string): Promise<StDbStatus> {
        return this.get(`rest/db/status?folder=${folderId}`);
    }

    async get<T>(path: string, init?: RequestInit): Promise<T> {
        let response = await fetch(`${this.baseUrl}${path}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                // who knows why we have to set both...
                'X-API-Key': `${this.apiKey}`
            },
            ...(init ?? {})
        });
        if (response.status == 200) {
            return response.json();
        }
        const text = await response.text();
        console.error(`Syncthing Decky: API error: ${response.status}: ${text}`);
        throw new SyncthingError(response.status, text);
    }
}

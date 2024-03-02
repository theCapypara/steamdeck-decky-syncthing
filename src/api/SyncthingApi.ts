import {WATCHDOG_PROXY_URL} from "../consts";

export type Folder = StConfigFolder & StStatsFolder & StDbStatus;
export type Folders = Record<string, Folder>;
export type Device = StConfigDevice & StStatsDevice;
export type Devices = Record<string, Device>;

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

export interface StConfigOptions {
    listenAddresses?: string[];
    globalAnnounceServers?: string[];
    globalAnnounceEnabled?: boolean;
    localAnnounceEnabled?: boolean;
    localAnnouncePort?: number;
    localAnnounceMCAddr?: string;
    maxSendKbps?: number;
    maxRecvKbps?: number;
    reconnectionIntervalS?: number;
    relaysEnabled?: boolean;
    relayReconnectIntervalM?: number;
    startBrowser?: boolean;
    natEnabled?: boolean;
    natLeaseMinutes?: number;
    natRenewalMinutes?: number;
    natTimeoutSeconds?: number;
    urAccepted?: number;
    urSeen?: number;
    urUniqueId?: string;
    urURL?: string;
    urPostInsecurely?: boolean;
    urInitialDelayS?: number;
    autoUpgradeIntervalH?: number;
    upgradeToPreReleases?: boolean;
    keepTemporariesH?: number;
    cacheIgnoredFiles?: boolean;
    progressUpdateIntervalS?: number;
    limitBandwidthInLan?: boolean;
    minHomeDiskFree?: { value?: number; unit?: string };
    releasesURL?: string;
    alwaysLocalNets?: any[];
    overwriteRemoteDeviceNamesOnConnect?: boolean;
    tempIndexMinBlocks?: number;
    unackedNotificationIDs?: any[];
    trafficClass?: number;
    setLowPriority?: boolean;
    maxFolderConcurrency?: number;
    crURL?: string;
    crashReportingEnabled?: boolean;
    stunKeepaliveStartS?: number;
    stunKeepaliveMinS?: number;
    stunServers?: string[];
    databaseTuning?: string;
    maxConcurrentIncomingRequestKiB?: number;
    announceLANAddresses?: boolean;
    sendFullIndexOnUpgrade?: boolean;
    featureFlags?: any[];
    connectionLimitEnough?: number;
    connectionLimitMax?: number;
    insecureAllowOldTLSVersions?: boolean;
    connectionPriorityTcpLan?: number;
    connectionPriorityQuicLan?: number;
    connectionPriorityTcpWan?: number;
    connectionPriorityQuicWan?: number;
    connectionPriorityRelay?: number;
    connectionPriorityUpgradeThreshold?: number;
}

export interface StConnectionService {
  error?: any | null;
  lanAddresses?: string[];
  wanAddresses?: string[];
}

export interface StStatus {
    alloc?: number;
    connectionServiceStatus?: Record<string, StConnectionService>;
    cpuPercent?: number;
    discoveryEnabled?: boolean;
    discoveryErrors?: Record<string, { error?: any | null }>;
    discoveryMethods?: number;
    discoveryStatus?: Record<string, { error?: any | null }>;
    goroutines?: number;
    guiAddressOverridden?: boolean;
    guiAddressUsed?: string;
    lastDialStatus?: Record<string, { error?: any | null, when?: string }>;
    myID?: string;
    pathSeparator?: string;
    startTime?: string;
    sys?: number;
    tilde?: string;
    uptime?: number;
    urVersionMax?: number;
}

export interface StConfigDevice {
    deviceID?: string;
    name?: string;
    paused?: boolean;
    maxRecvKbps?: number;
    maxSendKbps?: number;
    introducer?: boolean;
    introducedBy?: string;
    autoAcceptFolders?: boolean;
    untrusted?: boolean;
}

export interface StStatsDevice {
    lastSeen?: string;
}

export interface StConfigFolderDevice {
    deviceID?: string;
    introducedBy?: string;
    encryptionPassword?: string;
}

export interface StConfigFolderVersioning {
    type?: string;
    params?: any;
    cleanupIntervalS?: number;
    fsPath?: string;
    fsType?: string;
}

export interface StConfigFolder {
    id?: string;
    label?: string;
    paused?: boolean;
    filesystemType?: string;
    path?: string;
    type?: string;
    devices?: [StConfigFolderDevice];
    rescanIntervalS?: number;
    fsWatcherEnabled?: boolean;
    fsWatcherDelayS?: number;
    ignorePerms?: boolean;
    autoNormalize?: boolean;
    minDiskFree?: {value?: number; unit?: string;};
    versioning?: StConfigFolderVersioning;
    copiers?: number;
    pullerMaxPendingKiB?: number;
    hashers?: number;
    order?: string;
    ignoreDelete?: boolean;
    scanProgressIntervalS?: number;
    pullerPauseS?: number;
    maxConflicts?: number;
    disableSparseFiles?: boolean;
    disableTempIndexes?: boolean;
    weakHashThresholdPct?: number;
    markerName?: string;
    copyOwnershipFromParent?: boolean;
    modTimeWindowS?: number;
    maxConcurrentWrites?: number;
    disableFsync?: boolean;
    blockPullOrder?: string;
    copyRangeMethod?: string;
    caseSensitiveFS?: boolean;
    junctionsAsDirs?: boolean;
    syncOwnership?: boolean;
    sendOwnership?: boolean;
    syncXattrs?: boolean;
    sendXattrs?: boolean;
    xattrFilter?: {entries?: [any]; maxSingleEntrySize?: number; maxTotalSize?: number;}
}

export interface StStatsFolder {
    lastScan?: string; // ISO 8601
}

export interface StDbStatus {
  errors?: number;
  pullErrors?: number;
  invalid?: string;
  globalFiles?: number;
  globalDirectories?: number;
  globalSymlinks?: number;
  globalDeleted?: number;
  globalBytes?: number;
  globalTotalItems?: number;
  localFiles?: number;
  localDirectories?: number;
  localSymlinks?: number;
  localDeleted?: number;
  localBytes?: number;
  localTotalItems?: number;
  needFiles?: number;
  needDirectories?: number;
  needSymlinks?: number;
  needDeletes?: number;
  needBytes?: number;
  needTotalItems?: number;
  receiveOnlyChangedFiles?: number;
  receiveOnlyChangedDirectories?: number;
  receiveOnlyChangedSymlinks?: number;
  receiveOnlyChangedDeletes?: number;
  receiveOnlyChangedBytes?: number;
  receiveOnlyTotalItems?: number;
  inSyncFiles?: number;
  inSyncBytes?: number;
  state?: string;
  stateChanged?: string; // ISO 8601
  error?: string;
  version?: number;
  sequence?: number;
  ignorePatterns?: boolean;
  watchError?: string;
}

export interface StConnectionStatsSingle {
    at?: string; // ISO 8601
    inBytesTotal?: number;
    outBytesTotal?: number;
    startedAt?: string;
    address?: string;
    type?: string;
    isLocal?: boolean;
    crypto?: string;
}

export interface StConnectionStats {
    at?: string; // ISO 8601
    inBytesTotal?: number;
    outBytesTotal?: number;
    startedAt?: string;
    connected?: boolean;
    paused?: boolean;
    clientVersion?: string;
    address?: string;
    type?: string;
    isLocal?: boolean;
    crypto?: string;
    primary?: StConnectionStatsSingle;

    _inBps: number;
    _outBps: number;
}

export interface StConnectionsTotals {
    at?: string; // ISO 8601
    inBytesTotal?: number;
    outBytesTotal?: number;

    _inBps: number;
    _outBps: number;
}

export interface StConnections {
    connections?: Record<string, StConnectionStats>;
    total?: StConnectionsTotals;
}

export interface StCompletion {
  completion?: number;
  globalBytes?: number;
  globalItems?: number;
  needBytes?: number;
  needDeletes?: number;
  needItems?: number;
  remoteState?: string;
  sequence?: number;
}

export interface StVersion {
  arch?: string
  codename?: string
  container?: boolean
  date?: string
  extra?: string
  isBeta?: boolean
  isCandidate?: boolean
  isRelease?: boolean
  longVersion?: string
  os?: string
  stamp?: string
  tags?: string[]
  user?: string
  version?: string
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

    version(): Promise<StVersion> {
        return this.get("rest/system/version");
    }

    configOptions(): Promise<StConfigOptions> {
        return this.get("rest/config/options");
    }

    configDevices(): Promise<StConfigDevice[]> {
        return this.get("rest/config/devices");
    }

    statsDevices(): Promise<Record<string, StStatsDevice>> {
        return this.get("rest/stats/device");
    }

    completionDevice(device: string, folder: string): Promise<StCompletion> {
        return this.get(`rest/db/completion?device=${device}&folder=${folder}`);
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

    async connections(): Promise<StConnections> {
        // Wait 1000ms and capture again to calculate things like inBps.
        const wait = 1000;
        const td = wait / 1000;

        const first: StConnections = await this.get("rest/system/connections");
        await new Promise((resolve) => setTimeout(resolve, wait));
        const second: StConnections = await this.get("rest/system/connections");

        if (second.total != undefined && first.total != undefined) {
            try {
                second.total._inBps = Math.max(0, (second.total.inBytesTotal! - first.total.inBytesTotal!) / td);
                second.total._outBps = Math.max(0, (second.total.outBytesTotal! - first.total.outBytesTotal!) / td);
            } catch (e) {
                second.total._inBps = 0;
                second.total._outBps = 0;
            }
        }

        if (second.connections != undefined && first.connections != undefined) {
            for (const key of Object.keys(second.connections)) {
                const connectionInFirst = first.connections[key];
                const connectionInSecond = second.connections[key];
                try {
                    connectionInSecond._inBps = Math.max(0, (connectionInSecond.inBytesTotal! - connectionInFirst.inBytesTotal!) / td);
                    connectionInSecond._outBps = Math.max(0, (connectionInSecond.outBytesTotal! - connectionInFirst.outBytesTotal!) / td);
                } catch (e) {
                    connectionInSecond._inBps = 0;
                    connectionInSecond._outBps = 0;
                }
            }
        }

        return second;
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

export enum DeviceStatus {
    Unused,
    Unknown,
    Paused,
    InSync,
    Syncing,
    DisconnectedInactive,
    Disconnected
}

export function deviceStatus(
    device: Device,
    folders: Folders,
    connections: StConnections,
    completions: DeviceCompletion,
): DeviceStatus {
    let unused = true;
    outer:
    for (const folder of Object.values(folders)) {
        if (folder.devices) {
            for (const folderDevice of folder.devices) {
                if (folderDevice.deviceID == device.deviceID) {
                    unused = false;
                    break outer;
                }
            }
        }
    }

    if (unused) {
        return DeviceStatus.Unused;
    }

    if (connections.connections == undefined || connections.connections[device.deviceID ?? ""] == undefined) {
        return DeviceStatus.Unknown;
    }

    if (device.paused) {
        return DeviceStatus.Paused;
    }

    if (connections.connections[device.deviceID!].connected) {
        if (completions[device.deviceID!] && completions[device.deviceID!].total === 100) {
            return DeviceStatus.InSync;
        } else {
            return DeviceStatus.Syncing;
        }
    }

    if (device.lastSeen) {
        const lastSeen = new Date(device.lastSeen!);
        const lastSeenDays = (new Date().valueOf() - lastSeen.valueOf()) / 1000 / 86400;
        if (lastSeenDays >= 7) {
            return DeviceStatus.DisconnectedInactive;
        }
    }

    return DeviceStatus.Disconnected;

}

export interface DeviceCompletion {
    total: number;
    needBytes: number;
    needItems: number;
    folders: Record<string, StCompletion>;
}

// Source: https://github.com/syncthing/syncthing/blob/07a9fa2dbd60cdd2ee7f1a74324476547c65f76c/gui/default/syncthing/core/syncthingController.js#L964
export function recalcDeviceCompletions(completionData: Record<string, StCompletion>): DeviceCompletion {
    let total = 0, needed = 0, deletes = 0, items = 0;
    for (const folder in completionData) {
        total += completionData[folder].globalBytes ?? 0;
        needed += completionData[folder].needBytes ?? 0;
        items += completionData[folder].needItems ?? 0;
        deletes += completionData[folder].needDeletes ?? 0;
    }
    const outCompletionData: DeviceCompletion = {folders: completionData, total: 100, needBytes: 0, needItems: 0};
    if (total != 0) {
        outCompletionData.total = Math.floor(100 * (1 - needed / total));
        outCompletionData.needBytes = needed;
        outCompletionData.needItems = items + deletes;
    }

    if (needed == 0 && deletes + items > 0 ) {
        // We don't need any data, but we have deletes or
        // dirs/links/empty files that we need to do. Drop down the
        // completion percentage to indicate that we have stuff to do.
        outCompletionData.total = 95;
    }
    return outCompletionData;
}

export function getDeviceFolders(device: Device, folders: Folders): Folder[] {
    const deviceFolders = [];
    for (const folder of Object.values(folders)) {
        if (folder.devices) {
            for (const folderDevice of folder.devices) {
                if (folderDevice.deviceID == device.deviceID) {
                    deviceFolders.push(folder);
                    break;
                }
            }
        }
    }
    return deviceFolders;
}
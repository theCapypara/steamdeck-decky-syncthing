import {
    DeviceCompletion,
    Devices,
    Folders, recalcDeviceCompletions,
    StCompletion,
    StConfigDevice,
    StConfigFolder,
    StConnections,
    StDbStatus,
    StStatsDevice,
    StStatsFolder,
    SyncthingApi
} from "./SyncthingApi";
import {useEffect, useState} from "react";

/**
 * Returns:
 * - loading: boolean
 * - error: unknown | null
 * - myDevice: string | null
 * - devices: Devices | null
 *
 * Those will be loaded. Internally a state is used. On error, error is set instead.
 *
 * If `justThisId` is given, the result will only contain this entity and requests will be optimized.
 */
export function useDevices(api: SyncthingApi, justThisId?: string, refreshToken?: any): [boolean, unknown| null, string | null, Devices | null] {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown | null>(null);
    const [myDevice, setMyDevice] = useState<string | null>(null);
    const [devices, setDevices] = useState<Devices | null>(null);

    useEffect(() => {
        const loadDevices = async () => {
            setLoading(true);
            try {
                const [status, configDevices, statsDevices] = await Promise.all([api.status(), api.configDevices(), api.statsDevices()]);
                setMyDevice(status.myID ?? null);
                setDevices(buildDevices(configDevices, statsDevices, justThisId));
            } catch (error) {
                setError(error);
            }
            setLoading(false);
        };
        loadDevices();
    }, [api, refreshToken]);

    return [loading, error, myDevice, devices];
}

/**
 * Returns:
 * - loading: boolean
 * - error: unknown | null
 * - folders: Folders | null
 *
 * Those will be loaded. Internally a state is used. On error, error is set instead.
 *
 * If `justThisId` is given, the result will only contain this entity and requests will be optimized.
 */
export function useFolders(api: SyncthingApi, justThisId?: string, refreshToken?: any): [boolean, unknown| null, Folders | null] {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown | null>(null);
    const [folders, setFolders] = useState<Folders | null>(null);

    useEffect(() => {
        const loadFolders = async () => {
            setLoading(true);
            try {
                const [configFolders, statsFolders] = await Promise.all([api.configFolders(), api.statsFolders()]);
                setFolders(await buildFolders(api, configFolders, statsFolders, justThisId));
            } catch (error) {
                setError(error);
            }
            setLoading(false);
        };
        loadFolders();
    }, [api, refreshToken]);

    return [loading, error, folders];
}

/**
 * Returns:
 * - loading: boolean
 * - error: unknown | null
 * - connections: Connections | null
 *
 * Those will be loaded. Internally a state is used. On error, error is set instead.
 */
export function useConnections(api: SyncthingApi, refreshToken?: any): [boolean, unknown| null, StConnections | null] {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown | null>(null);
    const [connections, setConnections] = useState<StConnections | null>(null);

    useEffect(() => {
        const loadConnections = async () => {
            setLoading(true);
            try {
                setConnections(await api.connections());
            } catch (error) {
                setError(error);
            }
            setLoading(false);
        };
        loadConnections();
    }, [api, refreshToken]);

    return [loading, error, connections];
}

/**
 * Returns:
 * - loading: boolean
 * - error: unknown | null
 * - deviceCompletions: Record<string, StCompletion> | null
 *
 * Those will be loaded. Internally a state is used. On error, error is set instead.
 * Will not do anything as long as folders is null.
 */
export function useDeviceCompletions(api: SyncthingApi, folders: Folders | null, forDevice: string, refreshToken?: any): [boolean, unknown| null, DeviceCompletion | null] {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown | null>(null);
    const [deviceConnections, setDeviceConnections] = useState<DeviceCompletion | null>(null);

    async function _doCollect(connections: Record<string, StCompletion>, deviceName: string, folderName: string): Promise<void> {
        connections[folderName] = await api.completionDevice(deviceName, folderName);
    }

    useEffect(() => {
        const loadConnections = async () => {
            if (folders != null) {
                setLoading(true);
                try {
                    const connections = {};
                    const promises = [];
                    for (const folderId of Object.keys(folders)) {
                        const folder = folders[folderId];
                        if (folder.devices) {
                            for (const oDevice of folder.devices) {
                                if (oDevice.deviceID == forDevice) {
                                    promises.push(_doCollect(connections, forDevice, folderId));
                                    break;
                                }
                            }
                        }
                    }
                    await Promise.all(promises);
                    setDeviceConnections(recalcDeviceCompletions(connections));
                } catch (error) {
                    setError(error);
                }
                setLoading(false);
            }
        };
        loadConnections();
    }, [api, refreshToken, folders]);

    return [loading, error, deviceConnections];
}

const buildDevices = (configDevices: StConfigDevice[], statsDevices: Record<string, StStatsDevice>, justThisId?: string): Devices => {
    const out = {};
    for (const config of configDevices) {
        if (config.deviceID != undefined && (!justThisId || justThisId == config.deviceID)) {
            const stats = statsDevices[config.deviceID] ?? {};
            out[config.deviceID] = {...config, ...stats}
        }
    }
    return out;
}

const buildFolders = async (api: SyncthingApi, configFolders: StConfigFolder[], statsFolders: Record<string, StStatsFolder>, justThisId?: string): Promise<Folders> => {
    const out = {};
    const promisesStatus: Promise<[string, StDbStatus]>[] = [];
    for (const config of configFolders) {
        if (config.id != undefined && (!justThisId || justThisId == config.id)) {
            (() => {
                const id = config.id;
                promisesStatus.push(api.dbStatus(id).then(result => [id, result]));
            })();
        }
    }
    const resultStatuses = (await Promise.all(promisesStatus));
    const statuses = resultStatuses.reduce((acc, [id, status]) => {
        acc[id] = status;
        return acc;
    }, {});
    for (const config of configFolders) {
        if (config.id != undefined && (!justThisId || justThisId == config.id)) {
            const stats = statsFolders[config.id] ?? {};
            const status = statuses[config.id] ?? {};
            out[config.id] = {...config, ...stats, ...status}
        }
    }
    return out;
}
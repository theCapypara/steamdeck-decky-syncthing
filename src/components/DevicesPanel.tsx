import {FC, ReactNode, useEffect, useState} from "react";
import {StConfigDevice, StStatsDevice, SyncthingApi} from "../api/SyncthingApi";
import {SyncthingEntity} from "./SyncthingEntity";
import {Loader} from "./Loader";
import {PanelErrorContent} from "./PanelErrorContent";
import {PanelSectionRow} from "decky-frontend-lib";
import {Identicon} from "./Identicon";
import {FaPause} from "react-icons/fa";

interface DevicesPanelProps {
    api: SyncthingApi;
}

type Device = StConfigDevice & StStatsDevice;
type Devices = Record<string, Device>;

export const DevicesPanel: FC<DevicesPanelProps> = ({api}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown | null>(null);
    const [myDevice, setMyDevice] = useState<string | null>(null);
    const [devices, setDevices] = useState<Devices | null>(null);

    useEffect(() => {
        const loadDevices = async () => {
            try {
                const [status, configDevices, statsDevices] = await Promise.all([api.status(), api.configDevices(), api.statsDevices()]);
                setMyDevice(status.myID ?? null);
                setDevices(buildDevices(configDevices, statsDevices));
            } catch (error) {
                setError(error);
            }
            setLoading(false);
        };
        loadDevices();
    }, [api]);

    if (loading) {
        return (<PanelSectionRow><Loader/></PanelSectionRow>);
    }

    if (error) {
        return (<PanelSectionRow><PanelErrorContent error={error}/></PanelSectionRow>);
    }

    const remoteDevices: ReactNode[] = [];
    for (const device of devices ? Object.values(devices) : []) {
        if (device.deviceID != null && device.deviceID != myDevice) {
            remoteDevices.push(<SyncthingEntity primaryIcon={<Identicon ident={device.deviceID}/>}
                                                secondaryIcon={makeSecondaryIcon(device)}
                                                label={device.name ?? device.deviceID}/>);
        }
    }

    return (
        <PanelSectionRow>
            <div className="syncthing-entity-list">
                {myDevice && devices && devices[myDevice] && (
                    <SyncthingEntity primaryIcon={<Identicon ident={myDevice}/>}
                                     secondaryIcon={makeSecondaryIcon(devices[myDevice])}
                                     label={devices[myDevice].name ?? myDevice}/>
                )}
                {remoteDevices}
            </div>
        </PanelSectionRow>
    );
}

const buildDevices = (configDevices: StConfigDevice[], statsDevices: Record<string, StStatsDevice>): Devices => {
    const out = {};
    for (const config of configDevices) {
        if (config.deviceID != undefined) {
            const stats = statsDevices[config.deviceID] ?? {};
            out[config.deviceID] = {...config, ...stats}
        }
    }
    return out;
}

const makeSecondaryIcon = (device: Device): ReactNode => {
    if (device.paused) {
        return (<FaPause />);
    }
    return (<>{device.paused}</>);
}

import {FC, ReactNode} from "react";
import {Device, SyncthingApi} from "../api/SyncthingApi";
import {SyncthingEntity} from "./SyncthingEntity";
import {Loader} from "./Loader";
import {PanelErrorContent} from "./PanelErrorContent";
import {PanelSectionRow, showModal} from "decky-frontend-lib";
import {Identicon} from "./Identicon";
import {FaPause} from "react-icons/fa";
import {DeviceDetailsModal} from "./detail/DeviceDetailsModal";
import {ThisDeviceDetailsModal} from "./detail/ThisDeviceDetailsModal";
import {useDevices} from "../api/SyncthingReactHooks";

interface DevicesPanelProps {
    api: SyncthingApi;
}

export const DevicesPanel: FC<DevicesPanelProps> = ({api}) => {
    const [loading, error, myDevice, devices] = useDevices(api);

    if (loading) {
        return (<PanelSectionRow><Loader/></PanelSectionRow>);
    }

    if (error) {
        return (<PanelSectionRow><PanelErrorContent error={error}/></PanelSectionRow>);
    }

    const deviceNames = {};
    for (const device of devices ? Object.values(devices) : []) {
        if (device.name) {
            deviceNames[device.deviceID!] = device.name;
        }
    }

    const remoteDevices: ReactNode[] = [];
    for (const device of devices ? Object.values(devices) : []) {
        if (device.deviceID != null && device.deviceID != myDevice) {
            remoteDevices.push(<SyncthingEntity primaryIcon={<Identicon ident={device.deviceID}/>}
                                                secondaryIcon={makeSecondaryIcon(device)}
                                                label={device.name ?? device.deviceID}
                                                onClick={() => showModal(<DeviceDetailsModal api={api} id={device.deviceID as string} deviceNames={deviceNames}/>)}/>);
        }
    }

    return (
        <PanelSectionRow>
            <div className="syncthing-entity-list">
                {myDevice && devices && devices[myDevice] && (
                    <SyncthingEntity primaryIcon={<Identicon ident={myDevice}/>}
                                     secondaryIcon={makeSecondaryIcon(devices[myDevice])}
                                     label={devices[myDevice].name ?? myDevice}
                                     onClick={() => showModal(<ThisDeviceDetailsModal id={myDevice} api={api}/>)}/>
                )}
                {remoteDevices}
            </div>
        </PanelSectionRow>
    );
}

const makeSecondaryIcon = (device: Device): ReactNode => {
    if (device.paused) {
        return (<FaPause />);
    }
    return (<>{device.paused}</>);
}

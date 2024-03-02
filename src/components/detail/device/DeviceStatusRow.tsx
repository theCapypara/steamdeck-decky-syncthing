import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device, DeviceCompletion, DeviceStatus, deviceStatus, Folders, StConnections} from "../../../api/SyncthingApi";
import {DeviceStatusIcon} from "../../DeviceStatusIcon";

export interface DeviceStatusRowProps {
    device: Device;
    folders: Folders;
    connections: StConnections;
    completions: DeviceCompletion;
}

export const DeviceStatusRow: FC<DeviceStatusRowProps> = ({device, folders, connections, completions}) => {
    const status = deviceStatus(device, folders, connections, completions);

    let deviceStatusText;
    switch (status) {
        case DeviceStatus.Disconnected:
            deviceStatusText = "Disconnected";
            break;
        case DeviceStatus.DisconnectedInactive:
            deviceStatusText = "Disconnected (Inactive)";
            break;
        case DeviceStatus.InSync:
            deviceStatusText = "Up to Date";
            break;
        case DeviceStatus.Paused:
            deviceStatusText = "Paused";
            break;
        case DeviceStatus.Syncing:
            deviceStatusText = "Syncing";
            break;
        case DeviceStatus.Unused:
            deviceStatusText = "Unused";
            break;
        default:
            deviceStatusText = "Unknown";
            break;
    }

    return (
        <Field focusable={true} label="Device Status" icon={
            <DeviceStatusIcon deviceStatus={status}/>
        }>
            {deviceStatusText}
        </Field>
    )
}

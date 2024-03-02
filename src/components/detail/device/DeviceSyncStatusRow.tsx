import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device, DeviceCompletion, Folders, getDeviceFolders, StConnections} from "../../../api/SyncthingApi";
import {FaCloud} from "react-icons/fa";

export interface DeviceSyncStatusRowProps {
    device: Device;
    folders: Folders;
    connections: StConnections;
    completions: DeviceCompletion;
}

export const DeviceSyncStatusRow: FC<DeviceSyncStatusRowProps> = ({device, folders, connections, completions}) => {
    const deviceFolders = getDeviceFolders(device, folders);
    if (connections.connections?.[device.deviceID!].connected || deviceFolders.length == 0) {
        return <></>;
    }

    let body;

    if (completions.total == 100) {
        body = "Up to Date";
    } else {
        body = `Out of Sync (${completions.total} %)`
    }

    return (
        <Field focusable={true} label="Sync Status" icon={<FaCloud/>}>
            {body}
        </Field>
    )
}

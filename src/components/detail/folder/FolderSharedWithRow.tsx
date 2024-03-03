import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Devices,
    Folder
} from "../../../api/SyncthingApi";
import {FaShareAlt} from "react-icons/fa";

export interface FolderSharedWithRowProps {
    folder: Folder;
    devices: Devices;
    myDevice: string;
}

export const FolderSharedWithRow: FC<FolderSharedWithRowProps> = ({folder, myDevice, devices}) => {
    let deviceNames = "";
    for (const dev of folder.devices ?? []) {
        if (dev.deviceID && devices[dev.deviceID] && dev.deviceID != myDevice) {
            let devObj = devices[dev.deviceID];
            if (devObj.name) {
                deviceNames += `${devObj.name}, `;
            } else {
                deviceNames += `${dev.deviceID}, `;
            }
        }
    }

    if (deviceNames.endsWith(", ")) {
        deviceNames = deviceNames.substring(0, deviceNames.length - 2);
    }

    return (
        <Field focusable={true} label="Shared With" icon={<FaShareAlt/>}>
            {deviceNames}
        </Field>
    );
}

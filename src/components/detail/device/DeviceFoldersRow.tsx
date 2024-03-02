import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device, Folders, getDeviceFolders} from "../../../api/SyncthingApi";
import {FaFolder} from "react-icons/fa";

export interface DeviceFoldersRowProps {
    device: Device;
    folders: Folders;
}

export const DeviceFoldersRow: FC<DeviceFoldersRowProps> = ({device, folders}) => {
    const deviceFolders = getDeviceFolders(device, folders);
    if (deviceFolders.length == 0) {
        return <></>;
    }

    let folderNames = "";
    for (const fold of deviceFolders) {
        if (fold.label) {
            folderNames += `${fold.label}, `;
        } else {
            folderNames += `${fold.id}, `;
        }
    }

    if (folderNames.endsWith(", ")) {
        folderNames = folderNames.substring(0, folderNames.length - 2);
    }

    return (
        <Field focusable={true} label="Folders" icon={<FaFolder/>}>
            {folderNames}
        </Field>
    )
}

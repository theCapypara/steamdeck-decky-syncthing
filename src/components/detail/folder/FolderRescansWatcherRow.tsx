import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder, FolderStatus, folderStatus
} from "../../../api/SyncthingApi";
import {FaEye} from "react-icons/fa";

export interface FolderRescansWatcherRowProps {
    folder: Folder;
}

export const FolderRescansWatcherRow: FC<FolderRescansWatcherRowProps> = ({folder}) => {
    const status = folderStatus(folder);

    let body;

    if (!folder.fsWatcherEnabled) {
        body = "Disabled";
    } else if (!folder.watchError || folder.paused || status === FolderStatus.Stopped) {
        body = "Enabled";
    } else {
        body = "Failed to setup, retrying";
    }

    return (
        <Field focusable={true} label="File Watcher" icon={<FaEye/>}>
            {body}
        </Field>
    );

}

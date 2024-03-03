import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    FolderStatus,
    folderStatus,
    Folder
} from "../../../api/SyncthingApi";
import {FolderStatusIcon} from "../../FolderStatusIcon";

export interface FolderStatusRowProps {
    folder: Folder;
}

export const FolderStatusRow: FC<FolderStatusRowProps> = ({folder}) => {
    const status = folderStatus(folder);

    let folderStatusText;
    switch (status) {
        case FolderStatus.CleanWaiting:
            folderStatusText = "Waiting to Clean";
            break;
        case FolderStatus.Cleaning:
            folderStatusText = "Cleaning Versions";
            break;
        case FolderStatus.FailedItems:
            folderStatusText = "Failed Items";
            break;
        case FolderStatus.Idle:
            folderStatusText = "Up to Date";
            break;
        case FolderStatus.LocalAdditions:
            folderStatusText = "Local Additions";
            break;
        case FolderStatus.LocalUnencrypted:
            folderStatusText = "Unexpected Items";
            break;
        case FolderStatus.OutOfSync:
            folderStatusText = "Out of Sync";
            break;
        case FolderStatus.Paused:
            folderStatusText = "Paused";
            break;
        case FolderStatus.ScanWaiting:
            folderStatusText = "Waiting to Scan";
            break;
        case FolderStatus.Scanning:
            folderStatusText = "Scanning";
            break;
        case FolderStatus.Stopped:
            folderStatusText = "Stopped";
            break;
        case FolderStatus.SyncPreparing:
            folderStatusText = "Preparing to Sync";
            break;
        case FolderStatus.SyncWaiting:
            folderStatusText = "Waiting to Sync";
            break;
        case FolderStatus.Syncing:
            folderStatusText = "Syncing";
            break;
        case FolderStatus.Unshared:
            folderStatusText = "Unshared";
            break;
        case FolderStatus.Unknown:
        default:
            folderStatusText = "Unknown";
            break;
    }

    return (
        <Field focusable={true} label="Folder Status" icon={
            <FolderStatusIcon folderStatus={status}/>
        }>
            {folderStatusText}
        </Field>
    )
}

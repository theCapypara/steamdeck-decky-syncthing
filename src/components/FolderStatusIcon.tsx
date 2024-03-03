import {FC} from "react";
import {FolderStatus} from "../api/SyncthingApi";
import {
    FaCheckCircle,
    FaExclamationCircle,
    FaHourglassHalf,
    FaPauseCircle,
    FaQuestionCircle,
    FaRecycle,
    FaSearch,
    FaStopCircle,
    FaSync,
    FaUnlink
} from "react-icons/fa";

export interface FolderStatusIconProps {
    folderStatus: FolderStatus
}

export const FolderStatusIcon: FC<FolderStatusIconProps> = ({folderStatus}) => {
    switch (folderStatus) {
        case FolderStatus.CleanWaiting:
        case FolderStatus.SyncWaiting:
        case FolderStatus.SyncPreparing:
        case FolderStatus.ScanWaiting:
            return <FaHourglassHalf />;
        case FolderStatus.Cleaning:
            return <FaRecycle/>;
        case FolderStatus.FailedItems:
        case FolderStatus.LocalUnencrypted:
        case FolderStatus.OutOfSync:
            return <FaExclamationCircle/>;
        case FolderStatus.Idle:
        case FolderStatus.LocalAdditions:
            return <FaCheckCircle/>;
        case FolderStatus.Paused:
            return <FaPauseCircle/>;
        case FolderStatus.Scanning:
            return <FaSearch/>;
        case FolderStatus.Stopped:
            return <FaStopCircle/>;
        case FolderStatus.Syncing:
            return <FaSync/>;
        case FolderStatus.Unshared:
            return <FaUnlink/>;
        case FolderStatus.Unknown:
        default:
            return <FaQuestionCircle/>;
    }
}

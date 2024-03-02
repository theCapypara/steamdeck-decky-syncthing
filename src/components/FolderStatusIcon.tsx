import {FC} from "react";
import {Folder} from "../api/SyncthingApi";
import {
    FaCheckCircle,
    FaExclamationCircle,
    FaPauseCircle,
    FaQuestionCircle,
    FaSearch,
    FaStopCircle,
    FaSyncAlt
} from "react-icons/fa";

export interface FolderStatusIconProps {
    folder: Folder
}

export const FolderStatusIcon: FC<FolderStatusIconProps> = ({folder}) => {
    if (folder.paused) {
        return <FaPauseCircle />;
    }
    if (folder.state == "scanning") {
        return <FaSearch />;
    }
    if (folder.state == "syncing") {
        return <FaSyncAlt />;
    }
    if (folder.state == "error") {
        return <FaStopCircle />;
    }
    if ((folder.errors != null && folder.errors > 0) || (folder.pullErrors != null && folder.pullErrors > 0)) {
        return <FaExclamationCircle />;
    }
    if (folder.state == "idle") {
        return <FaCheckCircle />;
    }
    // unknown
    return <FaQuestionCircle />;
}

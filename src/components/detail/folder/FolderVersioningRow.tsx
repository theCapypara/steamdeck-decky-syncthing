import {FC, ReactNode} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaCalendar, FaCog, FaFile, FaFileArchive, FaFolderOpen, FaRecycle} from "react-icons/fa";
import {durationUnit} from "../../../util";

export interface FolderVersioningRowProps {
    folder: Folder;
}

export const FolderVersioningRow: FC<FolderVersioningRowProps> = ({folder}) => {
    if (folder.versioning?.type) {
        let versioningType = "Unknown";
        let details: ReactNode[] = [""];
        switch (folder.versioning.type) {
            case "simple":
                versioningType = "Simple";
                details = [
                    <span style={{paddingRight: "8px"}}>
                        <FaFileArchive/> {folder.versioning.params?.keep}
                    </span>
                ];
                // fall through:
            case "thrashcan":
                versioningType = "Trash Can";
                let trashCan = "Disabled";
                if (folder.versioning.params?.cleanoutDays != 0) {
                    trashCan = durationUnit((folder.versioning.params?.cleanoutDays ?? 0) * 86400)
                }
                details = [
                    <span style={{paddingRight: "8px"}}>
                        <FaCalendar/> {trashCan}
                    </span>
                ];
                break;
            case "staggered":
                versioningType = "Staggered";
                let staggered = "Forever";
                if (folder.versioning.params?.maxAge != 0) {
                    staggered = durationUnit(folder.versioning.params.maxAge ?? 0)
                }
                details = [
                    <span style={{paddingRight: "8px"}}>
                        <FaCalendar/> {staggered}
                    </span>
                ];
                break;
            case "external":
                versioningType = "External";
                details = [
                    <span style={{paddingRight: "8px"}}>
                        <FaCog/> {folder.versioning.params?.command}
                    </span>
                ];
                break;
        }

        if (versioningType != "external") {
            let cleanupInterval = "Disabled";
            if (folder.versioning.cleanupIntervalS != 0) {
                cleanupInterval = durationUnit(folder.versioning.cleanupIntervalS ?? 0)
            }
            details.push(
                <span style={{paddingRight: "8px"}}>
                    <FaRecycle/> {cleanupInterval}
                </span>
            );
            details.push(
                <span>
                    <FaFolderOpen/> {folder.versioning.fsPath === '' ? '.stversions' : folder.versioning.fsPath}
                </span>
            );
        }

        return (
            <Field focusable={true} label="File Versioning" icon={<FaFile/>}>
                <span style={{paddingRight: "8px"}}>{versioningType}</span>
                {details}
            </Field>
        );
    }
    return <></>;
}

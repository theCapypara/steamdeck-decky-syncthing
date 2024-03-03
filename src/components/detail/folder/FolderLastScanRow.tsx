import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaClock} from "react-icons/fa";
import {formatDate} from "../../../formatDate";

export interface FolderLastScanRowProps {
    folder: Folder;
}

export const FolderLastScanRow: FC<FolderLastScanRowProps> = ({folder}) => {
    if (folder.lastScan) {
        let body = "Never";

        const lastScan = new Date(folder.lastScan);
        const lastScanDays = (new Date().valueOf() - lastScan.valueOf()) / 1000 / 86400;

        if (lastScanDays < 365) {
            body = formatDate(lastScan);
        }

        return (
            <Field focusable={true} label="Last Scan" icon={<FaClock/>}>
                {body}
            </Field>
        );
    }
    return <></>;
}

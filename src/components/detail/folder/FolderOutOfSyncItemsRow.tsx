import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaCloudDownloadAlt} from "react-icons/fa";
import {byteUnit} from "../../../util";

export interface FolderOutOfSyncItemsRowProps {
    folder: Folder;
}

export const FolderOutOfSyncItemsRow: FC<FolderOutOfSyncItemsRowProps> = ({folder}) => {
    if ((folder.needTotalItems ?? 0) > 0) {
        return (
            <Field focusable={true} label="Out of Sync Items" icon={<FaCloudDownloadAlt/>}>
                {folder.needTotalItems} items, ~{byteUnit(folder.needBytes ?? 0)}
            </Field>
        );
    }
    return <></>;
}

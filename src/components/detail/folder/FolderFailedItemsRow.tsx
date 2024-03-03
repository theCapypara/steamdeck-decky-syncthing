import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaExclamationCircle} from "react-icons/fa";

export interface FolderFailedItemsRowProps {
    folder: Folder;
}

export const FolderFailedItemsRow: FC<FolderFailedItemsRowProps> = ({folder}) => {
    if ((folder.errors ?? 0) > 0) {
        return (
            <Field focusable={true} label="Failed Items" icon={<FaExclamationCircle/>}>
                {folder.pullErrors} items
            </Field>
        );
    }
    return <></>;
}

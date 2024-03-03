import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaExclamationCircle} from "react-icons/fa";
import {byteUnit} from "../../../util";

export interface FolderLocallyChangedItemsRowProps {
    folder: Folder;
}

export const FolderLocallyChangedItemsRow: FC<FolderLocallyChangedItemsRowProps> = ({folder}) => {
    let hasReceiveOnlyChanges = false;
    if (folder.type == "receiveonly" || folder.type == "receiveencrypted") {
        hasReceiveOnlyChanges = (folder.receiveOnlyTotalItems ?? 0) > 0;
    }

    if (hasReceiveOnlyChanges) {
        return (
            <Field focusable={true} label="Locally Changed Items" icon={<FaExclamationCircle/>}>
                {folder.receiveOnlyTotalItems} items, ~{byteUnit(folder.receiveOnlyChangedBytes ?? 0)}B
            </Field>
        );
    }
    return <></>;
}

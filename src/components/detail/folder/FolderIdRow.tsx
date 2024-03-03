import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaInfoCircle} from "react-icons/fa";

export interface FolderIdRowProps {
    folder: Folder;
}

export const FolderIdRow: FC<FolderIdRowProps> = ({folder}) => {
    if (folder.label != undefined && folder.label.length > 0) {
        return (
            <Field focusable={true} label="Folder ID" icon={<FaInfoCircle/>}>
                {folder.id}
            </Field>
        );
    }
    return <></>;
}

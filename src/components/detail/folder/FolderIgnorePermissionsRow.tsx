import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaMinusSquare} from "react-icons/fa";

export interface FolderIgnorePermissionsRowProps {
    folder: Folder;
}

export const FolderIgnorePermissionsRow: FC<FolderIgnorePermissionsRowProps> = ({folder}) => {
    if (folder.ignorePerms) {
        return (
            <Field focusable={true} label="Ignore Permissions" icon={<FaMinusSquare/>}>
                Yes
            </Field>
        );
    }
    return <></>;

}

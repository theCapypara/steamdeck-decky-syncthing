import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaExclamationTriangle} from "react-icons/fa";

export interface FolderErrorRowProps {
    folder: Folder;
}

export const FolderErrorRow: FC<FolderErrorRowProps> = ({folder}) => {
    if (!folder.paused && (folder.invalid || folder.error)) {
        return (
            <Field focusable={true} label="Error" icon={<FaExclamationTriangle/>}>
                {folder.invalid || folder.error}
            </Field>
        );
    }
    return <></>;

}

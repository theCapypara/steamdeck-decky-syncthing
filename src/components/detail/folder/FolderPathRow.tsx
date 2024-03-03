import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaFolderOpen} from "react-icons/fa";

export interface FolderPathRowProps {
    folder: Folder;
}

export const FolderPathRow: FC<FolderPathRowProps> = ({folder}) => {
    return (
        <Field focusable={true} label="Folder Path" icon={<FaFolderOpen/>}>
            {folder.path}
        </Field>
    )
}

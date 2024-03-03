import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Folder} from "../../../api/SyncthingApi";
import {FaGlobe} from "react-icons/fa";
import {FolderFileStats} from "../FolderFileStats";

export interface FolderGlobalStateRowProps {
    folder: Folder;
}

export const FolderGlobalStateRow: FC<FolderGlobalStateRowProps> = ({folder}) => {
    if (folder.paused) {
        return <></>;
    }

    return (
        <Field focusable={true} label="Global State" icon={<FaGlobe/>}>
            <FolderFileStats bytes={folder.globalBytes ?? 0} directories={folder.globalDirectories ?? 0} files={folder.globalFiles ?? 0}/>
        </Field>
    )
}

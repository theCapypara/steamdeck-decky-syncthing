import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Folders} from "../../../api/SyncthingApi";
import {FaHome} from "react-icons/fa";
import {FolderFileStats} from "../FolderFileStats";

export interface SelfLocalStateRowProps {
    folders: Folders;
}

export const SelfLocalStateRow: FC<SelfLocalStateRowProps> = ({folders}) => {
    let files = 0, directories = 0, bytes = 0;
    for (const folder of Object.values(folders)) {
        bytes += folder.localBytes ?? 0;
        files += folder.localFiles ?? 0;
        directories += folder.localDirectories ?? 0;
    }

    return (
        <Field focusable={true} label="Local State (Total)" icon={<FaHome/>}>
            <FolderFileStats bytes={bytes} directories={directories} files={files}/>
        </Field>
    )
}

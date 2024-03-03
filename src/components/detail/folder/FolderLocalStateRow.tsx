import {FC, ReactNode} from "react";
import {Field} from "decky-frontend-lib";
import {Folder} from "../../../api/SyncthingApi";
import {FaHome} from "react-icons/fa";
import {FolderFileStats} from "../FolderFileStats";

export interface FolderLocalStateRowProps {
    folder: Folder;
}

export const FolderLocalStateRow: FC<FolderLocalStateRowProps> = ({folder}) => {
    if (folder.paused) {
        return <></>;
    }

    let ignorePatternsText: ReactNode = "";
    let ignoreDelete: ReactNode = "";

    if (folder.ignorePatterns) {
        ignorePatternsText = (
            <span className={"syncthing-details"}>
                <br/>
                Reduced by ignore patterns.
            </span>
        );
    }

    if (folder.ignoreDelete) {
        ignoreDelete = (
            <span className={"syncthing-details"}>
                <br/>
                Altered by ignoring deletes.
            </span>
        );
    }

    return (
        <Field focusable={true} label="Local State" icon={<FaHome/>}>
            <FolderFileStats bytes={folder.localBytes ?? 0} directories={folder.localDirectories ?? 0} files={folder.localFiles ?? 0}/>
            {ignorePatternsText}
            {ignoreDelete}
        </Field>
    )
}

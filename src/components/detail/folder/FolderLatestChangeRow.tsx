import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaExchangeAlt} from "react-icons/fa";
import {formatDate} from "../../../formatDate";

export interface FolderLatestChangeRowProps {
    folder: Folder;
}

export const FolderLatestChangeRow: FC<FolderLatestChangeRowProps> = ({folder}) => {
    let body;

    if (folder.lastFile?.filename == undefined || folder.lastFile?.at == undefined) {
        return <></>;
    }

    if (folder.lastFile?.deleted) {
        body = `Updated ${basename(folder.lastFile?.filename!)} (at ${formatDate(new Date(folder.lastFile?.at!))})`;
    } else {
        body = `Deleted ${basename(folder.lastFile?.filename!)} (at ${formatDate(new Date(folder.lastFile?.at!))})`;
    }

    return (
        <Field focusable={true} label="Latest Change" icon={<FaExchangeAlt/>}>
            {body}
        </Field>
    );
}

function basename(path: string): string {
   return path.split('/').reverse()[0];
}
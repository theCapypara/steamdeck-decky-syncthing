import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaFolder} from "react-icons/fa";

export interface FolderTypeRowProps {
    folder: Folder;
}

export const FolderTypeRow: FC<FolderTypeRowProps> = ({folder}) => {
    let folderType = folder.type ?? "Unknown";

    switch (folder.type) {
        case "sendreceive":
            folderType = "Send & Receive";
            break;
        case "sendonly":
            folderType = "Send Only";
            break;
        case "receiveonly":
            folderType = "Receive Only";
            break;
        case "receiveencrypted":
            folderType = "Receive Encrypted";
            break;
    }

    return (
        <Field focusable={true} label="Folder Type" icon={<FaFolder/>}>
            {folderType}
        </Field>
    );

}

import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaSort} from "react-icons/fa";

export interface FolderFilePullOrderRowProps {
    folder: Folder;
}

export const FolderFilePullOrderRow: FC<FolderFilePullOrderRowProps> = ({folder}) => {
    if (folder.type != 'sendonly') {
        let pullOrder = "Random";

        switch (folder.order) {
            case "alphabetic":
                pullOrder = "Alphabetic";
                break;
            case "smallestFirst":
                pullOrder = "Smallest First";
                break;
            case "largestFirst":
                pullOrder = "Largest First";
                break;
            case "oldestFirst":
                pullOrder = "Oldest First";
                break;
            case "newestFirst":
                pullOrder = "Newest First";
                break;
        }

        return (
            <Field focusable={true} label="File Pull Order" icon={<FaSort/>}>
                {pullOrder}
            </Field>
        );
    }
    return <></>;
}

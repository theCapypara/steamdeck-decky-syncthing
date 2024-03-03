import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {
    Folder
} from "../../../api/SyncthingApi";
import {FaClock} from "react-icons/fa";
import {durationUnit} from "../../../util";

export interface FolderRescansPeriodicRowProps {
    folder: Folder;
}

export const FolderRescansPeriodicRow: FC<FolderRescansPeriodicRowProps> = ({folder}) => {
    let body = "Disabled";

    if ((folder.rescanIntervalS ?? 0) > 0) {
        body = durationUnit(folder.rescanIntervalS ?? 0);
    }

    return (
        <Field focusable={true} label="Periodic Rescans" icon={<FaClock/>}>
            {body}
        </Field>
    );

}

import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device} from "../../../api/SyncthingApi";
import {FaLevelDownAlt} from "react-icons/fa";

export interface DeviceAutoAcceptRowProps {
    device: Device;
}

export const DeviceAutoAcceptRow: FC<DeviceAutoAcceptRowProps> = ({device}) => {
    if (!device.autoAcceptFolders) {
        return <></>;
    }

    return (
        <Field focusable={true} label="Auto Accept" icon={<FaLevelDownAlt/>}>
            Yes
        </Field>
    )
}

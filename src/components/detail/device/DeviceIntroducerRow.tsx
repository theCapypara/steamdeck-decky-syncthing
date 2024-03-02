import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device} from "../../../api/SyncthingApi";
import {FaThumbsUp} from "react-icons/fa";

export interface DeviceIntroducerRowProps {
    device: Device;
}

export const DeviceIntroducerRow: FC<DeviceIntroducerRowProps> = ({device}) => {
    if (!device.introducer) {
        return <></>;
    }

    return (
        <Field focusable={true} label="Introducer" icon={<FaThumbsUp/>}>
            Yes
        </Field>
    )
}

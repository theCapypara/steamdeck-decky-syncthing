import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device} from "../../../api/SyncthingApi";
import {FaUserSecret} from "react-icons/fa";

export interface DeviceUntrustedRowProps {
    device: Device;
}

export const DeviceUntrustedRow: FC<DeviceUntrustedRowProps> = ({device}) => {
    if (!device.untrusted) {
        return <></>;
    }

    return (
        <Field focusable={true} label="Untrusted" icon={<FaUserSecret/>}>
            Yes
        </Field>
    )
}

import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device} from "../../../api/SyncthingApi";
import {FaQrcode} from "react-icons/fa";

export interface DeviceIdentificationRowProps {
    device: Device;
}

export const DeviceIdentificationRow: FC<DeviceIdentificationRowProps> = ({device}) => {
    return (
        <Field focusable={true} label="Identification" icon={<FaQrcode/>}>
            {device.deviceID}
        </Field>
    )
}

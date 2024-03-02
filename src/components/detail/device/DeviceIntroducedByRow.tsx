import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device} from "../../../api/SyncthingApi";
import {FaHandshake} from "react-icons/fa";

export interface DeviceIntroducedByRowProps {
    device: Device;
    deviceNames: Record<string, string>;
}

export const DeviceIntroducedByRow: FC<DeviceIntroducedByRowProps> = ({device, deviceNames}) => {
    if (!device.introducedBy) {
        return <></>;
    }

    return (
        <Field focusable={true} label="Introduced By" icon={<FaHandshake/>}>
            {deviceNames[device.introducedBy] ?? device.introducedBy}
        </Field>
    )
}

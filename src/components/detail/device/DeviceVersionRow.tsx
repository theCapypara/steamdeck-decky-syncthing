import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device, StConnections} from "../../../api/SyncthingApi";
import {FaTag} from "react-icons/fa";

export interface DeviceVersionRowProps {
    device: Device;
    connections: StConnections;
}

export const DeviceVersionRow: FC<DeviceVersionRowProps> = ({device, connections}) => {
    if (!connections.connections?.[device.deviceID!].clientVersion) {
        return <></>;
    }

    return (
        <Field focusable={true} label="Version" icon={<FaTag/>}>
            {connections.connections?.[device.deviceID!].clientVersion}
        </Field>
    )
}

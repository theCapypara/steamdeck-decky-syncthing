import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {Device, StConnections} from "../../../api/SyncthingApi";
import {FaEye} from "react-icons/fa";
import {formatDate} from "../../../formatDate";

export interface DeviceLastSeenProps {
    device: Device;
    connections: StConnections;
}

export const DeviceLastSeenRow: FC<DeviceLastSeenProps> = ({device, connections}) => {
    if (connections.connections?.[device.deviceID!].connected) {
        return <></>;
    }

    let body;

    if (device.lastSeen == null || device.lastSeen.startsWith("1970-")) {
        body = "Never";
    } else {
        body = formatDate(new Date(device.lastSeen!));
    }

    return (
        <Field focusable={true} label="Last Seen" icon={<FaEye/>}>
            {body}
        </Field>
    )
}

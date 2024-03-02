import {FC, ReactNode} from "react";
import {Field} from "decky-frontend-lib";
import {Device, StConnections} from "../../../api/SyncthingApi";
import {FaCloudUploadAlt} from "react-icons/fa";
import {byteUnit} from "../../../byteUnit";

export interface DeviceUploadRateRowProps {
    device: Device;
    connections: StConnections;
}

export const DeviceUploadRateRow: FC<DeviceUploadRateRowProps> = ({device, connections}) => {
    if (!connections.connections?.[device.deviceID!].connected) {
        return <></>;
    }

    let limit: ReactNode = "";

    if (device.maxSendKbps! > 0) {
        limit = (
            <span className={"syncthing-details"}>
                Limit: {byteUnit((device.maxSendKbps ?? 0) * 1024)}/s
            </span>
        );
    }

    return (
        <Field focusable={true} label="Upload Rate" icon={<FaCloudUploadAlt/>}>
            {byteUnit(connections.connections?.[device.deviceID!]?._outBps)}/s
            ({byteUnit(connections.connections?.[device.deviceID!]?.outBytesTotal ?? 0)})
            {limit}
        </Field>
    )
}

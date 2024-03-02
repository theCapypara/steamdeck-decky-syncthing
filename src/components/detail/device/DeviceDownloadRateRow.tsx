import {FC, ReactNode} from "react";
import {Field} from "decky-frontend-lib";
import {Device, StConnections} from "../../../api/SyncthingApi";
import {FaCloudDownloadAlt} from "react-icons/fa";
import {byteUnit} from "../../../byteUnit";

export interface DeviceDownloadRateRowProps {
    device: Device;
    connections: StConnections;
}

export const DeviceDownloadRateRow: FC<DeviceDownloadRateRowProps> = ({device, connections}) => {
    if (!connections.connections?.[device.deviceID!].connected) {
        return <></>;
    }

    let limit: ReactNode = "";

    if (device.maxRecvKbps! > 0) {
        limit = (
            <span className={"syncthing-details"}>
                Limit: {byteUnit((device.maxRecvKbps ?? 0) * 1024)}/s
            </span>
        );
    }

    return (
        <Field focusable={true} label="Download Rate" icon={<FaCloudDownloadAlt/>}>
            {byteUnit(connections.connections?.[device.deviceID!]?._inBps)}/s
            ({byteUnit(connections.connections?.[device.deviceID!]?.inBytesTotal ?? 0)})
            {limit}
        </Field>
    )
}

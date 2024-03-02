import {FC, ReactNode} from "react";
import {Field} from "decky-frontend-lib";
import {StConfigOptions, StConnections} from "../../../api/SyncthingApi";
import {FaCloudUploadAlt} from "react-icons/fa";
import {byteUnit} from "../../../byteUnit";

export interface SelfUploadRateRowProps {
    connections: StConnections;
    options: StConfigOptions;
}

export const SelfUploadRateRow: FC<SelfUploadRateRowProps> = ({connections, options}) => {
    let limit: ReactNode = "";

    if (options.maxSendKbps) {
        let lan: ReactNode = "";
        if (options.limitBandwidthInLan) {
            lan = "(Applied to LAN)";
        }
        limit = (
            <span className={"syncthing-details"}>
                Limit: {byteUnit((options.maxSendKbps ?? 0) * 1024)}/s {lan}
            </span>
        );
    }

    return (
        <Field focusable={true} label="Upload Rate" icon={<FaCloudUploadAlt/>}>
            {byteUnit(connections.total?._outBps ?? 0)}/s
            ({byteUnit(connections.total?.outBytesTotal ?? 0)})
            {limit}
        </Field>
    )
}

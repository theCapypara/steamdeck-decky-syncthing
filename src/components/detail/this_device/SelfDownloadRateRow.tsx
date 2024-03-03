import {FC, ReactNode} from "react";
import {Field} from "decky-frontend-lib";
import {StConfigOptions, StConnections} from "../../../api/SyncthingApi";
import {FaCloudDownloadAlt} from "react-icons/fa";
import {byteUnit} from "../../../util";

export interface SelfDownloadRateRowProps {
    connections: StConnections;
    options: StConfigOptions;
}

export const SelfDownloadRateRow: FC<SelfDownloadRateRowProps> = ({connections, options}) => {
    let limit: ReactNode = "";

    if (options.maxRecvKbps) {
        let lan: ReactNode = "";
        if (options.limitBandwidthInLan) {
            lan = "(Applied to LAN)";
        }
        limit = (
            <span className={"syncthing-details"}>
                Limit: {byteUnit((options.maxRecvKbps ?? 0) * 1024)}/s {lan}
            </span>
        );
    }

    return (
        <Field focusable={true} label="Download Rate" icon={<FaCloudDownloadAlt/>}>
            {byteUnit(connections.total?._inBps ?? 0)}/s
            ({byteUnit(connections.total?.inBytesTotal ?? 0)})
            {limit}
        </Field>
    )
}

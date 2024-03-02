import {FC} from "react";
import {DeviceStatus} from "../api/SyncthingApi";
import {FaCheckCircle, FaPauseCircle, FaPowerOff, FaQuestionCircle, FaSync, FaUnlink} from "react-icons/fa";

export interface DeviceStatusIconProps {
    deviceStatus: DeviceStatus
}

export const DeviceStatusIcon: FC<DeviceStatusIconProps> = ({deviceStatus}) => {
    switch (deviceStatus) {
        case DeviceStatus.Disconnected:
        case DeviceStatus.DisconnectedInactive:
            return <FaPowerOff />;
        case DeviceStatus.InSync:
            return <FaCheckCircle />;
        case DeviceStatus.Paused:
            return <FaPauseCircle />;
        case DeviceStatus.Syncing:
            return <FaSync />;
        case DeviceStatus.Unused:
            return <FaUnlink />;
        default:
            return <FaQuestionCircle />;
    }
}

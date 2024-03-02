import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {StStatus} from "../../../api/SyncthingApi";
import {FaClock} from "react-icons/fa";

export interface SelfUptimeRowProps {
    status: StStatus;
}

export const SelfUptimeRow: FC<SelfUptimeRowProps> = ({status}) => {
    return (
        <Field focusable={true} label="Uptime" icon={<FaClock/>}>
            {Math.floor((status.uptime ?? 0) / 60)}m
        </Field>
    )
}

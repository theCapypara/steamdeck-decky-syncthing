import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {StStatus} from "../../../api/SyncthingApi";
import {FaSitemap} from "react-icons/fa";

export interface SelfListenersRowProps {
    status: StStatus;
}

export const SelfListenersRow: FC<SelfListenersRowProps> = ({status}) => {
    const listenersTotal = Object.keys(status.connectionServiceStatus ?? {}).length;
    let listenersFailed = 0;
    for (const ls of Object.values(status.connectionServiceStatus ?? {})) {
        if (ls.error) {
            listenersFailed++;
        }
    }

    return (
        <Field focusable={true} label="Listeners" icon={<FaSitemap/>}>
            {listenersTotal-listenersFailed}/{listenersTotal}
        </Field>
    )
}

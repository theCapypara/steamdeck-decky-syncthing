import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {DeviceCompletion} from "../../../api/SyncthingApi";
import {FaExchangeAlt} from "react-icons/fa";
import {byteUnit} from "../../../byteUnit";

export interface DeviceOutOfSyncItemsRowProps {
    completions: DeviceCompletion;
}

export const DeviceOutOfSyncItemsRow: FC<DeviceOutOfSyncItemsRowProps> = ({completions}) => {
    if (!completions.needItems) {
        return <></>;
    }

    return (
        <Field focusable={true} label="Out of Sync Items" icon={<FaExchangeAlt/>}>
            {completions.needItems} items, ~{byteUnit(completions.needBytes)}
        </Field>
    )
}

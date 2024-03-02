import {FC, useReducer} from "react";
import {SyncthingApi} from "../../api/SyncthingApi";
import {DetailsModal} from "./DetailModal";
import {useDevices} from "../../api/SyncthingReactHooks";

export interface ThisDeviceDetailsModalProps {
    api: SyncthingApi;
    id: string;
    closeModal?: () => {};
}


export const ThisDeviceDetailsModal: FC<ThisDeviceDetailsModalProps> = ({api, id, closeModal}) => {
    const [reloadToken, reload] = useReducer(x => x + 1, 0);
    const [loading, error, _, devices] = useDevices(api, id, reloadToken);
    const thisDevice = devices?.[id];

    return (
        <DetailsModal isLoading={loading} error={error} headingIcon={""} headingLabel={""} closeModal={closeModal} onReload={reload}>
            {JSON.stringify(thisDevice)}
        </DetailsModal>
    )
}

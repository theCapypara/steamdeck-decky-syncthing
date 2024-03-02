import {FC, useReducer} from "react";
import {SyncthingApi} from "../../api/SyncthingApi";
import {DetailsModal} from "./DetailModal";
import {useFolders} from "../../api/SyncthingReactHooks";

export interface FolderDetailsModalProps {
    api: SyncthingApi;
    id: string;
    closeModal?: () => {};
}

export const FolderDetailsModal: FC<FolderDetailsModalProps> = ({api, id, closeModal}) => {
    const [reloadToken, reload] = useReducer(x => x + 1, 0);
    const [loading, error, folders] = useFolders(api, id, reloadToken);
    const thisFolder = folders?.[id];

    return (
        <DetailsModal isLoading={loading} error={error} headingIcon={""} headingLabel={""} closeModal={closeModal} onReload={reload}>
            {JSON.stringify(thisFolder)}
        </DetailsModal>
    )
}

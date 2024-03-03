import {FC, useReducer} from "react";
import {SyncthingApi} from "../../api/SyncthingApi";
import {DetailsModal} from "./DetailModal";
import {useDevices, useFolders} from "../../api/SyncthingReactHooks";
import {FaFolderOpen} from "react-icons/fa";
import {FolderStatusRow} from "./folder/FolderStatusRow";
import {FolderIdRow} from "./folder/FolderIdRow";
import {FolderPathRow} from "./folder/FolderPathRow";
import {FolderErrorRow} from "./folder/FolderErrorRow";
import {FolderGlobalStateRow} from "./folder/FolderGlobalStateRow";
import {FolderLocalStateRow} from "./folder/FolderLocalStateRow";
import {FolderOutOfSyncItemsRow} from "./folder/FolderOutOfSyncItemsRow";
import {FolderFailedItemsRow} from "./folder/FolderFailedItemsRow";
import {FolderLocallyChangedItemsRow} from "./folder/FolderLocallyChangedItemsRow";
import {FolderTypeRow} from "./folder/FolderTypeRow";
import {FolderIgnorePermissionsRow} from "./folder/FolderIgnorePermissionsRow";
import {FolderRescansPeriodicRow} from "./folder/FolderRescansPeriodicRow";
import {FolderRescansWatcherRow} from "./folder/FolderRescansWatcherRow";
import {FolderFilePullOrderRow} from "./folder/FolderFilePullOrderRow";
import {FolderVersioningRow} from "./folder/FolderVersioningRow";
import {FolderSharedWithRow} from "./folder/FolderSharedWithRow";
import {FolderLastScanRow} from "./folder/FolderLastScanRow";
import {FolderLatestChangeRow} from "./folder/FolderLatestChangeRow";

export interface FolderDetailsModalProps {
    api: SyncthingApi;
    id: string;
    closeModal?: () => {};
}

export const FolderDetailsModal: FC<FolderDetailsModalProps> = ({api, id, closeModal}) => {
    const [reloadToken, reload] = useReducer(x => x + 1, 0);
    const [loadingFolders, errorFolders, folders] = useFolders(api, id, reloadToken);
    const [loadingDevices, errorDevices, myDevice, devices] = useDevices(api, reloadToken);
    const thisFolder = folders?.[id];

    return (
        <DetailsModal
            isLoading={loadingFolders || loadingDevices}
            error={errorFolders ?? errorDevices}
            headingIcon={<FaFolderOpen/>}
            headingLabel={thisFolder?.label ?? id}
            closeModal={closeModal}
            onReload={reload}
        >
            <FolderStatusRow folder={thisFolder!}/>
            <FolderIdRow folder={thisFolder!}/>
            <FolderPathRow folder={thisFolder!}/>
            <FolderErrorRow folder={thisFolder!}/>
            <FolderGlobalStateRow folder={thisFolder!}/>
            <FolderLocalStateRow folder={thisFolder!}/>
            <FolderOutOfSyncItemsRow folder={thisFolder!}/>
            <FolderFailedItemsRow folder={thisFolder!}/>
            <FolderLocallyChangedItemsRow folder={thisFolder!}/>
            <FolderTypeRow folder={thisFolder!}/>
            <FolderIgnorePermissionsRow folder={thisFolder!}/>
            <FolderRescansPeriodicRow folder={thisFolder!}/>
            <FolderRescansWatcherRow folder={thisFolder!}/>
            <FolderFilePullOrderRow folder={thisFolder!}/>
            <FolderVersioningRow folder={thisFolder!}/>
            <FolderSharedWithRow folder={thisFolder!} myDevice={myDevice!} devices={devices!}/>
            <FolderLastScanRow folder={thisFolder!}/>
            <FolderLatestChangeRow folder={thisFolder!}/>
        </DetailsModal>
    )
}


import {FC, useReducer} from "react";
import {SyncthingApi} from "../../api/SyncthingApi";
import {DetailsModal} from "./DetailModal";
import {useConnections, useDeviceCompletions, useDevices, useFolders} from "../../api/SyncthingReactHooks";
import {Identicon} from "../Identicon";
import {DeviceStatusRow} from "./device/DeviceStatusRow";
import {DeviceLastSeenRow} from "./device/DeviceLastSeenRow";
import {DeviceSyncStatusRow} from "./device/DeviceSyncStatusRow";
import {DeviceDownloadRateRow} from "./device/DeviceDownloadRateRow";
import {DeviceUploadRateRow} from "./device/DeviceUploadRateRow";
import {DeviceOutOfSyncItemsRow} from "./device/DeviceOutOfSyncItemsRow";
import {DeviceIntroducerRow} from "./device/DeviceIntroducerRow";
import {DeviceIntroducedByRow} from "./device/DeviceIntroducedByRow";
import {DeviceAutoAcceptRow} from "./device/DeviceAutoAcceptRow";
import {DeviceIdentificationRow} from "./device/DeviceIdentificationRow";
import {DeviceUntrustedRow} from "./device/DeviceUntrustedRow";
import {DeviceVersionRow} from "./device/DeviceVersionRow";
import {DeviceFoldersRow} from "./device/DeviceFoldersRow";

export interface DeviceDetailsModalProps {
    api: SyncthingApi;
    id: string;
    deviceNames: Record<string, string>;
    closeModal?: () => {};
}

export const DeviceDetailsModal: FC<DeviceDetailsModalProps> = ({api, id, closeModal, deviceNames}) => {
    const [reloadToken, reload] = useReducer(x => x + 1, 0);
    const [loadingDevices, errorDevices, _, devices] = useDevices(api, id, reloadToken);
    const [loadingFolders, errorFolders, folders] = useFolders(api, undefined, reloadToken);
    const [loadingConnections, errorConnections, connections] = useConnections(api, reloadToken);
    const [loadingDeviceCompletions, errorDeviceCompletions, deviceCompletions] = useDeviceCompletions(api, folders, id, reloadToken);
    const thisDevice = devices?.[id];

    const icon = <Identicon ident={id}/>;
    let label = id;
    if (thisDevice) {
        label = thisDevice.name ?? label;
    }

    return (
        <DetailsModal
            isLoading={loadingDevices || loadingFolders || loadingConnections || loadingDeviceCompletions}
            error={errorDevices ?? errorFolders ?? errorConnections ?? errorDeviceCompletions}
            headingIcon={icon}
            headingLabel={label}
            closeModal={closeModal}
            onReload={reload}
        >
            <DeviceStatusRow device={thisDevice!} folders={folders!} connections={connections!} completions={deviceCompletions!}/>
            <DeviceLastSeenRow device={thisDevice!} connections={connections!}/>
            <DeviceSyncStatusRow device={thisDevice!} folders={folders!} connections={connections!} completions={deviceCompletions!}/>
            <DeviceDownloadRateRow device={thisDevice!} connections={connections!}/>
            <DeviceUploadRateRow device={thisDevice!} connections={connections!}/>
            <DeviceOutOfSyncItemsRow completions={deviceCompletions!}/>
            <DeviceIntroducerRow device={thisDevice!}/>
            <DeviceIntroducedByRow device={thisDevice!} deviceNames={deviceNames}/>
            <DeviceAutoAcceptRow device={thisDevice!}/>
            <DeviceIdentificationRow device={thisDevice!}/>
            <DeviceUntrustedRow device={thisDevice!}/>
            <DeviceVersionRow device={thisDevice!} connections={connections!}/>
            <DeviceFoldersRow device={thisDevice!} folders={folders!}/>
        </DetailsModal>
    )
}

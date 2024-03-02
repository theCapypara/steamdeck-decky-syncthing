import {FC, useReducer} from "react";
import {SyncthingApi} from "../../api/SyncthingApi";
import {DetailsModal} from "./DetailModal";
import {
    useConfigOptions,
    useConnections,
    useDevices,
    useFolders, useStatus, useVersion
} from "../../api/SyncthingReactHooks";
import {Identicon} from "../Identicon";
import {SelfDownloadRateRow} from "./this_device/SelfDownloadRateRow";
import {SelfUploadRateRow} from "./this_device/SelfUploadRateRow";
import {SelfLocalStateRow} from "./this_device/SelfLocalStateRow";
import {SelfListenersRow} from "./this_device/SelfListenersRow";
import {SelfUptimeRow} from "./this_device/SelfUptimeRow";
import {DeviceIdentificationRow} from "./device/DeviceIdentificationRow";
import {SelfVersionRow} from "./this_device/SelfVersionRow";

export interface ThisDeviceDetailsModalProps {
    api: SyncthingApi;
    id: string;
    closeModal?: () => {};
}


export const ThisDeviceDetailsModal: FC<ThisDeviceDetailsModalProps> = ({api, id, closeModal}) => {
    const [reloadToken, reload] = useReducer(x => x + 1, 0);
    const [loadingDevices, errorDevices, _, devices] = useDevices(api, id, reloadToken);
    const [loadingFolders, errorFolders, folders] = useFolders(api, undefined, reloadToken);
    const [loadingConnections, errorConnections, connections] = useConnections(api, reloadToken);
    const [loadingOptions, errorOptions, options] = useConfigOptions(api, reloadToken);
    const [loadingStatus, errorStatus, status] = useStatus(api, reloadToken);
    const [loadingVersion, errorVersion, version] = useVersion(api, reloadToken);
    const thisDevice = devices?.[id];

    const icon = <Identicon ident={id}/>;
    let label = id;
    if (thisDevice) {
        label = thisDevice.name ?? label;
    }

    return (
        <DetailsModal
            isLoading={loadingDevices || loadingFolders || loadingConnections || loadingOptions || loadingStatus || loadingVersion}
            error={errorDevices ?? errorFolders ?? errorConnections ?? errorOptions ?? errorStatus ?? errorVersion}
            headingIcon={icon}
            headingLabel={label}
            closeModal={closeModal}
            onReload={reload}
        >
            <SelfDownloadRateRow connections={connections!} options={options!}/>
            <SelfUploadRateRow connections={connections!} options={options!}/>
            <SelfLocalStateRow folders={folders!}/>
            <SelfListenersRow status={status!}/>
            <SelfUptimeRow status={status!}/>
            <DeviceIdentificationRow device={thisDevice!}/>
            <SelfVersionRow version={version!}/>
        </DetailsModal>
    )
}

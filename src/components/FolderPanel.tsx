import {FC, ReactNode} from "react";
import {
    Folder,
    SyncthingApi
} from "../api/SyncthingApi";
import {PanelSectionRow, showModal} from "decky-frontend-lib";
import {Loader} from "./Loader";
import {PanelErrorContent} from "./PanelErrorContent";
import {SyncthingEntity} from "./SyncthingEntity";
import {FolderDetailsModal} from "./detail/FolderDetailsModal";
import {FolderStatusIcon} from "./FolderStatusIcon";
import {useFolders} from "../api/SyncthingReactHooks";

interface FolderPanelProps {
    api: SyncthingApi;
}

export const FolderPanel: FC<FolderPanelProps> = ({api}) => {
    const [loading, error, folders] = useFolders(api);

    if (loading) {
        return (<PanelSectionRow><Loader/></PanelSectionRow>);
    }

    if (error) {
        return (<PanelSectionRow><PanelErrorContent error={error}/></PanelSectionRow>);
    }

    const folderNodes: ReactNode[] = [];
    for (const folder of folders ? Object.values(folders) : []) {
        if (folder.id != null) {
            folderNodes.push(
                <SyncthingEntity primaryIcon={<FolderStatusIcon folder={folder}/>}
                                 label={makeFolderLabel(folder)}
                                 onClick={() => showModal(<FolderDetailsModal api={api} id={folder.id as string}/>)}/>
            );
        }
    }

    return (
        <PanelSectionRow>
            <div className="syncthing-entity-list">
                {folderNodes}
            </div>
        </PanelSectionRow>
    );
}

const makeFolderLabel = (folder: Folder): ReactNode => {
    return <span>{folder.label ?? folder.id}</span>;
}

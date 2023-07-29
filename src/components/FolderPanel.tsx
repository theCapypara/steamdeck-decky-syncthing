import {FC, ReactNode, useEffect, useState} from "react";
import {
    StConfigFolder,
    StDbStatus,
    StStatsFolder,
    SyncthingApi
} from "../api/SyncthingApi";
import {PanelSectionRow} from "decky-frontend-lib";
import {Loader} from "./Loader";
import {PanelErrorContent} from "./PanelErrorContent";
import {SyncthingEntity} from "./SyncthingEntity";
import {FaCheckCircle, FaExclamationCircle, FaQuestionCircle, FaSearch, FaStopCircle, FaSyncAlt} from "react-icons/fa";

interface FolderPanelProps {
    api: SyncthingApi;
}

type Folder = StConfigFolder & StStatsFolder & StDbStatus;
type Folders = Record<string, Folder>;

export const FolderPanel: FC<FolderPanelProps> = ({api}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown | null>(null);
    const [folders, setFolders] = useState<Folders | null>(null);

    useEffect(() => {
        const loadFolders = async () => {
            try {
                const [configFolders, statsFolders] = await Promise.all([api.configFolders(), api.statsFolders()]);
                setFolders(await buildFolders(api, configFolders, statsFolders));
            } catch (error) {
                setError(error);
            }
            setLoading(false);
        };
        loadFolders();
    }, [api]);

    if (loading) {
        return (<PanelSectionRow><Loader/></PanelSectionRow>);
    }

    if (error) {
        return (<PanelSectionRow><PanelErrorContent error={error}/></PanelSectionRow>);
    }

    const folderNodes: ReactNode[] = [];
    for (const folder of folders ? Object.values(folders) : []) {
        if (folder.id != null) {
            folderNodes.push(<SyncthingEntity primaryIcon={makeFolderIcon(folder)}
                                              label={makeFolderLabel(folder)}/>);
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

const buildFolders = async (api: SyncthingApi, configFolders: StConfigFolder[], statsFolders: Record<string, StStatsFolder>): Promise<Folders> => {
    const out = {};
    const promisesStatus: Promise<[string, StDbStatus]>[] = [];
    for (const config of configFolders) {
        if (config.id != undefined) {
            (() => {
                const id = config.id;
                promisesStatus.push(api.dbStatus(id).then(result => [id, result]));
            })();
        }
    }
    const resultStatuses = (await Promise.all(promisesStatus));
    const statuses = resultStatuses.reduce((acc, [id, status]) => {
        acc[id] = status;
        return acc;
    }, {});
    for (const config of configFolders) {
        if (config.id != undefined) {
            const stats = statsFolders[config.id] ?? {};
            const status = statuses[config.id] ?? {};
            out[config.id] = {...config, ...stats, ...status}
        }
    }
    return out;
}

const makeFolderIcon = (folder: Folder): ReactNode => {
    if (folder.paused) {

    }
    if (folder.state == "scanning") {
        return <FaSearch />;
    }
    if (folder.state == "syncing") {
        return <FaSyncAlt />;
    }
    if (folder.state == "error") {
        return <FaStopCircle />;
    }
    if ((folder.errors != null && folder.errors > 0) || (folder.pullErrors != null && folder.pullErrors > 0)) {
        return <FaExclamationCircle />;
    }
    if (folder.state == "idle") {
        return <FaCheckCircle />;
    }
    // unknown
    return <FaQuestionCircle />;
}

const makeFolderLabel = (folder: Folder): ReactNode => {
    return <span>{folder.label ?? folder.id}</span>;
}

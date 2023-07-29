import {
    definePlugin,
    ServerAPI,
    staticClasses,
} from "decky-frontend-lib";
import {SettingsRouter} from "./components/settings/SettingsRouter";
import {QuickAccess} from "./components/QuickAccess";
import {SyncthingIcon} from "./components/SyncthingIcon";

export default definePlugin((serverApi: ServerAPI) => {
    console.info(`Decky Syncthing: loading`);
    serverApi.routerHook.addRoute(
        "/decky-syncthing/settings",
        () => (
            <SettingsRouter serverApi={serverApi}/>
        )
    );

    return {
        title: <div className={staticClasses.Title}>Syncthing</div>,
        content: <QuickAccess serverApi={serverApi}/>,
        icon: <SyncthingIcon/>,
        onDismount() {
            serverApi.routerHook.removeRoute("/decky-syncthing/settings");
        },
    };
});

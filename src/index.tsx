import {
    definePlugin,
    ServerAPI,
    staticClasses,
} from "decky-frontend-lib";
import {FaSyncAlt} from "react-icons/fa";
import {SettingsRouter} from "./components/settings/SettingsRouter";
import {Context} from "./components/Context";

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
        content: <Context serverApi={serverApi}/>,
        icon: <FaSyncAlt/>,
        onDismount() {
            serverApi.routerHook.removeRoute("/decky-syncthing/settings");
        },
    };
});

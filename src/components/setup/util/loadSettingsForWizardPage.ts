import {Settings} from "../../../Settings";
import {PLUGIN_API_GET_SETTINGS_JSON} from "../../../consts";
import {ServerAPI} from "decky-frontend-lib";

export function loadSettingsForWizardPage(setSettings: (_: Settings | null) => any, setLoading: (_: boolean) => any, serverApi: ServerAPI) {
    const onLoad = async () => {
        const currentValResult = await serverApi.callPluginMethod<{}, string>(PLUGIN_API_GET_SETTINGS_JSON, {});
        if (currentValResult.success) {
            console.info(`Decky Syncthing: loaded settings.`);
            setSettings(JSON.parse(currentValResult.result));
        } else {
            console.error(`Decky Syncthing: failed loading settings: ${currentValResult.result}`);
            setSettings(null);
        }
        setLoading(false);
    };
    onLoad();
}

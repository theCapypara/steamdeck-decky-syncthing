import {
    DialogBody,
    DialogControlsSection,
    DialogControlsSectionHeader,
    Field,
    ServerAPI,
    Spinner
} from "decky-frontend-lib";
import {useEffect, useState, FC} from "react";
import WithSuspense from "../../WithSuspense";
import Setting from "../../Setting";
import {Settings} from "../../../Settings";
import {PLUGIN_API_GET_SETTINGS_JSON, PLUGIN_API_SET_SETTING} from "../../../consts";
import {WatchdogApi} from "../../../api/WatchdogApi";

interface SetSettingParams {
    setting: string;
    value: string;
}

interface SettingsPageProps {
    serverApi: ServerAPI
}

export const SettingsPage: FC<SettingsPageProps> = ({serverApi}) => {

    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const onLoad = async () => {
            const currentValResult = await serverApi.callPluginMethod<{}, string>(PLUGIN_API_GET_SETTINGS_JSON, {});
            if (currentValResult.success) {
                console.info(`Decky Syncthing: loaded settings.`);
                setSettings(JSON.parse(currentValResult.result));
            } else {
                console.error(`Decky Syncthing: failed loading settings: ${currentValResult.result}`);
                setError(currentValResult.result);
            }
            setLoading(false);
        };
        onLoad();
    }, [serverApi]);

    const onChange = (setting: string, value: any) => {
        serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
            setting,
            value
        }).then(
            (result) => {
                if (result.success) {
                    console.info(`Decky Syncthing: set setting ${setting} to ${value}`);
                } else {
                    console.error(`Decky Syncthing: FAILED setting ${setting} to ${value}: ${result.result}`)
                }
            }
        ).then(() => {
            (new WatchdogApi()).reloadSettings();
        });
        if (settings != null) {
            const newSettings: Settings = {...settings, [setting]: value}
            setSettings(newSettings);
        }
    };

    let content;
    if (loading) {
        content = (
            <DialogBody>
                <DialogControlsSection>
                    <Field label="Loading...">
                        <Spinner/>
                    </Field>
                </DialogControlsSection>
            </DialogBody>
        );
    } else if (error) {
        content = (
            <DialogBody>
                <DialogControlsSection>
                    <p>Failed to load settings: {error}</p>
                </DialogControlsSection>
            </DialogBody>
        );
    } else {
        content = (
            <DialogBody>
                <DialogControlsSection>
                    <DialogControlsSectionHeader>General</DialogControlsSectionHeader>
                    <Setting type="bool" label="Start Syncthing automatically" setting="autostart"
                             value={settings?.autostart} onChange={onChange}/>
                    <Setting type="int" label="Syncthing Port" setting="port" value={settings?.port}
                             onChange={onChange}/>
                    <Setting type="int" label="API Key" setting="api_key" value={settings?.api_key}
                             onChange={onChange}
                             description="Tip: You can start Syncthing from this plugin before entering this key. It will still work, the plugin just won't be able to show you the status of it. Then enter the web interface with the globe icon. At the time of writing the Deck does not support copying from web sites, so you may need to write it down."/>
                </DialogControlsSection>
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Advanced</DialogControlsSectionHeader>
                    <Setting type="str" label="Flatpak ID" setting="flatpak_name" value={settings?.flatpak_name}
                             onChange={onChange}/>
                    <Setting type="str" label="Basic Auth Username" setting="basic_auth_user" value={settings?.basic_auth_user}
                             onChange={onChange}
                             description="This and the password are needed if you want to enter the web UI and have it password-protected."/>
                    <Setting type="password" label="Basic Auth Password" setting="basic_auth_pass" value={settings?.basic_auth_pass}
                             onChange={onChange}/>
                    <Setting type="bool" label="Keep running on Desktop" setting="keep_running_on_desktop"
                             value={settings?.keep_running_on_desktop} onChange={onChange}
                             description="If enabled, the plugin will try to keep Syncthing running even when switching to Desktop mode. You can then interact with it from Desktop via the Web UI. Do not try to start Syncthing GTK. If however you notice the Web UI does not work, then the plugin failed to keep Syncthing running and you can safely start Syncthing GTK."/>
                </DialogControlsSection>
            </DialogBody>
        );
    }

    return (
        <WithSuspense>
            {content}
        </WithSuspense>
    )

};
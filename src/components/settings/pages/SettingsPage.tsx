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
import SettingDropdown from "../../SettingDropdown";

export interface SetSettingParams {
    setting: string;
    value: any;
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
        let modeSettings;
        if (settings?.mode === "systemd" || settings?.mode === "systemd_system") {
            modeSettings = (
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Service Settings</DialogControlsSectionHeader>
                    <Setting type="str" label="Systemd service name" setting="service_name" value={settings?.service_name}
                             onChange={onChange}/>
                </DialogControlsSection>
            );
        } else {
            modeSettings = (
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Flatpak Settings</DialogControlsSectionHeader>
                    <Setting type="str" label="Flatpak ID" setting="flatpak_name" value={settings?.flatpak_name}
                             onChange={onChange}/>
                    <Setting type="str" label="Syncthing binary" setting="flatpak_binary" value={settings?.flatpak_binary}
                             onChange={onChange}/>
                </DialogControlsSection>
            );
        }

        content = (
            <DialogBody>
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Mode</DialogControlsSectionHeader>
                    <SettingDropdown label="Launch Mode" options={{"flatpak": "Flatpak", "systemd": "Existing Systemd user service", "systemd_system": "Existing Systemd system service"}}
                                     setting="mode" value={settings?.mode} onChange={onChange}/>
                </DialogControlsSection>
                {modeSettings}
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Connection</DialogControlsSectionHeader>
                    <Setting type="int" label="Syncthing Port" setting="port" value={settings?.port}
                             onChange={onChange}/>
                    <Setting type="str" label="API Key" setting="api_key" value={settings?.api_key}
                             onChange={onChange}/>
                    <Setting type="str" label="Basic Auth Username" setting="basic_auth_user" value={settings?.basic_auth_user}
                             onChange={onChange}
                             description="This and the password are needed if you want to enter the web UI and have it password-protected."/>
                    <Setting type="password" label="Basic Auth Password" setting="basic_auth_pass" value={settings?.basic_auth_pass}
                             onChange={onChange}/>
                </DialogControlsSection>
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Start / Stop</DialogControlsSectionHeader>
                    <SettingDropdown
                        label="Autostart"
                        options={{
                            "no": {label: "Disabled", description: "Syncthing will not start automatically. This will disable the Systemd service."},
                            "boot": {label: "At boot", description: "Syncthing will start automatically when the system starts. This will enable the Systemd service."},
                            "gamescope": {label: "When in Game Mode", description: "Whenever Game Mode or Big Picture Mode is started, Syncthing will be started. Syncthing may also be started if the plugin is reloaded."}
                        }}
                        setting="autostart"
                        value={settings?.autostart}
                        onChange={onChange}
                    />
                    <Setting type="bool" label="Keep running on Desktop" setting="keep_running_on_desktop"
                             value={settings?.keep_running_on_desktop} onChange={onChange}
                             description="If enabled, the plugin will try to keep Syncthing running even when switching to Desktop mode. If disabled, the plugin will try to stop Syncthing when switching to Desktop mode."/>
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
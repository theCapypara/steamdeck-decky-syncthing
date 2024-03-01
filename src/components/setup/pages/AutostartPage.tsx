import {DialogBody, DialogButton, DialogControlsSection} from 'decky-frontend-lib';
import {FunctionComponent, useCallback, useEffect, useState} from 'react';
import {SetupPageProps} from "../SetupRouter";
import Setting from "../../Setting";
import SettingDropdown from "../../SettingDropdown";
import {Settings} from "../../../Settings";
import {SetSettingParams} from "../../settings/pages/SettingsPage";
import {PLUGIN_API_SET_SETTING} from "../../../consts";
import {loadSettingsForWizardPage} from "../util/loadSettingsForWizardPage";
import {Loader} from "../../Loader";

const AutostartPage: FunctionComponent<SetupPageProps> = ({setBackNavAllowed, serverApi, nextPage}) => {
    setBackNavAllowed(true);

    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings | null>(null);

    let setAndContinue = useCallback(() => {
        (async () => {
            // Set settings
            let promises = [];
            promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                setting: "autostart",
                value: settings?.autostart ?? "no",
            }));
            promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                setting: "keep_running_on_desktop",
                value: settings?.keep_running_on_desktop ?? false,
            }));
            await Promise.all(promises);
            // Progress to next page
            nextPage({});
        })();
        setLoading(true);
    }, [settings]);

    useEffect(() => {
        loadSettingsForWizardPage(setSettings, setLoading, serverApi);
    }, [serverApi]);

    const onChange = (setting: string, value: any) => {
        let newSettings: Settings;
        if (settings == null) {
            // @ts-ignore
            newSettings = {[setting]: value};
        } else {
            // @ts-ignore
            newSettings = {...settings, [setting]: value}
        }
        setSettings(newSettings);
    };

    if (loading) {
        return <Loader fullScreen={true}/>;
    }

    return (
        <DialogBody>
            <DialogControlsSection>
                <p>
                    Almost done! You can now configure whether you want Syncthing to be started automatically or not.
                </p>
            </DialogControlsSection>
            <DialogControlsSection>
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
            <DialogControlsSection>
                <DialogButton onClick={setAndContinue}>
                    Continue
                </DialogButton>
            </DialogControlsSection>
        </DialogBody>
    );
};

export default AutostartPage;
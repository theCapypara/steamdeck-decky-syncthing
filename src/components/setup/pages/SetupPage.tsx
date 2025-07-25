import {DialogBody, DialogButton, DialogControlsSection} from 'decky-frontend-lib';
import {FunctionComponent, useCallback, useEffect, useState} from 'react';
import {SetupPageProps} from "../SetupRouter";
import {Loader} from "../../Loader";
import {PLUGIN_API_SET_SETTING} from "../../../consts";
import {SetSettingParams} from "../../settings/pages/SettingsPage";
import Setting from "../../Setting";
import {Settings} from "../../../Settings";
import {loadSettingsForWizardPage} from "../util/loadSettingsForWizardPage";

export type ApplyConfig =
    {type: "systemd", systemdService: string}
    | {type: "systemd_system", systemdService: string}
    | {type: "flatpak", flatpakName: string; flatpakBinary: string}
    | {type: "syncthingy", systemdService: string, flatpakName: string};

const SetupPage: FunctionComponent<SetupPageProps> = ({statePassedIn, nextPage, backPage, serverApi}) => {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings | null>(null);

    let applySettingsAndContinue = useCallback((applyConf: ApplyConfig) => {
        (async () => {
            // Set settings
            let promises = [];
            if (applyConf.type === "systemd" || applyConf.type === "systemd_system") {
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "mode",
                    value: applyConf.type,
                }));
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "service_name",
                    value: applyConf.systemdService,
                }));
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "_wizard_force_flatpak_config_for",
                    value: null,
                }));
            } if (applyConf.type === "syncthingy") {
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "mode",
                    value: "systemd",
                }));
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "service_name",
                    value: applyConf.systemdService,
                }));
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "_wizard_force_flatpak_config_for",
                    value: applyConf.flatpakName,
                }));
            } else if (applyConf.type === "flatpak") {
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "mode",
                    value: applyConf.type,
                }));
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "flatpak_name",
                    value: applyConf.flatpakName,
                }));
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "flatpak_binary",
                    value: applyConf.flatpakBinary,
                }));
                promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                    setting: "_wizard_force_flatpak_config_for",
                    value: null,
                }));
            }
            await Promise.all(promises);
            // Progress to next page
            nextPage(applyConf);
        })();
        setLoading(true);
    }, [statePassedIn]);

    let body;

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
        body = <Loader fullScreen={true}/>;
    } else if (statePassedIn.type == "none") {
        body = (
            <DialogBody>
                <DialogControlsSection>
                    <p>
                        The Syncthing plugin requires that you already have Syncthing installed.
                    </p>
                    <p>
                        On the Steam Deck you can install Syncthing by switching to desktop mode and installing the
                        "Syncthing GTK" Flatpak via "Discover".
                    </p>
                    <p>
                        After it is installed, make sure to start it and confirm that the port for the web UI is
                        set to anything other than 8080 (see the README of Decky Loader).
                    </p>
                </DialogControlsSection>
                <DialogControlsSection>
                    <DialogButton onClick={backPage}>
                        Back
                    </DialogButton>
                </DialogControlsSection>
            </DialogBody>
        );
    } else if (statePassedIn.type == "flatpak" && statePassedIn.name == null) {
        body = (
            <DialogBody>
                <DialogControlsSection>
                    <p>
                        Please enter the ID of the Flatpak. Advanced users can also configure a different binary to launch.
                        The default "syncthing" should work for most cases.
                    </p>
                </DialogControlsSection>
                <DialogControlsSection>
                    <Setting type="str" label="Flatpak ID" setting="flatpak_name" value={settings?.flatpak_name}
                             onChange={onChange}/>
                    <Setting type="str" label="Syncthing binary" setting="flatpak_binary" value={settings?.flatpak_binary}
                             onChange={onChange}/>
                </DialogControlsSection>
                <DialogControlsSection>
                    <DialogButton onClick={() => applySettingsAndContinue({
                        type: "flatpak",
                        flatpakName: settings?.flatpak_name ?? "",
                        flatpakBinary: settings?.flatpak_binary ?? ""
                    })}>
                        Continue
                    </DialogButton>
                </DialogControlsSection>
            </DialogBody>
        );
    } else if (statePassedIn.type == "system" && statePassedIn.name == null) {
        body = (
            <DialogBody>
                <DialogControlsSection>
                    <p>
                        Please enter the name of the Systemd user service.
                    </p>
                </DialogControlsSection>
                <DialogControlsSection>
                    <Setting type="str" label="Systemd service name" setting="service_name" value={settings?.service_name}
                             onChange={onChange}/>
                </DialogControlsSection>
                <DialogControlsSection>
                    <DialogButton onClick={() => applySettingsAndContinue({
                        type: "systemd",
                        systemdService: settings?.service_name ?? ""
                    })}>
                        Continue
                    </DialogButton>
                </DialogControlsSection>
            </DialogBody>
        );
    } else if (statePassedIn.type == "system_system") {
        const systemd_system_warning = <>
            <p>In order to use a Systemd system service, the current user (on a Steam Deck "deck") needs to be able to control the system service without using "sudo".</p>
            <p>This can be achieved on most distributions using polkit ("org.freedesktop.systemd1.manage-units" for the unit). Please see the manual of your distribution for more details or choose another installation method.</p>
            <p>In order to modify the "autostart" setting of Syncthing, the current user also needs to be allowed to disable and enable Systemd system services (polkit "org.freedesktop.systemd1.manage-unit-files"). If this permission isn't given, the autostart setting will not work correctly and you will need to manage this setting manually using systemctl.</p>
        </>;
        if (statePassedIn.name == null) {
            body = (
                <DialogBody>
                    <DialogControlsSection>
                        <p>
                            Please enter the name of the Systemd system service.
                        </p>
                        {systemd_system_warning}
                    </DialogControlsSection>
                    <DialogControlsSection>
                        <Setting type="str" label="Systemd service name" setting="service_name" value={settings?.service_name}
                                 onChange={onChange}/>
                    </DialogControlsSection>
                    <DialogControlsSection>
                        <DialogButton onClick={() => applySettingsAndContinue({
                            type: "systemd_system",
                            systemdService: settings?.service_name ?? ""
                        })}>
                            Continue
                        </DialogButton>
                    </DialogControlsSection>
                </DialogBody>
            );
        } else {
            body = (
                <DialogBody>
                    <DialogControlsSection>
                        {systemd_system_warning}
                    </DialogControlsSection>
                    <DialogControlsSection>
                        <DialogButton onClick={() => applySettingsAndContinue({
                            type: "systemd_system",
                            systemdService: statePassedIn.name
                        })}>
                            Continue
                        </DialogButton>
                    </DialogControlsSection>
                </DialogBody>
            );
        }
    } else if (statePassedIn.type == "flatpak") {
        applySettingsAndContinue(
            {type: "flatpak", flatpakName: statePassedIn.name, flatpakBinary: "syncthing"}
        );
        body = <Loader fullScreen={true}/>;
    } else if (statePassedIn.type == "syncthingy") {
        applySettingsAndContinue(
            {type: "syncthingy", systemdService: statePassedIn.systemd, flatpakName: statePassedIn.flatpak}
        );
        body = <Loader fullScreen={true}/>;
    } else {
        applySettingsAndContinue(
            {type: "systemd", systemdService: statePassedIn.name}
        );
        body = <Loader fullScreen={true}/>;
    }

    return <DialogBody>{body}</DialogBody>;
};

export default SetupPage;

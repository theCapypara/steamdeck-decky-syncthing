import {DialogBody, DialogButton, DialogControlsSection} from 'decky-frontend-lib';
import {FunctionComponent, ReactNode, useEffect, useState} from 'react';
import {SetupPageProps} from "../SetupRouter";
import {CheckError, WatchdogApi} from "../../../api/WatchdogApi";
import {SetSettingParams} from "../../settings/pages/SettingsPage";
import {PLUGIN_API_SET_SETTING} from "../../../consts";
import {Loader} from "../../Loader";
import {GenericWizardError} from "../util/GenericWizardError";
import {Settings} from "../../../Settings";
import {loadSettingsForWizardPage} from "../util/loadSettingsForWizardPage";
import Setting from "../../Setting";

const BasicAuthPage: FunctionComponent<SetupPageProps> = ({nextPage, backPage, setBackNavAllowed, serverApi}) => {
    const [loading, setLoading] = useState(true);
    const [basicAuthUser, setBasicAuthUser] = useState("");
    const [error, setError] = useState<CheckError | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    setBackNavAllowed(false);

    const setAndContinue = async (user: string, password: string) => {
        const promises = [];
        promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
            setting: "basic_auth_user",
            value: user,
        }));
        promises.push(serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
            setting: "basic_auth_pass",
            value: password,
        }));
        await Promise.all(promises);
        // Progress to next page
        nextPage({});
    };

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

    useEffect(() => {
        if (!loading && error == null && settings == null) {
            setLoading(true);
            loadSettingsForWizardPage(setSettings, setLoading, serverApi);
        }
    }, [serverApi, loading, settings, error]);

    useEffect(() => {
        if (settings != null && basicAuthUser != null) {
            onChange("basic_auth_user", basicAuthUser)
        }
    }, [settings, basicAuthUser]);

    useEffect(() => {
        (async () => {
            const watchdogApi = new WatchdogApi();
            try {
                let response = await watchdogApi.checkScanBasicAuth();
                if ("error" in response) {
                    setError({"error": response.error});
                    setLoading(false);
                } else if (response.basic_auth_user == null) {
                    setAndContinue("", "");
                } else {
                    setBasicAuthUser(response.basic_auth_user);
                    setLoading(false);
                }
            } catch (err) {
                setError({"error": `${err}`});
                setLoading(false);
            }
        })();
    }, []);

    let body: ReactNode;
    if (loading) {
        body  = <Loader fullScreen={true}/>;
    } else if (error) {
        setBackNavAllowed(true);
        body = <GenericWizardError error={error} backPage={backPage}/>;
    } else {
        setBackNavAllowed(true);

        body = (
            <DialogBody>
                <DialogControlsSection>
                    <p>
                        It was detected that the web UI of Syncthing may be password protected. Please
                        enter the username and password required to access the web UI. If none are needed,
                        leave both fields blank.
                    </p>
                </DialogControlsSection>
                <DialogControlsSection>
                    <Setting type="str" label="Basic Auth Username" setting="basic_auth_user" value={settings?.basic_auth_user}
                             onChange={onChange}/>
                    <Setting type="password" label="Basic Auth Password" setting="basic_auth_pass" value={settings?.basic_auth_pass}
                             onChange={onChange}/>
                </DialogControlsSection>
                <DialogControlsSection>
                    <DialogButton onClick={() => {
                        setAndContinue(settings?.basic_auth_user ?? "", settings?.basic_auth_pass ?? "");
                        setLoading(true);
                    }}>
                        Continue
                    </DialogButton>
                </DialogControlsSection>
            </DialogBody>
        );
    }

    return <DialogBody>{body}</DialogBody>;
};

export default BasicAuthPage;

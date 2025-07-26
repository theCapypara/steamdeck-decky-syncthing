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

const ApikeyPage: FunctionComponent<SetupPageProps> = ({nextPage, backPage, serverApi, setBackNavAllowed}) => {
    const [error, setError] = useState<CheckError | true | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings | null>(null);
    setBackNavAllowed(false);

    const setAndContinue = async (apiKey: string) => {
        await serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
            setting: "api_key",
            value: apiKey,
        })
        // Progress to next page
        nextPage({});
    };

    useEffect(() => {
        if (error != null) {
            setLoading(true);
            loadSettingsForWizardPage(setSettings, setLoading, serverApi);
        }
    }, [serverApi, error]);

    useEffect(() => {
        (async () => {
            const watchdogApi = new WatchdogApi();
            try {
                let response = await watchdogApi.checkScanApikey();
                if ("error" in response) {
                    setError({"error": response.error});
                } else if (response.api_key != null) {
                    setAndContinue(response.api_key);
                } else {
                    setError(true);
                }
            } catch (err) {
                setError({"error": `${err}`});
            }
        })();
    }, []);

    let body: ReactNode;
    if (error === true) {
        setBackNavAllowed(true);

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
        } else {
            body = (
                <DialogBody>
                    <DialogControlsSection>
                        <p>
                            The API key for Syncthing's API could not be detected. Please enter the currently
                            configured API key. You can find this value in the settings of the Syncthing web UI.
                        </p>
                    </DialogControlsSection>
                    <DialogControlsSection>
                        <Setting type="str" label="API Key" setting="api_key" value={settings?.api_key}
                                 onChange={onChange}/>
                    </DialogControlsSection>
                    <DialogControlsSection>
                        <DialogButton onClick={() => {
                            setAndContinue(settings?.api_key ?? "");
                            setLoading(true);
                        }}>
                            Continue
                        </DialogButton>
                    </DialogControlsSection>
                </DialogBody>
            );
        }
    } else if (error) {
        setBackNavAllowed(true);
        body = <GenericWizardError error={error} backPage={backPage}/>;
    } else  {
        body  = <Loader fullScreen={true}/>;
    }

    return <DialogBody>{body}</DialogBody>;
};

export default ApikeyPage;
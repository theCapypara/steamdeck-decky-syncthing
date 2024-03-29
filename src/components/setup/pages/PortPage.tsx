import {DialogBody, DialogButton, DialogControlsSection} from 'decky-frontend-lib';
import {FunctionComponent, ReactNode, useEffect, useState} from 'react';
import {SetupPageProps} from "../SetupRouter";
import {CheckError, WatchdogApi} from "../../../api/WatchdogApi";
import {Loader} from "../../Loader";
import {SetSettingParams} from "../../settings/pages/SettingsPage";
import {PLUGIN_API_SET_SETTING} from "../../../consts";
import {GenericWizardError} from "../util/GenericWizardError";
import Setting from "../../Setting";
import {loadSettingsForWizardPage} from "../util/loadSettingsForWizardPage";
import {Settings} from "../../../Settings";

const PortPage: FunctionComponent<SetupPageProps> = ({nextPage, backPage, serverApi, setBackNavAllowed}) => {
    const [error, setError] = useState<CheckError | true | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings | null>(null);
    setBackNavAllowed(false);

    const setAndContinue = async (port: number) => {
        await serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
            setting: "port",
            value: port,
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
                let response = await watchdogApi.checkScanPort();
                if ("error" in response) {
                    setError({"error": response.error});
                } else if (response.port != null) {
                    setAndContinue(response.port);
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
            let valueInt = parseInt(value);
            if (settings == null) {
                // @ts-ignore
                newSettings = {[setting]: valueInt};
            } else {
                // @ts-ignore
                newSettings = {...settings, [setting]: valueInt}
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
                            The port of Syncthing could not be detected. Please enter the web UI port that
                            Syncthing listens under.
                        </p>
                    </DialogControlsSection>
                    <DialogControlsSection>
                        <Setting type="int" label="Syncthing Port" setting="port" value={settings?.port}
                                 onChange={onChange}/>
                    </DialogControlsSection>
                    <DialogControlsSection>
                        <DialogButton onClick={() => {
                            setAndContinue(settings?.port ?? 0);
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
        body = <Loader fullScreen={true}/>;
    }

    return <DialogBody>{body}</DialogBody>;
};

export default PortPage;
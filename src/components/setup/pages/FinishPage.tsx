import {DialogBody, DialogButton, DialogControlsSection, Navigation, QuickAccessTab} from 'decky-frontend-lib';
import {FunctionComponent, useEffect, useState} from 'react';
import {SetupPageProps} from "../SetupRouter";
import {FaCheckCircle} from "react-icons/fa";
import {Loader} from "../../Loader";
import {SetSettingParams} from "../../settings/pages/SettingsPage";
import {PLUGIN_API_SET_SETTING} from "../../../consts";
import {WatchdogApi} from "../../../api/WatchdogApi";

const FinishPage: FunctionComponent<SetupPageProps> = ({serverApi}) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            await serverApi.callPluginMethod<SetSettingParams, void>(PLUGIN_API_SET_SETTING, {
                setting: "is_setup",
                value: true,
            })
            await (new WatchdogApi()).reloadSettings();
            setLoading(false);
        })();
    }, [serverApi]);

    const finish = () => {
        setTimeout(() => Navigation.OpenQuickAccessMenu(QuickAccessTab.Decky), 100);
        Navigation.NavigateBack();
    };

    if (loading) {
        return <Loader fullScreen={true}/>;
    }

    return (
        <DialogBody>
            <DialogControlsSection>
                <div style={{textAlign: "center"}}>
                    <FaCheckCircle size={"4em"}/>
                </div>
                <p style={{textAlign: "center"}}>
                    All done! You can now start using Syncthing!
                </p>
            </DialogControlsSection>
            <DialogControlsSection>
                <DialogButton onClick={finish}>
                    Get Started
                </DialogButton>
            </DialogControlsSection>
        </DialogBody>
    )
};

export default FinishPage;
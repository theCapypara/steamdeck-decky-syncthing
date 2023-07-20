import {useEffect, useState, VFC} from "react";
import {
    DialogButton, Field,
    Focusable,
    Navigation,
    PanelSection,
    PanelSectionRow,
    Router,
    ServerAPI, sleep,
    SteamSpinner
} from "decky-frontend-lib";
import {FaGlobe, FaPowerOff, FaSyncAlt, FaWrench} from "react-icons/fa";
import {SyncthingState} from "./SyncthingState";
import {SyncthingProcessState} from "../State";
import {Settings} from "../Settings";
import {FolderPanel} from "./FolderPanel";
import {DevicesPanel} from "./DevicesPanel";

export const Context: VFC<{ serverApi: ServerAPI }> = ({serverApi}) => {
    const [state, setState] = useState<SyncthingProcessState | string>(SyncthingProcessState.Unknown);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);


    const reloadState = async (updateLoading = true) => {
        console.info(`Decky Syncthing: loading context.`);
        if (updateLoading) {
            setLoading(true);
        }
        setState(SyncthingProcessState.Unknown);
        setSettings(null);
        const result = await serverApi.callPluginMethod<{}, string>("state", {});
        if (result.success) {
            console.info(`Decky Syncthing: loaded state: ${result.result}.`);
            setState(result.result);
            const settingsResult = await serverApi.callPluginMethod<{}, string>("get_settings_json", {});
            if (settingsResult.success) {
                console.info(`Decky Syncthing: loaded settings.`);
                setSettings(JSON.parse(settingsResult.result));
                setError(null);
            } else {
                console.error(`Decky Syncthing: failed loading settings: ${settingsResult.result}`);
                setError(settingsResult.result);
            }
        } else {
            console.error(`Decky Syncthing: failed loading state: ${result.result}`);
            setError(`${result.result}`);
        }
        if (updateLoading) {
            setLoading(false);
        }
        return state;
    };

    const toggleSyncthing = async() => {
        console.error(`Decky Syncthing: toggling`);
        if (!toggling) {
            setToggling(true);
            switch (state) {
                case SyncthingProcessState.Running:
                case SyncthingProcessState.Wait:
                    console.error(`Decky Syncthing: stopping...`);
                    await serverApi.callPluginMethod("stop", {});
                    await sleep(100);
                    console.error(`Decky Syncthing: reloading state...`);
                    await reloadState(false);
                    break;
                default:
                    console.error(`Decky Syncthing: starting...`);
                    await serverApi.callPluginMethod("start", {});
                    await sleep(100);
                    console.error(`Decky Syncthing: reloading state...`);
                    while (SyncthingProcessState.Wait == await reloadState(false)) {
                        console.error(`Decky Syncthing: still waiting...`);
                        await sleep(1000);
                    }
                    break;
            }
        }
        setToggling(false);
    }

    useEffect(() => {
        reloadState();
    }, [serverApi]);

    if (loading) {
        return (
            <Focusable
                style={{
                    overflowY: 'scroll',
                    backgroundColor: 'transparent',
                    marginTop: '40px',
                    height: 'calc( 100% - 40px )',
                }}
            >
                <SteamSpinner/>
            </Focusable>
        )
    }


    return (
        <>
            <PanelSection>
                <PanelSectionRow>
                    <Focusable flow-children="horizontal"
                               style={{display: "flex", padding: 0, gap: "8px"}}>
                        <DialogButton
                            style={{minWidth: 0, width: "15%", height: "32px", padding: 0}}
                            onClick={() => reloadState()}
                        >
                            <FaSyncAlt/>
                        </DialogButton>
                        <DialogButton
                            style={{minWidth: 0, width: "15%", height: "32px", padding: 0}}
                            onClick={() => {
                                Router.CloseSideMenus();
                                Router.Navigate("/decky-syncthing/settings");
                            }}
                        >
                            <FaWrench/>
                        </DialogButton>
                        <DialogButton
                            style={{minWidth: 0, width: "15%", height: "32px", padding: 0}}
                            onClick={() => {
                                if (settings?.port) {
                                    Router.CloseSideMenus();
                                    console.info(`Decky Syncthing: opening https://localhost:${settings?.port}/`);
                                    Navigation.NavigateToExternalWeb(`https://localhost:${settings?.port}/`);
                                }
                            }}
                        >
                            <FaGlobe/>
                        </DialogButton>
                        <DialogButton
                            style={{minWidth: 0, width: "15%", height: "32px", padding: 0}}
                            onClick={() => toggleSyncthing()}
                        >
                            <FaPowerOff/>
                        </DialogButton>
                    </Focusable>
                </PanelSectionRow>
                <PanelSectionRow>
                    <Field label={<SyncthingState state={state} hasError={error != null}/>}/>
                </PanelSectionRow>
            </PanelSection>
            {error != null && (
                <>
                    <PanelSection title="Error">
                        <PanelSectionRow>
                            {error}
                        </PanelSectionRow>
                    </PanelSection>
                </>
            )}
            {state == SyncthingProcessState.Running && settings != null && (
                <>
                    <PanelSection title="Folder">
                        <PanelSectionRow>
                            <FolderPanel port={settings.port} apiKey={settings.api_key}/>
                        </PanelSectionRow>
                    </PanelSection>
                    <PanelSection title="Devices">
                        <PanelSectionRow>
                            <DevicesPanel port={settings.port} apiKey={settings.api_key}/>
                        </PanelSectionRow>
                    </PanelSection>
                </>
            )}
        </>
    );
}

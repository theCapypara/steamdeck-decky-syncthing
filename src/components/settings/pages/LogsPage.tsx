import {
    ButtonItem,
    DialogBody,
    DialogButton,
    DialogControlsSection,
    DialogControlsSectionHeader,
    Field,
    ModalRoot,
    ServerAPI,
    showModal,
} from "decky-frontend-lib";
import {useCallback, useEffect, useState, VFC} from "react";
import WithSuspense from "../../WithSuspense";
import {FaSync} from "react-icons/fa";
import {SyncthingProcessState} from "../../../State";
import {Scrollable} from "../../Scrollable";

interface LogsPageProps {
    serverApi: ServerAPI
}

export const LogsPage: VFC<LogsPageProps> = ({serverApi}) => {
    const [state, setState] = useState("... Loading");

    const reloadState = async () => {
        const result = await serverApi.callPluginMethod<{}, string>("state", {});
        if (result.success) {
            setState(result.result);
        } else {
            setState(`!!! failed loading: ${result.result}`);
        }
    };

    useEffect(() => {
        reloadState();
    }, [serverApi]);

    const showLog = useCallback(() => {
        showModal(<LogModal state={state} serverApi={serverApi}/>);
    }, [state, serverApi]);

    return (
        <WithSuspense>
            <DialogBody>
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Syncthing Process Log</DialogControlsSectionHeader>
                    <ButtonItem onClick={showLog}>Show Current Log</ButtonItem>
                </DialogControlsSection>
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Debug information</DialogControlsSectionHeader>
                    <Field label="Current Process State" description={"State: " + state}>
                        <DialogButton onClick={() => reloadState()}><FaSync/></DialogButton>
                    </Field>
                </DialogControlsSection>
            </DialogBody>
        </WithSuspense>
    )
};

interface LogModalProps {
    state: SyncthingProcessState | string;
    serverApi: ServerAPI;
    closeModal?: () => {}
}

const LogModal: VFC<LogModalProps> = ({state, serverApi, closeModal}) => {
    const [log, setLog] = useState("Loading...");

    useEffect(() => {
        const getLog = async () => {
            if (state == SyncthingProcessState.Stopped) {
                setLog("Syncthing is not running.");
                return;
            }
            const result = await serverApi.callPluginMethod<{}, string>("get_log", {});
            if (result.success) {
                setLog(result.result);
            } else {
                setLog(`!!! Failed loading log: ${result.result}`);
            }
        };
        getLog();
    }, [serverApi]);

    return (
            <ModalRoot
              closeModal={closeModal}
              bDisableBackgroundDismiss={false}
              bHideCloseIcon={false}
            >
                <DialogBody>
                    <DialogControlsSection>
                        <DialogControlsSectionHeader>Log (use touch to scroll)</DialogControlsSectionHeader>
                        <Scrollable>
                            <code><pre>
                                { log }
                            </pre></code>
                        </Scrollable>
                    </DialogControlsSection>
                </DialogBody>
            </ModalRoot>
    );
}

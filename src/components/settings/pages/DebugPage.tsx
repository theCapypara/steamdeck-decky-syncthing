import {
    DialogBody, DialogButton,
    DialogControlsSection,
    DialogControlsSectionHeader,
    Field,
    ServerAPI
} from "decky-frontend-lib";
import {FC} from "react";
import WithSuspense from "../../WithSuspense";
import {PLUGIN_API_RESTART_WATCHDOG} from "../../../consts";
import {FaBomb} from "react-icons/fa";

interface DebugPageProps {
    serverApi: ServerAPI
}

export const DebugPage: FC<DebugPageProps> = ({serverApi}) => {

    const restartSyncthing = async () => {
        const currentValResult = await serverApi.callPluginMethod<{}, string>(PLUGIN_API_RESTART_WATCHDOG, {});
        if (currentValResult.success) {
            console.info(`Decky Syncthing: restarted watchdog.`);
        } else {
            console.error(`Decky Syncthing: failed restarting watchdog: ${currentValResult.result}`);
        }
    };

    return (
        <WithSuspense>
            <DialogBody>
                <DialogControlsSection>
                    <DialogControlsSectionHeader>Debug</DialogControlsSectionHeader>
                    <Field label="Restart Watchdog" description="This restarts the watchdog process that monitors and controls Syncthing. It also stops all running Syncthing processes.">
                        <DialogButton onClick={() => restartSyncthing()}><FaBomb/></DialogButton>
                    </Field>
                </DialogControlsSection>
            </DialogBody>
        </WithSuspense>
    )

};
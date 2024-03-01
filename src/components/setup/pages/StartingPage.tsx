import {DialogBody, DialogButton, DialogControlsSection} from 'decky-frontend-lib';
import {FunctionComponent, ReactNode, useEffect, useState} from 'react';
import {SetupPageProps} from "../SetupRouter";
import {Loader} from "../../Loader";
import {WatchdogApi} from "../../../api/WatchdogApi";
import {ApplyConfig} from "./SetupPage";

interface StartError {
    error: string,
    errorDetails?: string;
}

const StartingPage: FunctionComponent<SetupPageProps> = ({nextPage, backPage, setBackNavAllowed, statePassedIn}) => {
    const [error, setError] = useState<StartError | null>(null);
    setBackNavAllowed(false);

    useEffect(() => {
        (async () => {
            const watchdogApi = new WatchdogApi();
            try {
                let response = await watchdogApi.checkStart();
                if (!("success" in response) || !response.success) {
                    let errorDetails = "error_details" in response ? response.error_details : undefined;
                    if (response.error == null) {
                        setError({
                            "error": "Unknown error",
                            "errorDetails": errorDetails ?? "There was an unknown error starting Syncthing."
                        });
                    } else {
                        setError({"error": response.error, "errorDetails": errorDetails ?? ""});
                    }
                } else {
                    // Progress to next page
                    nextPage({});
                }
            } catch (err) {
                setError({"error": "Internal error", "errorDetails": `${err}`});
            }
        })();
    }, []);

    let body: ReactNode;
    if (error) {
        const statePassedInCast = statePassedIn as ApplyConfig;
        setBackNavAllowed(true);
        let help;
        let moreHelp = <></>;
        let errorDetails = <></>;
        if (statePassedInCast.type == "flatpak") {
            help = `Make sure the Flatpak with the ID '${statePassedInCast.flatpakName}' exists.`;
            moreHelp = (
                <p className={"syncthing-details"}>
                    If you want to try and investigate this error further, check the status or journal logs of the
                    Systemd user service 'decky-syncthing' that this plugin created based on your settings.
                </p>
            );
        } else {
            help = `Make sure the Systemd user service with the ID '${statePassedInCast.systemdService}' exists.`;
            moreHelp = (
                <p className={"syncthing-details"}>
                    If you want to try and investigate this error further, check the status or journal logs of the
                    Systemd user service '{statePassedInCast.systemdService}'.
                </p>
            );
        }
        if (error.errorDetails != undefined && error.errorDetails != "") {
            errorDetails = (
                <p>
                    Additional technical information about the error:
                    <pre style={{whiteSpace: "pre-wrap"}}>{error.errorDetails}</pre>
                </p>
            );
        }
        body = (
            <DialogBody>
                <DialogControlsSection>
                    <p>
                        There was an error trying to start Syncthing.
                    </p>
                    <p>
                        {error.error}
                    </p>
                    <p>
                        {help}
                    </p>
                    {errorDetails}
                    {moreHelp}
                </DialogControlsSection>
                <DialogControlsSection>
                    <DialogButton onClick={backPage}>
                        Back
                    </DialogButton>
                </DialogControlsSection>
            </DialogBody>
        );
    } else  {
        body  = <Loader fullScreen={true}/>;
    }

    return <DialogBody>{body}</DialogBody>;
};

export default StartingPage;
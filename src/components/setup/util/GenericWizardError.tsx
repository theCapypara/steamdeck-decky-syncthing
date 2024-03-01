import {FC} from "react";
import {DialogBody, DialogButton, DialogControlsSection} from "decky-frontend-lib";
import {CheckError} from "../../../api/WatchdogApi";

interface GenericWizardErrorProps {
    backPage: (stateNextPage: any) => void;
    error: CheckError;
}

export const GenericWizardError: FC<GenericWizardErrorProps> = ({ error, backPage }) => {
    return (
        <DialogBody>
            <DialogControlsSection>
                <p>
                    There was an error performing this step of the setup:
                </p>
                <p><pre style={{whiteSpace: "pre-wrap"}}>
                    {error.error}
                </pre></p>
            </DialogControlsSection>
            <DialogControlsSection>
                <DialogButton onClick={backPage}>
                    Back
                </DialogButton>
            </DialogControlsSection>
        </DialogBody>
    )
};
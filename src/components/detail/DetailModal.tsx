import {FC, ReactNode} from "react";
import {DialogBody, DialogControlsSection, DialogHeader, Focusable, ModalRoot} from "decky-frontend-lib";
import {Loader} from "../Loader";
import style from "../../style.css";
import {Scrollable} from "../Scrollable";

export interface DetailsModalProps {
    isLoading: boolean;
    error: unknown | null;
    headingIcon: ReactNode;
    headingLabel: ReactNode;
    onReload: () => any;
    closeModal?: () => {};

    children?: ReactNode;
}

// Maybe we'll use the reload button sometime.
// @ts-ignore
export const DetailsModal: FC<DetailsModalProps> = ({isLoading, error, headingIcon, headingLabel, onReload, closeModal, children}) => {
    let body;

    if (isLoading) {
        body = <Loader fullScreen={true} />;
    } else if (error) {
        const errorStr = error.toString()
        body = (
            <DialogBody>
                <DialogHeader>Error</DialogHeader>
                <DialogControlsSection>
                    <p>Failed to load details.</p>
                    <pre style={{whiteSpace: "pre-wrap"}}>
                        {errorStr}
                    </pre>
                </DialogControlsSection>
            </DialogBody>
        );
    } else {
        body = (
            <DialogBody>
                <DialogHeader><Focusable onActivate={() => {}}>{headingIcon} {headingLabel}</Focusable></DialogHeader>
                <DialogControlsSection>
                    <Scrollable>
                        {children}
                    </Scrollable>
                </DialogControlsSection>
            </DialogBody>
        );
        /*
                <DialogControlsSection>
                    <DialogButton onClick={onReload}>
                        <FaSyncAlt/>
                    </DialogButton>
                </DialogControlsSection>
         */
    }

    return (
        <ModalRoot
          closeModal={closeModal}
          bDisableBackgroundDismiss={false}
          bHideCloseIcon={false}
        >
            <style>{style}</style>
            {body}
        </ModalRoot>
    )
}

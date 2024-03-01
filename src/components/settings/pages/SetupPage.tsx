import {
    DialogBody, DialogButton,
    DialogControlsSection,
    Field,
    Router,
} from "decky-frontend-lib";
import {FC} from "react";
import WithSuspense from "../../WithSuspense";
import {FaWandMagic} from "react-icons/fa6";

export const SetupPage: FC = ({}) => {
    return (
        <WithSuspense>
            <DialogBody>
                <DialogControlsSection>
                    <p>
                        You can run the setup wizard again using the button below.
                        You can also configure the settings directly using the "Settings" tab.
                    </p>
                    <Field label="Run Setup again">
                        <DialogButton onClick={() => {
                            Router.CloseSideMenus();
                            Router.Navigate("/decky-syncthing/setup");
                        }}><FaWandMagic/> Run Setup</DialogButton>
                    </Field>
                </DialogControlsSection>
            </DialogBody>
        </WithSuspense>
    )
};
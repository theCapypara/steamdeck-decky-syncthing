import {FC} from "react";
import {DialogButton, PanelSection, PanelSectionRow, Router} from "decky-frontend-lib";
import {SyncthingIcon} from "./SyncthingIcon";
import {FaSyncAlt} from "react-icons/fa";

interface WelcomePanelProps {
    onReload: () => void;
    isUpdate: boolean;
}

export const WelcomePanel: FC<WelcomePanelProps> = ({onReload, isUpdate}) => {
    let text;

    if (isUpdate) {
        text = "The Syncthing plugin has been updated. Please click the button below to finish setup.";
    } else {
        text = "You have installed the Syncthing plugin.";
    }

    return (
        <PanelSection title="Welcome">
            <div className="syncthing-welcome">
                <div style={{margin: "auto"}}>
                    <SyncthingIcon big={true}/>
                </div>
                <PanelSectionRow>
                    <span style={{display: "inline-block", textAlign: "center"}}>{text}</span>
                </PanelSectionRow>
                <PanelSectionRow>
                    <DialogButton
                        onClick={() => {
                            Router.CloseSideMenus();
                            Router.Navigate("/decky-syncthing/setup");
                        }}
                    >
                        Start Setup
                    </DialogButton>
                </PanelSectionRow>
                <PanelSectionRow>
                    <DialogButton
                        style={{minWidth: 0, width: "15%", height: "28px", padding: "6px", margin: "auto"}}
                        onClick={onReload}
                    >
                        <FaSyncAlt/>
                    </DialogButton>
                </PanelSectionRow>
            </div>
        </PanelSection>
    );
}

import {DialogBody, DialogButton, DialogControlsSection, DialogControlsSectionHeader} from 'decky-frontend-lib';
import {FunctionComponent} from 'react';
import {SetupPageProps} from "../SetupRouter";
import {FaBoxesStacked, FaBoxOpen, FaCircleQuestion, FaComputer} from "react-icons/fa6";


const WelcomePage: FunctionComponent<SetupPageProps> = ({nextPage}) => {
    const select = (option: string) => {
        let service_or_flatpak_name: string | null = null;

        // noinspection FallThroughInSwitchStatementJS
        switch (option) {
            case "system":
                service_or_flatpak_name = "syncthing";
            case "other-system":
                nextPage({type: "system", name: service_or_flatpak_name});
                break;
            case "system_system":
                service_or_flatpak_name = "syncthing";
            case "other-system_system":
                nextPage({type: "system_system", name: service_or_flatpak_name});
                break;
            case "syncthing-gtk":
                service_or_flatpak_name = "me.kozec.syncthingtk"
            case "syncthingy":
                service_or_flatpak_name = service_or_flatpak_name ?? "com.github.zocker_160.SyncThingy";
            case "other-flatpak":
                nextPage({type: "flatpak", name: service_or_flatpak_name});
                break;
            case "none":
                nextPage({type: "none"});
                break;

        }
    };

    return (
        <DialogBody>
            <DialogControlsSection>
                <p>
                    In order to use the Syncthing plugin, you need to have Syncthing installed, either
                    via a Flatpak you can find from the "Discover" store in desktop mode, via the
                    package manager or manually.
                </p>
            </DialogControlsSection>
            <DialogControlsSection>
                <DialogControlsSectionHeader>Installation Method</DialogControlsSectionHeader>
                <DialogButton onClick={() => select("system")}>
                    <div className="syncthing-entity-label">
                        <span className="syncthing-entity-label--icons"><FaComputer/></span>
                        <span className="syncthing-entity-label--detailed-label">
                            Installed directly on the System via user service
                            <br/>
                            <span className="syncthing-entity-label--description">
                                eg. via Pacman; a Systemd user service "<pre>syncthing</pre>" exists.
                            </span>
                        </span>
                    </div>
                </DialogButton>
                <DialogButton onClick={() => select("syncthing-gtk")}>
                    <div className="syncthing-entity-label">
                        <span className="syncthing-entity-label--icons"><FaBoxOpen/></span>
                        <span className="syncthing-entity-label--detailed-label">
                            Installed via the "Syncthing GTK" Flatpak
                            <br/>
                            <span className="syncthing-entity-label--description">
                                ID: <pre>me.kozec.syncthingtk</pre>
                            </span>
                        </span>
                    </div>
                </DialogButton>
                {/*
                  * Does not work reliably, see: https://github.com/SteamDeckHomebrew/decky-plugin-database/pull/557
                  * and the comment in `SetupPage.tsx`.
                  */}
                {/*<DialogButton onClick={() => select("syncthingy")}>
                    <div className="syncthing-entity-label">
                        <span className="syncthing-entity-label--icons"><FaBoxOpen/></span>
                        <span className="syncthing-entity-label--detailed-label">
                            Installed via the "Syncthingy" Flatpak
                            <br/>
                            <span className="syncthing-entity-label--description">
                                ID: <pre>com.github.zocker_160.SyncThingy</pre>
                            </span>
                        </span>
                    </div>
                </DialogButton>*/}
                <DialogButton onClick={() => select("other-flatpak")}>
                    <div className="syncthing-entity-label">
                        <span className="syncthing-entity-label--icons"><FaBoxesStacked/></span>
                        <span className="syncthing-entity-label--detailed-label">
                            Installed via another Flatpak
                        </span>
                    </div>
                </DialogButton>
                <DialogButton onClick={() => select("other-system")}>
                    <div className="syncthing-entity-label">
                        <span className="syncthing-entity-label--icons"><FaComputer/></span>
                        <span className="syncthing-entity-label--detailed-label">
                            Installed via another Systemd user service
                        </span>
                    </div>
                </DialogButton>
                <DialogButton onClick={() => select("system_system")}>
                    <div className="syncthing-entity-label">
                        <span className="syncthing-entity-label--icons"><FaComputer/></span>
                        <span className="syncthing-entity-label--detailed-label">
                            Installed directly on the System via system service (advanced)
                            <br/>
                            <span className="syncthing-entity-label--description">
                                a Systemd system service "<pre>syncthing</pre>" exists.
                            </span>
                        </span>
                    </div>
                </DialogButton>
                <DialogButton onClick={() => select("other-system_system")}>
                    <div className="syncthing-entity-label">
                        <span className="syncthing-entity-label--icons"><FaComputer/></span>
                        <span className="syncthing-entity-label--detailed-label">
                            Installed via another Systemd system service (advanced)
                        </span>
                    </div>
                </DialogButton>
                <DialogButton onClick={() => select("none")}>
                    <div className="syncthing-entity-label">
                        <span className="syncthing-entity-label--icons"><FaCircleQuestion/></span>
                        <span className="syncthing-entity-label--detailed-label">
                            I have not installed Syncthing yet
                        </span>
                    </div>
                </DialogButton>
            </DialogControlsSection>
        </DialogBody>
    );
};

export default WelcomePage;

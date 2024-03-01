import {
    ServerAPI,
} from "decky-frontend-lib";
import {FC} from "react";
import WithSuspense from "../WithSuspense";
import {Wizard} from "../wizard/Wizard";
import style from "../../style.css";
import WelcomePage from "./pages/WelcomePage";
import SetupPage from "./pages/SetupPage";
import StartingPage from "./pages/StartingPage";
import PortPage from "./pages/PortPage";
import ApikeyPage from "./pages/ApikeyPage";
import BasicAuthPage from "./pages/BasicAuthPage";
import AutostartPage from "./pages/AutostartPage";
import FinishPage from "./pages/FinishPage";

export interface SetupPageProps {
    // State passed in from previous page
    statePassedIn: any;
    nextPage: (stateNextPage: any) => void;
    backPage: (stateNextPage: any) => void;
    setBackNavAllowed: (state: boolean) => void;
    serverApi: ServerAPI;
}

interface SetupRouterProps {
    serverApi: ServerAPI
}

export const SetupRouter: FC<SetupRouterProps> = ({ serverApi }) => {
    const pages = [
        {
            title: "Welcome",
            content: WelcomePage,
            shouldSkipOnBack: false,
        },
        {
            title: "Setup",
            content: SetupPage,
            shouldSkipOnBack: true,
        },
        {
            title: "Starting",
            content: StartingPage,
            shouldSkipOnBack: true,
        },
        {
            title: "Port",
            content: PortPage,
            shouldSkipOnBack: true,
        },
        {
            title: "API Key",
            content: ApikeyPage,
            shouldSkipOnBack: true,
        },
        {
            title: "Basic Auth",
            content: BasicAuthPage,
            shouldSkipOnBack: true,
        },
        {
            title: "Autostart",
            content: AutostartPage,
            shouldSkipOnBack: false,
        },
        {
            title: "Finish",
            content: FinishPage,
            shouldSkipOnBack: false,
        },
    ];

    return (
        <WithSuspense route={true}>
            <style>{style}</style>
            <Wizard pages={pages} extraProps={{serverApi}}/>
        </WithSuspense>
    )

};
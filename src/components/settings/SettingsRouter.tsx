import {
    ServerAPI,
    SidebarNavigation,
} from "decky-frontend-lib";
import {FC} from "react";
import WithSuspense from "../WithSuspense";
import {FaBug, FaWrench} from "react-icons/fa";
import {SettingsPage} from "./pages/SettingsPage";
import {FaWandMagic} from "react-icons/fa6";
import {DebugPage} from "./pages/DebugPage";
import {SetupPage} from "./pages/SetupPage";

interface SettingsRouterProps {
    serverApi: ServerAPI
}

export const SettingsRouter: FC<SettingsRouterProps> = ({ serverApi }) => {
    const pages = [
        {
            title: "Setup",
            content: (
                <SetupPage/>
            ),
            route: '/decky-syncthing/settings/setup',
            icon: <FaWandMagic/>,
        },
        {
            title: "Settings",
            content: (
                <SettingsPage serverApi={serverApi}/>
            ),
            route: '/decky-syncthing/settings/general',
            icon: <FaWrench/>,
        },
        {
            title: "Debug",
            content: (
                <DebugPage serverApi={serverApi}/>
            ),
            route: '/decky-syncthing/settings/debug',
            icon: <FaBug/>,
        },
    ];

    return (
        <WithSuspense route={true}>
            <SidebarNavigation pages={pages}/>
        </WithSuspense>
    )

};
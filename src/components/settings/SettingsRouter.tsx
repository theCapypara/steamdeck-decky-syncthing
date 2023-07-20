import {
    ServerAPI,
    SidebarNavigation,
} from "decky-frontend-lib";
import {VFC} from "react";
import WithSuspense from "../WithSuspense";
import {FaClipboardList, FaWrench} from "react-icons/fa";
import {SettingsPage} from "./pages/SettingsPage";
import {LogsPage} from "./pages/LogsPage";

interface SettingsRouterProps {
    serverApi: ServerAPI
}

export const SettingsRouter: VFC<SettingsRouterProps> = ({ serverApi }) => {
    const pages = [
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
                <LogsPage serverApi={serverApi}/>
            ),
            route: '/decky-syncthing/settings/logs',
            icon: <FaClipboardList/>,
        },
    ];

    return (
        <WithSuspense route={true}>
            <SidebarNavigation pages={pages}/>
        </WithSuspense>
    )

};
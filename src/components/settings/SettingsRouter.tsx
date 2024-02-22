import {
    ServerAPI,
    SidebarNavigation,
} from "decky-frontend-lib";
import {FC} from "react";
import WithSuspense from "../WithSuspense";
import {FaWrench} from "react-icons/fa";
import {SettingsPage} from "./pages/SettingsPage";

interface SettingsRouterProps {
    serverApi: ServerAPI
}

export const SettingsRouter: FC<SettingsRouterProps> = ({ serverApi }) => {
    const pages = [
        {
            title: "Settings",
            content: (
                <SettingsPage serverApi={serverApi}/>
            ),
            route: '/decky-syncthing/settings/general',
            icon: <FaWrench/>,
        },
    ];

    return (
        <WithSuspense route={true}>
            <SidebarNavigation pages={pages}/>
        </WithSuspense>
    )

};
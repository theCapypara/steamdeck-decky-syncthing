import {FC, ReactNode} from "react";
import {FaArrowRight, FaCheckCircle} from "react-icons/fa";

export interface WizardSidebarItemProps {
    isCleared: boolean;
    isCurrent: boolean;
    title: ReactNode;
}

export const WizardSidebarItem: FC<WizardSidebarItemProps> = ({ isCleared, isCurrent, title }) => {
    let modifierClass = "", icon: ReactNode = "";

    if (isCleared) {
        icon = <FaCheckCircle/>;
        modifierClass = "syncthing--mod-cleared";
    } else if (isCurrent) {
        icon = <FaArrowRight/>;
        modifierClass = "syncthing--mod-active";
    }

    return (
        <div className={`syncthing-wizard-sidebar-item ${modifierClass}`}>
            <span className={"syncthing-wizard-sidebar-item--icon-container"}>
                {icon}
            </span>
            <span className={"syncthing-wizard-sidebar-item--label"}>
                {title}
            </span>
        </div>
    );
};

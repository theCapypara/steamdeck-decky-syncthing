import {FC, ReactNode} from "react";
import {DialogButton} from "decky-frontend-lib";

interface SyncthingEntityProps {
    label: string | ReactNode;
    primaryIcon?: ReactNode;
    secondaryIcon?: ReactNode;
}

export const SyncthingEntity: FC<SyncthingEntityProps> = ({ primaryIcon, secondaryIcon, label }) => {
    const toggleSection = () => {};

    return (
        <DialogButton focusable={true} onClick={toggleSection}>
            <div className="syncthing-entity-label">
                <span className="syncthing-entity-label--icons">{primaryIcon}{secondaryIcon}</span>
                <span className="syncthing-entity-label--label">{label}</span>
            </div>
        </DialogButton>
    )
}

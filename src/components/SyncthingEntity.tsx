import {FC, ReactNode} from "react";
import {DialogButton} from "decky-frontend-lib";

interface SyncthingEntityProps {
    label: string | ReactNode;
    primaryIcon?: ReactNode;
    secondaryIcon?: ReactNode;
    onClick(e: MouseEvent): void;
}

export const SyncthingEntity: FC<SyncthingEntityProps> = ({ primaryIcon, secondaryIcon, label, onClick }) => {
    return (
        <DialogButton focusable={true} onClick={onClick}>
            <div className="syncthing-entity-label">
                <span className="syncthing-entity-label--icons">{primaryIcon}{secondaryIcon}</span>
                <span className="syncthing-entity-label--label">{label}</span>
            </div>
        </DialogButton>
    )
}

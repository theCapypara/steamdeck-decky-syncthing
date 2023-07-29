import {FC} from "react";
import {SyncthingError} from "../api/SyncthingApi";

interface PanelErrorContentProps {
    error: unknown;
}

export const PanelErrorContent: FC<PanelErrorContentProps> = ({ error }) => {
    if (typeof error == "object") {
        if (error instanceof SyncthingError) {
            if (error.status == 403 || error.status == 401) {
                return (<span>Error: Could not authenticate with Syncthing. Is the API key configured correctly? ({error.message})</span>);
            }
            return (<span>Error communicating with Syncthing (HTTP {error.status}: {error.response}</span>);
        } else if (error instanceof Error) {
            return (<span>Error: {error.message}</span>);
        }
        return (<span>Error: {error?.toString()}</span>);
    } else if (typeof error == "string") {
        return (<span>Error: {error}</span>);
    }
    return (<span>Unknown error.</span>);
}

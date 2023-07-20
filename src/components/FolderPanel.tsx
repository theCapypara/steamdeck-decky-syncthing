import {VFC} from "react";

interface FolderPanelProps {
    port: number;
    apiKey: string;
}

export const FolderPanel: VFC<FolderPanelProps> = ({ port, apiKey }) => {
    return (
        <span>Port: {port} - apiKey: {apiKey}</span>
    );
}

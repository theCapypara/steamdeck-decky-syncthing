import {VFC} from "react";

interface DevicesPanelProps {
    port: number;
    apiKey: string;
}

export const DevicesPanel: VFC<DevicesPanelProps> = ({ port, apiKey }) => {
    return (
        <span>Port: {port} - apiKey: {apiKey}</span>
    );
}

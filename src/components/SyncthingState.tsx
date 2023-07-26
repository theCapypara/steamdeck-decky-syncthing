import {VFC} from "react";
import {FaHourglass, FaPlay, FaQuestionCircle, FaSkull, FaSkullCrossbones, FaStop} from "react-icons/fa";
import {SyncthingProcessState} from "../consts";

interface SyncthingStateProps {
    state: SyncthingProcessState | string
    hasError: boolean;
}

export const SyncthingState: VFC<SyncthingStateProps> = ({ state, hasError }) => {
    if (hasError) {
        return <span><FaSkullCrossbones/> Error</span>;
    }
    switch (state) {
        case SyncthingProcessState.Failed:
            return <span><FaSkull/> Failed</span>;
        case SyncthingProcessState.Stopped:
            return <span><FaStop/> Stopped</span>;
        case SyncthingProcessState.Running:
            return <span><FaPlay/> Running</span>;
        case SyncthingProcessState.Wait:
            return <span><FaHourglass/> Starting</span>;
        default:
            return <span><FaQuestionCircle/> Unknown</span>;
    }
}

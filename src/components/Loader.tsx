import {FC} from "react";
import {Focusable, ProgressBarItem, Spinner} from "decky-frontend-lib";

interface LoaderProps {
    fullScreen?: boolean;
}

export const Loader: FC<LoaderProps> = ({ fullScreen = false }) => {
    if (fullScreen) {
        return (
            <Focusable
                style={{
                    overflowY: 'scroll',
                    backgroundColor: 'transparent',
                    marginTop: '40px',
                    height: 'calc( 100% - 40px )',
                }}
            >
                <div style={{"width": 36, "margin": "auto"}}>
                    <Spinner/>
                </div>
            </Focusable>
    );
    }

    return (
        <ProgressBarItem indeterminate={true} nProgress={0} focusable={true}/>
    );
}

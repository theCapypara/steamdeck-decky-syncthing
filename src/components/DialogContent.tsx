// TODO: Find the actual Steam UI component? It doesn't seem to be called DialogContent.
import {FunctionComponent, PropsWithChildren} from 'react';

const DialogContent: FunctionComponent<PropsWithChildren<{}>> = ({children}) => {
    return (
        <div className={"syncthing-dialog-content"}><div>
            {children}
        </div></div>
    );
};

export default DialogContent;

import React, {
    JSXElementConstructor,
    MutableRefObject,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import {DialogHeader, Focusable, Navigation} from "decky-frontend-lib";
import {WizardSidebarItem} from "./WizardSidebarItem";
import DialogContent from "../DialogContent";

export interface WizardPageProps {
    // State passed in from previous page
    statePassedIn: any;
    nextPage: (stateNextPage: any) => void;
    backPage: (stateNextPage: any) => void;
    setBackNavAllowed: (state: boolean) => void;
}

export interface WizardPage<P> {
    title: ReactNode;
    content: JSXElementConstructor<WizardPageProps & P>;
    shouldSkipOnBack: boolean;
}

export interface WizardProps<P> {
    pages: WizardPage<P>[];
    extraProps: P
}

// this is pretty much FC, but due to the generic "sub-parameter" we have to do it like this.
type WizardType = <P>(props: PropsWithChildren<WizardProps<P>>, context?: any) => ReactElement<any, any> | null;

export const Wizard: WizardType = ({ pages, extraProps }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [currentPageElement, setCurrentPageElement] = useState(<></>);
    const [crossPageState, setCrossPageState] = useState<any[]>([]);
    let backNavAllowed = useRef(true);
    const setBackNavAllowed = (state: boolean) => {
        backNavAllowed.current = state;
    };

    const navForward = (newCrossPageState: any) => {
        console.log("Syncthing wizard: forward");
        if (currentPage + 1 >= pages.length) {
            return;
        }
        setBackNavAllowed(true);
        crossPageState[currentPage + 1] = newCrossPageState
        setCrossPageState(crossPageState);
        setCurrentPage(currentPage + 1);
    };
    const navBack = () => {
        console.log("Syncthing wizard: back");
        if (!backNavAllowed.current) {
            return;
        }
        setBackNavAllowed(true);
        let newPage = currentPage - 1;
        while (newPage >= 0) {
            if (!pages[newPage].shouldSkipOnBack) {
                break;
            }
            newPage--;
        }
        if (newPage == -1) {
            Navigation.NavigateBack();
        } else {
            setCurrentPage(newPage);
        }
    };

    useEffect(() => {
        const activePageConstructor = pages[currentPage].content;
        const props = {
            nextPage: navForward,
            backPage: navBack,
            setBackNavAllowed,
            statePassedIn: crossPageState[currentPage],
            ...extraProps
        };
        let activePage = React.createElement(activePageConstructor, props);
        setCurrentPageElement(activePage);
    }, [currentPage]);


    let sidebarItems = [];

    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        sidebarItems.push(<WizardSidebarItem
            isCleared={i < currentPage}
            isCurrent={i == currentPage}
            title={page.title}
        />);
    }

    // Hack to make sure the dialog stays focused even when a page is switched. Drawback is that the
    // header is focusable even though it doesn't do anything.
    let headerRefStored: MutableRefObject<HTMLElement | null> = useRef(null);
    let headerRef = useCallback(node => {
        console.log("syncthing wizard init header");
        // due to rendering issues we need to wait just a bit.
        setTimeout(() => node?.focus(), 50);
        // if we need to re-focus after an update.
        headerRefStored.current = node;
    }, []);
    const header = (
        <Focusable ref={headerRef} noFocusRing={false} onActivate={() => {}}>
            <DialogHeader>{pages[currentPage].title}</DialogHeader>
        </Focusable>
    );
    headerRefStored.current?.focus();

    return (
        <Focusable onCancel={navBack} style={{height: "100%"}}>
            <div className={"syncthing-wizard-paged"}>
                <div className={"syncthing-wizard-sidebar"}>
                    <div>
                        {sidebarItems}
                    </div>
                </div>
                <div className={"syncthing-wizard-content"}>
                    <Focusable>
                        <DialogContent>
                            {header}
                            {currentPageElement}
                        </DialogContent>
                    </Focusable>
                </div>
            </div>
        </Focusable>
    );
};

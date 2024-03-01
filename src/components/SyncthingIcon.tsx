import {FC} from "react";

// The Syncthing icon is under the original Syncthing license, see https://github.com/syncthing/syncthing
export const SyncthingIcon: FC<{big? : boolean}> = ({big}) => {
    let size;
    if (big) {
        size = "4em";
    } else {
        size = "1em";
    }
    return (<svg version="1.1" viewBox="0 0 117.3 117.3" xmlns="http://www.w3.org/2000/svg" height={size} width={size}>
        <defs>
            <mask id="mask-powermask-path-effect868" maskUnits="userSpaceOnUse">
                <path id="mask-powermask-path-effect868_box" d="m-1-1h119.4v119.4h-119.4z" fill="#fff"/>
                <g>
                    <circle cx="58.7" cy="58.5" r="43.7"
                            d="M 102.4,58.5 A 43.700001,43.700001 0 0 1 58.700001,102.2 43.700001,43.700001 0 0 1 15,58.5 43.700001,43.700001 0 0 1 58.700001,14.799999 43.700001,43.700001 0 0 1 102.4,58.5 Z"
                            fill="none" stroke="#000" stroke-miterlimit="10" stroke-width="6"/>
                    <path d="m94.7 47.8c4.7 1.6 9.8-0.9 11.4-5.6s-0.9-9.8-5.6-11.4-9.8 0.9-11.4 5.6 0.9 9.8 5.6 11.4z"/>
                    <line x1="97.6" x2="67.5" y1="39.4" y2="64.4" d="m 97.599998,39.400002 -30.099998,25" fill="none"
                          stroke="#000" stroke-miterlimit="10" stroke-width="6"/>
                    <path
                        d="m77.6 91c-0.4 4.9 3.2 9.3 8.2 9.8 5 0.4 9.3-3.2 9.8-8.2 0.4-4.9-3.2-9.3-8.2-9.8-5-0.4-9.4 3.2-9.8 8.2z"/>
                    <line x1="86.5" x2="67.5" y1="91.8" y2="64.4" d="M 86.5,91.800003 67.5,64.400002" fill="none"
                          stroke="#000" stroke-miterlimit="10" stroke-width="6"/>
                    <path
                        d="m60 69.3c2.7 4.2 8.3 5.4 12.4 2.7 4.2-2.7 5.4-8.3 2.7-12.4-2.7-4.2-8.3-5.4-12.4-2.7-4.2 2.6-5.4 8.2-2.7 12.4z"/>
                    <path
                        d="m21.2 61.4c-4.3-2.5-9.8-1.1-12.3 3.1-2.5 4.3-1.1 9.8 3.1 12.3 4.3 2.5 9.8 1.1 12.3-3.1s1.1-9.7-3.1-12.3z"/>
                    <line x1="16.6" x2="67.5" y1="69.1" y2="64.4" d="M 16.6,69.099998 67.5,64.400002" fill="none"
                          stroke="#000" stroke-miterlimit="10" stroke-width="6"/>
                </g>
            </mask>
        </defs>
        <path
            d="m117.4 58.7a58.7 58.7 0 0 1-58.7 58.7 58.7 58.7 0 0 1-58.7-58.7 58.7 58.7 0 0 1 58.7-58.7 58.7 58.7 0 0 1 58.7 58.7z"
            fill="currentColor" mask="url(#mask-powermask-path-effect868)"/>
    </svg>);
}

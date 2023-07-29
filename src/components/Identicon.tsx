import {FC, useEffect, useRef} from "react";

// Since this is a pretty specific way of generating this, it's taken from
// https://github.com/syncthing/syncthing/blob/341b79814ec9eb9740705e935f653c358832ea67/gui/default/syncthing/core/identiconDirective.js#L5
// Licensed under Mozilla Public License Version 2.0.

const svgNS = 'http://www.w3.org/2000/svg';

interface IdenticonProps {
    ident: string;
}

export const Identicon: FC<IdenticonProps> = ({ident}) => {
    const ref = useRef<HTMLSpanElement>(null);

    function Identicon(value: any, size = 5) {
        let rectSize: number;
        let middleCol: number;
        let row;
        let col;

        const svg = document.createElementNS(svgNS, 'svg');
        const shouldFillRectAt = function (row: number, col: number) {
            return !(parseInt(value.charCodeAt(row + col * size), 10) % 2);
        };
        const shouldMirrorRectAt = function (_: number, col: number) {
            return !(size % 2 && col === middleCol)
        };
        const mirrorColFor = function (col: number) {
            return size - col - 1;
        };
        const fillRectAt = function (row: number, col: number) {
            const rect = document.createElementNS(svgNS, 'rect');

            rect.setAttribute('x', (col * rectSize) + '%');
            rect.setAttribute('y', (row * rectSize) + '%');
            rect.setAttribute('width', rectSize + '%');
            rect.setAttribute('height', rectSize + '%');

            svg.appendChild(rect);
        };

        svg.setAttribute('class', 'syncthing-identicon');
        rectSize = 100 / size;
        middleCol = Math.ceil(size / 2) - 1;

        if (value) {
            value = value.toString().replace(/[\W_]/i, '');

            for (row = 0; row < size; ++row) {
                for (col = middleCol; col > -1; --col) {
                    if (shouldFillRectAt(row, col)) {
                        fillRectAt(row, col);

                        if (shouldMirrorRectAt(row, col)) {
                            fillRectAt(row, mirrorColFor(col));
                        }
                    }
                }
            }
        }

        return svg;
    }

    useEffect(() => {
        const svg = Identicon(ident);

        while (ref.current?.firstChild) {
            ref.current.removeChild(svg);
        }

        ref.current?.appendChild(svg);
    }, [ident]);

    return (
        <span ref={ref}/>
    )
}

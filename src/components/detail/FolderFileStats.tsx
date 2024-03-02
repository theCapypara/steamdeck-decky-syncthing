import {FC} from "react";
import {FaCopy, FaFolder, FaHdd} from "react-icons/fa";
import {byteUnit} from "../../byteUnit";

export interface FolderFileStatsProps {
    bytes: number;
    files: number;
    directories: number;
}

export const FolderFileStats: FC<FolderFileStatsProps> = ({bytes, files, directories}) => {
    return (<>
        <span style={{paddingRight: "8px"}}>
            <FaCopy/> {files}
        </span>
        <span style={{paddingRight: "8px"}}>
            <FaFolder/> {directories}
        </span>
        <span>
            <FaHdd/> {byteUnit(bytes)}
        </span>
    </>);
}

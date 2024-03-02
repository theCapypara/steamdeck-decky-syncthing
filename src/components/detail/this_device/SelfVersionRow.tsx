import {FC} from "react";
import {Field} from "decky-frontend-lib";
import {StVersion} from "../../../api/SyncthingApi";
import {FaTag} from "react-icons/fa";

export interface SelfVersionRowProps {
    version: StVersion;
}

export const SelfVersionRow: FC<SelfVersionRowProps> = ({version}) => {
    if (!version.version) {
        return <></>;
    }

    const os = {
        'darwin': 'macOS',
        'dragonfly': 'DragonFly BSD',
        'freebsd': 'FreeBSD',
        'openbsd': 'OpenBSD',
        'netbsd': 'NetBSD',
        'linux': 'Linux',
        'windows': 'Windows',
        'solaris': 'Solaris'
    }[version.os!] || version.os!;

    let arch = {
        '386': '32-bit Intel/AMD',
        'amd64': '64-bit Intel/AMD',
        'arm': '32-bit ARM',
        'arm64': '64-bit ARM',
        'ppc64': '64-bit PowerPC',
        'ppc64le': '64-bit PowerPC (LE)',
        'mips': '32-bit MIPS',
        'mipsle': '32-bit MIPS (LE)',
        'mips64': '64-bit MIPS',
        'mips64le': '64-bit MIPS (LE)',
        'riscv64': '64-bit RISC-V',
        's390x': '64-bit z/Architecture',
    }[version.arch!] || version.arch!;

    if (version.container) {
        arch += " Container";
    }

    let verStr = version.version;
    if (version.extra) {
        verStr += ' (' + version.extra + ')';
    }

    return (
        <Field focusable={true} label="Version" icon={<FaTag/>}>
            {verStr}, {os} ({arch})
        </Field>
    )
}

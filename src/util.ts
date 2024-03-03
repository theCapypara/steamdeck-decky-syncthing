// Source: https://stackoverflow.com/a/14919494
export function byteUnit(bytes: number, si=false, dp=1): string {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}

// Source: https://github.com/syncthing/syncthing/blob/ac942e2481fa0692f0a51bd9fd6b2a6b4142bd32/gui/default/syncthing/core/durationFilter.js#L4
const SECONDS_IN = {"d": 86400, "h": 3600, "m": 60, "s": 1};
export function durationUnit(input: number, precision = "s"): string {
    let result = "";
    for (let k in SECONDS_IN) {
        const t = (input / SECONDS_IN[k] | 0); // Math.floor

        if (t > 0) {
            if (!result) {
                result = t + k;
            } else {
                result += " " + t + k;
            }
        }

        if (precision == k) {
            return result ? result : "<1" + k;
        } else {
            input %= SECONDS_IN[k];
        }
    }
    return "[Error: incorrect usage, precision must be one of " + Object.keys(SECONDS_IN) + "]";
}

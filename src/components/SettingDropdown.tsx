import {Dropdown, Field, SingleDropdownOption} from 'decky-frontend-lib';
import {FunctionComponent, ReactNode} from 'react';

type OptionValue = string | { label: string; description: string; };

interface SettingDropdownProps {
    label: string;
    options: Record<string, OptionValue>;
    setting: string;
    value: any;
    onChange: (setting: string, value: string) => void;
}

const SettingDropdown: FunctionComponent<SettingDropdownProps> = ({label, options, value, setting, onChange}) => {
    const labelFn = (option: OptionValue): string => {
        if (typeof option == "string") {
            return option;
        } else {
            return option.label;
        }
    }

    const labelDescFn = (option: OptionValue): ReactNode => {
        if (typeof option == "string") {
            return option;
        } else {
            return (
                <div>
                    {option.label}
                    <br />
                    <span className={"syncthing-details"}>
                        {option.description}
                    </span>
                </div>
            );
        }
    }

    const onChangeInner = (value: SingleDropdownOption) => onChange(setting, value.data);
    const optionsArr = [];
    const optionsObjArr: SingleDropdownOption[] = [];
    for (const option in options) {
        optionsArr.push(option);
        optionsObjArr.push({label: labelDescFn(options[option]), data: option})
    }

    return (
        <Field label={label} description={(
            <Dropdown
                rgOptions={optionsObjArr}
                selectedOption={optionsArr.indexOf(value)}
                onChange={onChangeInner}
                menuLabel={label}
                strDefaultLabel={labelFn(options[value])}
                focusable={true}
            />
        )}/>
    );
};

export default SettingDropdown;

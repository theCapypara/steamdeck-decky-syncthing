import {Dropdown, Field, SingleDropdownOption} from 'decky-frontend-lib';
import {FunctionComponent} from 'react';

interface SettingDropdownProps {
    label: string;
    options: Record<string, string>;
    setting: string;
    value: any;
    onChange: (setting: string, value: string) => void;
}

const SettingDropdown: FunctionComponent<SettingDropdownProps> = ({label, options, value, setting, onChange}) => {
    const onChangeInner = (value: SingleDropdownOption) => onChange(setting, value.data);
    const optionsArr = [];
    const optionsObjArr: SingleDropdownOption[] = [];
    for (const option in options) {
        optionsArr.push(option);
        optionsObjArr.push({label: options[option], data: option})
    }

    return (
        <Field label={label} description={(
            <Dropdown
                rgOptions={optionsObjArr}
                selectedOption={optionsArr.indexOf(value)}
                onChange={onChangeInner}
                menuLabel={label}
                strDefaultLabel={options[value]}
                focusable={true}
            />
        )}/>
    );
};

export default SettingDropdown;

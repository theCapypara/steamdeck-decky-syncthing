import {Field, TextField, Toggle} from 'decky-frontend-lib';
import {ChangeEventHandler, FunctionComponent} from 'react';

interface SettingProps {
    type: string;
    label: string;
    setting: string;
    description?: string;
    value: any;
    onChange: (setting: string, value: string) => void;
}

const Setting: FunctionComponent<SettingProps> = ({type, label, setting, value, description, onChange}) => {
    const onChangeInner = (value: any) => onChange(setting, value);
    const onChangeTextFieldInner: ChangeEventHandler<HTMLInputElement> = (e) => onChangeInner(e.target.value);

    switch (type) {
        case "password":
            return (
                <Field label={label} description={(
                    <TextField
                        value={value}
                        bIsPassword={true}
                        onChange={onChangeTextFieldInner}
                        description={description}
                    />
                )} />
            );
        case "bool":
            return (
                <Field label={label}>
                    <Toggle
                        value={value}
                        onChange={onChangeInner}
                    />
                </Field>
            );
        case "int":
            return (
                <Field label={label}>
                    <TextField
                        value={value}
                        rangeMin={1}
                        mustBeNumeric={true}
                        onChange={onChangeTextFieldInner}
                        style={{ minWidth: '80px' }}
                        description={description}
                    />
                </Field>
            );
        case "str":
        default:
            return (
                <Field label={label} description={(
                    <TextField
                        value={value}
                        onChange={onChangeTextFieldInner}
                        description={description}
                    />
                )} />
            );
    }
};

export default Setting;
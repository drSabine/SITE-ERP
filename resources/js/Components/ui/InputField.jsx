import InputLabel from './InputLabel';
import TextInput from './TextInput';
import InputError from './InputError';

export default function InputField({ label, id, error, className = '', inputClassName = '', ...props }) {
    return (
        <div className={className}>
            <InputLabel htmlFor={id} value={label} />
            <TextInput id={id} className={`mt-1 block w-full ${inputClassName}`} {...props} />
            {error && <InputError message={error} className="mt-1" />}
        </div>
    );
}

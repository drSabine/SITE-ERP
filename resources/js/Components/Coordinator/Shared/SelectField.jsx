import { InputError, InputLabel } from '@/Components/ui';

export default function SelectField({ label, error, children, className = '', selectClassName = '', ...props }) {
    return (
        <div className={className}>
            <InputLabel value={label} />
            <select
                className={`mt-1 block w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 ${selectClassName}`}
                {...props}
            >
                {children}
            </select>
            {error && <InputError message={error} className="mt-1" />}
        </div>
    );
}

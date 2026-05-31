export default function FilterSelect({ children, className = '', ...props }) {
    return (
        <select
            className={`rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}

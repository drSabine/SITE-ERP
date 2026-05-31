export default function FilterBar({ children, className = '' }) {
    return (
        <div className={`flex flex-wrap items-center gap-3 border-b border-gray-100 px-6 py-3 ${className}`}>
            {children}
        </div>
    );
}

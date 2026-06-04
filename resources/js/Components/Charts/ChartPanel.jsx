export default function ChartPanel({ eyebrow, title, children, empty = false, emptyMessage = 'No chart data available.' }) {
    return (
        <div className="border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
                {eyebrow && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{eyebrow}</p>
                )}
                <h2 className="mt-1 text-sm font-semibold leading-tight text-gray-900">{title}</h2>
            </div>

            {empty ? (
                <div className="flex h-36 items-center justify-center border border-dashed border-gray-200 bg-gray-50">
                    <p className="px-3 text-center text-xs text-gray-500">{emptyMessage}</p>
                </div>
            ) : (
                <div className="h-40">{children}</div>
            )}
        </div>
    );
}

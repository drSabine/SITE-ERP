export default function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="border border-gray-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-xs font-semibold text-gray-900">{label}</p>
            <div className="mt-1.5 space-y-1">
                {payload.map(item => (
                    <p key={item.dataKey} className="whitespace-nowrap text-[11px] text-gray-500">
                        <span className="font-semibold" style={{ color: item.color }}>{item.name}</span>
                        <span>: {item.value}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

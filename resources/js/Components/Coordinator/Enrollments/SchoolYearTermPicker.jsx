import { getSemesterLabel } from '@/Components/Coordinator/Shared';

export default function SchoolYearTermPicker({
    selectedSchoolYear,
    selectedTermId,
    terms,
    onTermClick,
}) {
    return (
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    School Year
                </span>
                <span className="text-sm font-semibold text-emerald-800">
                    {selectedSchoolYear?.name ?? 'No active school year'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">· Active</span>
            </div>

            {terms.length > 0 && (
                <div className="mt-3 flex gap-1">
                    {terms.map(term => (
                        <button
                            key={term.id}
                            type="button"
                            onClick={() => onTermClick(term.id)}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                                selectedTermId === term.id
                                    ? 'bg-emerald-700 text-white'
                                    : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {getSemesterLabel(term.semester)}
                            {term.is_active && (
                                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest opacity-75">
                                    Active
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

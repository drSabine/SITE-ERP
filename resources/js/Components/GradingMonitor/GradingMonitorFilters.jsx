import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';

export function buildTeacherName(teacher) {
    const profile = teacher.user_profile;
    if (!profile) return teacher.name;
    return `${profile.last_name}, ${profile.first_name}`;
}

export default function GradingMonitorFilters({
    filters,
    schoolYears,
    programs,
    teachers,
    sections,
    onApplyFilters,
}) {
    const selectedSchoolYear = schoolYears.find((schoolYear) =>
        (schoolYear.academic_terms ?? []).some((academicTerm) => academicTerm.id === Number(filters.term_id))
    );
    const termsForSelectedSchoolYear = selectedSchoolYear?.academic_terms ?? [];

    return (
        <div className="border-b border-gray-200 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
                <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">School Year</label>
                <select
                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    value={selectedSchoolYear?.id ?? ''}
                    onChange={(event) => {
                        const schoolYear = schoolYears.find((item) => item.id === Number(event.target.value));
                        const firstTerm = schoolYear?.academic_terms?.[0];
                        onApplyFilters({ term_id: firstTerm?.id ?? '', section_id: '' });
                    }}
                >
                    {schoolYears.map((schoolYear) => (
                        <option key={schoolYear.id} value={schoolYear.id}>
                            S.Y. {schoolYear.name}
                        </option>
                    ))}
                </select>
            </div>

                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Academic Term</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                    {termsForSelectedSchoolYear.map((academicTerm) => (
                        <button
                            key={academicTerm.id}
                            type="button"
                            onClick={() => onApplyFilters({ term_id: academicTerm.id })}
                            className={`border px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                                academicTerm.id === Number(filters.term_id)
                                    ? 'border-emerald-700 bg-emerald-700 text-white'
                                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {getSemesterLabel(academicTerm.semester)}
                        </button>
                    ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Program</label>
                <select
                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    value={filters.program_id ?? ''}
                    onChange={(event) => onApplyFilters({ program_id: event.target.value, section_id: '' })}
                >
                    <option value="">All programs</option>
                    {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                            {program.code}
                        </option>
                    ))}
                </select>
            </div>

                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Year Level</label>
                    <select
                        className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                        value={filters.year_level ?? ''}
                        onChange={(event) => onApplyFilters({ year_level: event.target.value })}
                    >
                        <option value="">All year levels</option>
                        {[1, 2, 3, 4].map((yearLevel) => (
                            <option key={yearLevel} value={yearLevel}>
                                {getYearLabel(yearLevel)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Teacher</label>
                <select
                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    value={filters.teacher_id ?? ''}
                    onChange={(event) => onApplyFilters({ teacher_id: event.target.value })}
                >
                    <option value="">All teachers</option>
                    {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                            {buildTeacherName(teacher)}
                        </option>
                    ))}
                </select>
            </div>

                <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Section</label>
                <select
                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    value={filters.section_id ?? ''}
                    onChange={(event) => onApplyFilters({ section_id: event.target.value })}
                >
                    <option value="">All sections</option>
                    {sections
                        .filter((section) => !filters.program_id || String(section.program_id) === String(filters.program_id))
                        .map((section) => (
                            <option key={section.id} value={section.id}>
                                {section.name} - {section.program?.code} {getYearLabel(section.year_level)}
                            </option>
                        ))}
                </select>
                </div>
            </div>
        </div>
    );
}

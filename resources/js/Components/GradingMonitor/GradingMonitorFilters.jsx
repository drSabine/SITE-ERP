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
        <div className="mb-4 grid grid-cols-1 gap-3 border border-gray-200 p-4 md:grid-cols-5">
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
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Term</label>
                <select
                    className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    value={filters.term_id ?? ''}
                    onChange={(event) => onApplyFilters({ term_id: event.target.value })}
                >
                    <option value="">All terms</option>
                    {termsForSelectedSchoolYear.map((academicTerm) => (
                        <option key={academicTerm.id} value={academicTerm.id}>
                            {getSemesterLabel(academicTerm.semester)}
                        </option>
                    ))}
                </select>
            </div>

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
    );
}

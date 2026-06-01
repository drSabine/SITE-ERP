import {
    ENROLLMENT_STATUS_OPTIONS,
    FilterBar,
    FilterSelect,
    YEAR_LEVELS,
    getYearLabel,
} from '@/Components/Coordinator/Shared';

export default function EnrollmentFilters({
    programs,
    programId,
    yearLevel,
    status,
    onProgramChange,
    onYearLevelChange,
    onStatusChange,
}) {
    return (
        <FilterBar>
            <FilterSelect value={programId} onChange={onProgramChange}>
                <option value="">All Programs</option>
                {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.code}</option>
                ))}
            </FilterSelect>
            <FilterSelect value={yearLevel} onChange={onYearLevelChange}>
                <option value="">All Year Levels</option>
                {YEAR_LEVELS.map(level => (
                    <option key={level} value={level}>{getYearLabel(level)}</option>
                ))}
            </FilterSelect>
            <FilterSelect value={status} onChange={onStatusChange}>
                <option value="all">All Statuses</option>
                {ENROLLMENT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </FilterSelect>
        </FilterBar>
    );
}

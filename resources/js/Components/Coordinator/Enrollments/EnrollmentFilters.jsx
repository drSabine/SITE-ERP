import { SearchBar } from '@/Components/ui';
import {
    ENROLLMENT_STATUS_OPTIONS,
    FilterBar,
    FilterSelect,
    YEAR_LEVELS,
    getYearLabel,
} from '@/Components/Coordinator/Shared';

export default function EnrollmentFilters({
    search,
    filters,
    programs,
    programId,
    yearLevel,
    sections = [],
    sectionId,
    status,
    onSearchChange,
    onSearchSubmit,
    onSearchClear,
    onProgramChange,
    onYearLevelChange,
    onSectionChange,
    onStatusChange,
}) {
    return (
        <FilterBar>
            <SearchBar
                value={search}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
                onClear={onSearchClear}
                active={!!filters.search}
                placeholder="Search student by name..."
            />
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
            <FilterSelect value={sectionId} onChange={onSectionChange}>
                <option value="">All Sections</option>
                {sections.map(section => (
                    <option key={section.id} value={section.id}>
                        {section.name} ({section.program?.code} {getYearLabel(section.year_level)})
                    </option>
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

import { SearchBar } from '@/Components/ui';
import { FilterBar, FilterSelect, STUDENT_STATUS_OPTIONS } from '@/Components/Coordinator/Shared';

export default function StudentFilters({
    search,
    filters,
    programs,
    programId,
    status,
    onSearchChange,
    onSearchSubmit,
    onSearchClear,
    onProgramChange,
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
                placeholder="Search by name or student number..."
            />
            <FilterSelect value={programId} onChange={onProgramChange}>
                <option value="">All Programs</option>
                {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.code}</option>
                ))}
            </FilterSelect>
            <FilterSelect value={status} onChange={onStatusChange}>
                {STUDENT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </FilterSelect>
        </FilterBar>
    );
}

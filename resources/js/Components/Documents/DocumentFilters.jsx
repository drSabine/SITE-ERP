import { SearchBar } from '@/Components/ui';

const selectClass =
    'rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500';

export default function DocumentFilters({
    search,
    onSearchChange,
    onSearchSubmit,
    onClear,
    searchActive = false,
    category,
    status,
    categories,
    onCategoryChange,
    onStatusChange,
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
            <SearchBar
                value={search}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
                onClear={onClear}
                active={searchActive}
                placeholder="Search documents..."
            />

            <div className="flex items-center gap-3">
                <select value={category} onChange={onCategoryChange} className={selectClass}>
                    <option value="">All Categories</option>
                    {categories.map(option => (
                        <option key={option.id} value={String(option.id)}>{option.name}</option>
                    ))}
                </select>

                <select value={status} onChange={onStatusChange} className={selectClass}>
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
        </div>
    );
}

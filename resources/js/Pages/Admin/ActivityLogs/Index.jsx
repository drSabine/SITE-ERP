import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PagePanel, SearchBar } from '@/Components/ui';

function formatDateTime(value) {
    if (!value) return '-';

    return new Date(value).toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function filterParams({ search, module, action }) {
    return {
        search: search || undefined,
        module: module || undefined,
        action: action || undefined,
    };
}

export default function Index({ activityLogs, filters = {}, filterOptions = {} }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [module, setModule] = useState(filters.module ?? '');
    const [action, setAction] = useState(filters.action ?? '');

    function applyFilters(nextFilters = {}) {
        const merged = {
            search,
            module,
            action,
            ...nextFilters,
        };

        router.get(route('admin.activity-logs.index'), filterParams(merged), {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function handleSearch(event) {
        event.preventDefault();
        applyFilters();
    }

    function handleClear() {
        setSearch('');
        setModule('');
        setAction('');
        applyFilters({ search: '', module: '', action: '' });
    }

    const columns = [
        { key: 'created_at', label: 'Date / Time', className: 'text-gray-500', render: row => formatDateTime(row.created_at) },
        { key: 'user', label: 'User', className: 'font-semibold text-gray-900', render: row => row.user?.name ?? 'System' },
        { key: 'module', label: 'Module', className: 'text-gray-600' },
        { key: 'action', label: 'Action', className: 'font-mono text-xs uppercase text-gray-500' },
        { key: 'description', label: 'Description', className: 'text-gray-700' },
        { key: 'ip_address', label: 'IP Address', className: 'font-mono text-xs text-gray-500' },
    ];

    return (
        <AuthenticatedLayout header="Activity Logs">
            <Head title="Activity Logs" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-6">
                    <PagePanel
                        title="Activity Logs"
                        description="Audit trail for administrative and security activity."
                    >
                        <div className="space-y-3 border-b border-gray-100 px-6 py-4">
                            <SearchBar
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                onSubmit={handleSearch}
                                onClear={handleClear}
                                active={!!(filters.search || filters.module || filters.action)}
                                placeholder="Search user, module, action, or description..."
                            />

                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={module}
                                    onChange={event => {
                                        setModule(event.target.value);
                                        applyFilters({ module: event.target.value });
                                    }}
                                    className="border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="">All modules</option>
                                    {(filterOptions.modules ?? []).map(moduleOption => (
                                        <option key={moduleOption} value={moduleOption}>{moduleOption}</option>
                                    ))}
                                </select>

                                <select
                                    value={action}
                                    onChange={event => {
                                        setAction(event.target.value);
                                        applyFilters({ action: event.target.value });
                                    }}
                                    className="border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="">All actions</option>
                                    {(filterOptions.actions ?? []).map(actionOption => (
                                        <option key={actionOption} value={actionOption}>{actionOption}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <DataTable
                            columns={columns}
                            rows={activityLogs.data}
                            pagination={activityLogs}
                            emptyMessage="No activity logs found."
                        />
                    </PagePanel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

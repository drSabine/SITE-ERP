import { router } from '@inertiajs/react';

/**
 * Pagination strip for Laravel paginator objects.
 * Renders nothing when there is only one page.
 *
 * pagination: Laravel paginator (links, from, to, total, last_page)
 */
export default function Pagination({ pagination }) {
    if (!pagination || pagination.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 text-sm text-gray-500">
            <span>Showing {pagination.from}-{pagination.to} of {pagination.total}</span>
            <div className="flex gap-1">
                {pagination.links.map((link, index) => (
                    <button
                        key={index}
                        disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`border px-3 py-1 text-xs font-medium ${
                            link.active
                                ? 'border-emerald-600 bg-emerald-700 text-white'
                                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

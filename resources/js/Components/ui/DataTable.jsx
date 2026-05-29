import { Fragment } from 'react';
import Pagination from './Pagination';

const thClass = 'px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500';

function displayCellValue(value) {
    if (value === null || value === undefined || value === '') return '-';
    return value;
}

/**
 * Reusable table with optional inline pagination and expandable rows.
 *
 * columns: Array<{
 *   key: string,
 *   label: string,
 *   headerClass?: string,
 *   className?: string,
 *   widthClassName?: string,
 *   render?: (row) => ReactNode,
 * }>
 * rows: Array - must have an `.id` field
 * actions?: (row) => ReactNode - rendered in a right-aligned last column
 * emptyMessage?: string
 * pagination?: Laravel paginator object (has .links, .from, .to, .total, .last_page)
 * expandedRowId?: number | string - id of the currently expanded row
 * renderExpandedRow?: (row) => ReactNode - content shown below the expanded row
 */
export default function DataTable({
    columns,
    rows,
    actions,
    emptyMessage = 'No records found.',
    pagination,
    expandedRowId,
    renderExpandedRow,
    tableClassName = '',
    actionsColumnClassName = '',
}) {
    const colSpan = columns.length + (actions ? 1 : 0);

    return (
        <div>
            <div className="overflow-x-auto">
                <table className={`min-w-full divide-y divide-gray-200 ${tableClassName}`}>
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map(column => (
                                <th
                                    key={column.key}
                                    className={`${thClass} ${column.widthClassName ?? ''} ${column.headerClass ?? ''}`}
                                >
                                    {column.label}
                                </th>
                            ))}
                            {actions && <th className={`px-5 py-3 ${actionsColumnClassName}`} />}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : rows.map((row, index) => (
                            <Fragment key={row.id ?? index}>
                                <tr className="hover:bg-gray-50">
                                    {columns.map(column => (
                                        <td
                                            key={column.key}
                                            className={`px-5 py-4 text-sm align-middle ${column.widthClassName ?? ''} ${column.className ?? 'text-gray-700'}`}
                                        >
                                            {column.render ? column.render(row) : displayCellValue(row[column.key])}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className={`px-5 py-4 text-right align-middle ${actionsColumnClassName}`}>
                                            <div className="flex items-center justify-end gap-3">
                                                {actions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                                {renderExpandedRow && expandedRowId === row.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan={colSpan} className="px-6 py-4">
                                            {renderExpandedRow(row)}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination pagination={pagination} />
        </div>
    );
}

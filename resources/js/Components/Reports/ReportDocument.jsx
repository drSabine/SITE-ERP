import { Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { PrimaryButton } from '@/Components/ui';
import { BackIcon, PrintIcon } from '@/Components/ui/Icons';

const UNIVERSITY = 'St. Paul University Philippines';
const DEPARTMENT = 'School of Information Technology and Engineering';
const CREDIT = 'Developed by BSIT-3B Major in Website Development, a requirement for ITE 125. S.Y 2025-2026.';

function formatTimestamp(value) {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
}

/**
 * Branded, print-optimized document shell. On screen it shows a toolbar (Back +
 * Save as PDF); on print only the document prints — the app chrome is already
 * print:hidden in AuthenticatedLayout. Saving as PDF uses the browser print dialog.
 */
export function ReportDocument({ title, subtitle, generatedAt, backHref, autoPrint = false, children }) {
    const printed = useRef(false);

    useEffect(() => {
        if (!autoPrint || printed.current) return;
        printed.current = true;
        const timer = setTimeout(() => window.print(), 350);
        return () => clearTimeout(timer);
    }, [autoPrint]);

    return (
        <div className="py-8 print:py-0">
            <div className="mx-auto max-w-4xl px-6 print:max-w-none print:px-0">
                {/* Toolbar — never printed */}
                <div className="report-toolbar mb-6 flex items-center justify-between print:hidden">
                    {backHref ? (
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                        >
                            <BackIcon className="h-4 w-4" /> Back
                        </Link>
                    ) : <span />}
                    <PrimaryButton type="button" onClick={() => window.print()}>
                        <PrintIcon className="mr-1.5 h-4 w-4" /> Save as PDF
                    </PrimaryButton>
                </div>

                {/* The printable document */}
                <div className="report-doc border border-gray-200 bg-white p-10 shadow-sm print:border-0 print:p-0 print:shadow-none">
                    <header className="flex items-start justify-between gap-6 border-b-2 border-emerald-700 pb-5">
                        <div className="flex items-center gap-4">
                            <img src="/images/SPUP-final-logo.png" alt="SPUP" className="h-16 w-16 object-contain" />
                            <div className="leading-tight">
                                <p className="text-lg text-emerald-900" style={{ fontFamily: "'OldEnglish', serif" }}>{UNIVERSITY}</p>
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">{DEPARTMENT}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-base font-bold uppercase tracking-wide text-gray-900">{title}</h1>
                            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
                            <p className="mt-2 text-[10px] uppercase tracking-widest text-gray-400">Generated {formatTimestamp(generatedAt)}</p>
                        </div>
                    </header>

                    <div className="mt-7 space-y-7">
                        {children}
                    </div>

                    <footer className="mt-10 border-t border-gray-200 pt-4 text-center">
                        <p className="text-[10px] text-gray-400">{CREDIT}</p>
                    </footer>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 14mm; }
                    html, body { background: #ffffff !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .report-section { break-inside: avoid; }
                    thead { display: table-header-group; }
                    tr { break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}

/** A grid of labelled stat tiles (overview figures). */
export function ReportStats({ items }) {
    return (
        <div className="report-section grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map(item => (
                <div key={item.label} className="border border-gray-200 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${item.accent ?? 'text-gray-900'}`}>{item.value}</p>
                    {item.hint && <p className="mt-0.5 text-[10px] text-gray-400">{item.hint}</p>}
                </div>
            ))}
        </div>
    );
}

export function ReportSection({ title, description, children }) {
    return (
        <section className="report-section">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
            <div className="mt-3">{children}</div>
        </section>
    );
}

/**
 * Plain semantic table tuned for print. columns: [{ key, label, align, render }].
 * footer: optional array of cells (strings/nodes) rendered as a bold summary row.
 */
export function ReportTable({ columns, rows, footer, emptyMessage = 'No records.' }) {
    const alignClass = align => (align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left');

    if (!rows || rows.length === 0) {
        return <p className="border border-gray-200 px-4 py-8 text-center text-sm text-gray-400">{emptyMessage}</p>;
    }

    return (
        <table className="w-full border-collapse text-sm">
            <thead>
                <tr>
                    {columns.map(col => (
                        <th
                            key={col.key}
                            className={`border border-emerald-700 bg-emerald-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white ${alignClass(col.align)}`}
                        >
                            {col.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, index) => (
                    <tr key={row.id ?? index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                        {columns.map(col => (
                            <td key={col.key} className={`border border-gray-200 px-3 py-1.5 text-gray-700 ${alignClass(col.align)}`}>
                                {col.render ? col.render(row) : row[col.key]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
            {footer && (
                <tfoot>
                    <tr className="bg-emerald-50 font-bold text-emerald-900">
                        {footer.map((cell, index) => (
                            <td key={index} className={`border border-emerald-200 px-3 py-2 ${alignClass(columns[index]?.align)}`}>{cell}</td>
                        ))}
                    </tr>
                </tfoot>
            )}
        </table>
    );
}

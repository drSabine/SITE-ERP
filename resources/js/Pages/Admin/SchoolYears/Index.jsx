import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PrimaryButton, StatusBadge, ConfirmModal } from '@/Components/ui';
import { SchoolYearFormModal, TermsPanel, SEMESTER_LABELS } from '@/Components/Admin/SchoolYears';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

const thClass = 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500';

function syStatus(sy) {
    if (sy.is_active) return 'active';
    if (sy.status === 'finalized') return 'finalized';
    return 'inactive';
}

export default function Index({ schoolYears }) {
    const [showForm, setShowForm]           = useState(false);
    const [editTarget, setEditTarget]       = useState(null);
    const [expandedSY, setExpandedSY]       = useState(null);
    const [terms, setTerms]                 = useState([]);
    const [loadingTerms, setLoadingTerms]   = useState(false);
    const [confirm, setConfirm]             = useState(null); // { title, message, confirmLabel, onConfirm }

    function openCreate() { setEditTarget(null); setShowForm(true); }
    function openEdit(sy) { setEditTarget(sy); setShowForm(true); }

    function loadTerms(syId) {
        return axios.get(route('admin.academic-terms.index'), { params: { school_year_id: syId } })
            .then(response => setTerms(response.data));
    }

    function toggleExpand(sy) {
        if (expandedSY === sy.id) { setExpandedSY(null); setTerms([]); return; }
        setExpandedSY(sy.id);
        setLoadingTerms(true);
        loadTerms(sy.id).finally(() => setLoadingTerms(false));
    }

    function activateSY(sy)  { router.post(route('admin.school-years.activate', sy.id)); }
    function activateTerm(t) { router.post(route('admin.academic-terms.activate', t.id)); }

    function addSummerTerm(sy) {
        router.post(route('admin.academic-terms.store', sy.id), { semester: 'summer' }, {
            onSuccess: () => loadTerms(sy.id),
        });
    }

    function requestFinalizeTerm(term) {
        setConfirm({
            title: `Finalize ${SEMESTER_LABELS[term.semester]}`,
            message: <>Lock all active grades for <strong>{SEMESTER_LABELS[term.semester]}</strong> and mark it inactive. This cannot be undone.</>,
            confirmLabel: 'Finalize Term',
            onConfirm: () => router.post(route('admin.academic-terms.finalize', term.id), {}, {
                onSuccess: () => { setConfirm(null); loadTerms(term.school_year_id); },
            }),
        });
    }

    function requestFinalizeSY(sy) {
        setConfirm({
            title: 'Finalize School Year',
            message: <>Lock <strong>{sy.name}</strong> and mark it finalized. No further changes allowed.</>,
            confirmLabel: 'Finalize School Year',
            onConfirm: () => router.post(route('admin.school-years.finalize', sy.id), {}, {
                onSuccess: () => setConfirm(null),
            }),
        });
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">School Years</h2>}>
            <Head title="School Years" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <p className="text-sm text-gray-500">Manage academic years and their semesters.</p>
                        <PrimaryButton onClick={openCreate}>+ New School Year</PrimaryButton>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={thClass}>Year</th>
                                    <th className={thClass}>Duration</th>
                                    <th className={thClass}>Status</th>
                                    <th className={thClass}>Terms</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {schoolYears.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                                            No school years yet. Create one to get started.
                                        </td>
                                    </tr>
                                )}
                                {schoolYears.map(sy => (
                                    <>
                                        <tr key={sy.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{sy.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{sy.start_date} Ã¢â‚¬â€ {sy.end_date}</td>
                                            <td className="px-6 py-4"><StatusBadge status={syStatus(sy)} /></td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{sy.academic_terms_count}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => toggleExpand(sy)} className="text-sm text-indigo-600 hover:text-indigo-800">
                                                        {expandedSY === sy.id ? 'Hide Ã¢â€“Â²' : 'Terms Ã¢â€“Â¼'}
                                                    </button>
                                                    {sy.status !== 'finalized' && (
                                                        <button onClick={() => openEdit(sy)} className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
                                                    )}
                                                    {!sy.is_active && sy.status !== 'finalized' && (
                                                        <button onClick={() => activateSY(sy)} className="text-sm font-medium text-green-600 hover:text-green-800">Activate</button>
                                                    )}
                                                    {sy.status !== 'finalized' && (
                                                        <button onClick={() => requestFinalizeSY(sy)} className="text-sm font-medium text-red-500 hover:text-red-700">Finalize</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedSY === sy.id && (
                                            <tr key={`${sy.id}-terms`} className="bg-gray-50">
                                                <td colSpan={5} className="px-8 py-4">
                                                    {loadingTerms
                                                        ? <p className="text-sm text-gray-400">LoadingÃ¢â‚¬Â¦</p>
                                                        : <TermsPanel sy={sy} terms={terms} onActivate={activateTerm} onFinalize={requestFinalizeTerm} onAddSummer={() => addSummerTerm(sy)} />
                                                    }
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <SchoolYearFormModal
                show={showForm}
                editTarget={editTarget}
                onClose={() => setShowForm(false)}
            />

            <ConfirmModal
                show={confirm !== null}
                title={confirm?.title}
                message={confirm?.message}
                confirmLabel={confirm?.confirmLabel}
                onConfirm={confirm?.onConfirm}
                onClose={() => setConfirm(null)}
            />
        </AuthenticatedLayout>
    );
}

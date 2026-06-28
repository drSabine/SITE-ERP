import { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, StatusBadge, SecondaryButton, DataTable } from '@/Components/ui';
import { formatGrade } from '@/utils/grades';
import { getSemesterLabel, getYearLabel, formatStudentName } from './utils';

const COURSE_COLUMNS = [
    { key: 'code', label: 'Code', widthClassName: 'w-24', className: 'font-mono text-xs font-semibold text-emerald-800', render: ec => ec.course?.course_code ?? '-' },
    { key: 'title', label: 'Subject', className: 'text-gray-700', render: ec => ec.course?.title ?? '-' },
    { key: 'units', label: 'Units', widthClassName: 'w-16', headerClass: 'text-center', className: 'text-center text-gray-500', render: ec => ec.course?.units ?? '-' },
    { key: 'grade', label: 'Grade', widthClassName: 'w-20', headerClass: 'text-center', className: 'text-center tabular-nums font-semibold text-gray-800', render: ec => formatGrade(ec) },
    { key: 'status', label: 'Status', widthClassName: 'w-24', headerClass: 'text-center', className: 'text-center', render: ec => <StatusBadge status={ec.status} /> },
];

function SummaryBox({ label, value, accent = 'text-gray-900' }) {
    return (
        <div className="border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p>
        </div>
    );
}

/**
 * Read-only "super-power" review of a student's complete academic record:
 * every course across every term with grade + status (incl. INC, dropped, credited).
 * No editing — purely for the coordinator to verify what was taken.
 */
export default function StudentReviewModal({ show, studentId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!show || !studentId) return undefined;

        setLoading(true);
        const controller = new AbortController();
        axios.get(route('coordinator.students.detail', studentId), { signal: controller.signal })
            .then(response => setData(response.data))
            .catch(error => { if (!axios.isCancel(error)) setData(null); })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [show, studentId]);

    const student = data?.student ?? null;
    const enrollments = student?.enrollments ?? [];
    const allCourses = enrollments.flatMap(enrollment => enrollment.enrollment_courses ?? []);
    const incCount = allCourses.filter(ec => ec.status === 'inc').length;
    const droppedCount = allCourses.filter(ec => ec.status === 'dropped').length;
    const passedCount = allCourses.filter(ec => ['passed', 'credited'].includes(ec.status)).length;

    return (
        <Modal show={show} maxWidth="2xl" onClose={onClose} afterLeave={() => setData(null)}>
            <div className="flex max-h-[88vh] flex-col">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-base font-bold uppercase tracking-wide text-gray-900">Student Review</h2>
                    {student && (
                        <p className="mt-0.5 text-sm text-gray-500">
                            {formatStudentName(student, { middleInitial: true })} · {student.program?.code} · {getYearLabel(student.year_level)}
                        </p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {loading ? (
                        <p className="py-10 text-center text-sm text-gray-400">Loading record…</p>
                    ) : !student ? (
                        <p className="py-10 text-center text-sm text-gray-400">No record found.</p>
                    ) : (
                        <>
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                <SummaryBox label="Passed/Credited" value={passedCount} accent="text-emerald-700" />
                                <SummaryBox label="INC" value={incCount} accent={incCount > 0 ? 'text-orange-600' : 'text-gray-900'} />
                                <SummaryBox label="Dropped" value={droppedCount} accent={droppedCount > 0 ? 'text-red-600' : 'text-gray-900'} />
                            </div>

                            {enrollments.length === 0 ? (
                                <p className="py-6 text-center text-sm text-gray-400">No enrollment history.</p>
                            ) : (
                                <div className="space-y-4">
                                    {enrollments.map(enrollment => (
                                        <div key={enrollment.id} className="overflow-hidden border border-gray-200">
                                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                                    {getSemesterLabel(enrollment.academic_term?.semester)} · S.Y. {enrollment.academic_term?.school_year?.name}
                                                </p>
                                                <span className="text-[10px] text-gray-400">{getYearLabel(enrollment.year_level)}</span>
                                            </div>
                                            <DataTable
                                                compact
                                                columns={COURSE_COLUMNS}
                                                rows={enrollment.enrollment_courses ?? []}
                                                emptyMessage="No courses."
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                    <SecondaryButton type="button" onClick={onClose}>Close</SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}

import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DataTable, PrimaryButton, InputLabel, StatusBadge } from '@/Components/ui';
import { BackIcon, SearchIcon } from '@/Components/ui/Icons';
import { getSemesterLabel, getYearLabel, formatStudentName, YEAR_LEVELS } from '@/Components/Coordinator/Shared';

export default function Evaluate({ term, students = [] }) {
    const { data, setData, post, processing } = useForm({
        student_id: '',
        academic_term_id: term.id,
        year_level: 1,
        load_curriculum: true,
    });

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [recommendation, setRecommendation] = useState(null);
    const [loadingRec, setLoadingRec] = useState(false);

    const query = search.trim().toLowerCase();
    const filtered = query
        ? students.filter(student => `${student.last_name} ${student.first_name}`.toLowerCase().includes(query))
        : students;

    function fetchRecommendation(studentId, yearLevel) {
        setLoadingRec(true);
        axios.get(route('coordinator.enrollments.recommendation'), { params: { student_id: studentId, year_level: yearLevel } })
            .then(response => setRecommendation(response.data))
            .catch(() => setRecommendation(null))
            .finally(() => setLoadingRec(false));
    }

    function selectStudent(student) {
        setSelected(student);
        setData(previous => ({ ...previous, student_id: String(student.id), year_level: student.year_level ?? 1 }));
        fetchRecommendation(student.id, student.year_level ?? 1);
    }

    function changeYear(yearLevel) {
        setData('year_level', yearLevel);
        if (selected) fetchRecommendation(selected.id, yearLevel);
    }

    function submit() {
        post(route('coordinator.enrollments.store'), {
            preserveScroll: true,
            onSuccess: () => router.visit(route('coordinator.enrollments.index')),
        });
    }

    const courseColumns = [
        { key: 'course_code', label: 'Code', widthClassName: 'w-28', className: 'font-mono text-xs font-semibold text-emerald-800' },
        { key: 'title', label: 'Subject', className: 'text-gray-800' },
        { key: 'units', label: 'Units', widthClassName: 'w-20', headerClass: 'text-center', className: 'text-center text-gray-600' },
    ];

    return (
        <AuthenticatedLayout header="Evaluate Student">
            <Head title="Evaluate Student" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    <Link
                        href={route('coordinator.enrollments.index')}
                        className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        <BackIcon className="h-4 w-4" />
                        Back to Evaluations
                    </Link>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Student picker */}
                        <section className="border border-gray-200 bg-white shadow-sm lg:col-span-1">
                            <div className="border-b border-gray-200 px-5 py-3">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Select Student</h2>
                                <p className="mt-0.5 text-xs text-gray-400">{getSemesterLabel(term.semester)} · S.Y. {term.school_year?.name}</p>
                            </div>
                            <div className="p-4">
                                <div className="relative">
                                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={event => setSearch(event.target.value)}
                                        placeholder="Search student..."
                                        className="block w-full rounded border-gray-300 pl-8 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="mt-2 max-h-[28rem] divide-y divide-gray-100 overflow-y-auto border border-gray-200">
                                    {filtered.length === 0 ? (
                                        <p className="px-3 py-6 text-center text-xs text-gray-400">
                                            {students.length === 0 ? 'All active students are already evaluated.' : 'No students match your search.'}
                                        </p>
                                    ) : filtered.map(student => {
                                        const isSelected = String(student.id) === String(data.student_id);
                                        return (
                                            <button
                                                key={student.id}
                                                type="button"
                                                onClick={() => selectStudent(student)}
                                                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <span className="min-w-0 truncate text-gray-700">{formatStudentName(student, { middleInitial: true })}</span>
                                                <span className="shrink-0 text-[10px] text-gray-400">{student.program?.code} · {getYearLabel(student.year_level)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Recommendation + evaluate */}
                        <section className="border border-gray-200 bg-white shadow-sm lg:col-span-2">
                            {!selected ? (
                                <div className="flex h-full min-h-[20rem] items-center justify-center px-6 py-16 text-center text-sm text-gray-400">
                                    Select a student to preview their recommended load.
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900">{formatStudentName(selected, { middleInitial: true })}</h2>
                                            <p className="text-sm text-gray-500">{selected.program?.code} · {selected.program?.name}</p>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="eval_year" value="Year Level" />
                                            <select
                                                id="eval_year"
                                                value={data.year_level}
                                                onChange={event => changeYear(Number(event.target.value))}
                                                className="mt-1 rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                            >
                                                {YEAR_LEVELS.map(level => (
                                                    <option key={level} value={level}>{getYearLabel(level)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                Recommended Load · {getYearLabel(data.year_level)} · {getSemesterLabel(term.semester)}
                                            </p>
                                            {recommendation && (
                                                <span className="text-xs font-semibold text-gray-500">{recommendation.totalUnits} units</span>
                                            )}
                                        </div>

                                        {loadingRec ? (
                                            <p className="py-10 text-center text-sm text-gray-400">Loading recommendation…</p>
                                        ) : (
                                            <>
                                                <div className="border border-gray-200">
                                                    <DataTable
                                                        compact
                                                        columns={courseColumns}
                                                        rows={recommendation?.courses ?? []}
                                                        emptyMessage="No standard curriculum block for this year level and semester."
                                                    />
                                                </div>

                                                {recommendation?.incCourses?.length > 0 && (
                                                    <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3">
                                                        <p className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                                                            <StatusBadge status="inc" label="Carry-over INC" />
                                                            Outstanding subjects to resolve
                                                        </p>
                                                        <ul className="mt-2 space-y-0.5">
                                                            {recommendation.incCourses.map((course, index) => (
                                                                <li key={index} className="text-xs text-amber-700">
                                                                    <span className="font-mono font-semibold">{course.course_code}</span> — {course.title}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <label className="mt-4 flex cursor-pointer items-start gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.load_curriculum}
                                                        onChange={event => setData('load_curriculum', event.target.checked)}
                                                        className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <span className="text-sm text-gray-700">
                                                        <span className="font-medium">Load this recommended curriculum on evaluate</span>
                                                        <span className="block text-xs text-gray-500">Uncheck to enroll the student with an empty load and add subjects manually.</span>
                                                    </span>
                                                </label>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex justify-end border-t border-gray-200 px-5 py-4">
                                        <PrimaryButton type="button" onClick={submit} disabled={processing || !data.student_id}>
                                            {processing ? 'Evaluating…' : 'Evaluate Student'}
                                        </PrimaryButton>
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

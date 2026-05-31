import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { StatusBadge } from '@/Components/ui';
import { CloseIcon } from '@/Components/ui/Icons';
import { getSemesterLabel, getYearLabel } from '@/Components/Coordinator/Shared';
import { formatDate } from '@/utils/format';

function groupEnrollmentsBySchoolYear(enrollments) {
    const groups = {};

    for (const enrollment of (enrollments ?? [])) {
        const schoolYear = enrollment.academic_term?.school_year;

        if (!schoolYear) continue;

        if (!groups[schoolYear.id]) {
            groups[schoolYear.id] = {
                id: schoolYear.id,
                name: schoolYear.name,
                enrollments: [],
            };
        }

        groups[schoolYear.id].enrollments.push(enrollment);
    }

    return Object.values(groups).sort((groupA, groupB) => groupB.name.localeCompare(groupA.name));
}

function EnrollmentRow({ enrollment, onManageClick }) {
    const activeCount = (enrollment.enrollment_courses ?? []).filter(
        enrollmentCourse => ['active', 'inc'].includes(enrollmentCourse.status)
    ).length;
    const incCount = (enrollment.enrollment_courses ?? []).filter(
        enrollmentCourse => enrollmentCourse.status === 'inc'
    ).length;

    return (
        <div className="flex items-center justify-between py-2.5 pl-4">
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">
                    {getSemesterLabel(enrollment.academic_term?.semester)}
                    {enrollment.year_level && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                            {getYearLabel(enrollment.year_level)}
                        </span>
                    )}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                    {activeCount} course{activeCount !== 1 ? 's' : ''}
                    {incCount > 0 && (
                        <span className="ml-1.5 font-semibold text-orange-600">{incCount} INC</span>
                    )}
                </p>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
                <StatusBadge status={enrollment.status} />
                <button
                    type="button"
                    onClick={() => onManageClick(enrollment)}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                >
                    Manage
                </button>
            </div>
        </div>
    );
}

export default function StudentDrawer({
    show,
    student,
    loading,
    onClose,
    onEnrollClick,
    onManageClick,
    onEditClick,
    onDeleteClick,
}) {
    const schoolYearGroups = groupEnrollmentsBySchoolYear(student?.enrollments);

    return (
        <Transition show={show}>
            <Dialog onClose={onClose} className="relative z-40">
                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                            <TransitionChild
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-200"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <DialogPanel className="pointer-events-auto flex w-[480px] flex-col bg-white shadow-xl">
                                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
                                        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                                            Student Profile
                                        </p>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <CloseIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {loading || !student ? (
                                        <div className="flex flex-1 items-center justify-center">
                                            <p className="text-sm text-gray-400">
                                                {loading ? 'Loading...' : 'No student selected.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 flex-col overflow-hidden">
                                            {(() => {
                                                const activeEnrollment = (student.enrollments ?? []).find(
                                                    enrollment => enrollment.academic_term?.is_active
                                                );

                                                if (activeEnrollment) {
                                                    const courseCount = (activeEnrollment.enrollment_courses ?? []).filter(
                                                        enrollmentCourse => ['active', 'inc'].includes(enrollmentCourse.status)
                                                    ).length;
                                                    const termLabel = getSemesterLabel(activeEnrollment.academic_term?.semester);
                                                    const syName = activeEnrollment.academic_term?.school_year?.name ?? '';

                                                    return (
                                                        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-2.5">
                                                            <div className="text-xs text-emerald-800">
                                                                <span className="font-semibold">Enrolled</span>
                                                                {` in ${termLabel}`}
                                                                {syName && ` for S.Y. ${syName}`}
                                                                <span className="ml-1.5 text-emerald-600">
                                                                    ({courseCount} course{courseCount !== 1 ? 's' : ''})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-5 py-2.5">
                                                        <p className="text-xs font-medium text-amber-800">
                                                            Not enrolled in the active term
                                                        </p>
                                                        {student.status === 'active' && (
                                                            <button
                                                                type="button"
                                                                onClick={onEnrollClick}
                                                                className="bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                                                            >
                                                                + Enroll
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            <div className="border-b border-gray-200 px-5 py-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h2 className="text-base font-bold text-gray-900">
                                                            {student.last_name}, {student.first_name}
                                                            {student.middle_name && ` ${student.middle_name}`}
                                                            {student.suffix && ` ${student.suffix}`}
                                                        </h2>
                                                        <p className="mt-0.5 font-mono text-sm text-gray-500">
                                                            {student.student_number}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={student.status} />
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                                                    <div>
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Program</span>
                                                        <p className="text-gray-700">{student.program?.code} - {student.program?.name}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Year Level</span>
                                                        <p className="text-gray-700">{getYearLabel(student.year_level)}</p>
                                                    </div>
                                                    {student.sex && (
                                                        <div>
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sex</span>
                                                            <p className="text-gray-700">{student.sex}</p>
                                                        </div>
                                                    )}
                                                    {student.birthdate && (
                                                        <div>
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Birthdate</span>
                                                            <p className="text-gray-700">{formatDate(student.birthdate)}</p>
                                                        </div>
                                                    )}
                                                    {student.contact_number && (
                                                        <div>
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contact</span>
                                                            <p className="text-gray-700">{student.contact_number}</p>
                                                        </div>
                                                    )}
                                                    {student.email && (
                                                        <div>
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email</span>
                                                            <p className="truncate text-gray-700">{student.email}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditClick(student)}
                                                        className="border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                                    >
                                                        Edit Profile
                                                    </button>
                                                    {(student.enrollments ?? []).length === 0 && onDeleteClick && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onDeleteClick(student)}
                                                            className="border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                                <div className="mb-3">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                        Enrollment History
                                                    </p>
                                                </div>

                                                {schoolYearGroups.length === 0 ? (
                                                    <p className="py-4 text-center text-sm text-gray-400">
                                                        No enrollment records found.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {schoolYearGroups.map(group => (
                                                            <div key={group.id} className="border border-gray-200">
                                                                <div className="bg-gray-50 px-4 py-2">
                                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                                        S.Y. {group.name}
                                                                    </p>
                                                                </div>
                                                                <div className="divide-y divide-gray-100">
                                                                    {group.enrollments.map(enrollment => (
                                                                        <EnrollmentRow
                                                                            key={enrollment.id}
                                                                            enrollment={enrollment}
                                                                            onManageClick={onManageClick}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

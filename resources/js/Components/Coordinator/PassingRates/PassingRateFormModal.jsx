import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal, InputField, PrimaryButton, SecondaryButton } from '@/Components/ui';

const MONTHS = [
    { value: 1,  label: 'January'   },
    { value: 2,  label: 'February'  },
    { value: 3,  label: 'March'     },
    { value: 4,  label: 'April'     },
    { value: 5,  label: 'May'       },
    { value: 6,  label: 'June'      },
    { value: 7,  label: 'July'      },
    { value: 8,  label: 'August'    },
    { value: 9,  label: 'September' },
    { value: 10, label: 'October'   },
    { value: 11, label: 'November'  },
    { value: 12, label: 'December'  },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, index) => currentYear - index);

function computeRate(passers, total) {
    const p = parseInt(passers, 10);
    const t = parseInt(total, 10);
    if (!t || t <= 0) return null;
    return Math.round((p / t) * 1000) / 10;
}

function rateColor(rate) {
    if (rate === null) return 'text-gray-400';
    if (rate >= 75) return 'text-emerald-700';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
}

export default function PassingRateFormModal({ show, editTarget, onClose, programs = [] }) {
    const isEdit = Boolean(editTarget);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        program_id:    '',
        exam_month:    '',
        exam_year:     '',
        total_takers:  '',
        passers_count: '',
        notes:         '',
    });

    useEffect(() => {
        if (show && isEdit) {
            setData({
                program_id:    editTarget.program_id ?? '',
                exam_month:    editTarget.exam_month ?? '',
                exam_year:     editTarget.exam_year ?? '',
                total_takers:  editTarget.total_takers ?? '',
                passers_count: editTarget.passers_count ?? '',
                notes:         editTarget.notes ?? '',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, editTarget?.id]);

    function handleSubmit(event) {
        event.preventDefault();
        if (isEdit) {
            put(route('coordinator.passing-rates.update', editTarget.id), { onSuccess: onClose });
        } else {
            post(route('coordinator.passing-rates.store'), { onSuccess: onClose });
        }
    }

    const rate = computeRate(data.passers_count, data.total_takers);

    return (
        <Modal show={show} maxWidth="md" onClose={onClose} afterLeave={reset}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">
                    {isEdit ? 'Edit Passing Rate Record' : 'Log Passing Rate'}
                </h3>

                <div className="mt-4 space-y-4">
                    {/* Program */}
                    <div>
                        <label htmlFor="pr-program" className="block text-sm font-medium text-gray-700">Program <span className="text-red-500">*</span></label>
                        <select
                            id="pr-program"
                            value={data.program_id}
                            onChange={event => setData('program_id', event.target.value)}
                            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                            required
                        >
                            <option value="">— Select program —</option>
                            {programs.map(program => (
                                <option key={program.id} value={program.id}>{program.code} — {program.name}</option>
                            ))}
                        </select>
                        {errors.program_id && <p className="mt-1 text-xs text-red-600">{errors.program_id}</p>}
                    </div>

                    {/* Month + Year */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="pr-month" className="block text-sm font-medium text-gray-700">Month <span className="text-red-500">*</span></label>
                            <select
                                id="pr-month"
                                value={data.exam_month}
                                onChange={event => setData('exam_month', event.target.value)}
                                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                                required
                            >
                                <option value="">— Month —</option>
                                {MONTHS.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                            </select>
                            {errors.exam_month && <p className="mt-1 text-xs text-red-600">{errors.exam_month}</p>}
                        </div>

                        <div>
                            <label htmlFor="pr-year" className="block text-sm font-medium text-gray-700">Year <span className="text-red-500">*</span></label>
                            <select
                                id="pr-year"
                                value={data.exam_year}
                                onChange={event => setData('exam_year', event.target.value)}
                                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                                required
                            >
                                <option value="">— Year —</option>
                                {YEARS.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            {errors.exam_year && <p className="mt-1 text-xs text-red-600">{errors.exam_year}</p>}
                        </div>
                    </div>

                    {/* Takers + Passers */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Total Takers"
                            id="pr-takers"
                            type="number"
                            min="1"
                            value={data.total_takers}
                            onChange={event => setData('total_takers', event.target.value)}
                            error={errors.total_takers}
                            required
                        />
                        <InputField
                            label="Number of Passers"
                            id="pr-passers"
                            type="number"
                            min="0"
                            value={data.passers_count}
                            onChange={event => setData('passers_count', event.target.value)}
                            error={errors.passers_count}
                            required
                        />
                    </div>

                    {/* Computed Pass Rate */}
                    <div className="flex items-center gap-3 border border-gray-100 bg-gray-50 px-4 py-3">
                        <span className="text-sm text-gray-500">Computed Pass Rate:</span>
                        <span className={`text-lg font-bold ${rateColor(rate)}`}>
                            {rate !== null ? `${rate}%` : '—'}
                        </span>
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="pr-notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                        <textarea
                            id="pr-notes"
                            rows={2}
                            value={data.notes}
                            onChange={event => setData('notes', event.target.value)}
                            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                            placeholder="Any additional context..."
                        />
                        {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>{isEdit ? 'Save Changes' : 'Log Record'}</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

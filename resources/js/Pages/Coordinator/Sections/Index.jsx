import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    InputError,
    InputLabel,
    PagePanel,
    PrimaryButton,
    SecondaryButton,
    SegmentedTabs,
    StatusBadge,
    TextInput,
    Modal,
} from '@/Components/ui';
import { UsersIcon } from '@/Components/ui/Icons';
import { getSemesterLabel, getYearLabel, YEAR_TABS } from '@/Components/Coordinator/Shared';

export default function Index({ term, sections = [], programs }) {
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [yearFilter, setYearFilter] = useState('');
    const [programFilter, setProgramFilter] = useState('');

    const sectionForm = useForm({ program_id: '', year_level: '', name: '' });

    function submitSectionForm(event) {
        event.preventDefault();
        sectionForm.post(route('coordinator.sections.store'), {
            preserveScroll: true,
            onSuccess: () => setShowSectionModal(false),
        });
    }

    const filtered = sections.filter(section =>
        (yearFilter === '' || String(section.year_level) === String(yearFilter)) &&
        (programFilter === '' || String(section.program_id) === String(programFilter))
    );

    // Group into a bento, one block per program.
    const byProgram = filtered.reduce((groups, section) => {
        const key = section.program?.code ?? 'Other';
        (groups[key] ||= []).push(section);
        return groups;
    }, {});
    const programKeys = Object.keys(byProgram).sort();

    const pageDescription = `${getSemesterLabel(term.semester)} > S.Y. ${term.school_year?.name}`;

    return (
        <AuthenticatedLayout header="Sections">
            <Head title="Sections" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-6">
                    {/* Header / actions — separate from the list */}
                    <PagePanel
                        title="Section Management"
                        description={pageDescription}
                        action={<PrimaryButton onClick={() => setShowSectionModal(true)}>+ New Section</PrimaryButton>}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
                            <SegmentedTabs options={YEAR_TABS} value={yearFilter} onChange={setYearFilter} />
                            <select
                                value={programFilter}
                                onChange={event => setProgramFilter(event.target.value)}
                                className="rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">All Programs</option>
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>{program.code}</option>
                                ))}
                            </select>
                        </div>
                    </PagePanel>

                    {/* Bento list */}
                    {filtered.length === 0 ? (
                        <div className="border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-400 shadow-sm">
                            No sections match the current filters.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {programKeys.map(code => (
                                <div key={code}>
                                    <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                                        {code} — {byProgram[code][0].program?.name}
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {byProgram[code].map(section => (
                                            <Link
                                                key={section.id}
                                                href={route('coordinator.sections.manage', section.id)}
                                                className="group border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <p className="text-lg font-bold text-gray-900">{section.name}</p>
                                                    <StatusBadge status={section.is_active ? 'active' : 'inactive'} />
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {section.program?.code} · {getYearLabel(section.year_level)}
                                                </p>
                                                <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-600">
                                                    <UsersIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="font-semibold text-gray-900">{section.students_count ?? 0}</span>
                                                    student{(section.students_count ?? 0) !== 1 ? 's' : ''} this term
                                                </div>
                                                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-emerald-700 group-hover:text-emerald-800">
                                                    Manage Students →
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal show={showSectionModal} onClose={() => setShowSectionModal(false)} afterLeave={() => sectionForm.reset()}>
                <form onSubmit={submitSectionForm} className="space-y-4 p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Create Section</h2>

                    <div>
                        <InputLabel htmlFor="section_program_id" value="Program" />
                        <select
                            id="section_program_id"
                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            value={sectionForm.data.program_id}
                            onChange={event => {
                                sectionForm.setData('program_id', event.target.value);
                                sectionForm.setData('year_level', '');
                            }}
                        >
                            <option value="">Select program</option>
                            {programs.map(program => (
                                <option key={program.id} value={program.id}>{program.code} - {program.name}</option>
                            ))}
                        </select>
                        <InputError message={sectionForm.errors.program_id} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="section_year_level" value="Year Level" />
                        <select
                            id="section_year_level"
                            className="mt-1 w-full border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                            value={sectionForm.data.year_level}
                            onChange={event => sectionForm.setData('year_level', event.target.value)}
                            disabled={!sectionForm.data.program_id}
                        >
                            <option value="">Select year level</option>
                            {[1, 2, 3, 4, 5].map(yearLevel => (
                                <option key={yearLevel} value={yearLevel}>{getYearLabel(yearLevel)}</option>
                            ))}
                        </select>
                        <InputError message={sectionForm.errors.year_level} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="section_name" value="Section Name" />
                        <TextInput
                            id="section_name"
                            value={sectionForm.data.name}
                            onChange={event => sectionForm.setData('name', event.target.value)}
                            className="mt-1 block w-full"
                            placeholder="e.g., BSIT-1A"
                        />
                        <InputError message={sectionForm.errors.name} className="mt-2" />
                    </div>

                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowSectionModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={sectionForm.processing}>Save Section</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

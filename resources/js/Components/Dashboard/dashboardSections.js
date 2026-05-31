/**
 * Dashboard section builders - one function per role (or shared feature).
 *
 * Each function returns an array of section descriptors:
 *   { title: string, cols: string, cards: Array<{ title, description, href, disabled? }> }
 *
 * Rule: Add/edit sections here. Never create a new Dashboard page for a role.
 *
 * admin       -> buildAdminSections()
 * coordinator -> buildCoordinatorSections()
 * teacher     -> buildTeachingSections()   (also used when admin/coordinator has a teaching load)
 * student     -> buildStudentSections()
 */

export function buildAdminSections() {
    return [
        {
            title: 'Administration',
            cols: 'grid-cols-2 sm:grid-cols-3',
            cards: [
                { title: 'School Years', description: 'Manage school years and academic terms', href: route('admin.school-years.index') },
                { title: 'Users', description: 'Manage user accounts', href: route('admin.users.index') },
                { title: 'Programs', description: 'Manage degree programs', href: route('admin.programs.index') },
                { title: 'Courses', description: 'Manage the course catalog', href: route('admin.courses.index') },
            ],
        },
    ];
}

export function buildCoordinatorSections() {
    return [
        {
            title: 'Program Coordination',
            cols: 'grid-cols-2 sm:grid-cols-3',
            cards: [
                { title: 'Students', description: 'View and manage student records', href: route('coordinator.students.index') },
                { title: 'Teacher Assignments', description: 'Assign faculty to courses', href: route('coordinator.assignments.index') },
            ],
        },
    ];
}

export function buildTeachingSections({ hasActiveTerm }) {
    return [
        {
            title: 'Teaching',
            cols: 'grid-cols-2 sm:grid-cols-3',
            cards: [
                {
                    title: 'Grades',
                    description: 'Enter and submit student grades',
                    href: route('teacher.grades.index'),
                    disabled: !hasActiveTerm,
                },
            ],
        },
    ];
}

export function buildStudentSections() {
    return [
        {
            title: 'Academics',
            cols: 'grid-cols-1 sm:grid-cols-2',
            cards: [
                { title: 'My Enrollment', description: 'View your enrolled subjects and status', href: '#', disabled: true },
            ],
        },
    ];
}

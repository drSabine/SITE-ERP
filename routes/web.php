<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin;
use App\Http\Controllers\Coordinator;
use App\Http\Controllers\Teacher;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');

// Dashboard — role-aware, single route
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// ─────────────────────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────────────────────
Route::prefix('admin')->middleware(['auth', 'role:admin'])->name('admin.')->group(function () {

    // School Years
    Route::get('school-years', [Admin\SchoolYearController::class, 'index'])->name('school-years.index');
    Route::post('school-years', [Admin\SchoolYearController::class, 'store'])->name('school-years.store');
    Route::put('school-years/{schoolYear}', [Admin\SchoolYearController::class, 'update'])->name('school-years.update');
    Route::post('school-years/{schoolYear}/activate', [Admin\SchoolYearController::class, 'activate'])->name('school-years.activate');
    Route::post('school-years/{schoolYear}/finalize', [Admin\SchoolYearController::class, 'finalize'])->name('school-years.finalize');

    // Academic Terms (JSON endpoint for axios — no Inertia page)
    Route::get('academic-terms', [Admin\AcademicTermController::class, 'index'])->name('academic-terms.index');
    Route::post('school-years/{schoolYear}/academic-terms', [Admin\AcademicTermController::class, 'store'])->name('academic-terms.store');
    Route::put('academic-terms/{academicTerm}', [Admin\AcademicTermController::class, 'update'])->name('academic-terms.update');
    Route::post('academic-terms/{academicTerm}/activate', [Admin\AcademicTermController::class, 'activate'])->name('academic-terms.activate');
    Route::post('academic-terms/{academicTerm}/finalize', [Admin\AcademicTermController::class, 'finalize'])->name('academic-terms.finalize');

    // Users / Accounts
    Route::get('users', [Admin\UserController::class, 'index'])->name('users.index');
    Route::post('users', [Admin\UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [Admin\UserController::class, 'update'])->name('users.update');
    Route::patch('users/{user}/reactivate', [Admin\UserController::class, 'reactivate'])->name('users.reactivate');
    Route::delete('users/{user}', [Admin\UserController::class, 'destroy'])->name('users.destroy');

    // Programs
    Route::get('programs', [Admin\ProgramController::class, 'index'])->name('programs.index');
    Route::post('programs', [Admin\ProgramController::class, 'store'])->name('programs.store');
    Route::put('programs/{program}', [Admin\ProgramController::class, 'update'])->name('programs.update');

    // Courses (nested under programs conceptually but flat route for simplicity)
    Route::get('courses', [Admin\CourseController::class, 'index'])->name('courses.index');
    Route::post('courses', [Admin\CourseController::class, 'store'])->name('courses.store');
    Route::put('courses/{course}', [Admin\CourseController::class, 'update'])->name('courses.update');
    Route::delete('courses/{course}', [Admin\CourseController::class, 'destroy'])->name('courses.destroy');
});

// ─────────────────────────────────────────────────────────────
// Coordinator routes (also accessible by admin)
// ─────────────────────────────────────────────────────────────
Route::prefix('coordinator')->middleware(['auth', 'role:admin,coordinator'])->name('coordinator.')->group(function () {

    // Students
    Route::get('students', [Coordinator\StudentController::class, 'index'])->name('students.index');
    Route::get('students/{student}/detail', [Coordinator\StudentController::class, 'detail'])->name('students.detail');
    Route::get('students/{student}', [Coordinator\StudentController::class, 'show'])->name('students.show');
    Route::post('students', [Coordinator\StudentController::class, 'store'])->name('students.store');
    Route::put('students/{student}', [Coordinator\StudentController::class, 'update'])->name('students.update');

    // Enrollments
    Route::get('enrollments', [Coordinator\EnrollmentController::class, 'index'])->name('enrollments.index');
    Route::post('enrollments/school-year', [Coordinator\EnrollmentController::class, 'storeForSchoolYear'])->name('enrollments.store-school-year');
    Route::post('enrollments', [Coordinator\EnrollmentController::class, 'store'])->name('enrollments.store');
    Route::post('enrollments/{enrollment}/load-curriculum', [Coordinator\EnrollmentController::class, 'loadCurriculum'])->name('enrollments.load-curriculum');
    Route::post('enrollments/{enrollment}/drop', [Coordinator\EnrollmentController::class, 'drop'])->name('enrollments.drop');

    // Enrollment Courses (subject load management)
    Route::post('enrollment-courses', [Coordinator\EnrollmentCourseController::class, 'store'])->name('enrollment-courses.store');
    Route::delete('enrollment-courses/{enrollmentCourse}', [Coordinator\EnrollmentCourseController::class, 'destroy'])->name('enrollment-courses.destroy');
    Route::post('enrollment-courses/{enrollmentCourse}/override-grade', [Coordinator\EnrollmentCourseController::class, 'overrideGrade'])->name('enrollment-courses.override-grade');

    // Teacher Assignments
    Route::get('assignments', [Coordinator\TeacherAssignmentController::class, 'index'])->name('assignments.index');
    Route::post('assignments', [Coordinator\TeacherAssignmentController::class, 'store'])->name('assignments.store');
    Route::delete('assignments/{teacherAssignment}', [Coordinator\TeacherAssignmentController::class, 'destroy'])->name('assignments.destroy');

    // INC / Deficiency list
    Route::get('deficiencies/{academicTerm}', [Coordinator\DeficiencyController::class, 'index'])->name('deficiencies.index');
});

// ─────────────────────────────────────────────────────────────
// Teacher routes
// ─────────────────────────────────────────────────────────────
Route::prefix('teacher')->middleware(['auth', 'role:admin,coordinator,teacher'])->name('teacher.')->group(function () {
    Route::get('grades', [Teacher\GradeController::class, 'index'])->name('grades.index');
    Route::get('grades/{teacherAssignment}', [Teacher\GradeController::class, 'show'])->name('grades.show');
    Route::post('grades', [Teacher\GradeController::class, 'store'])->name('grades.store');
});

// Profile (Breeze default — keep as-is)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

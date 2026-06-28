<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\StudentGradeService;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function __construct(private StudentGradeService $service) {}

    public function index(): Response
    {
        $student = auth()->user()->student;
        abort_unless($student, 403, 'No student record is linked to this account.');

        $student->load('program:id,code,name');
        $transcript = $this->service->transcript($student);

        return Inertia::render('Student/Grades/Index', [
            'student' => [
                'first_name'  => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name'   => $student->last_name,
                'suffix'      => $student->suffix,
                'year_level'  => $student->year_level,
                'program'     => $student->program,
            ],
            'terms'      => $transcript['terms'],
            'overallGwa' => $transcript['overallGwa'],
        ]);
    }
}

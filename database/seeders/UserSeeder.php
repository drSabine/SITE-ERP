<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $bsit = Program::updateOrCreate(
            ['code' => 'BSIT'],
            ['name' => 'Bachelor of Science in Information Technology', 'description' => null, 'is_active' => true]
        );

        $bsce = Program::updateOrCreate(
            ['code' => 'BSCE'],
            ['name' => 'Bachelor of Science in Civil Engineering', 'description' => null, 'is_active' => true]
        );

        foreach ($this->profiledUsers() as $profileData) {
            $this->seedProfiledUser($profileData);
        }

        foreach ($this->bsitStudents() as $studentData) {
            $this->seedStudent($studentData, $bsit);
        }

        foreach ($this->bsceStudents() as $studentData) {
            $this->seedStudent($studentData, $bsce);
        }
    }

    private function profiledUsers(): array
    {
        return [
            ['first_name' => 'Marifel Grace', 'middle_name' => 'C', 'last_name' => 'Kummer', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '1985-03-12', 'degree' => 'MIT', 'specialization' => '', 'role' => 'admin'],
            ['first_name' => 'Rucelj', 'middle_name' => '', 'last_name' => 'Pugeda', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '1987-07-08', 'degree' => 'MIT', 'specialization' => 'Information Technology', 'role' => 'coordinator'],
            ['first_name' => 'Cirilio', 'middle_name' => 'M', 'last_name' => 'Gazzingan', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '1983-11-19', 'degree' => 'MSCE', 'specialization' => 'Engineering', 'role' => 'coordinator'],
            ['first_name' => 'Justine Vince', 'middle_name' => '', 'last_name' => 'Tan', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '1990-02-24', 'degree' => 'MIT', 'specialization' => 'Web Development', 'role' => 'teacher'],
            ['first_name' => 'Luigie', 'middle_name' => '', 'last_name' => 'Cagurangan', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '1991-09-14', 'degree' => 'MIT', 'specialization' => 'Network Systems', 'role' => 'teacher'],
            ['first_name' => 'Reychelle Ann', 'middle_name' => 'M', 'last_name' => 'Antonio', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '1992-05-06', 'degree' => 'MIT', 'specialization' => 'Software Engineering', 'role' => 'teacher'],
        ];
    }

    private function bsitStudents(): array
    {
        return [
            ['student_number' => '2025-0001', 'first_name' => 'Alyssa Mae', 'middle_name' => 'T', 'last_name' => 'Soriano', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '2007-01-18', 'year_level' => 1],
            ['student_number' => '2025-0002', 'first_name' => 'John Paulo', 'middle_name' => 'R', 'last_name' => 'Ramos', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '2006-09-03', 'year_level' => 1],
            ['student_number' => '2025-0003', 'first_name' => 'Bianca Claire', 'middle_name' => 'M', 'last_name' => 'Mendoza', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '2005-04-27', 'year_level' => 2],
            ['student_number' => '2025-0004', 'first_name' => 'Kevin Luis', 'middle_name' => 'A', 'last_name' => 'Navarro', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '2005-12-09', 'year_level' => 2],
            ['student_number' => '2025-0005', 'first_name' => 'Denise Marie', 'middle_name' => 'L', 'last_name' => 'Villanueva', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '2004-03-15', 'year_level' => 3],
            ['student_number' => '2025-0006', 'first_name' => 'Aaron Miguel', 'middle_name' => 'P', 'last_name' => 'Flores', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '2004-08-22', 'year_level' => 3],
            ['student_number' => '2025-0007', 'first_name' => 'Patricia Anne', 'middle_name' => 'D', 'last_name' => 'Dela Cruz', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '2003-02-11', 'year_level' => 4],
            ['student_number' => '2025-0008', 'first_name' => 'Jomarie', 'middle_name' => 'S', 'last_name' => 'Santos', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '2003-10-30', 'year_level' => 4],
        ];
    }

    private function bsceStudents(): array
    {
        return [
            ['student_number' => '2025-0101', 'first_name' => 'Carla Joy', 'middle_name' => 'B', 'last_name' => 'Bautista', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '2007-02-19', 'year_level' => 1],
            ['student_number' => '2025-0102', 'first_name' => 'Mark Anthony', 'middle_name' => 'R', 'last_name' => 'Reyes', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '2006-11-25', 'year_level' => 1],
            ['student_number' => '2025-0103', 'first_name' => 'Elaine Marie', 'middle_name' => 'Q', 'last_name' => 'Aquino', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '2005-06-07', 'year_level' => 2],
            ['student_number' => '2025-0104', 'first_name' => 'Joshua Neil', 'middle_name' => 'V', 'last_name' => 'Ventura', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '2005-09-28', 'year_level' => 2],
            ['student_number' => '2025-0105', 'first_name' => 'Faith Louise', 'middle_name' => 'D', 'last_name' => 'Domingo', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '2004-04-13', 'year_level' => 3],
            ['student_number' => '2025-0106', 'first_name' => 'Carl Adrian', 'middle_name' => 'M', 'last_name' => 'Manalo', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '2004-12-02', 'year_level' => 3],
            ['student_number' => '2025-0107', 'first_name' => 'Hannah Grace', 'middle_name' => 'V', 'last_name' => 'Valdez', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '2003-01-29', 'year_level' => 4],
            ['student_number' => '2025-0108', 'first_name' => 'Patrick Sean', 'middle_name' => 'C', 'last_name' => 'Cortez', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '2003-07-17', 'year_level' => 4],
        ];
    }

    private function seedProfiledUser(array $profileData): User
    {
        $email = UserService::buildEmail($profileData['first_name'], $profileData['last_name']);
        $displayName = UserService::buildDisplayName(
            $profileData['first_name'],
            $profileData['middle_name'],
            $profileData['last_name'],
            $profileData['suffix']
        );

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $displayName,
                'password' => Hash::make('password'),
                'role' => $profileData['role'],
                'is_active' => true,
            ]
        );

        $user->userProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'first_name' => $profileData['first_name'],
                'middle_name' => $profileData['middle_name'] !== '' ? $profileData['middle_name'] : null,
                'last_name' => $profileData['last_name'],
                'suffix' => $profileData['suffix'] !== '' ? $profileData['suffix'] : null,
                'sex' => $profileData['sex'],
                'birthdate' => $profileData['birthdate'],
                'degree' => $profileData['degree'] !== '' ? $profileData['degree'] : null,
                'specialization' => $profileData['specialization'] !== '' ? $profileData['specialization'] : null,
            ]
        );

        return $user;
    }

    private function seedStudent(array $studentData, Program $program): void
    {
        $user = $this->seedProfiledUser([
            ...$studentData,
            'degree' => '',
            'specialization' => '',
            'role' => 'student',
        ]);

        Student::updateOrCreate(
            ['student_number' => $studentData['student_number']],
            [
                'user_id' => $user->id,
                'first_name' => $studentData['first_name'],
                'middle_name' => $studentData['middle_name'] !== '' ? $studentData['middle_name'] : null,
                'last_name' => $studentData['last_name'],
                'suffix' => $studentData['suffix'] !== '' ? $studentData['suffix'] : null,
                'sex' => $studentData['sex'],
                'birthdate' => $studentData['birthdate'],
                'email' => $user->email,
                'program_id' => $program->id,
                'year_level' => $studentData['year_level'],
                'status' => 'active',
            ]
        );
    }
}

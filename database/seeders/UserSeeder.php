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
            ['first_name' => 'Rucelj', 'middle_name' => '', 'last_name' => 'Pugeda', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '1987-07-08', 'degree' => 'MIT', 'specialization' => 'Information Technology', 'role' => 'coordinator_it'],
            ['first_name' => 'Cirilio', 'middle_name' => 'M', 'last_name' => 'Gazzingan', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '1983-11-19', 'degree' => 'MSCE', 'specialization' => 'Engineering', 'role' => 'coordinator_engineering'],
            ['first_name' => 'Justine Vince', 'middle_name' => '', 'last_name' => 'Tan', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '1990-02-24', 'degree' => 'MIT', 'specialization' => 'Web Development', 'role' => 'teacher'],
            ['first_name' => 'Luigie', 'middle_name' => '', 'last_name' => 'Cagurangan', 'suffix' => '', 'sex' => 'Male', 'birthdate' => '1991-09-14', 'degree' => 'MIT', 'specialization' => 'Network Systems', 'role' => 'teacher'],
            ['first_name' => 'Reychelle Ann', 'middle_name' => 'M', 'last_name' => 'Antonio', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '1992-05-06', 'degree' => 'MIT', 'specialization' => 'Software Engineering', 'role' => 'teacher'],
        ];
    }

    private function bsitStudents(): array
    {
        return [
            // 1st Year
            ['first_name' => 'Alyssa Mae',    'middle_name' => 'T', 'last_name' => 'Soriano',    'suffix' => '', 'sex' => 'Male',   'year_level' => 1],
            ['first_name' => 'John Paulo',    'middle_name' => 'R', 'last_name' => 'Ramos',       'suffix' => '', 'sex' => 'Male',   'year_level' => 1],
            ['first_name' => 'Shiela Marie',  'middle_name' => 'C', 'last_name' => 'Cabrera',     'suffix' => '', 'sex' => 'Female', 'year_level' => 1],
            ['first_name' => 'Renz Carlo',    'middle_name' => 'A', 'last_name' => 'Aguillon',    'suffix' => '', 'sex' => 'Male',   'year_level' => 1],
            // 2nd Year
            ['first_name' => 'Bianca Claire', 'middle_name' => 'M', 'last_name' => 'Mendoza',     'suffix' => '', 'sex' => 'Female', 'year_level' => 2],
            ['first_name' => 'Kevin Luis',    'middle_name' => 'A', 'last_name' => 'Navarro',     'suffix' => '', 'sex' => 'Male',   'year_level' => 2],
            ['first_name' => 'Jessa Ann',     'middle_name' => 'B', 'last_name' => 'Bernardo',    'suffix' => '', 'sex' => 'Female', 'year_level' => 2],
            ['first_name' => 'Lance Gabriel', 'middle_name' => 'O', 'last_name' => 'Obispo',      'suffix' => '', 'sex' => 'Male',   'year_level' => 2],
            // 3rd Year
            ['first_name' => 'Denise Marie',  'middle_name' => 'L', 'last_name' => 'Villanueva',  'suffix' => '', 'sex' => 'Female', 'year_level' => 3],
            ['first_name' => 'Aaron Miguel',  'middle_name' => 'P', 'last_name' => 'Flores',      'suffix' => '', 'sex' => 'Male',   'year_level' => 3],
            ['first_name' => 'Kristine Joy',  'middle_name' => 'E', 'last_name' => 'Estoquia',    'suffix' => '', 'sex' => 'Female', 'year_level' => 3],
            ['first_name' => 'Harold James',  'middle_name' => 'N', 'last_name' => 'Natividad',   'suffix' => '', 'sex' => 'Male',   'year_level' => 3],
            // 4th Year
            ['first_name' => 'Patricia Anne', 'middle_name' => 'D', 'last_name' => 'Dela Cruz',   'suffix' => '', 'sex' => 'Female', 'year_level' => 4],
            ['first_name' => 'Jomarie',       'middle_name' => 'S', 'last_name' => 'Santos',      'suffix' => '', 'sex' => 'Male',   'year_level' => 4],
            ['first_name' => 'Lovely Grace',  'middle_name' => 'F', 'last_name' => 'Fernando',    'suffix' => '', 'sex' => 'Female', 'year_level' => 4],
            ['first_name' => 'Aldrin Paul',   'middle_name' => 'G', 'last_name' => 'Guzman',      'suffix' => '', 'sex' => 'Male',   'year_level' => 4],
        ];
    }

    private function bsceStudents(): array
    {
        return [
            // 1st Year
            ['first_name' => 'Carla Joy',     'middle_name' => 'B', 'last_name' => 'Bautista',    'suffix' => '', 'sex' => 'Female', 'year_level' => 1],
            ['first_name' => 'Mark Anthony',  'middle_name' => 'R', 'last_name' => 'Reyes',       'suffix' => '', 'sex' => 'Male',   'year_level' => 1],
            ['first_name' => 'Angela Rose',   'middle_name' => 'S', 'last_name' => 'Salcedo',     'suffix' => '', 'sex' => 'Female', 'year_level' => 1],
            ['first_name' => 'Rico James',    'middle_name' => 'T', 'last_name' => 'Tungol',      'suffix' => '', 'sex' => 'Male',   'year_level' => 1],
            // 2nd Year
            ['first_name' => 'Elaine Marie',  'middle_name' => 'Q', 'last_name' => 'Aquino',      'suffix' => '', 'sex' => 'Female', 'year_level' => 2],
            ['first_name' => 'Joshua Neil',   'middle_name' => 'V', 'last_name' => 'Ventura',     'suffix' => '', 'sex' => 'Male',   'year_level' => 2],
            ['first_name' => 'Mylene Grace',  'middle_name' => 'C', 'last_name' => 'Capuno',      'suffix' => '', 'sex' => 'Female', 'year_level' => 2],
            ['first_name' => 'Daven Carlo',   'middle_name' => 'P', 'last_name' => 'Paras',       'suffix' => '', 'sex' => 'Male',   'year_level' => 2],
            // 3rd Year
            ['first_name' => 'Faith Louise',  'middle_name' => 'D', 'last_name' => 'Domingo',     'suffix' => '', 'sex' => 'Female', 'year_level' => 3],
            ['first_name' => 'Carl Adrian',   'middle_name' => 'M', 'last_name' => 'Manalo',      'suffix' => '', 'sex' => 'Male',   'year_level' => 3],
            ['first_name' => 'Ivy Rose',      'middle_name' => 'L', 'last_name' => 'Lacap',       'suffix' => '', 'sex' => 'Female', 'year_level' => 3],
            ['first_name' => 'Rommel Jay',    'middle_name' => 'I', 'last_name' => 'Imperial',    'suffix' => '', 'sex' => 'Male',   'year_level' => 3],
            // 4th Year
            ['first_name' => 'Hannah Grace',  'middle_name' => 'V', 'last_name' => 'Valdez',      'suffix' => '', 'sex' => 'Female', 'year_level' => 4],
            ['first_name' => 'Patrick Sean',  'middle_name' => 'C', 'last_name' => 'Cortez',      'suffix' => '', 'sex' => 'Male',   'year_level' => 4],
            ['first_name' => 'Rosemarie',     'middle_name' => 'A', 'last_name' => 'Arenas',      'suffix' => '', 'sex' => 'Female', 'year_level' => 4],
            ['first_name' => 'Lemuel John',   'middle_name' => 'B', 'last_name' => 'Blanca',      'suffix' => '', 'sex' => 'Male',   'year_level' => 4],
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
                'name'      => $displayName,
                'password'  => Hash::make('password'),
                'role'      => $profileData['role'],
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
            'birthdate'     => null,
            'degree'        => '',
            'specialization' => '',
            'role'          => 'student',
        ]);

        Student::updateOrCreate(
            ['user_id' => $user->id],
            [
                'first_name'     => $studentData['first_name'],
                'middle_name'    => $studentData['middle_name'] !== '' ? $studentData['middle_name'] : null,
                'last_name'      => $studentData['last_name'],
                'suffix'         => $studentData['suffix'] !== '' ? $studentData['suffix'] : null,
                'sex'            => $studentData['sex'],
                'email'          => $user->email,
                'program_id'     => $program->id,
                'year_level'     => $studentData['year_level'],
                'status'         => 'active',
            ]
        );
    }
}

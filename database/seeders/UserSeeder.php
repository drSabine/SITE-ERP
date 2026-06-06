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
    private const STUDENT_POPULATION_PLAN = [
        'BSIT' => [1 => 28, 2 => 24, 3 => 21, 4 => 16],
        'BSCE' => [1 => 24, 2 => 20, 3 => 17, 4 => 13],
    ];

    private ?string $passwordHash = null;

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

        foreach ($this->generateStudents($bsit, $this->bsitLastNames()) as $studentData) {
            $this->seedStudent($studentData, $bsit);
        }

        foreach ($this->generateStudents($bsce, $this->bsceLastNames()) as $studentData) {
            $this->seedStudent($studentData, $bsce);
        }
    }

    private function profiledUsers(): array
    {
        return [
            // Admin
            ['first_name' => 'Marifel Grace', 'middle_name' => 'C', 'last_name' => 'Kummer',    'suffix' => '', 'sex' => 'Female', 'birthdate' => '1985-03-12', 'degree' => 'MIT',  'specialization' => '',                       'role' => 'admin'],
            // Coordinators
            ['first_name' => 'Rucelj',        'middle_name' => '', 'last_name' => 'Pugeda',    'suffix' => '', 'sex' => 'Male',   'birthdate' => '1987-07-08', 'degree' => 'MIT',  'specialization' => 'Information Technology', 'role' => 'coordinator_it'],
            ['first_name' => 'Cirilio',        'middle_name' => 'M', 'last_name' => 'Gazzingan','suffix' => '', 'sex' => 'Male',   'birthdate' => '1983-11-19', 'degree' => 'MSCE', 'specialization' => 'Engineering',            'role' => 'coordinator_engineering'],
            // Teachers (5 total)
            ['first_name' => 'Justine Vince',  'middle_name' => '', 'last_name' => 'Tan',       'suffix' => '', 'sex' => 'Male',   'birthdate' => '1990-02-24', 'degree' => 'MIT',  'specialization' => 'Web Development',        'role' => 'teacher'],
            ['first_name' => 'Luigie',         'middle_name' => '', 'last_name' => 'Cagurangan','suffix' => '', 'sex' => 'Male',   'birthdate' => '1991-09-14', 'degree' => 'MIT',  'specialization' => 'Network Systems',        'role' => 'teacher'],
            ['first_name' => 'Reychelle Ann',  'middle_name' => 'M', 'last_name' => 'Antonio',  'suffix' => '', 'sex' => 'Female', 'birthdate' => '1992-05-06', 'degree' => 'MIT',  'specialization' => 'Software Engineering',   'role' => 'teacher'],
            ['first_name' => 'Arvin Roldan',   'middle_name' => 'C', 'last_name' => 'Macaraeg', 'suffix' => '', 'sex' => 'Male',   'birthdate' => '1988-04-15', 'degree' => 'MIT',  'specialization' => 'Database Systems',       'role' => 'teacher'],
            ['first_name' => 'Josephine Ynez', 'middle_name' => 'B', 'last_name' => 'Dela Cruz','suffix' => '', 'sex' => 'Female', 'birthdate' => '1993-08-22', 'degree' => 'MSCE', 'specialization' => 'Structural Engineering', 'role' => 'teacher'],
        ];
    }

    private function bsitLastNames(): array
    {
        return [
            1 => ['Soriano', 'Aguillon', 'Cabrera', 'Navarro', 'Obispo', 'Natividad', 'De Leon', 'Bernardo', 'Ramos', 'Flores', 'Valdez', 'Manalo', 'Imperial', 'Domingo'],
            2 => ['Santos', 'Bautista', 'Fernando', 'Salcedo', 'Guzman', 'Aquino', 'Capuno', 'Reyes', 'Ventura', 'Tungol', 'Castro', 'Mendoza'],
            3 => ['Paras', 'Imperial', 'Domingo', 'Valdez', 'Manalo', 'Arenas', 'Mendoza', 'Lacap', 'Cortez', 'Blanca', 'Lim'],
            4 => ['Garcia', 'Cruz', 'Torres', 'Villanueva', 'Perez', 'Aguilar', 'Lim', 'Castro'],
        ];
    }

    private function bsceLastNames(): array
    {
        return [
            1 => ['Abreu', 'Dalisay', 'Bugarin', 'Escoto', 'Canlas', 'Hipolito', 'Fuentes', 'Ilagan', 'Guarino', 'Jimenez', 'Legaspi', 'Pascual'],
            2 => ['Kapuno', 'Ocampo', 'Legaspi', 'Pascual', 'Montoya', 'Resurreccion', 'Narciso', 'Simeon', 'Quinto', 'Tinio'],
            3 => ['Umali', 'Zabala', 'Vidal', 'Alcantara', 'Yap', 'Casimiro', 'Guerrero', 'Ejercito', 'Balderama'],
            4 => ['Hufano', 'Javier', 'Intal', 'Lagramada', 'Katmon', 'Nazareno', 'Mallari'],
        ];
    }

    private function generateStudents(Program $program, array $lastNamesByYear): array
    {
        $femaleFirstNames = [
            'Alyssa Mae', 'Bianca Claire', 'Carla Joy', 'Denise Marie', 'Elaine Rose',
            'Faith Louise', 'Gabrielle Ann', 'Hannah Grace', 'Iris Mae', 'Janine Marie',
            'Katrina Joy', 'Lara Nicole', 'Mikaela Faye', 'Nadine Bea', 'Olivia Anne',
        ];

        $maleFirstNames = [
            'Aaron Miguel', 'Bryan Carlo', 'Carlos Luis', 'Daniel Jose', 'Eduardo Nino',
            'Francis Mark', 'Gabriel Josh', 'Harold James', 'Ivan Carlo', 'Julius Marc',
            'Kenneth Paul', 'Lance Gabriel', 'Marco Andrei', 'Nathaniel John', 'Oscar Miguel',
        ];

        $middleInitials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
                           'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'V',
                           'W', 'Y', 'Z'];

        $students = [];
        $populationPlan = self::STUDENT_POPULATION_PLAN[$program->code] ?? [];

        foreach ($populationPlan as $yearLevel => $targetPopulation) {
            $lastNames = $lastNamesByYear[$yearLevel] ?? $lastNamesByYear[array_key_first($lastNamesByYear)];

            for ($index = 0; $index < $targetPopulation; $index++) {
                $isFemale = $index % 2 === 0;
                $firstNamePool = $isFemale ? $femaleFirstNames : $maleFirstNames;
                $nameCycle = intdiv($index, count($firstNamePool));
                $firstName = $firstNamePool[$index % count($firstNamePool)];

                if ($nameCycle > 0) {
                    $firstName .= ' ' . chr(64 + $nameCycle);
                }

                $students[] = [
                    'first_name'  => $firstName,
                    'middle_name' => $middleInitials[$index % count($middleInitials)],
                    'last_name'   => $lastNames[$index % count($lastNames)],
                    'suffix'      => '',
                    'sex'         => $isFemale ? 'Female' : 'Male',
                    'year_level'  => $yearLevel,
                    'email'       => strtolower($program->code) . '.y' . $yearLevel . '.' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) . '@site.spup',
                ];
            }
        }

        return $students;
    }

    private function seedProfiledUser(array $profileData): User
    {
        $email = $profileData['email'] ?? UserService::buildEmail($profileData['first_name'], $profileData['last_name']);
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
                'password'  => $this->passwordHash(),
                'role'      => $profileData['role'],
                'is_active' => true,
            ]
        );

        $user->userProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'first_name'     => $profileData['first_name'],
                'middle_name'    => $profileData['middle_name'] !== '' ? $profileData['middle_name'] : null,
                'last_name'      => $profileData['last_name'],
                'suffix'         => $profileData['suffix'] !== '' ? $profileData['suffix'] : null,
                'sex'            => $profileData['sex'],
                'birthdate'      => $profileData['birthdate'],
                'degree'         => $profileData['degree'] !== '' ? $profileData['degree'] : null,
                'specialization' => $profileData['specialization'] !== '' ? $profileData['specialization'] : null,
            ]
        );

        return $user;
    }

    private function seedStudent(array $studentData, Program $program): void
    {
        $user = $this->seedProfiledUser([
            ...$studentData,
            'birthdate'      => null,
            'degree'         => '',
            'specialization' => '',
            'role'           => 'student',
            'email'          => $studentData['email'],
        ]);

        Student::updateOrCreate(
            ['user_id' => $user->id],
            [
                'first_name'  => $studentData['first_name'],
                'middle_name' => $studentData['middle_name'] !== '' ? $studentData['middle_name'] : null,
                'last_name'   => $studentData['last_name'],
                'suffix'      => $studentData['suffix'] !== '' ? $studentData['suffix'] : null,
                'sex'         => $studentData['sex'],
                'email'       => $user->email,
                'program_id'  => $program->id,
                'year_level'  => $studentData['year_level'],
                'status'      => 'active',
            ]
        );
    }

    private function passwordHash(): string
    {
        return $this->passwordHash ??= Hash::make('password');
    }
}

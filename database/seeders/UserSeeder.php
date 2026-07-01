<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\User;
use App\Services\UserService;
use Database\Seeders\Support\StudentArchetype;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds all login accounts (staff + active students) using bulk inserts.
 *
 * Performance: the password is hashed ONCE and the same bcrypt string is reused for
 * every account, and rows are written with three bulk inserts (users, user_profiles,
 * students) instead of per-row updateOrCreate. This keeps seeding fast and is fully
 * MySQL / Laravel Cloud compatible. Re-run with `migrate:fresh --seed`.
 */
class UserSeeder extends Seeder
{
    private const STUDENT_POPULATION_PLAN = [
        // BSCE and BSENSE are five-year programs (their integrating courses live in 5th year).
        'BSIT'   => [1 => 28, 2 => 24, 3 => 21, 4 => 16],
        'BSCE'   => [1 => 24, 2 => 20, 3 => 17, 4 => 13, 5 => 11],
        'BSENSE' => [1 => 12, 2 => 10, 3 => 8,  4 => 6,  5 => 5],
        'BSCpE'  => [1 => 14, 2 => 12, 3 => 10, 4 => 8],
        'BLIS'   => [1 => 10, 2 => 8,  3 => 7,  4 => 5],
    ];

    public function run(): void
    {
        // Programs are seeded by ProgramSeeder (runs first). Seed students for every
        // program that has a population plan so each coordinator's scope is populated.
        $programs = Program::whereIn('code', array_keys(self::STUDENT_POPULATION_PLAN))->get()->keyBy('code');

        // Build one flat list of "people". Each carries the columns needed for the
        // users + user_profiles rows, and students additionally carry a `student` payload.
        $people = [];

        foreach ($this->profiledUsers() as $profile) {
            $email = $profile['email'] ?? UserService::buildEmail($profile['first_name'], $profile['last_name']);
            $people[] = $this->makePerson($profile, $email);
        }

        foreach (array_keys(self::STUDENT_POPULATION_PLAN) as $code) {
            $program = $programs->get($code);
            if (! $program) {
                continue;
            }
            foreach ($this->generateStudents($program) as $studentData) {
                $person = $this->makePerson([
                    ...$studentData,
                    'birthdate'      => null,
                    'degree'         => '',
                    'specialization' => '',
                    'role'           => 'student',
                ], $studentData['email']);

                $person['student'] = [
                    'program_id' => $program->id,
                    'year_level' => $studentData['year_level'],
                    'remarks'    => StudentArchetype::remarkFor($studentData['archetype']),
                ];

                $people[] = $person;
            }
        }

        $this->bulkInsert($people);

        $this->command->info('UserSeeder: ' . count($people) . ' accounts seeded (bulk).');
    }

    private function bulkInsert(array $people): void
    {
        $now = now();
        $passwordHash = Hash::make('password');

        // 1. Users
        $userRows = array_map(fn ($person) => [
            'email'      => $person['email'],
            'name'       => $person['name'],
            'password'   => $passwordHash,
            'role'       => $person['role'],
            'is_active'  => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $people);

        collect($userRows)->chunk(200)->each(fn (Collection $chunk) => DB::table('users')->insert($chunk->all()));

        // 2. Map emails -> ids
        $idByEmail = User::whereIn('email', array_column($people, 'email'))->pluck('id', 'email');

        // 3. Profiles + students
        $profileRows = [];
        $studentRows = [];

        foreach ($people as $person) {
            $userId = $idByEmail[$person['email']];

            $profileRows[] = [
                'user_id'        => $userId,
                'first_name'     => $person['first_name'],
                'middle_name'    => $person['middle_name'],
                'last_name'      => $person['last_name'],
                'suffix'         => $person['suffix'],
                'sex'            => $person['sex'],
                'birthdate'      => $person['birthdate'],
                'specialization' => $person['specialization'],
                'degree'         => $person['degree'],
                'created_at'     => $now,
                'updated_at'     => $now,
            ];

            if (isset($person['student'])) {
                $studentRows[] = [
                    'user_id'     => $userId,
                    'first_name'  => $person['first_name'],
                    'middle_name' => $person['middle_name'],
                    'last_name'   => $person['last_name'],
                    'suffix'      => $person['suffix'],
                    'sex'         => $person['sex'],
                    'email'       => $person['email'],
                    'program_id'  => $person['student']['program_id'],
                    'year_level'  => $person['student']['year_level'],
                    'status'      => 'active',
                    'remarks'     => $person['student']['remarks'],
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];
            }
        }

        collect($profileRows)->chunk(200)->each(fn (Collection $chunk) => DB::table('user_profiles')->insert($chunk->all()));
        collect($studentRows)->chunk(200)->each(fn (Collection $chunk) => DB::table('students')->insert($chunk->all()));
    }

    /** Normalise a profile/student array into the shared person shape. */
    private function makePerson(array $data, string $email): array
    {
        return [
            'email'          => $email,
            'name'           => UserService::buildDisplayName($data['first_name'], $data['middle_name'] ?? '', $data['last_name'], $data['suffix'] ?? ''),
            'role'           => $data['role'],
            'first_name'     => $data['first_name'],
            'middle_name'    => ($data['middle_name'] ?? '') !== '' ? $data['middle_name'] : null,
            'last_name'      => $data['last_name'],
            'suffix'         => ($data['suffix'] ?? '') !== '' ? $data['suffix'] : null,
            'sex'            => $data['sex'],
            'birthdate'      => $data['birthdate'] ?? null,
            'degree'         => ($data['degree'] ?? '') !== '' ? $data['degree'] : null,
            'specialization' => ($data['specialization'] ?? '') !== '' ? $data['specialization'] : null,
        ];
    }

    private function profiledUsers(): array
    {
        return [
            // Admin
            ['first_name' => 'Marifel Grace', 'middle_name' => 'C', 'last_name' => 'Kummer',    'suffix' => '', 'sex' => 'Female', 'birthdate' => '1985-03-12', 'degree' => 'MIT',  'specialization' => '',                       'role' => 'admin'],
            // Coordinators
            ['first_name' => 'Rucelj',        'middle_name' => '', 'last_name' => 'Pugeda',    'suffix' => '', 'sex' => 'Male',   'birthdate' => '1987-07-08', 'degree' => 'MIT',  'specialization' => 'Information Technology', 'role' => 'coordinator_it'],
            ['first_name' => 'Cirilio',        'middle_name' => 'M', 'last_name' => 'Gazzingan','suffix' => '', 'sex' => 'Male',   'birthdate' => '1983-11-19', 'degree' => 'MSCE', 'specialization' => 'Engineering',            'role' => 'coordinator_engineering'],
            // Teachers — 17 total (5 original + 12 new) across IT and Engineering faculty.
            ['first_name' => 'Justine Vince',  'middle_name' => '', 'last_name' => 'Tan',        'suffix' => '', 'sex' => 'Male',   'birthdate' => '1990-02-24', 'degree' => 'MIT',  'specialization' => 'Web Development',         'role' => 'teacher'],
            ['first_name' => 'Luigie',         'middle_name' => '', 'last_name' => 'Cagurangan', 'suffix' => '', 'sex' => 'Male',   'birthdate' => '1991-09-14', 'degree' => 'MIT',  'specialization' => 'Network Systems',         'role' => 'teacher'],
            ['first_name' => 'Reychelle Ann',  'middle_name' => 'M', 'last_name' => 'Antonio',   'suffix' => '', 'sex' => 'Female', 'birthdate' => '1992-05-06', 'degree' => 'MIT',  'specialization' => 'Software Engineering',    'role' => 'teacher'],
            ['first_name' => 'Arvin Roldan',   'middle_name' => 'C', 'last_name' => 'Macaraeg',  'suffix' => '', 'sex' => 'Male',   'birthdate' => '1988-04-15', 'degree' => 'MIT',  'specialization' => 'Database Systems',        'role' => 'teacher'],
            ['first_name' => 'Josephine Ynez', 'middle_name' => 'B', 'last_name' => 'Dela Cruz', 'suffix' => '', 'sex' => 'Female', 'birthdate' => '1993-08-22', 'degree' => 'MSCE', 'specialization' => 'Structural Engineering',  'role' => 'teacher'],
            ['first_name' => 'Marlon',         'middle_name' => 'D', 'last_name' => 'Bayudan',   'suffix' => '', 'sex' => 'Male',   'birthdate' => '1986-01-30', 'degree' => 'MIT',  'specialization' => 'Information Security',    'role' => 'teacher'],
            ['first_name' => 'Cherry Lou',     'middle_name' => 'P', 'last_name' => 'Sabado',    'suffix' => '', 'sex' => 'Female', 'birthdate' => '1989-06-11', 'degree' => 'MIT',  'specialization' => 'Data Analytics',         'role' => 'teacher'],
            ['first_name' => 'Dennis',         'middle_name' => 'R', 'last_name' => 'Villanueva','suffix' => '', 'sex' => 'Male',   'birthdate' => '1984-12-03', 'degree' => 'MSCE', 'specialization' => 'Geotechnical Engineering','role' => 'teacher'],
            ['first_name' => 'Karen Joy',      'middle_name' => 'S', 'last_name' => 'Mangrobang','suffix' => '', 'sex' => 'Female', 'birthdate' => '1991-03-19', 'degree' => 'MSCE', 'specialization' => 'Transportation Engineering', 'role' => 'teacher'],
            ['first_name' => 'Rommel',         'middle_name' => 'T', 'last_name' => 'Battung',   'suffix' => '', 'sex' => 'Male',   'birthdate' => '1987-10-27', 'degree' => 'MIT',  'specialization' => 'Mobile Development',      'role' => 'teacher'],
            ['first_name' => 'Aileen',         'middle_name' => 'V', 'last_name' => 'Pascua',    'suffix' => '', 'sex' => 'Female', 'birthdate' => '1990-08-05', 'degree' => 'MSCE', 'specialization' => 'Water Resources Engineering', 'role' => 'teacher'],
            ['first_name' => 'Gerald',         'middle_name' => 'A', 'last_name' => 'Domingo',   'suffix' => '', 'sex' => 'Male',   'birthdate' => '1985-05-21', 'degree' => 'PhD',  'specialization' => 'General Education — Mathematics', 'role' => 'teacher'],
            ['first_name' => 'Maria Teresa',   'middle_name' => 'L', 'last_name' => 'Bayquen',   'suffix' => '', 'sex' => 'Female', 'birthdate' => '1982-09-09', 'degree' => 'PhD',  'specialization' => 'General Education — Sciences',    'role' => 'teacher'],
            ['first_name' => 'Noel',           'middle_name' => 'F', 'last_name' => 'Carbonell', 'suffix' => '', 'sex' => 'Male',   'birthdate' => '1988-11-14', 'degree' => 'MIT',  'specialization' => 'Systems Analysis',       'role' => 'teacher'],
            ['first_name' => 'Sheila Mae',     'middle_name' => 'G', 'last_name' => 'Tactay',    'suffix' => '', 'sex' => 'Female', 'birthdate' => '1992-12-01', 'degree' => 'MSCE', 'specialization' => 'Construction Management', 'role' => 'teacher'],
            ['first_name' => 'Roberto',        'middle_name' => 'M', 'last_name' => 'Quitalig',  'suffix' => '', 'sex' => 'Male',   'birthdate' => '1983-04-07', 'degree' => 'PhD',  'specialization' => 'General Education — Humanities',  'role' => 'teacher'],
            ['first_name' => 'Veronica',       'middle_name' => 'D', 'last_name' => 'Esguerra',  'suffix' => '', 'sex' => 'Female', 'birthdate' => '1991-07-16', 'degree' => 'MIT',  'specialization' => 'Cloud Computing',         'role' => 'teacher'],
        ];
    }

    private function generateStudents(Program $program): array
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
        $middleNames = [
            'Bautista', 'Reyes', 'Santos', 'Mercado', 'Aquino', 'Del Rosario', 'Villaflor',
            'Salazar', 'Mariano', 'Rivera', 'Velasco', 'Espino', 'Padilla', 'Tolentino',
            'Marquez', 'Galang', 'Bartolome', 'Magbanua', 'Carpio', 'Hernandez',
            'Ocampo', 'Sarmiento', 'Tiongson', 'Verzosa', 'Yumul',
        ];

        $lastNamesByYear = match ($program->code) {
            'BSIT'  => $this->bsitLastNames(),
            'BSCE'  => $this->bsceLastNames(),
            default => $this->genericLastNames(),
        };

        $students = [];
        $populationPlan = self::STUDENT_POPULATION_PLAN[$program->code] ?? [];

        foreach ($populationPlan as $yearLevel => $targetPopulation) {
            $lastNames = $lastNamesByYear[$yearLevel] ?? $lastNamesByYear[array_key_first($lastNamesByYear)];

            for ($index = 0; $index < $targetPopulation; $index++) {
                $isFemale = $index % 2 === 0;
                $firstNamePool = $isFemale ? $femaleFirstNames : $maleFirstNames;

                $students[] = [
                    'first_name'  => $firstNamePool[$index % count($firstNamePool)],
                    'middle_name' => $middleNames[$index % count($middleNames)],
                    'last_name'   => $lastNames[$index % count($lastNames)],
                    'suffix'      => '',
                    'sex'         => $isFemale ? 'Female' : 'Male',
                    'year_level'  => $yearLevel,
                    'archetype'   => StudentArchetype::assign($yearLevel, $index, $targetPopulation),
                    'email'       => strtolower($program->code) . '.y' . $yearLevel . '.' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) . '@site.spup',
                ];
            }
        }

        return $students;
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
            5 => ['Obanil', 'Pagulayan', 'Quizon', 'Rabago', 'Sibayan', 'Tolentino'],
        ];
    }

    /** Shared surname pool for the remaining programs (BSENSE, BSCpE, BLIS). */
    private function genericLastNames(): array
    {
        return [
            1 => ['Agbayani', 'Bonifacio', 'Cuaresma', 'Duremdes', 'Espiritu', 'Fabros', 'Gatchalian', 'Hidalgo', 'Inocencio', 'Jocson'],
            2 => ['Kalaw', 'Lansang', 'Mabini', 'Nakpil', 'Olarte', 'Panganiban', 'Quiambao', 'Rosales', 'Sandoval', 'Tamayo'],
            3 => ['Ubaldo', 'Valdes', 'Wenceslao', 'Ylagan', 'Zamora', 'Acosta', 'Belmonte', 'Custodio', 'Dimaano', 'Encarnacion'],
            4 => ['Frias', 'Genato', 'Halili', 'Ignacio', 'Javellana', 'Ladrera', 'Montinola', 'Nepomuceno'],
            5 => ['Obispo', 'Pineda', 'Quintos', 'Roldan', 'Samonte', 'Trinidad'],
        ];
    }
}

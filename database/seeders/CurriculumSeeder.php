<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Program;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurriculumSeeder extends Seeder
{
    // -------------------------------------------------------------------------
    // BSIT Curriculum
    // -------------------------------------------------------------------------
    private function bsitCourses(): array
    {
        return [
            // ── Year 1, 1st Semester ──────────────────────────────────────
            ['course_code' => 'INT Rel 101', 'title' => 'The Revelation of God in the Old Testament',  'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'GEC 105',     'title' => 'Art Appreciation',                             'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'GEC 106',     'title' => 'Ethics',                                       'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'GEC 107',     'title' => 'Readings in Philippine History',               'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'GE Ele 101',  'title' => 'Kontekstwalisadong Komunikasyon sa Filipino',  'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'PED 101',     'title' => 'Wellness and Fitness',                         'units' => 2, 'lec_hours' => 2, 'lab_hours' => 1, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'ITE 101',     'title' => 'Introduction to Computing',                    'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'ITE 102',     'title' => 'Programming 1',                                'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 1, 'semester_type' => 'first'],

            // ── Year 1, 2nd Semester ──────────────────────────────────────
            ['course_code' => 'INT Rel 102', 'title' => 'Revelation of God in the New Testament',       'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second',
                'prerequisites' => ['INT Rel 101']],
            ['course_code' => 'GEC 101',     'title' => 'Purposive Communication',                      'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'GEC 102',     'title' => 'Science, Technology and Society',              'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'GEC 103',     'title' => 'Mathematics in the Modern World',              'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'GEC 104',     'title' => 'Understanding the Self',                       'units' => 3, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'GE Ele 102',  'title' => "Filipino sa Iba't-Ibang Disiplina",            'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second',
                'prerequisites' => ['GE Ele 101']],
            ['course_code' => 'ITE 103',     'title' => 'Programming 2',                                'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 1, 'semester_type' => 'second',
                'prerequisites' => ['ITE 102']],
            ['course_code' => 'ITE 104',     'title' => 'Information Management',                       'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 1, 'semester_type' => 'second'],

            // ── Year 1, Summer ────────────────────────────────────────────
            ['course_code' => 'PED 102',     'title' => 'Movement Enhancement',                         'units' => 2, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'summer',
                'prerequisites' => ['PED 101']],
            ['course_code' => 'ITE 105',     'title' => 'Discrete Mathematics',                         'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'summer',
                'prerequisites' => ['GEC 103']],
            ['course_code' => 'NST 101',     'title' => 'National Service Training Program 1',          'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'summer'],

            // ── Year 2, 1st Semester ──────────────────────────────────────
            ['course_code' => 'INT Rel 103', 'title' => 'The Church',                                   'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['INT Rel 102']],
            ['course_code' => 'GEC 108',     'title' => 'Contemporary World',                           'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first'],
            ['course_code' => 'ITE 106',     'title' => 'Data Structures and Algorithm',                'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['ITE 103']],
            ['course_code' => 'ITE 107',     'title' => 'Object Oriented Programming',                  'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['ITE 103'], 'co_requisites' => ['ITE 101']],
            ['course_code' => 'ITE 108',     'title' => 'Web Systems and Technologies',                 'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['ITE 103'], 'co_requisites' => ['ITE 103']],
            ['course_code' => 'ITE 109',     'title' => 'Advance Database System',                      'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['ITE 104'], 'co_requisites' => ['ITE 103']],
            ['course_code' => 'INT 101',     'title' => 'ASEAN Studies',                                'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first'],
            ['course_code' => 'PED 103',     'title' => 'Physical Activities Towards Health Fitness 1', 'units' => 2, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['PED 102']],

            // ── Year 2, 2nd Semester ──────────────────────────────────────
            ['course_code' => 'INT Rel 104', 'title' => 'The Sacraments & Liturgy',                     'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['INT Rel 103']],
            ['course_code' => 'GEC 109',     'title' => 'The Life and Works of Rizal',                  'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second'],
            ['course_code' => 'ITE 110',     'title' => 'Rich Media Development',                       'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['ITE 107'], 'co_requisites' => ['ITE 107']],
            ['course_code' => 'ITE 111',     'title' => 'Application Development and Emerging Technologies', 'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['ITE 108'], 'co_requisites' => ['ITE 107']],
            ['course_code' => 'ITE 112',     'title' => 'Quantitative Methods',                         'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['GEC 103'], 'co_requisites' => ['ITE 103']],
            ['course_code' => 'ITE 113',     'title' => 'Human Computer Interaction',                   'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['ITE 106']],
            ['course_code' => 'LIT 101',     'title' => 'Panitikang Panlipunan',                        'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second'],
            ['course_code' => 'PED 104',     'title' => 'Physical Activities Towards Health and Fitness 2 (Swimming)', 'units' => 2, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['PED 103']],

            // ── Year 2, Summer ────────────────────────────────────────────
            ['course_code' => 'NST 102',     'title' => 'National Service Training Program 2',          'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'summer',
                'prerequisites' => ['NST 101']],
            ['course_code' => 'ITE 114',     'title' => 'Free Elective 1 (Accounting Process)',         'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 2, 'semester_type' => 'summer'],
            ['course_code' => 'INT Rel 105', 'title' => 'Christian Morality (General Morals)',          'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'summer',
                'prerequisites' => ['INT Rel 104']],

            // ── Year 3, 1st Semester ──────────────────────────────────────
            ['course_code' => 'INT Rel 106', 'title' => 'Christian Morality (Specific Morals)',         'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['INT Rel 105']],
            ['course_code' => 'LIT 102',     'title' => 'Pelikutang Panlipunan',                        'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['LIT 101']],
            ['course_code' => 'ITE 115',     'title' => 'Information Assurance and Security',           'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ITE 112']],
            ['course_code' => 'ITE 116',     'title' => 'Integrative and Programming Technologies',     'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ITE 110']],
            ['course_code' => 'ITE 117',     'title' => 'Social and Professional Issues',               'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first'],
            ['course_code' => 'ITE 118',     'title' => 'Elective 1 (Platform Technologies)',           'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ITE 113'], 'co_requisites' => ['ITE 112']],
            ['course_code' => 'ITE 119',     'title' => 'Systems Integration and Architecture',         'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ITE 108']],
            ['course_code' => 'ITE 120',     'title' => 'Capstone Project 1 (Project Research Proposal)', 'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ITE 107', 'ITE 111']],

            // ── Year 3, 2nd Semester ──────────────────────────────────────
            ['course_code' => 'INT Rel 107', 'title' => 'Christian Vocation (Sacraments of Marriage)', 'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['INT Rel 106']],
            ['course_code' => 'ITE 121',     'title' => 'Computer Networks Systems',                    'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ITE 118']],
            ['course_code' => 'ITE 122',     'title' => 'Elective 2 (Game Development)',                'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ITE 119']],
            ['course_code' => 'ITE 123',     'title' => 'Capstone Project and Research 2 (Project Development)', 'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ITE 120']],
            ['course_code' => 'ITE 124',     'title' => 'Elective 3 (Hybrid Mobile Application)',      'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ITE 118']],
            ['course_code' => 'ITE 125',     'title' => 'Free Elective 2 (Strategic Planning - ERP)',   'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second'],
            ['course_code' => 'ITE 126',     'title' => 'Artificial Intelligence & Robotics',           'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ITE 113'], 'co_requisites' => ['ITE 103']],
            ['course_code' => 'FLG 101',     'title' => 'Mandarin',                                     'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second'],

            // ── Year 4, 1st Semester ──────────────────────────────────────
            ['course_code' => 'INT Rel 108', 'title' => 'The Social Teachings of the Church and Christian Apostolate', 'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['INT Rel 107']],
            ['course_code' => 'ITE 127',     'title' => 'Capstone Project and Research 2 - Project Implementation', 'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['ITE 123']],
            ['course_code' => 'ITE 128',     'title' => 'Systems Administration & Maintenance',         'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['ITE 115']],
            ['course_code' => 'ITE 129',     'title' => 'Free Elective 3 (Project Management)',         'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['ITE 109']],
            ['course_code' => 'ITE 130',     'title' => 'Elective 4 (Data Mining and Data Warehousing)','units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['ITE 126'], 'co_requisites' => ['ITE 119']],
            ['course_code' => 'ITE 131',     'title' => 'Certification Exam',                           'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 4, 'semester_type' => 'first'],

            // ── Year 4, 2nd Semester ──────────────────────────────────────
            ['course_code' => 'ITE 132',     'title' => 'Practicum (International/National/Local)',     'units' => 9, 'lec_hours' => 0, 'lab_hours' => 9, 'year_level' => 4, 'semester_type' => 'second'],
        ];
    }

    // -------------------------------------------------------------------------
    // BSCE Curriculum
    // -------------------------------------------------------------------------
    private function bsceCourses(): array
    {
        return [
            // ── Year 1, 1st Semester ──────────────────────────────────────
            ['course_code' => 'INTREL101',  'title' => 'The Revelation of God in the Old Testament',    'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'GEC 105',    'title' => 'Art Appreciation',                              'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'GEC 103',    'title' => 'Mathematics in the Modern World',               'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'GEC 107',    'title' => 'Readings in Philippine History',                'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'GE Ele 101', 'title' => 'Kontekstwalisadong Komunikasyon sa Filipino',   'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'PED 101',    'title' => 'Wellness and Fitness',                          'units' => 2, 'lec_hours' => 2, 'lab_hours' => 1, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'ENGMAT 1',   'title' => 'Calculus I (DC)',                               'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'CHEM1set',   'title' => 'Chemistry for Engineering',                     'units' => 4, 'lec_hours' => 3, 'lab_hours' => 1, 'year_level' => 1, 'semester_type' => 'first'],
            ['course_code' => 'CE101',      'title' => 'Civil Engineering Orientation',                 'units' => 2, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'first'],

            // ── Year 1, 2nd Semester ──────────────────────────────────────
            ['course_code' => 'INTREL102',  'title' => 'The Revelation in the New Testament (Cristology)', 'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second',
                'prerequisites' => ['INTREL101']],
            ['course_code' => 'GEC101',     'title' => 'Purposive Communication',                       'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'GEC102',     'title' => 'Science, Technology and Society',               'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'GEC106',     'title' => 'Ethics',                                        'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'GEC104',     'title' => 'Understanding the Self',                        'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'GE Ele 102', 'title' => "Filipino sa Iba't Ibang Disiplina",             'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second',
                'prerequisites' => ['GE Ele 101']],
            ['course_code' => 'ENGGMAT2',   'title' => 'Calculus 2 (IC)',                               'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second',
                'prerequisites' => ['ENGMAT 1']],
            ['course_code' => 'PHY1set',    'title' => 'Physics for Engineers',                         'units' => 4, 'lec_hours' => 3, 'lab_hours' => 1, 'year_level' => 1, 'semester_type' => 'second',
                'prerequisites' => ['ENGMAT 1']],
            ['course_code' => 'ENGG101',    'title' => 'Engineering Drawings and Plans',                'units' => 1, 'lec_hours' => 0, 'lab_hours' => 1, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'NST101',     'title' => 'National Service Training Program 1',           'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 1, 'semester_type' => 'second'],
            ['course_code' => 'PED102',     'title' => 'Movement Enhancement',                          'units' => 2, 'lec_hours' => 2, 'lab_hours' => 1, 'year_level' => 1, 'semester_type' => 'second'],

            // ── Year 2, 1st Semester ──────────────────────────────────────
            ['course_code' => 'INTREL103',  'title' => 'The Church',                                    'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['INTREL102']],
            ['course_code' => 'GEC 8',      'title' => 'Contemporary World',                            'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first'],
            ['course_code' => 'FLG101',     'title' => 'Foreign Language (Mandarin)',                   'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first'],
            ['course_code' => 'PED 103',    'title' => 'Physical Activities Towards Health and Fitness I', 'units' => 2, 'lec_hours' => 2, 'lab_hours' => 1, 'year_level' => 2, 'semester_type' => 'first'],
            ['course_code' => 'ENGGMAT3',   'title' => 'Differential Equations',                        'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['ENGGMAT2']],
            ['course_code' => 'ENGG104',    'title' => 'Statics of Rigid Bodies',                       'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['PHY1set', 'ENGGMAT2']],
            ['course_code' => 'ENGG113',    'title' => 'Fundamentals of Surveying',                     'units' => 4, 'lec_hours' => 3, 'lab_hours' => 1, 'year_level' => 2, 'semester_type' => 'first',
                'prerequisites' => ['ENGG101', 'PHY1set']],
            ['course_code' => 'ENGG102',    'title' => 'Computer Fundamentals and Programming',         'units' => 2, 'lec_hours' => 0, 'lab_hours' => 2, 'year_level' => 2, 'semester_type' => 'first'],

            // ── Year 2, 2nd Semester ──────────────────────────────────────
            ['course_code' => 'INTREL104',  'title' => 'The Sacraments and Liturgy',                    'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['INTREL103']],
            ['course_code' => 'GEC 109',    'title' => 'The Life and Works of Rizal',                   'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second'],
            ['course_code' => 'PED 104',    'title' => 'Physical Activities Towards Health and Fitness II (Swimming)', 'units' => 2, 'lec_hours' => 2, 'lab_hours' => 1, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['PED102']],
            ['course_code' => 'INT 101',    'title' => 'ASEAN Studies',                                 'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second'],
            ['course_code' => 'ENGG107',    'title' => 'Engineering Economy',                           'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second'],
            ['course_code' => 'ENGGEO1',    'title' => 'Engineering Geology',                           'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['CHEM1set']],
            ['course_code' => 'ENGG105',    'title' => 'Dynamics of Rigid Bodies',                      'units' => 2, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['ENGGMAT3', 'ENGG104']],
            ['course_code' => 'ENGG106',    'title' => 'Mechanics of Deformable Bodies',                'units' => 4, 'lec_hours' => 4, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['ENGGMAT3', 'ENGG105']],
            ['course_code' => 'ENGG103',    'title' => 'Computer Aided Drafting',                       'units' => 1, 'lec_hours' => 0, 'lab_hours' => 1, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['ENGG101']],
            ['course_code' => 'ENGGMAT4',   'title' => 'Engineering Data Analysis',                     'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['GEC101', 'ENGG107']],
            ['course_code' => 'NST102',     'title' => 'National Service Training Program 2',           'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['NST101']],
            ['course_code' => 'CE102',      'title' => 'Building Systems Design',                       'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 2, 'semester_type' => 'second',
                'prerequisites' => ['ENGG101', 'ENGG103']],

            // ── Year 3, 1st Semester ──────────────────────────────────────
            ['course_code' => 'INTREL105',  'title' => 'Christian Morality (General Morals)',           'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['INTREL104']],
            ['course_code' => 'CE104',      'title' => 'Highway and Rail Road Engineering',             'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ENGG113']],
            ['course_code' => 'ENGGMAT 5',  'title' => 'Numerical Solutions to Engineering Problems',   'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ENGGMAT3']],
            ['course_code' => 'ENGG112',    'title' => 'Construction and Materials Testing',            'units' => 3, 'lec_hours' => 2, 'lab_hours' => 1, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ENGG105', 'ENGG106']],
            ['course_code' => 'ENGG114',    'title' => 'Structural Theory',                             'units' => 4, 'lec_hours' => 4, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['ENGG105', 'ENGG106']],
            ['course_code' => 'ENGG110',    'title' => 'Basic Mechanical Engineering (Utilities 1)',    'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['PHY1set']],
            ['course_code' => 'ENGG111',    'title' => 'Basic Electrical Engineering (Utilities 2)',    'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'first',
                'prerequisites' => ['PHY1set']],

            // ── Year 3, 2nd Semester ──────────────────────────────────────
            ['course_code' => 'INTREL106',  'title' => 'Christian Morality (Specific Morals)',          'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['INTREL105']],
            ['course_code' => 'ENGG115',    'title' => 'Principles of Reinforced Concrete',             'units' => 4, 'lec_hours' => 4, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ENGG114']],
            ['course_code' => 'ENGG116',    'title' => 'Hydraulics',                                    'units' => 5, 'lec_hours' => 4, 'lab_hours' => 1, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ENGG105', 'ENGG106']],
            ['course_code' => 'ENGG117',    'title' => 'Hydrology',                                     'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ENGGMAT3']],
            ['course_code' => 'ENGG109',    'title' => 'Engineering Management',                        'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ENGG107']],
            ['course_code' => 'CE103',      'title' => 'Principles of Steel',                           'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second',
                'prerequisites' => ['ENGG114', 'ENGG112']],
            ['course_code' => 'CE105',      'title' => 'CE Laws, Ethics and Contracts',                 'units' => 2, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 3, 'semester_type' => 'second'],
            ['course_code' => 'CE114',      'title' => 'On-the-Job Training',                           'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 3, 'semester_type' => 'second'],

            // ── Year 4, 1st Semester ──────────────────────────────────────
            ['course_code' => 'INTREL107',  'title' => 'Christian Vocation and Sacrament of Marriage',  'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['INTREL106']],
            ['course_code' => 'ENGG108',    'title' => 'Technopreneurship 101',                         'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['ENGG107', 'ENGG109']],
            ['course_code' => 'ENGG118',    'title' => 'Geotechnical Engineering I (Soil Mechanics)',   'units' => 4, 'lec_hours' => 4, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['ENGG106', 'ENGG114', 'ENGG116']],
            ['course_code' => 'CE106',      'title' => 'Principles of Transportation Engineering',      'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['CE104']],
            ['course_code' => 'CE109',      'title' => 'Earthquake Engineering',                        'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['ENGG118']],
            ['course_code' => 'CE110',      'title' => 'Reinforced Concrete Design',                    'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['ENGG115']],
            ['course_code' => 'CE107',      'title' => 'CE Project I',                                  'units' => 2, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'first',
                'prerequisites' => ['CE114']],

            // ── Year 4, 2nd Semester ──────────────────────────────────────
            ['course_code' => 'INTREL108',  'title' => 'The Social Teachings of the Church and Christian Apostolate', 'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'second',
                'prerequisites' => ['INTREL107']],
            ['course_code' => 'ENGG119',    'title' => 'Construction Methods and Project Management',   'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'second'],
            ['course_code' => 'CE107QS',    'title' => 'Quantity Surveying',                            'units' => 2, 'lec_hours' => 2, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'second',
                'prerequisites' => ['CE102']],
            ['course_code' => 'CE111',      'title' => 'Design of Steel Structures',                    'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'second'],
            ['course_code' => 'CE112',      'title' => 'Bridge Engineering',                            'units' => 3, 'lec_hours' => 3, 'lab_hours' => 0, 'year_level' => 4, 'semester_type' => 'second'],
            ['course_code' => 'CE126',      'title' => 'Computer Software in Structural Analysis',      'units' => 3, 'lec_hours' => 0, 'lab_hours' => 3, 'year_level' => 4, 'semester_type' => 'second'],
            ['course_code' => 'CE127',      'title' => 'CE Project II',                                 'units' => 3, 'lec_hours' => 2, 'lab_hours' => 1, 'year_level' => 4, 'semester_type' => 'second',
                'prerequisites' => ['CE107']],
            ['course_code' => 'ENGG120',    'title' => 'Integrating Course I',                          'units' => 9, 'lec_hours' => 0, 'lab_hours' => 9, 'year_level' => 4, 'semester_type' => 'second'],
            ['course_code' => 'CE115',      'title' => 'Integrating Course II',                         'units' => 9, 'lec_hours' => 0, 'lab_hours' => 9, 'year_level' => 4, 'semester_type' => 'second'],
        ];
    }

    // -------------------------------------------------------------------------
    // Run
    // -------------------------------------------------------------------------
    public function run(): void
    {
        DB::disableQueryLog();

        $bsit = Program::where('code', 'BSIT')->firstOrFail();
        $bsce = Program::where('code', 'BSCE')->firstOrFail();

        $this->seedProgram($bsit, $this->bsitCourses());
        $this->seedProgram($bsce, $this->bsceCourses());
    }

    private function seedProgram($program, array $coursesData): void
    {
        // ── Pass 1: upsert all courses (no prereqs yet) ───────────────────
        foreach ($coursesData as $data) {
            Course::updateOrCreate(
                ['program_id' => $program->id, 'course_code' => $data['course_code']],
                [
                    'title'         => $data['title'],
                    'units'         => $data['units'],
                    'lec_hours'     => $data['lec_hours'],
                    'lab_hours'     => $data['lab_hours'],
                    'year_level'    => $data['year_level'],
                    'semester_type' => $data['semester_type'],
                    'is_active'     => true,
                ]
            );
        }

        // ── Build a lookup map: course_code → id ─────────────────────────
        $courseMap = Course::where('program_id', $program->id)
            ->pluck('id', 'course_code');

        // ── Pass 2: seed prerequisites and co-requisites ──────────────────
        foreach ($coursesData as $data) {
            $courseId = $courseMap[$data['course_code']] ?? null;
            if (! $courseId) {
                continue;
            }

            foreach (($data['prerequisites'] ?? []) as $preCode) {
                $prereqId = $courseMap[$preCode] ?? null;
                if (! $prereqId) {
                    continue;
                }
                DB::table('course_prerequisites')->updateOrInsert(
                    ['course_id' => $courseId, 'prerequisite_id' => $prereqId, 'type' => 'prerequisite'],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }

            foreach (($data['co_requisites'] ?? []) as $coCode) {
                $coId = $courseMap[$coCode] ?? null;
                if (! $coId) {
                    continue;
                }
                DB::table('course_prerequisites')->updateOrInsert(
                    ['course_id' => $courseId, 'prerequisite_id' => $coId, 'type' => 'co_requisite'],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }
}

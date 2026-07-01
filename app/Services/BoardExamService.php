<?php

namespace App\Services;

use App\Models\BoardExamResult;
use App\Models\Program;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BoardExamService
{
    /** Engineering program codes that own board/licensure exams in this system. */
    public const ENGINEERING_CODES = ['BSCE', 'BSENSE'];

    public const MONTHS = [
        1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
        5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
        9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December',
    ];

    /** Program ids eligible for board-exam records (engineering only). */
    public function engineeringProgramIds(): array
    {
        return Program::whereIn('code', self::ENGINEERING_CODES)->pluck('id')->all();
    }

    /** Engineering programs for the form dropdown (id + code + name). */
    public function engineeringPrograms(): array
    {
        return Program::whereIn('code', self::ENGINEERING_CODES)
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->all();
    }

    public function paginate(): LengthAwarePaginator
    {
        return BoardExamResult::query()
            ->with(['program' => fn ($query) => $query->select('id', 'code', 'name')])
            ->ordered()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (BoardExamResult $result) => $this->transform($result));
    }

    /** Every record (newest first) for the printable admin report — no pagination. */
    public function allForReport(): array
    {
        return BoardExamResult::query()
            ->with(['program' => fn ($query) => $query->select('id', 'code', 'name')])
            ->ordered()
            ->get()
            ->map(fn (BoardExamResult $result) => $this->transform($result))
            ->all();
    }

    /** Flatten a record into the shape the tables/report read. */
    private function transform(BoardExamResult $result): array
    {
        return [
            'id'                  => $result->id,
            'program'             => $result->program?->code,
            'program_name'        => $result->program?->name,
            'program_id'          => $result->program_id,
            'exam_name'           => $result->exam_name,
            'exam_year'           => $result->exam_year,
            'exam_month'          => $result->exam_month,
            'intake'              => self::MONTHS[$result->exam_month] . ' ' . $result->exam_year,
            'first_takers'        => $result->first_takers,
            'first_taker_passers' => $result->first_taker_passers,
            'retakers'            => $result->retakers,
            'retaker_passers'     => $result->retaker_passers,
            'total_takers'        => $result->total_takers,
            'total_passers'       => $result->total_passers,
            'pass_rate'           => $result->total_takers > 0
                ? round($result->total_passers / $result->total_takers * 100, 1)
                : 0,
            'remarks'             => $result->remarks,
        ];
    }

    public function create(array $data, int $recordedBy): BoardExamResult
    {
        return BoardExamResult::create([...$data, 'recorded_by' => $recordedBy]);
    }

    public function update(BoardExamResult $result, array $data): BoardExamResult
    {
        $result->update($data);

        return $result;
    }
}

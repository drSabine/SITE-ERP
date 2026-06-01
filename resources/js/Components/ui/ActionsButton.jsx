import { ChevronDownIcon } from './Icons';

export default function ActionsButton() {
    return (
        <button
            type="button"
            className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
        >
            Actions
            <ChevronDownIcon className="h-3.5 w-3.5 opacity-60" />
        </button>
    );
}

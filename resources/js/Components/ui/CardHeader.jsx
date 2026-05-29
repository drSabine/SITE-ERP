/**
 * Standard card header: title + optional description on the left, optional action on the right.
 * description accepts a string or a ReactNode (e.g. a breadcrumb row).
 */
export default function CardHeader({ title, description, action }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                {description && (
                    <div className="mt-0.5 text-sm text-gray-500">{description}</div>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

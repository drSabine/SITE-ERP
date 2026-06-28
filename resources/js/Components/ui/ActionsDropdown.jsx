import Dropdown from './Dropdown';
import ActionsButton from './ActionsButton';

/**
 * Convenience wrapper for table row action menus.
 *
 * items: Array<{
 *   label: string,
 *   onClick?: () => void,
 *   href?: string,
 *   disabled?: boolean,
 *   variant?: 'default' | 'primary' | 'danger',
 * } | false | null | undefined>
 *
 * Falsy items are filtered out automatically, so conditional items can be
 * inlined without extra ternaries:
 *   items={[
 *     { label: 'Edit', onClick: () => openEdit(row) },
 *     !row.locked && { label: 'Delete', onClick: () => ..., variant: 'danger' },
 *   ]}
 */
export default function ActionsDropdown({ items = [] }) {
    const visibleItems = items.filter(Boolean);

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <ActionsButton />
            </Dropdown.Trigger>
            <Dropdown.Content width="40" align="right">
                {visibleItems.map((item, index) => {
                    if (item.href) {
                        return (
                            <Dropdown.Link key={index} href={item.href}>
                                {item.label}
                            </Dropdown.Link>
                        );
                    }

                    const variantClass =
                        item.variant === 'danger'  ? 'text-red-600 hover:bg-red-50' :
                        item.variant === 'primary' ? 'text-emerald-700 hover:bg-emerald-50' :
                                                     'text-gray-700 hover:bg-gray-100';

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={`block w-full px-4 py-2 text-start text-sm disabled:pointer-events-none disabled:opacity-50 ${variantClass}`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </Dropdown.Content>
        </Dropdown>
    );
}

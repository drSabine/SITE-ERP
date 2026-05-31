import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DropDownContext = createContext();

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    const close = () => setOpen(false);

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen, close, triggerRef, dropdownRef }}>
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { open, setOpen, toggleOpen, triggerRef } = useContext(DropDownContext);

    return (
        <div ref={triggerRef} onClick={toggleOpen}>{children}</div>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white',
    children,
}) => {
    const { open, setOpen, close, triggerRef, dropdownRef } = useContext(DropDownContext);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const dropdownWidth = width === '40' ? 160 : 192; // w-40 = 160px, w-48 = 192px

            let left = rect.left;
            if (align === 'right') {
                left = rect.right - dropdownWidth;
            } else if (align === 'center') {
                left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
            }

            setPosition({
                top: rect.bottom + 4,
                left: Math.max(8, Math.min(left, window.innerWidth - dropdownWidth - 8)),
            });
        }
    };

    useEffect(() => {
        if (open) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [open, align, width, triggerRef]);

    let widthClasses = '';

    if (width === '40') {
        widthClasses = 'w-40';
    } else if (width === '48') {
        widthClasses = 'w-48';
    }

    if (!open) return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-40"
                onClick={close}
            />
            <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div
                    ref={dropdownRef}
                    className={`fixed z-50 rounded-md shadow-lg ${widthClasses}`}
                    style={{ top: position.top, left: position.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className={
                            `rounded-md ring-1 ring-black ring-opacity-5 ` +
                            contentClasses
                        }
                    >
                        {children}
                    </div>
                </div>
            </Transition>
        </>,
        document.body
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;

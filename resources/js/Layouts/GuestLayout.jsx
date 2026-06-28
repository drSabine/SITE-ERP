import { ApplicationLogo } from '@/Components/ui';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden border border-gray-200 bg-white px-6 py-4 shadow-sm sm:max-w-md">
                {children}
            </div>
        </div>
    );
}

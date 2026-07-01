import { Checkbox, InputError, InputLabel, TextInput } from '@/Components/ui';
import { ForgotPasswordModal } from '@/Components/Auth';
import { BackIcon } from '@/Components/ui/Icons';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const FOOTER = 'Project created by BSIT-3B Major in Website Development as a requirement for ITE 125. S.Y 2025-2026.';

const DEV_ACCOUNTS = [
    { label: 'Admin',            email: 'marifelgrace.kummer@site.spup' },
    { label: 'IT Coordinator',   email: 'rucelj.pugeda@site.spup' },
    { label: 'Eng. Coordinator', email: 'cirilio.gazzingan@site.spup' },
    { label: 'Teacher',          email: 'justinevince.tan@site.spup' },
    { label: 'Student',          email: 'bsit.y1.01@site.spup' },
];

/**
 * Floating, collapsible dev quick-login — pinned to the screen corner so it
 * stays out of the real credentials card. Only mounts off-production.
 */
function DevLoginPanel({ onPick }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="login-devpanel fixed bottom-4 right-4 z-30 flex flex-col items-end">
            {open && (
                <div className="login-devpop mb-2 w-56 border border-amber-300 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Dev Quick Login</p>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-gray-400 hover:text-gray-700"
                            aria-label="Close dev login"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {DEV_ACCOUNTS.map(account => (
                            <button
                                key={account.email}
                                type="button"
                                onClick={() => onPick(account.email)}
                                className="block w-full border border-amber-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.98]"
                            >
                                {account.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen(value => !value)}
                className="flex items-center gap-2 border border-amber-400 bg-amber-50 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-amber-800 shadow-lg transition-colors hover:bg-amber-100"
                aria-expanded={open}
            >
                <span className="inline-block h-2 w-2 bg-amber-400" aria-hidden="true" />
                Dev Login
            </button>
        </div>
    );
}

export default function Login({ status, appEnv }) {
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function quickFill(email) {
        setData('email', email);
        setData('password', 'password');
    }

    function handleSubmit(event) {
        event.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
            <Head title="Log In">
                <link rel="preload" as="image" href="/images/spup-bg-landing-page.jpg" />
            </Head>

            {/* Shared scene with the landing hero: same photo + overlay for visual continuity.
                The deep-emerald base color keeps the pre-load state matching the final tint
                instead of flashing bright green over the page body. */}
            <div className="absolute inset-0 bg-emerald-950 bg-[url('/images/spup-bg-landing-page.jpg')] bg-cover bg-center" aria-hidden="true" />
            <div className="absolute inset-0 bg-emerald-950/80" aria-hidden="true" />

            <Link
                href="/"
                className="login-fade absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 drop-shadow transition-colors hover:text-white"
            >
                <BackIcon className="h-4 w-4" />
                Back to Site
            </Link>

            {/* Centered credentials card — rises into the same scene */}
            <div className="login-card relative z-10 w-full max-w-md">
                <div className="border border-white/10 bg-white p-8 shadow-2xl shadow-black/40 sm:p-10">
                    <div className="login-stagger flex justify-center" style={{ animationDelay: '220ms' }}>
                        <img
                            src="/images/SPUP-final-logo.png"
                            alt="SPUP Seal"
                            className="h-20 w-20 object-contain drop-shadow-md"
                        />
                    </div>

                    <div className="login-stagger mt-6 text-center" style={{ animationDelay: '300ms' }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">SITE · Account Access</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Welcome back</h1>
                        <p className="mt-1.5 text-sm text-gray-500">Sign in to continue to the academic information system.</p>
                    </div>

                    {status && (
                        <div className="login-stagger mt-6 border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-800" style={{ animationDelay: '360ms' }}>
                            {status}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-stagger mt-8 space-y-5" style={{ animationDelay: '380ms' }}>
                        <div>
                            <InputLabel htmlFor="email" value="Email Address" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full rounded"
                                autoComplete="username"
                                isFocused={true}
                                onChange={event => setData('email', event.target.value)}
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="Password" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full rounded"
                                autoComplete="current-password"
                                onChange={event => setData('password', event.target.value)}
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={event => setData('remember', event.target.checked)}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                Remember me
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm font-medium text-emerald-700 hover:text-emerald-900 focus:outline-none"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-emerald-700 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
                        >
                            {processing ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="login-stagger mt-6 text-center text-xs text-white/70" style={{ animationDelay: '460ms' }}>
                    {FOOTER}
                </p>
            </div>

            {appEnv !== 'production' && <DevLoginPanel onPick={quickFill} />}

            <ForgotPasswordModal
                show={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />

            <style>{`
                @keyframes rise {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .login-card { opacity: 0; animation: rise 600ms cubic-bezier(0.16, 1, 0.3, 1) both; }
                .login-fade { opacity: 0; animation: rise 500ms cubic-bezier(0.16, 1, 0.3, 1) 160ms both; }
                .login-stagger { opacity: 0; animation: rise 600ms cubic-bezier(0.16, 1, 0.3, 1) both; }
                .login-devpanel { opacity: 0; animation: rise 500ms cubic-bezier(0.16, 1, 0.3, 1) 500ms both; }
                .login-devpop { animation: rise 200ms cubic-bezier(0.16, 1, 0.3, 1) both; }

                @media (prefers-reduced-motion: reduce) {
                    .login-card,
                    .login-fade,
                    .login-stagger,
                    .login-devpanel,
                    .login-devpop {
                        opacity: 1;
                        animation: none;
                        transform: none;
                    }
                }
            `}</style>
        </div>
    );
}

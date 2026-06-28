import { Checkbox, InputError, InputLabel, TextInput } from '@/Components/ui';
import { ForgotPasswordModal } from '@/Components/Auth';
import { BackIcon } from '@/Components/ui/Icons';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status, appEnv }) {
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function quickFill(role) {
        const credentials = {
            admin:       { email: 'marifelgrace.kummer@site.spup', password: 'password' },
            coordinator: { email: 'rucelj.pugeda@site.spup',       password: 'password' },
            teacher:     { email: 'justinevince.tan@site.spup',    password: 'password' },
            student:     { email: 'bsit.y1.01@site.spup',          password: 'password' },
        };
        setData('email', credentials[role].email);
        setData('password', credentials[role].password);
    }

    function handleSubmit(event) {
        event.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    }

    return (
        <div className="flex min-h-screen">
            <Head title="Log In" />

            <div className="relative hidden overflow-hidden lg:flex lg:w-2/5 flex-col items-center justify-center bg-[url('/images/spup-bg-landing-page.jpg')] bg-cover bg-center px-12 py-16">
                <div className="absolute inset-0 bg-emerald-950/80" aria-hidden="true" />

                <Link
                    href="/"
                    className="absolute left-6 top-6 z-10 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-100 transition-colors hover:text-white"
                >
                    <BackIcon className="h-4 w-4" />
                    Back to Site
                </Link>

                <div className="relative z-10 text-center">
                    <img
                        src="/images/SPUP-final-logo.png"
                        alt="SPUP Seal"
                        className="mx-auto h-28 w-28 object-contain drop-shadow-xl"
                    />

                    <h1
                        className="mt-8 whitespace-nowrap text-2xl font-normal leading-snug text-white tracking-wide"
                        style={{ fontFamily: "'OldEnglish', serif" }}
                    >
                        St. Paul University Philippines
                    </h1>

                    <p className="mt-6 text-xs font-bold uppercase tracking-widest text-emerald-300 leading-relaxed">
                        School of Information Technology<br />and Engineering
                    </p>
                </div>
            </div>

            {/* ── Right panel: Login form ── */}
            <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12 sm:px-12">

                {/* Mobile-only back link + compact header */}
                <Link
                    href="/"
                    className="mb-6 inline-flex items-center gap-1.5 self-start text-xs font-semibold uppercase tracking-widest text-emerald-700 lg:hidden"
                >
                    <BackIcon className="h-4 w-4" />
                    Back to Site
                </Link>

                <div className="mb-8 flex items-center gap-3 lg:hidden">
                    <img src="/images/SPUP-final-logo.png" alt="SPUP" className="h-12 w-12 object-contain" />
                    <div className="leading-tight">
                        <h1
                            className="text-lg font-normal text-emerald-900"
                            style={{ fontFamily: "'OldEnglish', serif" }}
                        >
                            St. Paul University Philippines
                        </h1>
                        <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                            School of Information Technology and Engineering
                        </p>
                    </div>
                </div>

                <div className="w-full max-w-md border border-gray-200 bg-white p-8 sm:p-10 shadow-sm">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
                        <p className="mt-1.5 text-sm text-gray-500">Sign in to your account to continue.</p>
                    </div>

                    {status && (
                        <div className="mb-6 border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
                            {status}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                            className="w-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
                        >
                            {processing ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {appEnv !== 'production' && (
                        <div className="mt-8 border border-gray-200 bg-gray-50 p-5">
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Dev Quick Login
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                                {['admin', 'coordinator', 'teacher', 'student'].map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => quickFill(role)}
                                        className="border border-gray-200 bg-white px-3 py-2 text-xs font-semibold capitalize text-gray-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.98]"
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="mt-8 text-center text-xs text-gray-400">
                        Project created by BSIT-3B Major in Website Development. S.Y 2025-2026.
                    </p>
                </div>
            </div>

            <ForgotPasswordModal
                show={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
}

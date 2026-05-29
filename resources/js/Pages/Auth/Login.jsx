import { Checkbox, InputError, InputLabel, TextInput } from '@/Components/ui';
import { ForgotPasswordModal } from '@/Components/Auth';
import { Head, useForm } from '@inertiajs/react';
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
            student:     { email: 'alyssamae.soriano@site.spup',   password: 'password' },
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

            {/* ── Left panel: SPUP branding ── */}
            <div className="relative hidden overflow-hidden lg:flex lg:w-2/5 flex-col items-center justify-center bg-emerald-900 px-12 py-16">
                {/* Dot-grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                />
                {/* Corner accents */}
                <div className="absolute bottom-0 left-0 h-48 w-48 rounded-tr-full bg-yellow-400 opacity-10" />
                <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-yellow-400 opacity-10" />

                <div className="relative z-10 text-center">
                    {/* SPUP Seal */}
                    <div className="mb-8 flex justify-center">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-yellow-400 bg-emerald-800 p-2 shadow-lg">
                            <img src="/images/SPUP-final-logo.png" alt="SPUP Seal" className="h-full w-full object-contain" />
                        </div>
                    </div>

                    <h1
                        className="text-[1.8rem] font-normal leading-snug text-white"
                        style={{ fontFamily: "'OldEnglish', serif" }}
                    >
                        St. Paul University<br />Philippines
                    </h1>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-yellow-400 opacity-40" />
                        <div className="h-2 w-2 rounded-full bg-yellow-400" />
                        <div className="h-px flex-1 bg-yellow-400 opacity-40" />
                    </div>

                    <p className="text-base font-medium leading-snug text-emerald-100">
                        School of Information Technology<br />and Engineering
                    </p>
                </div>
            </div>

            {/* ── Right panel: Login form ── */}
            <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12 sm:px-12">

                {/* Mobile-only compact header */}
                <div className="mb-8 text-center lg:hidden">
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-700 bg-emerald-900 p-1">
                            <img src="/images/SPUP-final-logo.png" alt="SPUP" className="h-full w-full object-contain" />
                        </div>
                    </div>
                    <h1
                        className="text-xl font-normal leading-tight text-emerald-900"
                        style={{ fontFamily: "'OldEnglish', serif" }}
                    >
                        St. Paul University Philippines
                    </h1>
                    <p className="mt-1 text-sm font-medium text-gray-600">
                        School of Information Technology and Engineering
                    </p>
                </div>

                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                        <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue.</p>
                    </div>

                    {status && (
                        <div className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
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
                                className="mt-1 block w-full"
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
                                className="mt-1 block w-full"
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
                                />
                                Remember me
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-emerald-700 hover:text-emerald-900 focus:outline-none"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60"
                        >
                            {processing ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {appEnv !== 'production' && (
                        <div className="mt-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-600">
                                Dev Quick Login
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {['admin', 'coordinator', 'teacher', 'student'].map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => quickFill(role)}
                                        className="rounded-md bg-amber-100 px-3 py-2 text-xs font-medium capitalize text-amber-800 transition-colors hover:bg-amber-200"
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

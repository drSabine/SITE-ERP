import { Checkbox, InputError, InputLabel, PrimaryButton, TextInput } from '@/Components/ui';
import { ForgotPasswordModal } from '@/Components/Auth';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status }) {
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function handleSubmit(event) {
        event.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-12">
            <Head title="Log In" />

            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold leading-tight text-gray-900">
                        School of Information Technology
                    </h1>
                    <p className="mt-1 text-lg font-medium text-gray-600">and Engineering Portal</p>
                </div>

                <div className="rounded-xl bg-white px-8 py-8 shadow-sm ring-1 ring-gray-200">
                    {status && (
                        <div className="mb-5 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
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
                                className="text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <PrimaryButton className="w-full justify-center py-2.5" disabled={processing}>
                            Log In
                        </PrimaryButton>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Project created by BSIT-3B Major in Website Development. S.Y 2025-2026.
                </p>
            </div>

            <ForgotPasswordModal
                show={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
}

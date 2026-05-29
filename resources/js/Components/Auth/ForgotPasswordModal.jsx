import { Modal, InputError, InputLabel, PrimaryButton, SecondaryButton, TextInput } from '@/Components/ui';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function ForgotPasswordModal({ show, onClose }) {
    const [submitted, setSubmitted] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ email: '' });

    function handleSubmit(event) {
        event.preventDefault();
        post(route('password.email'), { onSuccess: () => setSubmitted(true) });
    }

    function handleAfterLeave() {
        reset();
        setSubmitted(false);
    }

    return (
        <Modal show={show} maxWidth="md" onClose={onClose} afterLeave={handleAfterLeave}>
            <div className="p-6">
                {submitted ? (
                    <>
                        <h3 className="text-lg font-semibold text-gray-900">Check Your Inbox</h3>
                        <p className="mt-3 text-sm text-gray-600">
                            If an account with that email address exists, a password reset link has been sent.
                            Check your inbox and follow the instructions provided.
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                            If you do not receive an email, contact your system administrator for assistance.
                        </p>
                        <div className="mt-6 flex justify-end">
                            <PrimaryButton onClick={onClose}>Close</PrimaryButton>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-semibold text-gray-900">Reset Your Password</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your registered email address. A password reset link will be sent
                            if an account with that address exists.
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                            For immediate assistance, contact your system administrator.
                        </p>
                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div>
                                <InputLabel htmlFor="forgot-email" value="Email Address" />
                                <TextInput
                                    id="forgot-email"
                                    type="email"
                                    value={data.email}
                                    className="mt-1 block w-full"
                                    isFocused
                                    onChange={event => setData('email', event.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                                <PrimaryButton disabled={processing}>Send Reset Link</PrimaryButton>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </Modal>
    );
}

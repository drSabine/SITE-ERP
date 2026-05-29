import { Modal, SecondaryButton } from '@/Components/ui';

export default function ForgotPasswordModal({ show, onClose }) {
    return (
        <Modal show={show} maxWidth="sm" onClose={onClose}>
            <div className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <span className="text-2xl leading-none text-emerald-700">&#9432;</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Forgot your password?</h3>
                <p className="mt-2 text-sm text-gray-600">
                    Password resets are handled by the system administrator.
                    Please approach or contact your <span className="font-medium text-emerald-700">School of IT &amp; Engineering administrator</span> and
                    request a password reset for your account.
                </p>
                <div className="mt-6 flex justify-end">
                    <SecondaryButton onClick={onClose}>Got it</SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}

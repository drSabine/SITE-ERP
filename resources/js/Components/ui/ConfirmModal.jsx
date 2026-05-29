import Modal from './Modal';
import SecondaryButton from './SecondaryButton';
import DangerButton from './DangerButton';

export default function ConfirmModal({ show, title, message, confirmLabel = 'Confirm', onConfirm, onClose }) {
    return (
        <Modal show={show} maxWidth="sm" onClose={onClose} afterLeave={() => {}}>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <div className="mt-2 text-sm text-gray-600">{message}</div>
                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <DangerButton onClick={onConfirm}>{confirmLabel}</DangerButton>
                </div>
            </div>
        </Modal>
    );
}

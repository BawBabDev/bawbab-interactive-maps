/**
 * Generic Confirmation and Cancellation Modals
 * Reusable dialog components for confirming changes or discarding edits.
 *
 * File: src/bawbab-interactive-maps-admin/confirmModal.js
 */

import { Modal, Button, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * Generic Confirmation Modal
 */
export const ConfirmModal = ( {
    isOpen = false,
    title = __( 'Confirm Changes', TEXT_DOMAIN ),
    message = __(
        'Are you sure you want to save and apply these changes?',
        TEXT_DOMAIN
    ),
    confirmLabel = __( 'Save & Apply', TEXT_DOMAIN ),
    cancelLabel = __( 'Continue Editing', TEXT_DOMAIN ),
    onConfirm,
    onCancel,
    isBusy = false,
} ) => {
    if ( ! isOpen ) return null;

    return (
        <Modal
            title={ title }
            onRequestClose={ onCancel }
            style={ { maxWidth: '450px', width: '100%' } }
        >
            <p style={ { fontSize: '13px', color: '#555', marginBottom: '20px' } }>
                { message }
            </p>

            <Flex justify="flex-end" gap={ 2 }>
                <Button
                    variant="tertiary"
                    onClick={ onCancel }
                    disabled={ isBusy }
                >
                    { cancelLabel }
                </Button>

                <Button
                    variant="primary"
                    onClick={ onConfirm }
                    isBusy={ isBusy }
                    disabled={ isBusy }
                >
                    { confirmLabel }
                </Button>
            </Flex>
        </Modal>
    );
};

/**
 * Generic Cancel / Discard Changes Modal
 */
export const CancelModal = ( {
    isOpen = false,
    title = __( 'Discard Unsaved Changes?', TEXT_DOMAIN ),
    message = __(
        'Are you sure you want to discard your changes? All unsaved modifications will be reverted to the previous saved version.',
        TEXT_DOMAIN
    ),
    confirmLabel = __( 'Discard Changes', TEXT_DOMAIN ),
    cancelLabel = __( 'Keep Editing', TEXT_DOMAIN ),
    onConfirm,
    onCancel,
    isBusy = false,
} ) => {
    if ( ! isOpen ) return null;

    return (
        <Modal
            title={ title }
            onRequestClose={ onCancel }
            style={ { maxWidth: '450px', width: '100%' } }
        >
            <p style={ { fontSize: '13px', color: '#555', marginBottom: '20px' } }>
                { message }
            </p>

            <Flex justify="flex-end" gap={ 2 }>
                <Button
                    variant="tertiary"
                    onClick={ onCancel }
                    disabled={ isBusy }
                >
                    { cancelLabel }
                </Button>

                <Button
                    variant="primary"
                    isDestructive
                    onClick={ onConfirm }
                    isBusy={ isBusy }
                    disabled={ isBusy }
                >
                    { confirmLabel }
                </Button>
            </Flex>
        </Modal>
    );
};
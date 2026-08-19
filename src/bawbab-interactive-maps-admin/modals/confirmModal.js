/**
 * Generic Confirmation and Cancellation Modals
 * Reusable dialog components for confirming changes or discarding edits.
 *
 * File: src/bawbab-interactive-maps-admin/modals/confirmModal.js
 */

import { Modal, Button, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Generic Confirmation Modal
 */
export const ConfirmModal = ( {
    isOpen = false,
    title = __( 'Confirm Changes', 'bawbab-interactive-maps' ),
    message = __(
        'Are you sure you want to save and apply these changes?',
        'bawbab-interactive-maps'
    ),
    confirmLabel = __( 'Save & Apply', 'bawbab-interactive-maps' ),
    cancelLabel = __( 'Continue Editing', 'bawbab-interactive-maps' ),
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
    title = __( 'Discard Unsaved Changes?', 'bawbab-interactive-maps' ),
    message = __(
        'Are you sure you want to discard your changes? All unsaved modifications will be reverted to the previous saved version.',
        'bawbab-interactive-maps'
    ),
    confirmLabel = __( 'Discard Changes', 'bawbab-interactive-maps' ),
    cancelLabel = __( 'Keep Editing', 'bawbab-interactive-maps' ),
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
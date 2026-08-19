import { Modal, Button, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const NavigationWarningModal = ( {
    isOpen,
    onConfirm,
    onCancel,
} ) => {
    if ( ! isOpen ) return null;

    return (
        <Modal
            title={ __( 'Unsaved Changes Detected', 'bawbab-interactive-maps' ) }
            onRequestClose={ onCancel }
            style={ { maxWidth: '480px', width: '100%' } }
        >
            <p style={ { fontSize: '13px', color: '#555', marginBottom: '20px' } }>
                { __(
                    'You have unsaved changes. Navigating to another page will discard all pending modifications. Are you sure you want to leave?',
                    'bawbab-interactive-maps'
                ) }
            </p>

            <Flex justify="flex-end" gap={ 2 }>
                <Button variant="tertiary" onClick={ onCancel }>
                    { __( 'Stay on Page', 'bawbab-interactive-maps' ) }
                </Button>
                <Button variant="primary" isDestructive onClick={ onConfirm }>
                    { __( 'Leave & Discard Changes', 'bawbab-interactive-maps' ) }
                </Button>
            </Flex>
        </Modal>
    );
};
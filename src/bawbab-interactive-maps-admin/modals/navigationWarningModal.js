import { Modal, Button, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const NavigationWarningModal = ( {
    isOpen,
    onConfirm,
    onCancel,
} ) => {
    if ( ! isOpen ) return null;

    return (
        <Modal
            title={ __( 'Unsaved Changes Detected', TEXT_DOMAIN ) }
            onRequestClose={ onCancel }
            style={ { maxWidth: '480px', width: '100%' } }
        >
            <p style={ { fontSize: '13px', color: '#555', marginBottom: '20px' } }>
                { __(
                    'You have unsaved changes. Navigating to another page will discard all pending modifications. Are you sure you want to leave?',
                    TEXT_DOMAIN
                ) }
            </p>

            <Flex justify="flex-end" gap={ 2 }>
                <Button variant="tertiary" onClick={ onCancel }>
                    { __( 'Stay on Page', TEXT_DOMAIN ) }
                </Button>
                <Button variant="primary" isDestructive onClick={ onConfirm }>
                    { __( 'Leave & Discard Changes', TEXT_DOMAIN ) }
                </Button>
            </Flex>
        </Modal>
    );
};
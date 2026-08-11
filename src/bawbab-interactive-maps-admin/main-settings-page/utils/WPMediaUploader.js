import { __ } from '@wordpress/i18n';

export const WPMediaUploader = (onSelect, titleKey = 'Media') => {
    if (!window.wp?.media) return console.error('WordPress Media Library not enqueued.');

    const frame = window.wp.media({
        title: __(`Select or Upload ${titleKey}`, 'bawbab-interactive-maps'),
        button: { text: __(`Use this ${titleKey.toLowerCase()}`, 'bawbab-interactive-maps') },
        multiple: false
    });

    frame.on('select', () => onSelect(frame.state().get('selection').first().toJSON()));
    frame.open();
};

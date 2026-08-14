import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const SidebarHeader = ({ categoryText, onClose }) => {
    return (
        <div className="sidebar-header">
            <span className="sidebar-category-label">{categoryText}</span>
            <button onClick={onClose} className="sidebar-close-btn" aria-label={__('Close', 'bawbab-interactive-maps')}>
                <span>&times;</span>
            </button>
        </div>
    );
};


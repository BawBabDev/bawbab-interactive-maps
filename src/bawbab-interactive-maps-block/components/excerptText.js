import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const ExcerptText = ({ selectedLoc, wpData }) => {
    const stripInlineMedia = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('img, figure, picture, video, .wp-block-image, .wp-block-gallery, .wp-block-embed').forEach(el => el.remove());
        return doc.body.innerHTML;
    };

    const rawWpContent = wpData?.content?.rendered || "";
    const cleanWpContent = stripInlineMedia(rawWpContent);

    const hasCustomDesc = !!selectedLoc?.description && selectedLoc.description.trim().length > 0;
    const hasWpContent = cleanWpContent.trim().length > 0;
    const shouldAppend = !!selectedLoc?.append_description;

    let renderContentHTML = "";

    if (hasCustomDesc && hasWpContent && shouldAppend) {
        renderContentHTML = `
            <div class="custom-description-block"><p>${selectedLoc.description}</p></div>
            <hr class="content-divider" style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
            <div class="wp-page-content-block">${cleanWpContent}</div>
        `;
    } else if (hasCustomDesc) {
        renderContentHTML = `<p class="description-text">${selectedLoc.description}</p>`;
    } else if (hasWpContent) {
        renderContentHTML = cleanWpContent;
    } else {
        renderContentHTML = `<p class="description-text">No description available.</p>`;
    }

    return (
        /* TEXT EXCERPTS AND CONTENT CONTAINER */
        <div className="loc-description">
            <div className="combined-content-wrapper" dangerouslySetInnerHTML={{ __html: renderContentHTML }} />
            
            {hasWpContent && wpData?.link && (
                <div className="wp-link-container" style={{ marginTop: '15px' }}>
                    <a href={wpData.link} target="_blank" rel="noopener noreferrer" className="sidebar-wp-link">
                        {__('Read full details on website', 'bawbab-interactive-maps')} <span>&rarr;</span>
                    </a>
                </div>
            )}
        </div>
    );
};

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const ContentRenderer = ({ selectedLoc, wpData }) => {
    const stripInlineMedia = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('img, figure, picture, video, .wp-block-image, .wp-block-gallery, .wp-block-embed').forEach(el => el.remove());
        return doc.body.innerHTML;
    };

    const cleanWpContent = stripInlineMedia(wpData?.content?.rendered || "");

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
        <div dangerouslySetInnerHTML={{ __html: renderContentHTML }} />
    );
};

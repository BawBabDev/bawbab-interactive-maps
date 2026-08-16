import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const ExcerptText = ( { selectedLoc, wpData } ) => {
    const stripInlineMedia = ( html ) => {
        if ( ! html ) return '';
        const doc = new DOMParser().parseFromString( html, 'text/html' );
        doc.querySelectorAll(
            'img, figure, picture, video, .wp-block-image, .wp-block-gallery, .wp-block-embed'
        ).forEach( ( el ) => el.remove() );
        return doc.body.innerHTML;
    };

    const rawWpContent = wpData?.content?.rendered || '';
    const cleanWpContent = stripInlineMedia( rawWpContent );

    const customDesc = ( selectedLoc?.description || '' ).trim();
    const hasCustomDesc = customDesc.length > 0;
    const hasWpContent = cleanWpContent.trim().length > 0;
    const shouldAppend = !! selectedLoc?.append_description;

    let renderContentHTML = '';

    const formattedCustomDesc = customDesc.startsWith( '<p>' )
        ? customDesc
        : `<p class="description-text">${ customDesc }</p>`;

    if ( hasCustomDesc && hasWpContent && shouldAppend ) {
        renderContentHTML = `
            <div class="custom-description-block">${ formattedCustomDesc }</div>
            <hr class="content-divider" style="margin: 20px 0; border: 0; border-top: 1px solid #eee; clear: both;" />
            <div class="wp-page-content-block">${ cleanWpContent }</div>
        `;
    } else if ( hasCustomDesc ) {
        renderContentHTML = `<div class="custom-description-block">${ formattedCustomDesc }</div>`;
    } else if ( hasWpContent ) {
        renderContentHTML = `<div class="wp-page-content-block">${ cleanWpContent }</div>`;
    } else {
        renderContentHTML = `<p class="description-text">${ __(
            'No description available.',
            TEXT_DOMAIN
        ) }</p>`;
    }

    return (
        <div
            className="loc-description"
            style={ {
                marginTop: '20px',
                marginBottom: '20px',
                clear: 'both',
                display: 'block',
                position: 'relative',
                zIndex: 1,
            } }
        >
            { /* SCOPED INLINE STYLES TO OVERRIDE ALL GUTENBERG / THEME LIST TYPOGRAPHY */ }
            <style>{ `
                .loc-description .wp-page-content-block { display: block !important; width: 100% !important; clear: both !important; overflow: hidden !important; }
                .loc-description .wp-page-content-block .alignfull { width: 100% !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; left: 0 !important; right: 0 !important; box-sizing: border-box !important; }
                .loc-description .wp-page-content-block [style*="margin-top:-"], .loc-description .wp-page-content-block [style*="margin-top: -"] { margin-top: 0 !important; }
                .loc-description .wp-page-content-block .wp-block-group, .loc-description .wp-page-content-block .wp-block-columns { position: relative !important; clear: both !important; float: none !important; height: auto !important; min-height: 0 !important; }
                .loc-description .wp-page-content-block .wp-block-columns { flex-direction: column !important; }
                .loc-description .wp-page-content-block .wp-block-column { flex-basis: 100% !important; width: 100% !important; max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
                .loc-description ul, .loc-description ol, .loc-description .wp-block-list { list-style-type: disc !important; margin-left: 20px !important; margin-bottom: 15px !important; padding-left: 5px !important; font-size: 1.1rem !important; }
                .loc-description li, .loc-description li p, .loc-description li span, .loc-description li div, .loc-description .wp-block-list li { font-size: 1.1rem !important; line-height: 1.6 !important; font-family: inherit !important; font-weight: 400 !important; color: #3c434a !important; margin-top: 0 !important; margin-bottom: 4px !important; }
                .map-sidebar.is-compact .loc-description ul, .map-sidebar.is-compact .loc-description ol, .map-sidebar.is-compact .loc-description .wp-block-list { font-size: 0.95rem !important; }
                .map-sidebar.is-compact .loc-description li, .map-sidebar.is-compact .loc-description li p, .map-sidebar.is-compact .loc-description li span, .map-sidebar.is-compact .loc-description li div, .map-sidebar.is-compact .loc-description .wp-block-list li { font-size: 0.95rem !important; }
            ` }</style>

            <div
                className="combined-content-wrapper"
                style={ {
                    display: 'block',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                } }
                dangerouslySetInnerHTML={ { __html: renderContentHTML } }
            />

            { hasWpContent && wpData?.link && (
                <div
                    className="wp-link-container"
                    style={ { marginTop: '18px', clear: 'both' } }
                >
                    <a
                        href={ wpData.link }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sidebar-wp-link"
                        style={ {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                            fontWeight: '600',
                        } }
                    >
                        { __(
                            'Read full details on website',
                            TEXT_DOMAIN
                        ) }{ ' ' }
                        <span>&rarr;</span>
                    </a>
                </div>
            ) }
        </div>
    );
};
import { useState, useEffect } from '@wordpress/element';

export const useWpLinkedContent = (
    stablePageId,
    stableFeatureId,
    initialGallery = [],
    selectedLoc = null
) => {
    const [ wpData, setWpData ] = useState( null );
    const [ isLoading, setIsLoading ] = useState( false );
    const [ currentImage, setCurrentImage ] = useState( null );
    const [ allImages, setAllImages ] = useState( [] );
    const [ videoEmbedUrl, setVideoEmbedUrl ] = useState( null );
    const [ vimeoThumbUrl, setVimeoThumbUrl ] = useState( null );

    const pageId = parseInt( stablePageId, 10 ) || 0;

    const extractWpMedia = ( html, featured ) => {
        const media = [];
        if ( featured ) media.push( featured );

        const doc = new DOMParser().parseFromString( html, 'text/html' );
        const includedBlocks = doc.querySelectorAll(
            '.map-include, .map-sidebar-content'
        );

        let searchScope;
        if ( includedBlocks.length > 0 ) {
            const container = document.createElement( 'div' );
            includedBlocks.forEach( ( block ) =>
                container.appendChild( block.cloneNode( true ) )
            );
            searchScope = container;
        } else {
            doc.querySelectorAll( '.map-exclude' ).forEach( ( el ) =>
                el.remove()
            );
            searchScope = doc;
        }

        searchScope.querySelectorAll( 'img' ).forEach( ( img ) => {
            const src = img.getAttribute( 'src' );
            if ( src && src !== featured ) media.push( src );
        } );

        searchScope
            .querySelectorAll( 'video source, video' )
            .forEach( ( vid ) => {
                const src = vid.getAttribute( 'src' );
                if ( src ) media.push( src );
            } );

        return [ ...new Set( media ) ];
    };

    const cleanHtmlContent = ( html ) => {
        if ( ! html ) return '';
        const doc = new DOMParser().parseFromString( html, 'text/html' );

        // 1. Remove non-content elements and media embeds
        doc.querySelectorAll(
            '.map-exclude, a, button, table, form, script, style, iframe, .wp-block-button, .wp-block-file, .wp-block-table, figcaption'
        ).forEach( ( el ) => el.remove() );

        // 2. Normalize Headings (h1 - h6) to preserve strict typographic hierarchy
        doc.querySelectorAll( 'h1, h2, h3, h4, h5, h6' ).forEach( ( heading ) => {
            const tag = heading.tagName.toLowerCase();
            heading.removeAttribute( 'style' );
            heading.removeAttribute( 'class' );
            heading.classList.add( `sidebar-heading-${ tag.replace( 'h', '' ) }` );
        } );

        // 3. Strip inline style overrides from paragraphs, lists, and text nodes
        doc.querySelectorAll( 'p, ul, ol, li, span, div' ).forEach( ( el ) => {
            if ( el.style ) {
                el.style.removeProperty( 'font-size' );
                el.style.removeProperty( 'font-family' );
                el.style.removeProperty( 'line-height' );
                el.style.removeProperty( 'margin-top' );
                el.style.removeProperty( 'margin-bottom' );
                el.style.removeProperty( 'padding' );
            }
        } );

        // 4. Unwrap unnecessary layout containers (Gutenberg groups, columns, cards)
        doc.querySelectorAll(
            '.wp-block-group, .wp-block-columns, .wp-block-column, .card, .container, section, article'
        ).forEach( ( container ) => {
            while ( container.firstChild ) {
                container.parentNode.insertBefore( container.firstChild, container );
            }
            container.parentNode.removeChild( container );
        } );

        // 5. Remove empty elements & whitespace-only paragraphs/divs (Iterative to clean nested empty nodes)
        let removedEmpty = true;
        while ( removedEmpty ) {
            removedEmpty = false;
            doc.querySelectorAll( 'p, div, span, ul, ol, li, h1, h2, h3, h4, h5, h6' ).forEach( ( el ) => {
                // If element has no text content (ignoring spaces & &nbsp;) and no image/video children
                const textContent = el.textContent.replace( /\u00A0/g, ' ' ).trim();
                if ( ! textContent && el.children.length === 0 ) {
                    el.remove();
                    removedEmpty = true;
                }
            } );
        }

        const designatedBlocks = doc.querySelectorAll(
            '.map-include, .map-sidebar-content'
        );
        if ( designatedBlocks.length > 0 ) {
            let combinedContent = '';
            designatedBlocks.forEach( ( block ) => {
                block
                    .querySelectorAll( 'a, button, script' )
                    .forEach( ( el ) => el.remove() );
                combinedContent += block.outerHTML;
            } );
            return combinedContent;
        }

        return doc.body.innerHTML;
    };

    const parseVimeoUrl = ( url ) => {
        if ( ! url ) return null;
        const regExp =
            /vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/|album\/[^\/]+\/video\/|video\/|)?(\d+)(?:$|\/|\?)/;
        const match = url.match( regExp );
        return match && match[ 1 ]
            ? `https://player.vimeo.com/video/${ match[ 1 ] }?badge=0&autopause=0&player_id=0&app_id=58479`
            : null;
    };

    useEffect( () => {
        setWpData( null );
        setCurrentImage( null );
        setAllImages( [] );
        setVideoEmbedUrl( null );
        setVimeoThumbUrl( null );

        if ( pageId <= 0 ) {
            setIsLoading( false );
            return;
        }

        const fetchLinkedContent = async () => {
            setIsLoading( true );
            try {
                const response = await fetch(
                    `/wp-json/wp/v2/pages/${ pageId }?_embed`
                );
                if ( ! response.ok )
                    throw new Error(
                        `WP REST API HTTP Error: ${ response.status }`
                    );

                const data = await response.json();
                const rawHtml = data.content?.rendered || '';
                const cleanedHtml = cleanHtmlContent( rawHtml );

                setWpData( { ...data, content: { rendered: cleanedHtml } } );

                const featured =
                    data._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ]?.source_url;
                const contentMedia = extractWpMedia( rawHtml, featured );

                // --- 1. RESOLVE VIDEO ---
                const rawVideoUrl =
                    selectedLoc?.custom_video_url ||
                    ( selectedLoc?.hide_page_video
                        ? null
                        : data.acf?.video_url );

                if ( rawVideoUrl ) {
                    const vimeoLink = parseVimeoUrl( rawVideoUrl );
                    setVideoEmbedUrl( vimeoLink );
                    if ( vimeoLink ) {
                        contentMedia.push( vimeoLink );
                    }
                }

                // --- 2. RESOLVE FLOORPLAN ---
                const activeFloorplan =
                    selectedLoc?.custom_floorplan_url ||
                    ( selectedLoc?.hide_page_floorplan
                        ? null
                        : data.acf?.floorplan?.url );
                if ( activeFloorplan ) {
                    contentMedia.push( activeFloorplan );
                }

                const uniqueMediaList = [ ...new Set( contentMedia ) ];

                setAllImages( uniqueMediaList );
                setCurrentImage( featured || uniqueMediaList[ 0 ] || null );
            } catch ( err ) {
                console.warn( '⚠️ [useWpLinkedContent] REST fetch error:', err );
            } finally {
                setIsLoading( false );
            }
        };

        fetchLinkedContent();
    }, [
        pageId,
        stableFeatureId,
        selectedLoc?.custom_video_url,
        selectedLoc?.custom_floorplan_url,
        selectedLoc?.hide_page_video,
        selectedLoc?.hide_page_floorplan,
    ] );

    return {
        wpData,
        isLoading,
        currentImage,
        setCurrentImage,
        allImages,
        videoEmbedUrl,
        vimeoThumbUrl,
    };
};
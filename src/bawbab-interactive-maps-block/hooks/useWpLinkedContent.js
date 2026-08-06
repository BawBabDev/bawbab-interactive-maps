import { useState, useEffect } from '@wordpress/element';

export const useWpLinkedContent = (stablePageId, stableFeatureId, initialGallery = [], selectedLoc = null) => {
    const [wpData, setWpData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [allImages, setAllImages] = useState([]);
    const [videoEmbedUrl, setVideoEmbedUrl] = useState(null);
    const [vimeoThumbUrl, setVimeoThumbUrl] = useState(null);

    const pageId = parseInt(stablePageId, 10) || 0;

    const extractWpMedia = (html, featured) => {
        const media = [];
        if (featured) media.push(featured);
        
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const includedBlocks = doc.querySelectorAll('.map-include, .map-sidebar-content');

        let searchScope;
        if (includedBlocks.length > 0) {
            console.log("🔍 [useWpLinkedContent] Found explicit [map_include] blocks:", includedBlocks.length);
            const container = document.createElement('div');
            includedBlocks.forEach(block => container.appendChild(block.cloneNode(true)));
            searchScope = container;
        } else {
            console.log("🔍 [useWpLinkedContent] No [map_include] blocks found. Processing full document after stripping .map-exclude.");
            doc.querySelectorAll('.map-exclude').forEach(el => el.remove());
            searchScope = doc;
        }

        searchScope.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (src && src !== featured) media.push(src);
        });

        searchScope.querySelectorAll('video source, video').forEach(vid => {
            const src = vid.getAttribute('src');
            if (src) media.push(src);
        });

        return [...new Set(media)];
    };

    const cleanHtmlContent = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('.map-exclude').forEach(el => el.remove());

        const designatedBlocks = doc.querySelectorAll('.map-include, .map-sidebar-content');
        if (designatedBlocks.length > 0) {
            let combinedContent = '';
            designatedBlocks.forEach(block => {
                block.querySelectorAll('a, button, script').forEach(el => el.remove());
                combinedContent += block.outerHTML;
            });
            return combinedContent;
        }

        const toRemove = [
            'a', 'button', 'table', 'form', 'script', 'style', 
            'iframe', '.wp-block-button', '.wp-block-file', '.wp-block-table'
        ];
        
        toRemove.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => el.remove());
        });

        return doc.body.innerHTML;
    };

    const parseVimeoUrl = (url) => {
        if (!url) return null;
        const regExp = /vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/|album\/[^\/]+\/video\/|video\/|)?(\d+)(?:$|\/|\?)/;
        const match = url.match(regExp);
        return match && match[1] ? `https://player.vimeo.com/video/${match[1]}?badge=0&autopause=0&player_id=0&app_id=58479` : null;
    };

    useEffect(() => {
        console.log("🔍 [useWpLinkedContent] Init Effect Triggered", { pageId, stableFeatureId, selectedLoc });

        setWpData(null);
        setCurrentImage(null);
        setAllImages([]);
        setVideoEmbedUrl(null);
        setVimeoThumbUrl(null);
        
        if (pageId <= 0) {
            console.log("⚠️ [useWpLinkedContent] No linked WP Page ID provided (pageId <= 0). Using initial local gallery.");
            if (initialGallery.length > 0) {
                const urls = initialGallery.map(img => img.url);
                setAllImages(urls);
                setCurrentImage(urls[0]);
            }
            return;
        }

        const fetchLinkedContent = async () => {
            setIsLoading(true);
            console.log(`🚀 [useWpLinkedContent] Fetching WP Page data for Page ID: ${pageId}...`);
            try {
                const response = await fetch(`/wp-json/wp/v2/pages/${pageId}?_embed`);
                if (!response.ok) throw new Error(`WP REST API HTTP Error: ${response.status}`);
                
                const data = await response.json();
                console.log("✅ [useWpLinkedContent] REST API Data Received:", data);
                
                const rawHtml = data.content?.rendered || '';
                const cleanedHtml = cleanHtmlContent(rawHtml);
                
                setWpData({ ...data, content: { rendered: cleanedHtml } });
                
                const featured = data._embedded?.['wp:featuredmedia']?.[0]?.source_url;
                const contentMedia = extractWpMedia(rawHtml, featured);
                
                // --- 1. RESOLVE VIDEO (Unit Override > Page ACF Field) ---
                const rawVideoUrl = selectedLoc?.custom_video_url || (selectedLoc?.hide_page_video ? null : data.acf?.video_url);
                console.log("📹 [useWpLinkedContent] Resolved Video URL:", rawVideoUrl);
                
                if (rawVideoUrl) {
                    const vimeoLink = parseVimeoUrl(rawVideoUrl);
                    setVideoEmbedUrl(vimeoLink);
                    if (vimeoLink) {
                        contentMedia.push(vimeoLink);
                        try {
                            const oEmbedResp = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(rawVideoUrl)}`);
                            if (oEmbedResp.ok) {
                                const oEmbedData = await oEmbedResp.json();
                                if (oEmbedData.thumbnail_url) {
                                    setVimeoThumbUrl(oEmbedData.thumbnail_url);
                                }
                            }
                        } catch (oEmbedErr) {
                            console.warn("⚠️ Failed to fetch Vimeo cover thumbnail:", oEmbedErr);
                        }
                    }
                }

                // --- 2. RESOLVE FLOORPLAN (Unit Override > Page ACF Field) ---
                const activeFloorplan = selectedLoc?.custom_floorplan_url || (selectedLoc?.hide_page_floorplan ? null : data.acf?.floorplan?.url);
                console.log("📐 [useWpLinkedContent] Resolved Floorplan:", activeFloorplan);
                if (activeFloorplan) {
                    contentMedia.push(activeFloorplan);
                }
                
                // --- 3. GALLERY FALLBACKS ---
                if (initialGallery.length > 0) {
                    initialGallery.forEach(img => { if (img.url) contentMedia.push(img.url); });
                }

                const uniqueMediaList = [...new Set(contentMedia)];
                console.log("📸 [useWpLinkedContent] Final Media Carousel Array:", uniqueMediaList);
                
                setAllImages(uniqueMediaList);
                setCurrentImage(featured || uniqueMediaList[0] || null);
            } catch (err) {
                console.error("❌ [useWpLinkedContent] Sync Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLinkedContent();
    }, [
        pageId, 
        stableFeatureId, 
        selectedLoc?.custom_video_url, 
        selectedLoc?.custom_floorplan_url, 
        selectedLoc?.hide_page_video, 
        selectedLoc?.hide_page_floorplan
    ]);

    return { wpData, isLoading, currentImage, setCurrentImage, allImages, videoEmbedUrl, vimeoThumbUrl };
};
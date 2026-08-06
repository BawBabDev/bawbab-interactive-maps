import React, { useState, useEffect, useRef, Fragment } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { UnitSpecs } from './drawer-unit-specs';
import { useWpLinkedContent } from '../hooks/useWpLinkedContent';
import { SidebarHeader } from './sidebarHeader';
import { MediaCarousel } from './mediaCarousel';
//import { ContentRenderer } from './contentRenderer';
import { FloorPlanBlock } from './floorPlanBlock';
import { ExcerptText } from './excerptText';

const DrawingSidebar = ({ isOpen, selectedLoc, onClose, onImageClick, mapDimensions, onRouteGenerated, onRouteCleared     
}) => {
    const stablePageId = selectedLoc?.wp_page_id ? parseInt(selectedLoc.wp_page_id, 10) : 0;
    const stableFeatureId = selectedLoc?.fid;
    const initialGallery = selectedLoc?.gallery || [];

    const { wpData, isLoading, currentImage, setCurrentImage, allImages, videoEmbedUrl, vimeoThumbUrl
    } = useWpLinkedContent(stablePageId, stableFeatureId, initialGallery, selectedLoc);

    const mapSettings = window.bwbimapsSettings || {};
    const colorTheme = mapSettings.colorTheme;
    const { width = 0, height = 0 } = mapDimensions || {};
    const isSmallUI = (width < 800 || height < 500);

    const isParlor = selectedLoc?.name?.toLowerCase().includes('parlor') || selectedLoc?.title?.toLowerCase().includes('parlor');
    const categoryText = (!isParlor && (selectedLoc?.category === 'residential_apartment' || selectedLoc?.category === 'cottage')) 
        ? selectedLoc.category.replace('_', ' ') 
        : 'amenity';
    
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        let timer;
        if (isOpen) {
            if (window.innerWidth <= 768) {
                timer = setTimeout(() => { setShouldShow(true); }, 1500);
            } else {
                setShouldShow(true);
            }
        } else {
            setShouldShow(false);
        }
        return () => clearTimeout(timer);
    }, [isOpen]);
    
    if (!selectedLoc) return null;

    const displayTitle = selectedLoc?.title || wpData?.title?.rendered  || selectedLoc?.name || "Untitled Location";
    const showCodeAsSubtitle = (selectedLoc?.category === 'residential_apartment' || selectedLoc?.category === 'cottage') && selectedLoc?.code;
    const secondaryTitle = showCodeAsSubtitle ? selectedLoc.code : ((wpData && selectedLoc?.name) ? selectedLoc.name : null);
    const directFloorplanAssetUrl = selectedLoc?.custom_floorplan_url 
        || (selectedLoc?.hide_page_floorplan ? null : wpData?.acf?.floorplan?.url);

    return (
        <div className={`map-theme-${colorTheme}`}>
            <div className={`map-sidebar ${shouldShow ? 'is-open' : ''} ${isSmallUI ? 'is-compact' : ''}`}>
                <div className={`sidebar-inner-padding ${shouldShow ? 'visible' : ''}`}>
                    <SidebarHeader categoryText={categoryText} onClose={onClose} />
                    {isLoading ? (
                        <div className="sidebar-loader-container"><Spinner /></div>
                    ) : (
                        <div className="sidebar-content-fade">
                             <MediaCarousel currentImage={currentImage} allImages={allImages} setCurrentImage={setCurrentImage} 
                                onImageClick={onImageClick} 
                            />
                            {/* TITLE HEADER CONTAINER */}
                            <div className="sidebar-title-section">
                               <h2 className="loc-title">{displayTitle}</h2>
                                {secondaryTitle && <h3 className="loc-subtitle">{secondaryTitle}</h3>}
                            </div>
                            {/* REGULAR HARDWARE DATA SPECS */}
                            <UnitSpecs specs={selectedLoc} isSmallUI={isSmallUI} />

                            {/* FLOORPLAN ACTIONABLE BOUNDARY PANEL */}
                            <FloorPlanBlock directFloorplanAssetUrl={directFloorplanAssetUrl} onImageClick={onImageClick} />

                            {/* TEXT EXCERPTS AND CONTEXTUAL CONTENT CONTAINER */}
                            <ExcerptText selectedLoc={selectedLoc} wpData={wpData} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrawingSidebar;
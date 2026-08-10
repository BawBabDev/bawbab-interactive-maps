import React, { useState, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { UnitSpecs } from './drawer-unit-specs';
import { useWpLinkedContent } from '../hooks/useWpLinkedContent';
import { SidebarHeader } from './sidebarHeader';
import { MediaCarousel } from './mediaCarousel';
import { CampusNavigation } from './campusNavigation';
import { FloorPlanBlock } from './floorPlanBlock';
import { ExcerptText } from './excerptText';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

const DrawingSidebar = ({ 
    isOpen, 
    selectedLoc, 
    onClose, 
    onImageClick, 
    mapDimensions, 
    onRouteGenerated, 
    onRouteCleared     
}) => {
    const stablePageId = selectedLoc?.wp_page_id ? parseInt(selectedLoc.wp_page_id, 10) : 0;
    const stableFeatureId = selectedLoc?.fid;
    const initialGallery = selectedLoc?.gallery || [];

    const { 
        wpData, isLoading, currentImage, setCurrentImage, allImages 
    } = useWpLinkedContent(stablePageId, stableFeatureId, initialGallery, selectedLoc);

    const mapSettings = window.bwbimapsSettings || {};
    const colorTheme = mapSettings.colorTheme;
    const { width = 0, height = 0 } = mapDimensions || {};
    const isSmallUI = (width < 800 || height < 500);

    // Generic Category Header formatting
    const rawCategory = selectedLoc?.category || selectedLoc?.layer_type || 'amenity';
    const categoryText = rawCategory.replace(/_/g, ' ');
    
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

    const displayTitle = selectedLoc?.title || wpData?.title?.rendered || selectedLoc?.name || __('Untitled Location', TEXT_DOMAIN);
    
    // Generic subtitle resolution: display unit code if present, otherwise fall back to feature name
    const secondaryTitle = selectedLoc?.code 
        ? `${__('Unit', TEXT_DOMAIN)} ${selectedLoc.code}`
        : ((wpData && selectedLoc?.name && selectedLoc.name !== displayTitle) ? selectedLoc.name : null);

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
                            <MediaCarousel 
                                currentImage={currentImage} 
                                allImages={allImages} 
                                setCurrentImage={setCurrentImage} 
                                onImageClick={onImageClick} 
                            />

                            {/* TITLE HEADER CONTAINER */}
                            <div className="sidebar-title-section">
                                <h2 className="loc-title">{displayTitle}</h2>
                                {secondaryTitle && <h3 className="loc-subtitle">{secondaryTitle}</h3>}
                            </div>

                            {/* DYNAMIC SPECS & ATTRIBUTES */}
                            <UnitSpecs specs={selectedLoc} isSmallUI={isSmallUI} />

                            {/* FLOORPLAN ACTIONABLE BOUNDARY PANEL */}
                            <FloorPlanBlock directFloorplanAssetUrl={directFloorplanAssetUrl} onImageClick={onImageClick} />

                            {/* TEXT EXCERPTS AND CONTEXTUAL CONTENT CONTAINER */}
                            <ExcerptText selectedLoc={selectedLoc} wpData={wpData} />

                            {/* INTEGRATED DECOUPLED CAMPUS NAVIGATION CORE CONTROLLERS */}
                            <CampusNavigation 
                                destinationFeature={selectedLoc?.type === 'spatial' ? selectedLoc : { geometry: selectedLoc?.geometry, properties: selectedLoc }}
                                manualOriginNode={selectedLoc?.manualOriginNode || null} 
                                onTriggerOriginPick={selectedLoc?.onTriggerOriginPick}   
                                onRouteGenerated={onRouteGenerated}
                                onRouteCleared={onRouteCleared}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrawingSidebar;
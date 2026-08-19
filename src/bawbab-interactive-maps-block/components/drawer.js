import { useState, useEffect, useMemo } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { UnitSpecs } from './drawerUnitSpecs';
import { useWpLinkedContent } from '../hooks/useWpLinkedContent';
import { SidebarHeader } from './sidebarHeader';
import { MediaCarousel } from './mediaCarousel';
import { CampusNavigation } from './campusNavigation';
import { FloorPlanBlock } from './floorPlanBlock';
import { ExcerptText } from './excerptText';

const DrawingSidebar = ( {
	isOpen,
	selectedLoc,
	onClose,
	onImageClick,
	mapDimensions,
	onRouteGenerated,
	onRouteCleared,
} ) => {
	const stablePageId = selectedLoc?.wp_page_id
		? parseInt( selectedLoc.wp_page_id, 10 )
		: 0;
	const isStaticMarker = stablePageId <= 0;

	// Normalize static location gallery directly from selectedLoc memory
	const localMarkerImages = useMemo( () => {
		if ( ! selectedLoc?.gallery ) return [];
		const raw = Array.isArray( selectedLoc.gallery )
			? selectedLoc.gallery
			: [ selectedLoc.gallery ];

		return raw
			.map( ( item ) => {
				if ( typeof item === 'string' ) return item;
				if ( item && typeof item === 'object' && item.url ) return item.url;
				return null;
			} )
			.filter( Boolean );
	}, [ selectedLoc?.gallery, selectedLoc?.lat, selectedLoc?.lng ] );

	// Fetch remote WP Page data ONLY for linked spatial features (stablePageId > 0)
	const { wpData, isLoading, currentImage: remoteImage, setCurrentImage: setRemoteImage, allImages: remoteImages } =
		useWpLinkedContent(
			isStaticMarker ? 0 : stablePageId,
			selectedLoc?.fid,
			localMarkerImages,
			selectedLoc
		);

	// Local state management for static marker carousel interactions
	const [ localCurrentImage, setLocalCurrentImage ] = useState( null );

	useEffect( () => {
		if ( isStaticMarker ) {
			setLocalCurrentImage( localMarkerImages[ 0 ] || null );
		}
	}, [ selectedLoc?.lat, selectedLoc?.lng, selectedLoc?.fid, localMarkerImages, isStaticMarker ] );

	// Resolve active carousel media based on selection type
	const activeAllImages = isStaticMarker ? localMarkerImages : remoteImages;
	const activeCurrentImage = isStaticMarker ? localCurrentImage : remoteImage;
	const setActiveCurrentImage = isStaticMarker ? setLocalCurrentImage : setRemoteImage;

	const mapSettings = window.bawbinmapsSettings || {};
	const colorTheme = mapSettings.colorTheme;
	const { width = 0, height = 0 } = mapDimensions || {};
	const isSmallUI = width < 800 || height < 500;

	const rawCategory =
		selectedLoc?.category || selectedLoc?.layer_type || 'amenity';
	const categoryText = rawCategory.replace( /_/g, ' ' );

	const [ shouldShow, setShouldShow ] = useState( false );

	useEffect( () => {
		let timer;
		if ( isOpen ) {
			if ( window.innerWidth <= 768 ) {
				timer = setTimeout( () => {
					setShouldShow( true );
				}, 1500 );
			} else {
				setShouldShow( true );
			}
		} else {
			setShouldShow( false );
		}
		return () => clearTimeout( timer );
	}, [ isOpen ] );

	if ( ! selectedLoc ) return null;

	const displayTitle =
		selectedLoc?.title ||
		wpData?.title?.rendered ||
		selectedLoc?.name ||
		__( 'Untitled Location', 'bawbab-interactive-maps' );

	const secondaryTitle = selectedLoc?.code
		? `${ __( 'Unit', 'bawbab-interactive-maps' ) } ${ selectedLoc.code }`
		: wpData && selectedLoc?.name && selectedLoc.name !== displayTitle
		? selectedLoc.name
		: null;

	const directFloorplanAssetUrl =
		selectedLoc?.custom_floorplan_url ||
		( selectedLoc?.hide_page_floorplan
			? null
			: wpData?.acf?.floorplan?.url );

	return (
		<div className={ `map-theme-${ colorTheme }` }>
			<div
				className={ `map-sidebar ${ shouldShow ? 'is-open' : '' } ${
					isSmallUI ? 'is-compact' : ''
				}` }
			>
				<div
					className={ `sidebar-inner-padding ${
						shouldShow ? 'visible' : ''
					}` }
				>
					<SidebarHeader
						categoryText={ categoryText }
						onClose={ onClose }
					/>
					{ ! isStaticMarker && isLoading ? (
						<div className="sidebar-loader-container">
							<Spinner />
						</div>
					) : (
						<div className="sidebar-content-fade">
							<MediaCarousel
								currentImage={ activeCurrentImage }
								allImages={ activeAllImages }
								setCurrentImage={ setActiveCurrentImage }
								onImageClick={ onImageClick }
							/>

							{ /* TITLE HEADER CONTAINER */ }
							<div className="sidebar-title-section">
								<h2 className="loc-title">{ displayTitle }</h2>
								{ secondaryTitle && (
									<h3 className="loc-subtitle">
										{ secondaryTitle }
									</h3>
								) }
							</div>

							{ /* DYNAMIC SPECS & ATTRIBUTES */ }
							<UnitSpecs
								specs={ selectedLoc }
								isSmallUI={ isSmallUI }
							/>

							{ /* FLOORPLAN ACTIONABLE BOUNDARY PANEL */ }
							<FloorPlanBlock
								directFloorplanAssetUrl={
									directFloorplanAssetUrl
								}
								onImageClick={ onImageClick }
							/>

							{ /* TEXT EXCERPTS AND CONTEXTUAL CONTENT CONTAINER */ }
							<ExcerptText
								selectedLoc={ selectedLoc }
								wpData={ wpData }
							/>

							{ /* INTEGRATED DECOUPLED CAMPUS NAVIGATION CORE CONTROLLERS */ }
							<CampusNavigation
								destinationFeature={
									selectedLoc?.type === 'spatial'
										? selectedLoc
										: {
												geometry: selectedLoc?.geometry,
												properties: selectedLoc,
												manualOriginNode: selectedLoc?.manualOriginNode || null,
										  }
								}
								manualOriginNode={
									selectedLoc?.manualOriginNode || null
								}
								onTriggerOriginPick={
									selectedLoc?.onTriggerOriginPick
								}
								onRouteGenerated={ onRouteGenerated }
								onRouteCleared={ onRouteCleared }
							/>
						</div>
					) }
				</div>
			</div>
		</div>
	);
};

export default DrawingSidebar;
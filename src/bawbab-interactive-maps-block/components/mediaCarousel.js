import React, { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const MediaCarousel = ( {
	currentImage,
	allImages = [],
	setCurrentImage,
	onImageClick,
	vimeoThumbUrl = null,
} ) => {
	const [ isTallImage, setIsTallImage ] = useState( false );
	const thumbStripRef = useRef( null );
	const scrollIntervalRef = useRef( null );

	useEffect( () => {
		setIsTallImage( false );
	}, [ currentImage ] );

	const handleImageLoad = ( e ) => {
		const { naturalWidth, naturalHeight } = e.target;
		if ( naturalWidth && naturalHeight ) {
			setIsTallImage( naturalWidth / naturalHeight < 1.333 );
		}
	};

	const isLocalVideo = ( url ) =>
		typeof url === 'string' && url.match( /\.(mp4|webm|ogg)$/i );
	const isVimeoVideo = ( url ) =>
		typeof url === 'string' &&
		( url.includes( 'player.vimeo.com' ) || url.includes( 'vimeo.com' ) );
	const isAnyVideo = ( url ) => isLocalVideo( url ) || isVimeoVideo( url );

	useEffect( () => {
		if ( ! thumbStripRef.current ) return;
		const activeThumb = thumbStripRef.current.querySelector( '.is-active' );
		if ( activeThumb ) {
			const container = thumbStripRef.current;
			const thumbOffset = activeThumb.offsetLeft;
			const thumbWidth = activeThumb.clientWidth;
			const containerWidth = container.clientWidth;

			container.scrollTo( {
				left: thumbOffset - containerWidth / 2 + thumbWidth / 2,
				behavior: 'smooth',
			} );
		}
	}, [ currentImage ] );

	const navigateImage = ( direction ) => {
		const currentIndex = allImages.indexOf( currentImage );
		let nextIndex = currentIndex + direction;
		if ( nextIndex >= allImages.length ) nextIndex = 0;
		if ( nextIndex < 0 ) nextIndex = allImages.length - 1;
		setCurrentImage( allImages[ nextIndex ] );
	};

	const startScroll = ( speed ) => {
		stopScroll();
		scrollIntervalRef.current = setInterval( () => {
			if ( thumbStripRef.current )
				thumbStripRef.current.scrollLeft += speed;
		}, 10 );
	};

	const stopScroll = () => {
		if ( scrollIntervalRef.current )
			clearInterval( scrollIntervalRef.current );
	};

	const handleTriggerViewportFullscreen = ( elementTarget ) => {
		if ( ! elementTarget ) return;
		if ( elementTarget.requestFullscreen ) {
			elementTarget.requestFullscreen();
		} else if ( elementTarget.webkitRequestFullscreen ) {
			elementTarget.webkitRequestFullscreen();
		} else if ( elementTarget.msRequestFullscreen ) {
			elementTarget.msRequestFullscreen();
		}
	};

	return (
		<>
			{ /* DYNAMIC CAROUSEL VIEWPORT */ }
			{ currentImage && (
				<div
					className={ `main-image-viewport ${
						isTallImage ? 'force-full-height' : ''
					}` }
					style={ {
						cursor: isAnyVideo( currentImage )
							? 'default'
							: 'zoom-in',
						height: isVimeoVideo( currentImage )
							? 'auto'
							: undefined,
					} }
				>
					{ allImages.length > 1 && (
						<>
							<button
								className="nav-arrow prev"
								onClick={ ( e ) => {
									e.stopPropagation();
									navigateImage( -1 );
								} }
							>
								&#10094;
							</button>
							<button
								className="nav-arrow next"
								onClick={ ( e ) => {
									e.stopPropagation();
									navigateImage( 1 );
								} }
							>
								&#10095;
							</button>
						</>
					) }

					{ isLocalVideo( currentImage ) ? (
						<div
							style={ { width: '100%', position: 'relative' } }
							id="local-video-container"
						>
							<video
								src={ `${ currentImage }#t=0.1` }
								controls
								className="main-display-img"
								style={ { background: '#000' } }
							/>
							<button
								onClick={ () =>
									handleTriggerViewportFullscreen(
										document.querySelector(
											'#local-video-container video'
										)
									)
								}
								style={ {
									position: 'absolute',
									left: '12px',
									top: '12px',
									zIndex: 30,
									background: 'rgba(0,0,0,0.6)',
									border: 'none',
									color: '#fff',
									padding: '4px 8px',
									borderRadius: '4px',
									cursor: 'pointer',
									fontSize: '11px',
									fontWeight: '600',
								} }
							>
								{ __( 'Maximize', 'bawbab-interactive-maps' ) }
							</button>
						</div>
					) : isVimeoVideo( currentImage ) ? (
						<div
							style={ {
								width: '100%',
								position: 'relative',
								paddingTop: '56.25%',
								background: '#000',
							} }
							id="vimeo-iframe-container"
						>
							<iframe
								src={ currentImage }
								frameBorder="0"
								allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
								allowFullScreen={ true }
								style={ {
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '100%',
								} }
								title={ __(
									'Residence Video Walkthrough',
									'bawbab-interactive-maps'
								) }
							/>
							<button
								onClick={ () =>
									handleTriggerViewportFullscreen(
										document.getElementById(
											'vimeo-iframe-container'
										)
									)
								}
								style={ {
									position: 'absolute',
									left: '12px',
									top: '12px',
									zIndex: 30,
									background: 'rgba(0,0,0,0.6)',
									border: 'none',
									color: '#fff',
									padding: '4px 8px',
									borderRadius: '4px',
									cursor: 'pointer',
									fontSize: '11px',
									fontWeight: '600',
								} }
							>
								{ __( 'Maximize', 'bawbab-interactive-maps' ) }
							</button>
						</div>
					) : (
						<img
							src={ currentImage }
							className="main-display-img"
							alt="Display Layout"
							onClick={ () =>
								onImageClick && onImageClick( currentImage )
							}
							onLoad={ handleImageLoad }
						/>
					) }
				</div>
			) }

			{ /* THUMBNAIL STRIP */ }
			{ allImages.length > 1 && (
				<div className="thumb-carousel-container">
					<div
						className="hover-zone left"
						onMouseEnter={ () => startScroll( -6 ) }
						onMouseLeave={ stopScroll }
					/>
					<div
						className="hover-zone right"
						onMouseEnter={ () => startScroll( 6 ) }
						onMouseLeave={ stopScroll }
					/>
					<div
						className="custom-carousel-strip"
						ref={ thumbStripRef }
					>
						{ allImages.map( ( url, i ) => (
							<div
								key={ i }
								onClick={ () => setCurrentImage( url ) }
								className={ `thumb-wrapper ${
									currentImage === url ? 'is-active' : ''
								} ${ isAnyVideo( url ) ? 'is-video' : '' }` }
							>
								{ isVimeoVideo( url ) && vimeoThumbUrl ? (
									<img
										src={ vimeoThumbUrl }
										className="carousel-thumb-img"
										alt="Video cover thumbnail"
									/>
								) : isAnyVideo( url ) ? (
									<div className="carousel-thumb-video-fallback">
										{ __( 'Video', 'bawbab-interactive-maps' ) }
									</div>
								) : (
									<img
										src={ url }
										className="carousel-thumb-img"
										alt=""
									/>
								) }
							</div>
						) ) }
					</div>
				</div>
			) }
		</>
	);
};
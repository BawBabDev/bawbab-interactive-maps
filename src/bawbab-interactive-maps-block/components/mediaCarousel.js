import React, { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { triggerViewportFullscreen } from '../utils/triggerFullScreen';

export const MediaCarousel = ( {
	currentImage,
	allImages,
	setCurrentImage,
	onImageClick,
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
		typeof url === 'string' && url.includes( '://vimeo.com' );
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
								❮
							</button>
							<button
								className="nav-arrow next"
								onClick={ ( e ) => {
									e.stopPropagation();
									navigateImage( 1 );
								} }
							>
								❯
							</button>
						</>
					) }
					{ /* Preserved core image/video viewport elements inside your block */ }
					{ isLocalVideo( currentImage ) && (
						<video
							src={ currentImage }
							controls
							style={ {
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							} }
						/>
					) }
					{ isVimeoVideo( currentImage ) && (
						<iframe
							src={ currentImage }
							frameBorder="0"
							allow="autoplay; fullscreen"
							allowFullScreen
							style={ { width: '100%', height: '100%' } }
						/>
					) }
					{ ! isAnyVideo( currentImage ) && (
						<img
							src={ currentImage }
							alt="Main Preview"
							onLoad={ handleImageLoad }
							onClick={ () =>
								onImageClick && onImageClick( currentImage )
							}
						/>
					) }
				</div>
			) }

			{ /* THUMBNAIL STRIP */ }
			{ allImages.length > 1 && (
				<div
					className="thumbnail-strip-wrapper"
					style={ { position: 'relative' } }
				>
					<button
						className="scroll-btn left"
						onMouseDown={ () => startScroll( -5 ) }
						onMouseUp={ stopScroll }
						onMouseLeave={ stopScroll }
					>
						◀
					</button>
					<div className="thumbnail-strip" ref={ thumbStripRef }>
						{ allImages.map( ( img, index ) => (
							<div
								key={ index }
								className={ `thumb-item ${
									img === currentImage ? 'is-active' : ''
								}` }
								onClick={ () => setCurrentImage( img ) }
							>
								<img src={ img } alt={ `Thumb ${ index }` } />
							</div>
						) ) }
					</div>
					<button
						className="scroll-btn right"
						onMouseDown={ () => startScroll( 5 ) }
						onMouseUp={ stopScroll }
						onMouseLeave={ stopScroll }
					>
						▶
					</button>
				</div>
			) }
		</>
	);
};

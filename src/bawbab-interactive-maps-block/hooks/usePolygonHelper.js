import { useEffect, useMemo } from '@wordpress/element';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export default function usePolygonHelper( {
	paths,
	options,
	onClick,
	onMouseEnter,
	onMouseLeave,
} ) {
	const map = useMap();
	const mapsLibrary = useMapsLibrary( 'maps' );

	// Memoize the polygon instance so it's not recreated every render
	const polygon = useMemo( () => {
		if ( ! mapsLibrary ) return null;
		return new google.maps.Polygon();
	}, [ mapsLibrary ] );

	// Update paths and options when they change
	// This handles the visual 'yellow' highlight when options object updates
	useEffect( () => {
		if ( ! polygon ) return;
		polygon.setOptions( { ...options, paths } );
	}, [ polygon, paths, options ] );

	// Event listeners
	useEffect( () => {
		if ( ! polygon ) return;

		const listeners = [];

		if ( onClick ) {
			listeners.push(
				google.maps.event.addListener( polygon, 'click', ( e ) =>
					onClick( e )
				)
			);
		}

		if ( onMouseEnter ) {
			listeners.push(
				google.maps.event.addListener( polygon, 'mouseover', ( e ) =>
					onMouseEnter( e )
				)
			);
		}

		if ( onMouseLeave ) {
			listeners.push(
				google.maps.event.addListener( polygon, 'mouseout', ( e ) =>
					onMouseLeave( e )
				)
			);
		}

		return () => {
			listeners.forEach( ( l ) => google.maps.event.removeListener( l ) );
		};
	}, [ polygon, onClick, onMouseEnter, onMouseLeave ] );

	// Attach/Detach from map
	useEffect( () => {
		if ( ! polygon || ! map ) return;
		polygon.setMap( map );
		return () => polygon.setMap( null );
	}, [ polygon, map ] );

	return null;
}

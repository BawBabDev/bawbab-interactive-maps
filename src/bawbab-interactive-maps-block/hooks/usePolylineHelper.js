import { useEffect, useRef } from '@wordpress/element';
import { useMap } from '@vis.gl/react-google-maps';

/**
 * Polyline Component
 * Simple declarative wrapper around native google.maps.Polyline instances
 */
export default function usePolyline( { paths, options } ) {
	const map = useMap();
	const polylineRef = useRef( null );

	useEffect( () => {
		if ( ! map ) return;

		polylineRef.current = new google.maps.Polyline( {
			path: paths,
			...options,
		} );

		polylineRef.current.setMap( map );

		return () => {
			if ( polylineRef.current ) {
				polylineRef.current.setMap( null );
				polylineRef.current = null;
			}
		};
	}, [ map, paths, options ] );

	return null;
}

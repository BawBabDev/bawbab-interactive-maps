import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MainSettingsPage from './main-settings-page/mainSettingsPage';
import SpatialDataEditPage from './editor-page/spatialDataEditPage';
import './admin-styles.css';
import CategoryEditorPage from './category-editor/categoryEditorPage';

const App = () => {
	// Determine the current page from the URL query string
	const urlParams = new URLSearchParams( window.location.search );
	const currentPage = urlParams.get( 'page' );

	// Route logic
	if ( currentPage === 'bawbab-interactive-maps-edit-spatial-data' ) {
		return <SpatialDataEditPage />;
	}

	if ( currentPage === 'bawbab-interactive-maps-edit-category' ) {
		return <CategoryEditorPage />;
	}

	// Default route
	return <MainSettingsPage />;
};

/**
 * Initialize the React Admin Interface
 */
domReady( () => {
	const rootElement = document.getElementById( 'bwb-imaps-admin-app' );

	if ( rootElement ) {
		const root = createRoot( rootElement );
		root.render( <App /> );
	}
} );

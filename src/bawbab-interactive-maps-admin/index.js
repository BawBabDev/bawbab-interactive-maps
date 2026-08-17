import domReady from '@wordpress/dom-ready';
import { createRoot, useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MapSettingsPage from './map-settings-page/mapSettingsPage';
import SpatialDataEditorPage from './spatial-data-editor-page/spatialDataEditorPage';
import CategoryEditorPage from './category-editor-page/categoryEditorPage';
import { NavigationWarningModal } from './modals/navigationWarningModal';
import './admin-styles.css';

const App = () => {
    // 1. Centralized Dirty State Signal
    const [ isAppDirty, setIsAppDirty ] = useState( false );

    // 2. Navigation Interceptor States
    const [ pendingUrl, setPendingUrl ] = useState( null );
    const [ showNavModal, setShowNavModal ] = useState( false );

    // Ref to hold current dirty state without stale closures
    const isDirtyRef = useRef( isAppDirty );
    useEffect( () => {
        isDirtyRef.current = isAppDirty;
    }, [ isAppDirty ] );

    // Ref to bypass beforeunload check when user explicitly approves navigation in custom modal
    const allowNavigationRef = useRef( false );

    // 3. Browser Native BeforeUnload Interceptor (Page refresh, closing tab, direct URL typing)
    useEffect( () => {
        const handleBeforeUnload = ( e ) => {
            // Bypass if user confirmed leaving via the custom React modal
            if ( allowNavigationRef.current ) {
                return;
            }

            if ( isDirtyRef.current ) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser native prompt
            }
        };

        window.addEventListener( 'beforeunload', handleBeforeUnload );
        return () => window.removeEventListener( 'beforeunload', handleBeforeUnload );
    }, [] );

    // 4. Intercept Clicks on WordPress Sidebar Links & Admin Page Links
    useEffect( () => {
        const handleAdminLinkClick = ( e ) => {
            const anchor = e.target.closest( 'a' );
            if ( ! anchor ) return;

            const href = anchor.getAttribute( 'href' );
            if ( ! href || href.startsWith( '#' ) || href.startsWith( 'javascript:' ) ) {
                return;
            }

            if ( isDirtyRef.current ) {
                e.preventDefault();
                e.stopPropagation();
                setPendingUrl( href );
                setShowNavModal( true );
            }
        };

        // Attach listener to WP Admin Menu and Body
        const adminMenu = document.getElementById( 'adminmenuwrap' ) || document.body;
        adminMenu.addEventListener( 'click', handleAdminLinkClick, true );

        return () => {
            adminMenu.removeEventListener( 'click', handleAdminLinkClick, true );
        };
    }, [] );

    // 5. User confirms leaving without saving
    const handleConfirmNavigation = () => {
        // Set bypass flags synchronously before changing window.location
        allowNavigationRef.current = true;
        isDirtyRef.current = false;

        setShowNavModal( false );
        setIsAppDirty( false );

        if ( pendingUrl ) {
            window.location.href = pendingUrl;
            setPendingUrl( null );
        }
    };

    // 6. User cancels navigation and stays on current page
    const handleCancelNavigation = () => {
        setShowNavModal( false );
        setPendingUrl( null );
    };

    // Determine the current page from the URL query string
    const urlParams = new URLSearchParams( window.location.search );
    const currentPage = urlParams.get( 'page' );

    // Route logic with top-level dirty reporting callback
    const renderActivePage = () => {
        if ( currentPage === 'bawbab-interactive-maps-edit-spatial-data' ) {
            return <SpatialDataEditorPage onDirtyStateChange={ setIsAppDirty } />;
        }

        if ( currentPage === 'bawbab-interactive-maps-edit-category' ) {
            return <CategoryEditorPage onDirtyStateChange={ setIsAppDirty } />;
        }

        // Default route
        return <MapSettingsPage onDirtyStateChange={ setIsAppDirty } />;
    };

    return (
        <>
            { /* Global Navigation Interceptor Modal */ }
            <NavigationWarningModal
                isOpen={ showNavModal }
                onConfirm={ handleConfirmNavigation }
                onCancel={ handleCancelNavigation }
            />

            { renderActivePage() }
        </>
    );
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
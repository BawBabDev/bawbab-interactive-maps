import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class MapErrorBoundary extends Component {
    constructor( props ) {
        super( props );
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch( error, errorInfo ) {
        console.error( 'Google Map Crash prevented:', error, errorInfo );
    }

    render() {
        if ( this.state.hasError ) {
            return (
                <div style={ { 
                    height: '100%', 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: '#f0f0f0', 
                    color: '#3c434a',
                    padding: '20px',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                } }>
                    <span role="img" aria-label="warning" style={ { fontSize: '40px', marginBottom: '10px' } }>
                        ⚠️
                    </span>
                    <p style={ { fontWeight: '600', margin: 0 } }>
                        { __( 'Map rendering failed (check your API Key)', 'bawbab-interactive-maps' ) }
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MapErrorBoundary;

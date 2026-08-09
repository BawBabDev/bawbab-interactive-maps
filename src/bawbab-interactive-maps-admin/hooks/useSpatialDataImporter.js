import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * useSpatialDataImporter
 * 
 * Custom React hook handling async multi-layer GeoJSON payload uploads 
 * and layer truncations to the custom WordPress REST API namespace endpoints.
 * Optimized with stable callback references to prevent unneeded component tree re-renders.
 *
 * @returns {Object} Importer states and actions { importGeoJSON, isUploading, message, setMessage, deleteLayer }
 */
export const useSpatialDataImporter = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState(null);

    /**
     * importGeoJSON
     * Processes files dynamically over FormData, assigning layer types 
     * dispatched inside the backend PHP router.
     */
    const importGeoJSON = useCallback(async (fileList, layerType) => {
        if (!fileList?.length) return;
        
        const file = fileList[0];
        setIsUploading(true);
        
        // Reset message securely without breaking layout effects
        setMessage(prev => prev === null ? null : null);

        const formData = new FormData();
        formData.append('geojson_file', file);
        formData.append('layer_type', layerType);

        try {
            const response = await fetch('/wp-json/bwb-imaps-federated-api/v1/spatial-data-importer', {
                method: 'POST',
                headers: { 'X-WP-Nonce': window.wpApiSettings?.nonce || '' },
                body: formData,
            });

            const text = await response.text();
            let result;

            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error("Malformed JSON response:", text);
                setMessage({ 
                    type: 'error', 
                    text: __('Server error: Invalid response format.', 'bawbab-interactive-maps') 
                });
                return;
            }

            if (response.ok && result.success) {
                setMessage({ 
                    type: 'success', 
                    text: sprintf(
                        __('Import complete: %1$d features imported.', 'bawbab-interactive-maps'),
                        result.imported
                    )
                });
            } else {
                setMessage({ 
                    type: 'error', 
                    text: result.message || __('Import failed.', 'bawbab-interactive-maps') 
                });
            }
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: __('Network error occurred.', 'bawbab-interactive-maps') 
            });
        } finally {
            setIsUploading(false);
            const input = document.getElementById('geojson-import-input');
            if (input) input.value = '';
        }
    }, []); // Empty dependency array ensures reference stability

    /**
     * deleteLayer
     * Issues an authorized DELETE verb request targeting specific layers, 
     * purging records within specialized database structures safely.
     */
    const deleteLayer = useCallback(async (layerType) => {
        // Translation-safe confirmation alert
        const confirmPhrase = sprintf(
            __('Are you sure you want to delete ALL data for the %1$s layer?', 'bawbab-interactive-maps'),
            layerType
        );
        if (!window.confirm(confirmPhrase)) return;

        setIsUploading(true);
        setMessage(prev => prev === null ? null : null);

        try {
            const response = await fetch(`/wp-json/bwb-imaps-federated-api/v1/delete-layer/${layerType}`, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': window.wpApiSettings?.nonce || '' },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setMessage({ 
                    type: 'success', 
                    text: sprintf(__('Layer %1$s deleted successfully.', 'bawbab-interactive-maps'), layerType) 
                });
                // Soft timeout to give users feedback before view refresh
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessage({ 
                    type: 'error', 
                    text: __('Failed to delete layer.', 'bawbab-interactive-maps') 
                });
            }
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: __('Network error occurred.', 'bawbab-interactive-maps') 
            });
        } finally {
            setIsUploading(false);
        }
    }, []); // Wrapped in useCallback to prevent hook re-allocation side-effects

    return { importGeoJSON, isUploading, message, setMessage, deleteLayer };
};
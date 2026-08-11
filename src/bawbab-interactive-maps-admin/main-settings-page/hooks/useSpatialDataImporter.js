/**
 * Custom React hook handling async multi-layer GeoJSON inspections, 
 * field mapping execution, and layer truncations.
 * File location: src/hooks/useSpatialDataImporter.js
 */

import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const useSpatialDataImporter = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState(null);

    /**
     * inspectGeoJSON
     * Sends the file to the REST API to discover properties prior to import.
     */
    const inspectGeoJSON = useCallback(async (file) => {
        if (!file) return { success: false, message: __('No file provided.', TEXT_DOMAIN) };

        const formData = new FormData();
        formData.append('geojson_file', file);

        try {
            const response = await fetch('/wp-json/bwb-imaps-federated-api/v1/inspect-geojson', {
                method: 'POST',
                headers: { 'X-WP-Nonce': window.wpApiSettings?.nonce || '' },
                body: formData,
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: __('Network error inspecting file.', TEXT_DOMAIN) };
        }
    }, []);

    /**
     * importGeoJSON
     * Executes feature insertion with custom column mapping options.
     */
    const importGeoJSON = useCallback(async ({ 
        file, 
        layerType, 
        fieldMapping = {}, 
        importedCustomKeys = [], 
        overwriteExisting = false 
    }) => {
        if (!file) return;

        setIsUploading(true);
        setMessage(null);

        console.log('[useSpatialDataImporter] Starting GeoJSON import with payload:', {
            layerType,
            fieldMapping,
            importedCustomKeys
        });

        const formData = new FormData();
        formData.append('geojson_file', file);
        formData.append('layer_type', layerType);
        formData.append('field_mapping', JSON.stringify(fieldMapping));
        formData.append('imported_custom_keys', JSON.stringify(importedCustomKeys));
        formData.append('overwrite_existing', overwriteExisting ? 'true' : 'false');

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
                console.error('[useSpatialDataImporter] Raw server response was not valid JSON:', text);
                setMessage({ 
                    type: 'error', 
                    text: __('Server error: Invalid response format.', TEXT_DOMAIN) 
                });
                return;
            }

            console.log('[useSpatialDataImporter] Server import response:', result);

            if (response.ok && result.success) {
                setMessage({ 
                    type: 'success', 
                    text: sprintf(
                        __('Import complete: %1$d features processed.', TEXT_DOMAIN),
                        result.imported
                    )
                });
            } else {
                setMessage({ 
                    type: 'error', 
                    text: result.message || __('Import failed.', TEXT_DOMAIN) 
                });
            }
        } catch (error) {
            console.error('[useSpatialDataImporter] Network error during import:', error);
            setMessage({ 
                type: 'error', 
                text: __('Network error occurred.', TEXT_DOMAIN) 
            });
        } finally {
            setIsUploading(false);
            const input = document.getElementById('geojson-import-input');
            if (input) input.value = '';
        }
    }, []);

    /**
     * deleteLayer
     * Issues an authorized DELETE verb request targeting specific layers.
     */
    const deleteLayer = useCallback(async (layerType) => {
        const confirmPhrase = sprintf(
            __('Are you sure you want to delete ALL data for the %1$s layer?', TEXT_DOMAIN),
            layerType
        );
        if (!window.confirm(confirmPhrase)) return;

        setIsUploading(true);
        setMessage(null);

        try {
            const response = await fetch(`/wp-json/bwb-imaps-federated-api/v1/delete-layer/${layerType}`, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': window.wpApiSettings?.nonce || '' },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setMessage({ 
                    type: 'success', 
                    text: sprintf(__('Layer %1$s deleted successfully.', TEXT_DOMAIN), layerType) 
                });
                // No location reload needed! The state and map re-render dynamically.
            } else {
                setMessage({ 
                    type: 'error', 
                    text: __('Failed to delete layer.', TEXT_DOMAIN) 
                });
            }
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: __('Network error occurred.', TEXT_DOMAIN) 
            });
        } finally {
            setIsUploading(false);
        }
    }, []);

    return { inspectGeoJSON, importGeoJSON, isUploading, message, setMessage, deleteLayer };
};
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const useSpatialDataExporter = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState(null);

    const exportGeoJSON = async (layerType = 'buildings') => {
        setIsExporting(true);
        setExportError(null);

        try {
            const nonce = window.wpApiSettings?.nonce || '';
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `spatial-layer-${layerType}-${timestamp}.geojson`;

            const url = `/wp-json/bawbin-maps-federated-api/v1/export-geojson?layer_type=${encodeURIComponent(
                layerType
            )}&_wpnonce=${encodeURIComponent(nonce)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': nonce,
                },
            });

            if (!response.ok) {
                throw new Error(
                    sprintf(
                        /* translators: %s: HTTP status error text */
                        __('Export failed with status: %s', TEXT_DOMAIN),
                        response.statusText
                    )
                );
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            
            // Clean up DOM and object URL
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return { success: true, filename };
        } catch (err) {
            console.error('GeoJSON Export Error:', err);
            const errorMsg = err.message || __('Failed to export GeoJSON layer.', TEXT_DOMAIN);
            setExportError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsExporting(false);
        }
    };

    return {
        exportGeoJSON,
        isExporting,
        exportError,
    };
};
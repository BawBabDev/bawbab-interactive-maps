import { useState, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

/**
 * Custom hook to interact with the central attribute schema registry via REST API.
 */
export const useAttributeSchema = () => {
    const [schema, setSchema] = useState([]);
    const [isLoadingSchema, setIsLoadingSchema] = useState(true);

    // 1. Fetch current global attribute schema
    const fetchSchema = useCallback(async () => {
        setIsLoadingSchema(true);
        console.log('[useAttributeSchema] Fetching schema from /get-attribute-schema...');
        try {
            const response = await fetch('/wp-json/bwb-imaps-federated-api/v1/get-attribute-schema');
            console.log('[useAttributeSchema] Raw fetch response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[useAttributeSchema] Received schema payload:', data);
                console.log('[useAttributeSchema] Extracted schema array:', data.schema || []);
                setSchema(data.schema || []);
            } else {
                console.error('[useAttributeSchema] Failed REST response:', response.statusText);
            }
        } catch (err) {
            console.error('[useAttributeSchema] Error fetching attribute schema:', err);
        } finally {
            setIsLoadingSchema(false);
        }
    }, []);

    useEffect(() => {
        fetchSchema();
    }, [fetchSchema]);

    // 2. Add or update a key in the central attribute schema
    const updateSchemaKey = useCallback(async ({ key, label, type }) => {
        console.log('[useAttributeSchema] Sending update request for key:', { key, label, type });
        try {
            const response = await fetch('/wp-json/bwb-imaps-federated-api/v1/update-attribute-schema', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                },
                body: JSON.stringify({ key, label, type })
            });

            console.log('[useAttributeSchema] Update response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('[useAttributeSchema] Schema update successful. New schema:', data.schema);
                setSchema(data.schema || []);
                return { success: true };
            }
        } catch (err) {
            console.error('[useAttributeSchema] Error updating attribute schema:', err);
        }
        return { success: false };
    }, []);

    // 3. Purge a key from central schema AND all MySQL spatial rows
    const deleteSchemaKey = useCallback(async (key) => {
        console.log('[useAttributeSchema] Initiating purge request for key:', key);
        const confirmPhrase = sprintf(
            __('Are you sure you want to PERMANENTLY delete "%s" from ALL features in the database?', TEXT_DOMAIN),
            key
        );
        if (!window.confirm(confirmPhrase)) return { success: false };

        try {
            const response = await fetch('/wp-json/bwb-imaps-federated-api/v1/delete-attribute-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                },
                body: JSON.stringify({ key })
            });

            console.log('[useAttributeSchema] Delete response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('[useAttributeSchema] Schema purge successful. Remaining schema:', data.schema);
                setSchema(data.schema || []);
                return { success: true };
            }
        } catch (err) {
            console.error('[useAttributeSchema] Error deleting attribute key globally:', err);
        }
        return { success: false };
    }, []);

    return {
        schema,
        isLoadingSchema,
        fetchSchema,
        updateSchemaKey,
        deleteSchemaKey
    };
};
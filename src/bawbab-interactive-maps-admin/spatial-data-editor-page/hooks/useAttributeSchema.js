/**
 * Custom hook to interact with the central attribute schema registry via REST API.
 * File location: src/hooks/useAttributeSchema.js
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

const TEXT_DOMAIN = 'bawbab-interactive-maps';

export const useAttributeSchema = () => {
    const [ schema, setSchema ] = useState( [] );
    const [ isLoadingSchema, setIsLoadingSchema ] = useState( true );

    // 1. Fetch current global attribute schema
    const fetchSchema = useCallback( async () => {
        setIsLoadingSchema( true );
        try {
            const response = await fetch(
                '/wp-json/bawbin-maps-federated-api/v1/get-attribute-schema'
            );
            if ( response.ok ) {
                const data = await response.json();
                setSchema( data.schema || [] );
            }
        } catch ( err ) {
            console.error(
                '[useAttributeSchema] Error fetching attribute schema:',
                err
            );
        } finally {
            setIsLoadingSchema( false );
        }
    }, [] );

    useEffect( () => {
        fetchSchema();
    }, [ fetchSchema ] );

    // 2. Add or update a key in central attribute schema
    const updateSchemaKey = useCallback(
        async ( { key, label, type, icon, config } ) => {
            try {
                const response = await fetch(
                    '/wp-json/bawbin-maps-federated-api/v1/update-attribute-schema',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': window.wpApiSettings?.nonce || '',
                        },
                        body: JSON.stringify( {
                            key,
                            label,
                            type,
                            icon,
                            config,
                        } ),
                    }
                );

                if ( response.ok ) {
                    const data = await response.json();
                    setSchema( data.schema || [] );
                    return { success: true };
                }
            } catch ( err ) {
                console.error(
                    '[useAttributeSchema] Error updating attribute schema:',
                    err
                );
            }
            return { success: false };
        },
        []
    );

    // 3. Save full reordered schema sequence atomically
    const reorderSchemaKeys = useCallback(
        async ( newSchemaArray ) => {
            // Optimistically update React state immediately so UI re-renders without lag
            setSchema( newSchemaArray );

            try {
                const response = await fetch(
                    '/wp-json/bawbin-maps-federated-api/v1/reorder-attribute-schema',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': window.wpApiSettings?.nonce || '',
                        },
                        body: JSON.stringify( { schema: newSchemaArray } ),
                    }
                );

                if ( response.ok ) {
                    const data = await response.json();
                    setSchema( data.schema || [] );
                    return { success: true };
                }
            } catch ( err ) {
                console.error(
                    '[useAttributeSchema] Error persisting schema reorder:',
                    err
                );
                // Revert to server state on error
                fetchSchema();
            }
            return { success: false };
        },
        [ fetchSchema ]
    );

    // 4. Purge a key from central schema AND all spatial rows
    const deleteSchemaKey = useCallback( async ( key ) => {
        const confirmPhrase = sprintf(
            __(
                'Are you sure you want to PERMANENTLY delete "%s" from ALL features in the database?',
                TEXT_DOMAIN
            ),
            key
        );
        if ( ! window.confirm( confirmPhrase ) ) return { success: false };

        try {
            const response = await fetch(
                '/wp-json/bawbin-maps-federated-api/v1/delete-attribute-key',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': window.wpApiSettings?.nonce || '',
                    },
                    body: JSON.stringify( { key } ),
                }
            );

            if ( response.ok ) {
                const data = await response.json();
                setSchema( data.schema || [] );
                return { success: true };
            }
        } catch ( err ) {
            console.error(
                '[useAttributeSchema] Error deleting attribute key globally:',
                err
            );
        }
        return { success: false };
    }, [] );

    return {
        schema,
        isLoadingSchema,
        fetchSchema,
        updateSchemaKey,
        reorderSchemaKeys,
        deleteSchemaKey,
    };
};
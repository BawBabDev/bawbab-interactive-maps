<?php
/**
 * Sanitizer functions for Bawbab Interactive Maps.
 *File location: /includes/integrations/bawbin-options-sanitizer.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Sanitizes global settings option payloads.
 *
 */

$api_dir = plugin_dir_path( __FILE__ );

require_once dirname( $api_dir ) . '/sanitizers/bawbin-options-sanitizer.php';

function bawbin_maps_sanitize_global_settings( $input ) {
    if ( ! is_array( $input ) ) {
        return array();
    }

    $sanitized = array();

    // Process specific string fields field-by-field with explicit WP functions
    $string_fields = array( 
        'mapDescription', 
        'mapType', 
        'mapLogo', 
        'colorTheme', 
        'navBackground', 
        'googleApiKey', 
        'googleMapId' 
    );

    foreach ( $string_fields as $field ) {
        if ( isset( $input[ $field ] ) ) {
            // Handle array/object structures safely before sanitizing
            if ( is_array( $input[ $field ] ) || is_object( $input[ $field ] ) ) {
                $raw_val = isset( $input[ $field ]['url'] ) ? (string) $input[ $field ]['url'] : '';
            } else {
                $raw_val = (string) $input[ $field ];
            }

            // Apply specific WordPress sanitization based on the type of data
            if ( 'mapLogo' === $field ) {
                $sanitized[ $field ] = esc_url_raw( $raw_val );
            } elseif ( 'mapType' === $field || 'googleMapId' === $field ) {
                $sanitized[ $field ] = sanitize_key( $raw_val );
            } else {
                $sanitized[ $field ] = sanitize_text_field( $raw_val );
            }
        } else {
            $sanitized[ $field ] = '';
        }
    }

    // Deep sanitize 'categoryConfig' array structure using map_deep
    if ( isset( $input['categoryConfig'] ) && is_array( $input['categoryConfig'] ) ) {
        $groups       = isset( $input['categoryConfig']['groups'] ) && is_array( $input['categoryConfig']['groups'] ) ? $input['categoryConfig']['groups'] : array();
        $category_map = isset( $input['categoryConfig']['categoryMap'] ) && is_array( $input['categoryConfig']['categoryMap'] ) ? $input['categoryConfig']['categoryMap'] : array();

        $sanitized['categoryConfig'] = array(
            'groups'      => map_deep( $groups, 'sanitize_text_field' ),
            'categoryMap' => map_deep( $category_map, 'sanitize_text_field' ),
        );
    } else {
        $sanitized['categoryConfig'] = array(
            'groups'      => array(),
            'categoryMap' => array(),
        );
    }

    // Deep sanitize 'attribute_schema' array
    if ( isset( $input['attribute_schema'] ) && is_array( $input['attribute_schema'] ) ) {
        $sanitized['attribute_schema'] = map_deep( $input['attribute_schema'], 'sanitize_text_field' );
    } else {
        $sanitized['attribute_schema'] = array();
    }

    // 4. Deep sanitize 'locations' array
    if ( isset( $input['locations'] ) && is_array( $input['locations'] ) ) {
        $sanitized['locations'] = map_deep( $input['locations'], 'sanitize_text_field' );
    } else {
        $sanitized['locations'] = array();
    }

    // Maintain the debugging code safely
    if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log, WordPress.PHP.DevelopmentFunctions.error_log_print_r
        error_log( '[BWB iMaps Options Sanitizer] Processed option payload: ' . print_r( $sanitized, true ) );
    }

    return $sanitized;
}

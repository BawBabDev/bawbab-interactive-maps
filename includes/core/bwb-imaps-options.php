<?php
/**
 * Global Mapping Engine Settings & REST Data Schema Registry
 * File location: /includes/bwb-imaps-options.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Sanitizes and logs global settings changes
 */
function bwb_imaps_sanitize_global_settings( $input ) {
    if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
        error_log( '[BWB iMaps Options Sanitizer] Received option payload: ' . print_r( $input, true ) );
        if ( isset( $input['attribute_schema'] ) ) {
            error_log( '[BWB iMaps Options Sanitizer] attribute_schema count: ' . count( (array) $input['attribute_schema'] ) );
        } else {
            error_log( '[BWB iMaps Options Sanitizer] attribute_schema is NOT SET in input payload!' );
        }
    }
    return $input;
}

/**
 * Registers the map options dataset configuration layout within the WordPress option and REST system
 */
function bwb_imaps_register_global_settings() {
    register_setting(
        'bwb_imaps_settings_group',
        'bwb_imaps_options_data',
        array(
            'type'              => 'object',
            'sanitize_callback' => 'bwb_imaps_sanitize_global_settings',
            'show_in_rest'      => array(
                'schema' => array(
                    'type'       => 'object',
                    'properties' => array(
                        'mapDescription'   => array( 'type' => 'string' ),
                        'mapType'          => array( 'type' => 'string' ),
                        'mapLogo'          => array( 'type' => 'string' ),
                        'colorTheme'       => array( 'type' => 'string' ),
                        'navBackground'    => array( 'type' => 'string' ),
                        'googleApiKey'     => array( 'type' => 'string' ),
                        'googleMapId'      => array( 'type' => 'string' ),
                        'attribute_schema' => array(
                            'type'  => 'array',
                            'items' => array(
                                'type'       => 'object',
                                'properties' => array(
                                    'key'   => array( 'type' => 'string' ),
                                    'label' => array( 'type' => 'string' ),
                                    'type'  => array( 'type' => 'string' ), // 'text', 'number', 'boolean', 'bathrooms'
                                ),
                            ),
                        ),
                        'locations'        => array(
                            'type'  => 'array',
                            'items' => array(
                                'type'       => 'object',
                                'properties' => array(
                                    'title'       => array( 'type' => 'string' ),
                                    'lat'         => array( 'type' => 'string' ),
                                    'lng'         => array( 'type' => 'string' ),
                                    'description' => array( 'type' => 'string' ),
                                    'gallery'     => array( 'type' => 'array' ),
                                    'showMarker'  => array( 'type' => 'boolean' ),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
            'default' => array(
                'mapDescription'   => 'Bawbab Interactive Maps',
                'mapType'          => 'hybrid',
                'googleApiKey'     => '',
                'googleMapId'      => '',
                'attribute_schema' => array(),
                'locations'        => array(
                    array(
                        'title'       => 'Main office',
                        'lat'         => '40.202687',
                        'lng'         => '-75.251563',
                        'description' => 'Bawbab Maps Main Office',
                        'gallery'     => array(),
                        'showMarker'  => true,
                    )
                ),
            ),
        )
    );
}
add_action( 'init', 'bwb_imaps_register_global_settings' );
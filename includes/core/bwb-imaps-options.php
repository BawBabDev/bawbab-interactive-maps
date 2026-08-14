<?php
/**
 * Global Mapping Engine Settings & REST Data Schema Registry
 * File location: /includes/bwb-imaps-options.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Sanitizes global settings changes and protects core string types
 */
function bwb_imaps_sanitize_global_settings( $input ) {
    if ( ! is_array( $input ) ) {
        return array();
    }

    // Ensure all string fields are valid strings
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
            if ( is_array( $input[ $field ] ) || is_object( $input[ $field ] ) ) {
                $input[ $field ] = isset( $input[ $field ]['url'] ) ? (string) $input[ $field ]['url'] : '';
            } else {
                $input[ $field ] = (string) $input[ $field ];
            }
        } else {
            $input[ $field ] = '';
        }
    }

    if ( ! isset( $input['categoryConfig'] ) || ! is_array( $input['categoryConfig'] ) ) {
        $input['categoryConfig'] = array(
            'groups'      => array(),
            'categoryMap' => array(),
        );
    }

    if ( ! isset( $input['attribute_schema'] ) || ! is_array( $input['attribute_schema'] ) ) {
        $input['attribute_schema'] = array();
    }

    if ( ! isset( $input['locations'] ) || ! is_array( $input['locations'] ) ) {
        $input['locations'] = array();
    }

    if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log, WordPress.PHP.DevelopmentFunctions.error_log_print_r
        error_log( '[BWB iMaps Options Sanitizer] Processed option payload: ' . print_r( $input, true ) );
    }

    return $input;
}

/**
 * Registers global settings with full schema support for REST API
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
                    'type'                 => 'object',
                    'additionalProperties' => true,
                    'properties'           => array(
                        'mapDescription'   => array( 'type' => 'string' ),
                        'mapType'          => array( 'type' => 'string' ),
                        'mapLogo'          => array( 'type' => 'string' ),
                        'colorTheme'       => array( 'type' => 'string' ),
                        'navBackground'    => array( 'type' => 'string' ),
                        'googleApiKey'     => array( 'type' => 'string' ),
                        'googleMapId'      => array( 'type' => 'string' ),
                        'categoryConfig'   => array(
                            'type'                 => 'object',
                            'additionalProperties' => true,
                        ),
                        'attribute_schema' => array(
                            'type'                 => 'array',
                            'items'                => array(
                                'type'                 => 'object',
                                'additionalProperties' => true,
                            ),
                        ),
                        'locations'        => array(
                            'type'                 => 'array',
                            'items'                => array(
                                'type'                 => 'object',
                                'additionalProperties' => true,
                            ),
                        ),
                    ),
                ),
            ),
            'default' => array(
                'mapDescription'   => 'Bawbab Interactive Maps',
                'mapType'          => 'hybrid',
                'mapLogo'          => '',
                'colorTheme'       => 'blue',
                'navBackground'    => '',
                'googleApiKey'     => '',
                'googleMapId'      => '',
                'categoryConfig'   => array(
                    'groups'      => array(),
                    'categoryMap' => array(),
                ),
                'attribute_schema' => array(),
                'locations'        => array(),
            ),
        )
    );
}
add_action( 'init', 'bwb_imaps_register_global_settings' );
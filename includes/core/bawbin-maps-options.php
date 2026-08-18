<?php
/**
 * Global Mapping Engine Settings & REST Data Schema Registry
 * File location: /includes/bwb-imaps-options.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Registers global settings with full schema support for REST API
 */
function bawbin_maps_register_global_settings() {
    register_setting(
        'bawbin_maps_settings_group',
        'bawbin_maps_options_data',
        array(
            'type'              => 'object',
            'sanitize_callback' => 'bawbin_maps_sanitize_global_settings',
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
add_action( 'init', 'bawbin_maps_register_global_settings' );
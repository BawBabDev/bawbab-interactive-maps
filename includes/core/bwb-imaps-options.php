<?php
/**
 * Global Mapping Engine Settings & REST Data Schema Registry
 * File location: /includes/bwb-imaps-options.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Registers the map options dataset configuration layout within the WordPress option and REST system
 */
function bwb_imaps_register_global_settings() {
    register_setting(
        'bwb_imaps_settings_group',
        'bwb_imaps_options_data',
        array(
            'type'         => 'object',
            'show_in_rest' => array(
                'schema' => array(
                    'type'       => 'object',
                    'properties' => array(
                        'mapDescription' => array( 'type' => 'string' ),
                        'mapType'        => array( 'type' => 'string' ),
                        'mapLogo'        => array( 'type' => 'string' ),
                        'colorTheme'     => array( 'type' => 'string' ),
                        'navBackground'  => array( 'type' => 'string' ),
                        'googleApiKey'   => array( 'type' => 'string' ),
                        'googleMapId'    => array( 'type' => 'string' ),
                        'locations'      => array(
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
                'mapDescription' => 'Bawbab Interactive Maps',
                'mapType'        => 'hybrid',
                'googleApiKey'   => '',
                'googleMapId'    => '',
                'locations'      => array(
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

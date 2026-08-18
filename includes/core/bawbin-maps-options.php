<?php
/**
 * Global Mapping Engine Settings & REST Data Schema Registry
 * File location: /includes/bawbin-maps-options.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Field-by-field sanitization callback for registered settings options
 * Complies strictly with WordPress.org Plugin Review Guidelines.
 *
 * @param array $input Raw input payload from admin panel or REST API.
 * @return array Thoroughly sanitized settings payload.
 */
function bawbin_maps_sanitize_global_settings( $input ) {
    if ( ! is_array( $input ) ) {
        return array();
    }

    $sanitized = array();

    // 1. Text & Key Fields (sanitize_text_field & sanitize_key)
    $sanitized['mapDescription'] = isset( $input['mapDescription'] ) ? sanitize_text_field( $input['mapDescription'] ) : '';
    $sanitized['mapType']        = isset( $input['mapType'] ) ? sanitize_key( $input['mapType'] ) : 'hybrid';
    $sanitized['colorTheme']     = isset( $input['colorTheme'] ) ? sanitize_key( $input['colorTheme'] ) : 'blue';
    $sanitized['googleApiKey']   = isset( $input['googleApiKey'] ) ? sanitize_text_field( $input['googleApiKey'] ) : '';
    $sanitized['googleMapId']    = isset( $input['googleMapId'] ) ? sanitize_text_field( $input['googleMapId'] ) : '';

    // 2. URL / Image Media Fields (esc_url_raw)
    if ( isset( $input['mapLogo'] ) ) {
        if ( is_array( $input['mapLogo'] ) && isset( $input['mapLogo']['url'] ) ) {
            $sanitized['mapLogo'] = esc_url_raw( $input['mapLogo']['url'] );
        } elseif ( is_string( $input['mapLogo'] ) ) {
            $sanitized['mapLogo'] = esc_url_raw( $input['mapLogo'] );
        } else {
            $sanitized['mapLogo'] = '';
        }
    } else {
        $sanitized['mapLogo'] = '';
    }

    if ( isset( $input['navBackground'] ) ) {
        if ( is_array( $input['navBackground'] ) && isset( $input['navBackground']['url'] ) ) {
            $sanitized['navBackground'] = esc_url_raw( $input['navBackground']['url'] );
        } elseif ( is_string( $input['navBackground'] ) ) {
            $sanitized['navBackground'] = esc_url_raw( $input['navBackground'] );
        } else {
            $sanitized['navBackground'] = '';
        }
    } else {
        $sanitized['navBackground'] = '';
    }

    // 3. Category Configuration (Deep Recursive Array Sanitization)
    if ( isset( $input['categoryConfig'] ) && is_array( $input['categoryConfig'] ) ) {
        $sanitized['categoryConfig'] = map_deep( $input['categoryConfig'], 'sanitize_text_field' );
    } else {
        $sanitized['categoryConfig'] = array(
            'groups'      => array(),
            'categoryMap' => array(),
        );
    }

    // 4. Attribute Schema Array (Deep Recursive Sanitization)
    if ( isset( $input['attribute_schema'] ) && is_array( $input['attribute_schema'] ) ) {
        $sanitized['attribute_schema'] = map_deep( $input['attribute_schema'], 'sanitize_text_field' );
    } else {
        $sanitized['attribute_schema'] = array();
    }

    // 5. Locations Array (Deep Recursive Sanitization)
    if ( isset( $input['locations'] ) && is_array( $input['locations'] ) ) {
        $sanitized['locations'] = map_deep( $input['locations'], 'sanitize_text_field' );
    } else {
        $sanitized['locations'] = array();
    }

    // 6. Typography Array (Strict Typed Sanitization)
    $default_typography = array(
        'fontFamily'            => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
        'legendHeaderFontSize'  => 13,
        'legendSectionFontSize' => 10,
        'legendItemFontSize'    => 11,
        'drawerTitleFontSize'   => 28,
        'drawerBodyFontSize'    => 14,
        'controlsFontSize'      => 13,
    );

    if ( isset( $input['typography'] ) && is_array( $input['typography'] ) ) {
        $sanitized_typo = array();

        foreach ( $input['typography'] as $key => $val ) {
            $safe_key = sanitize_key( $key );

            if ( 'fontFamily' === $safe_key ) {
                $sanitized_typo[ $safe_key ] = sanitize_text_field( $val );
            } elseif ( is_numeric( $val ) ) {
                $sanitized_typo[ $safe_key ] = ( strpos( (string) $val, '.' ) !== false ) ? (float) $val : (int) $val;
            } else {
                $sanitized_typo[ $safe_key ] = sanitize_text_field( $val );
            }
        }

        $sanitized['typography'] = wp_parse_args( $sanitized_typo, $default_typography );
    } else {
        $sanitized['typography'] = $default_typography;
    }

    if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log, WordPress.PHP.DevelopmentFunctions.error_log_print_r
        error_log( '[BAWBIN Maps Options Sanitizer] Successfully sanitized payload.' );
    }

    return $sanitized;
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
                        'typography'       => array(
                            'type'                 => 'object',
                            'additionalProperties' => true,
                            'properties'           => array(
                                'fontFamily'            => array( 'type' => 'string' ),
                                'legendHeaderFontSize'  => array( 'type' => 'integer' ),
                                'legendSectionFontSize' => array( 'type' => 'integer' ),
                                'legendItemFontSize'    => array( 'type' => 'integer' ),
                                'drawerTitleFontSize'   => array( 'type' => 'number' ),
                                'drawerBodyFontSize'    => array( 'type' => 'number' ),
                                'controlsFontSize'      => array( 'type' => 'integer' ),
                            ),
                        ),
                    ),
                ),
            ),
            'default'           => array(
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
                'typography'       => array(
                    'fontFamily'            => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                    'legendHeaderFontSize'  => 13,
                    'legendSectionFontSize' => 10,
                    'legendItemFontSize'    => 11,
                    'drawerTitleFontSize'   => 28,
                    'drawerBodyFontSize'    => 14,
                    'controlsFontSize'      => 13,
                ),
            ),
        )
    );
}
add_action( 'init', 'bawbin_maps_register_global_settings' );
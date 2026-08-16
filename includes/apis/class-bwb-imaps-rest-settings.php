<?php
/**
 * MAP SETTINGS & STYLING REST ROUTES
 * File: includes/apis/class-bwb-imaps-rest-settings.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BWB_IMaps_REST_Settings {

    public static function register_routes( $namespace ) {
        // Public endpoint to retrieve general settings and styling configurations
        register_rest_route( $namespace, '/get-map-settings', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_settings' ),
            'permission_callback' => '__return_true',
        ) );

        // Authenticated admin endpoint to update settings, typography, and styling
        register_rest_route( $namespace, '/update-map-settings', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_update_settings' ),
            'permission_callback' => array( 'BWB_Federated_Imaps_API_Controller', 'check_admin_permissions' ),
        ) );
    }

    /**
     * Retrieve all map settings, themes, and typography configurations
     */
    public static function handle_get_settings() {
        $settings = get_option( 'bwb_imaps_options_data', array() );

        $default_category_config = array(
            'groups'      => array(),
            'categoryMap' => array(),
        );

        $default_typography = array(
            'fontFamily'            => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
            'legendHeaderFontSize'  => 13,
            'legendSectionFontSize' => 10,
            'legendItemFontSize'    => 11,
            'drawerTitleFontSize'   => 2.0,
            'drawerBodyFontSize'    => 1.1,
            'controlsFontSize'      => 13,
        );

        $payload = array(
            'mapDescription'   => $settings['mapDescription'] ?? 'Bawbab Interactive Maps',
            'mapType'          => $settings['mapType'] ?? 'hybrid',
            'mapLogo'          => $settings['mapLogo'] ?? '',
            'colorTheme'       => $settings['colorTheme'] ?? 'blue',
            'navBackground'    => $settings['navBackground'] ?? '',
            'googleApiKey'     => $settings['googleApiKey'] ?? '',
            'googleMapId'      => $settings['googleMapId'] ?? '',
            'locations'        => $settings['locations'] ?? array(),
            'attribute_schema' => $settings['attribute_schema'] ?? array(),
            'categoryConfig'   => $settings['categoryConfig'] ?? $default_category_config,
            'typography'       => $settings['typography'] ?? $default_typography,
        );

        return new WP_REST_Response( $payload, 200 );
    }

    /**
     * Update map settings, theme choices, and typography options
     */
    public static function handle_update_settings( $request ) {
        $existing_settings = get_option( 'bwb_imaps_options_data', array() );
        $params            = $request->get_json_params() ?: $request->get_body_params();

        if ( empty( $params ) ) {
            return new WP_Error( 'no_data', 'No parameters provided for update.', array( 'status' => 400 ) );
        }

        // Work on a copy of existing settings
        $updated_settings = $existing_settings;

        // Apply top-level scalar / array parameters
        foreach ( $params as $key => $value ) {
            if ( 'categoryConfig' === $key || 'attribute_schema' === $key || 'typography' === $key ) {
                // For structured subsystems, completely replace the key when provided so empty arrays aren't merged back
                if ( is_array( $value ) ) {
                    $updated_settings[ $key ] = $value;
                }
            } else {
                $updated_settings[ $key ] = $value;
            }
        }

        if ( function_exists( 'bwb_imaps_sanitize_global_settings' ) ) {
            $updated_settings = bwb_imaps_sanitize_global_settings( $updated_settings );
        }

        $saved = update_option( 'bwb_imaps_options_data', $updated_settings );

        if ( false === $saved ) {
            return new WP_REST_Response( array(
                'success' => true,
                'message' => 'Settings unchanged or already up to date.',
            ), 200 );
        }

        return new WP_REST_Response( array(
            'success'  => true,
            'settings' => $updated_settings,
        ), 200 );
    }
}
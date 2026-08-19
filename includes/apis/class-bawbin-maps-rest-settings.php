<?php
/**
 * MAP SETTINGS & STYLING REST ROUTES
 * File: includes/apis/class-bawbin-maps-rest-settings.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BAWBIN_Maps_REST_Settings {

    public static function bawbin_maps_register_routes( $namespace ) {
        // Public endpoint to retrieve general settings, navigation, legend, and styling configurations
        register_rest_route( $namespace, '/get-map-settings', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'bawbin_maps_handle_get_settings' ),
            'permission_callback' => '__return_true',
        ) );

        // Authenticated admin endpoint to update settings, categories, legend, typography, and styling
        register_rest_route( $namespace, '/update-map-settings', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'bawbin_maps_handle_update_settings' ),
            'permission_callback' => array( 'BAWBIN_Maps_Federated_API_Controller', 'bawbin_maps_check_admin_permissions' ),
        ) );
    }

    /**
     * Retrieve all map settings, category maps, legend configs, themes, and typography
     */
    public static function bawbin_maps_handle_get_settings() {
        $settings = get_option( 'bawbin_maps_options_data', array() );

        // Preserve exact saved categoryConfig structure without forced non-empty fallbacks
        $saved_category_config = isset( $settings['categoryConfig'] ) && is_array( $settings['categoryConfig'] )
            ? $settings['categoryConfig']
            : array();

        $default_category_config = array(
            'groups'      => array(),
            'categoryMap'  => array(),
            'legendConfig' => array(
                'enabled'            => true,
                'showSectionHeaders' => true,
                'sections'           => array(),
            ),
        );

        // Merge saved structure with defaults while preserving empty arrays verbatim
        $category_config = array_merge( $default_category_config, $saved_category_config );

        $default_typography = array(
            'fontFamily'                  => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
            
            // --- LEGEND DEFAULTS ---
            'legendHeaderFontSize'        => 13,
            'legendSectionFontSize'       => 10,
            'legendItemFontSize'          => 11,
            'legendHeaderFontWeight'      => '800',
            'legendSectionFontWeight'     => '800',
            'legendItemFontWeight'        => '600',
            'legendHeaderFontStyle'       => 'normal',
            'legendSectionFontStyle'      => 'normal',
            'legendItemFontStyle'         => 'normal',
            'legendHeaderDecoration'      => 'none',
            'legendSectionDecoration'     => 'none',
            'legendItemDecoration'        => 'none',

            // --- DRAWER DEFAULTS ---
            'drawerCategoryFontSize'      => 11,
            'drawerCategoryFontWeight'    => '700',
            'drawerCategoryFontStyle'     => 'normal',
            'drawerCategoryDecoration'    => 'none',

            'drawerTitleFontSize'         => 28,
            'drawerTitleFontWeight'       => '800',
            'drawerTitleFontStyle'        => 'normal',
            'drawerTitleDecoration'       => 'none',

            'drawerSubtitleFontSize'      => 16,
            'drawerSubtitleFontWeight'    => '600',
            'drawerSubtitleFontStyle'     => 'normal',
            'drawerSubtitleDecoration'    => 'none',

            'drawerHeadingFontSize'       => 20,
            'drawerHeadingFontWeight'     => '700',
            'drawerHeadingFontStyle'      => 'normal',
            'drawerHeadingDecoration'     => 'none',

            'drawerBodyFontSize'          => 14,
            'drawerBodyFontWeight'        => '400',
            'drawerBodyFontStyle'         => 'normal',
            'drawerBodyDecoration'        => 'none',

            'drawerQuoteFontSize'         => 14,
            'drawerQuoteFontWeight'        => '400',
            'drawerQuoteFontStyle'        => 'italic',
            'drawerQuoteDecoration'       => 'none',

            'drawerSpecsNumberFontSize'  => 14,
            'drawerSpecsNumberFontWeight' => '800',
            'drawerSpecsNumberFontStyle'  => 'normal',
            'drawerSpecsNumberDecoration' => 'none',

            'drawerSpecsLabelFontSize'   => 9,
            'drawerSpecsLabelFontWeight'  => '700',
            'drawerSpecsLabelFontStyle'   => 'normal',
            'drawerSpecsLabelDecoration'  => 'none',

            // --- MAP CONTROLS DEFAULTS ---
            'controlsHeaderFontSize'      => 12,
            'controlsHeaderFontWeight'    => '800',
            'controlsHeaderFontStyle'     => 'normal',
            'controlsHeaderDecoration'    => 'none',

            'controlsItemFontSize'        => 11,
            'controlsItemFontWeight'      => '600',
            'controlsItemFontStyle'       => 'normal',
            'controlsItemDecoration'      => 'none',

            'controlsFloorFontSize'       => 11,
            'controlsFloorFontWeight'     => '800',
            'controlsFloorFontStyle'      => 'normal',
            'controlsFloorDecoration'     => 'none',

            // --- SEARCH BAR & LIST DEFAULTS ---
            'searchInputFontSize'         => 13,
            'searchInputFontWeight'       => '400',
            'searchInputFontStyle'        => 'normal',
            'searchInputDecoration'       => 'none',

            'searchTabFontSize'           => 14,
            'searchTabFontWeight'         => '600',
            'searchTabFontStyle'          => 'normal',
            'searchTabDecoration'         => 'none',

            'searchGroupHeaderFontSize'   => 13,
            'searchGroupHeaderFontWeight' => '600',
            'searchGroupHeaderFontStyle'  => 'normal',
            'searchGroupHeaderDecoration' => 'none',

            'searchItemFontSize'          => 12,
            'searchItemFontWeight'        => '400',
            'searchItemFontStyle'         => 'normal',
            'searchItemDecoration'        => 'none',

            'searchResultTitleFontSize'   => 12,
            'searchResultTitleFontWeight' => '600',
            'searchResultTitleFontStyle'  => 'normal',
            'searchResultTitleDecoration' => 'none',

            'searchResultCatFontSize'     => 9,
            'searchResultCatFontWeight'   => '700',
            'searchResultCatFontStyle'    => 'normal',
            'searchResultCatDecoration'   => 'none',

            // --- MAP HEADER TITLE & DESCRIPTION DEFAULTS ---
            'mapTitleFontSize'            => 16,
            'mapTitleFontWeight'          => '700',
            'mapTitleFontStyle'           => 'normal',
            'mapTitleDecoration'          => 'none',

            'mapDescriptionFontSize'      => 11,
            'mapDescriptionFontWeight'    => '400',
            'mapDescriptionFontStyle'     => 'normal',
            'mapDescriptionDecoration'    => 'none',
        );

        $payload = array(
            'mapTitle'         => $settings['mapTitle'] ?? 'Bawbab Interactive Maps',
            'mapDescription'   => $settings['mapDescription'] ?? '',
            'mapType'          => $settings['mapType'] ?? 'hybrid',
            'mapLogo'          => $settings['mapLogo'] ?? '',
            'colorTheme'       => ! empty( $settings['colorTheme'] ) ? $settings['colorTheme'] : 'blue',
            'navBackground'    => $settings['navBackground'] ?? '',
            'googleApiKey'     => $settings['googleApiKey'] ?? '',
            'googleMapId'      => $settings['googleMapId'] ?? '',
            'locations'        => $settings['locations'] ?? array(),
            'attribute_schema' => $settings['attribute_schema'] ?? array(),
            'categoryConfig'   => $category_config,
            'typography'       => isset( $settings['typography'] ) ? array_merge( $default_typography, $settings['typography'] ) : $default_typography,
        );

        return new WP_REST_Response( $payload, 200 );
    }

    /**
     * Update map settings, category maps, legend section configurations, and typography
     */
    public static function bawbin_maps_handle_update_settings( $request ) {
        $existing_settings = get_option( 'bawbin_maps_options_data', array() );
        $params            = $request->get_json_params() ?: $request->get_body_params();

        if ( empty( $params ) ) {
            return new WP_Error( 'no_data', 'No parameters provided for update.', array( 'status' => 400 ) );
        }

        // Work on a copy of existing settings
        $updated_settings = $existing_settings;

        // Apply top-level structured parameters directly without stripping empty arrays
        foreach ( $params as $key => $value ) {
            if ( 'categoryConfig' === $key || 'attribute_schema' === $key || 'typography' === $key ) {
                if ( is_array( $value ) ) {
                    $updated_settings[ $key ] = $value;
                }
            } else {
                $updated_settings[ $key ] = $value;
            }
        }

        if ( function_exists( 'bawbin_maps_sanitize_global_settings' ) ) {
            $updated_settings = bawbin_maps_sanitize_global_settings( $updated_settings );
        }

        $saved = update_option( 'bawbin_maps_options_data', $updated_settings );

        // Invalidate spatial GeoJSON transient cache so public frontend map updates immediately
        wp_cache_delete( 'bawbin_maps_spatial_geojson_collection', 'bawbin_maps_spatial_cache' );

        return new WP_REST_Response( array(
            'success'  => true,
            'settings' => $updated_settings,
        ), 200 );
    }
}
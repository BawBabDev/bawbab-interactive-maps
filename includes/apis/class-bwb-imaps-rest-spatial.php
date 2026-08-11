<?php
/**
 * SPATIAL DATA REST ROUTES
 * File: includes/apis/class-bwb-imaps-rest-spatial.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BWB_IMaps_REST_Spatial {

    public static function register_routes( $namespace ) {
        register_rest_route( $namespace, '/get-spatial-data', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_spatial_data' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( $namespace, '/map-locations', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'get_public_map_data' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( $namespace, '/update-spatial-meta', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_update_spatial_meta' ),
            'permission_callback' => array( 'BWB_Federated_Imaps_API_Controller', 'check_admin_permissions' ),
        ) );

        register_rest_route( $namespace, '/delete-layer/(?P<layer_type>[a-zA-Z0-9_\-]+)', array(
            'methods'             => 'DELETE',
            'callback'            => array( __CLASS__, 'handle_delete_layer' ),
            'permission_callback' => array( 'BWB_Federated_Imaps_API_Controller', 'check_admin_permissions' ),
        ) );
    }

    public static function get_public_map_data() {
        $settings = get_option( 'bwb_imaps_options_data' );

        $default_category_config = array(
            'groups'      => array(),
            'categoryMap' => array(),
        );

        return array(
            'locations'        => isset( $settings['locations'] ) ? $settings['locations'] : array(),
            'mapType'          => isset( $settings['mapType'] ) ? $settings['mapType'] : 'hybrid',
            'mapLogo'          => isset( $settings['mapLogo'] ) ? $settings['mapLogo'] : '',
            'colorTheme'       => isset( $settings['colorTheme'] ) ? $settings['colorTheme'] : 'blue',
            'navBackground'    => isset( $settings['navBackground'] ) ? $settings['navBackground'] : '',
            'googleApiKey'     => isset( $settings['googleApiKey'] ) ? $settings['googleApiKey'] : '',
            'googleMapId'      => isset( $settings['googleMapId'] ) ? $settings['googleMapId'] : '',
            'attribute_schema' => isset( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array(),
            'categoryConfig'   => isset( $settings['categoryConfig'] ) ? $settings['categoryConfig'] : $default_category_config,
        );
    }

    public static function handle_get_spatial_data() {
        global $wpdb;

        $cache_key          = 'bwb_spatial_geojson_collection';
        $cache_group        = 'bwb_spatial_cache';
        $geojson_collection = wp_cache_get( $cache_key, $cache_group );

        if ( false === $geojson_collection ) {
            $table_spatial = $wpdb->prefix . 'bwb_general_spatial_data';
            $table_entries = $wpdb->prefix . 'bwb_nav_entries_data';

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $spatial_results = $wpdb->get_results( 
                $wpdb->prepare( "
                    SELECT *, CASE 
                        WHEN layer_type = 'land_use'  THEN 1 
                        WHEN layer_type = 'paths'     THEN 2 
                        WHEN layer_type = 'buildings' THEN 3 
                        WHEN layer_type = 'parcels'   THEN 4 
                        ELSE 0 
                    END as render_order FROM %i ORDER BY render_order ASC
                ", $table_spatial ), ARRAY_A );

            if ( is_null( $spatial_results ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve spatial data layers.', array( 'status' => 500 ) );
            }

            $features = array();

            foreach ( $spatial_results as $row ) {
                $custom_attrs = ! empty( $row['custom_attributes'] ) ? json_decode( $row['custom_attributes'], true ) : array();
                if ( ! is_array( $custom_attrs ) ) {
                    $custom_attrs = array();
                }

                $properties = array(
                    'fid'                  => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                    'layer_type'           => $row['layer_type'] ?? '',
                    'name'                 => $row['name'] ?? '',
                    'category'             => $row['category'] ?? '',
                    'code'                 => $row['code'] ?? '',
                    'fill_color'           => $row['fill_color'] ?? '',
                    'lat'                  => ! empty( $row['lat'] ) ? (float) $row['lat'] : null,
                    'lng'                  => ! empty( $row['lng'] ) ? (float) $row['lng'] : null,
                    'floor'                => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    'is_interactive'       => isset( $row['is_interactive'] ) ? (bool) $row['is_interactive'] : ( 'buildings' === ( $row['layer_type'] ?? '' ) ),
                    'show_label'           => isset( $row['show_label'] ) ? (bool) $row['show_label'] : ( ! empty( $row['name'] ) && 'paths' !== ( $row['layer_type'] ?? '' ) ),
                    'title'                => $row['title'] ?? '',
                    'description'          => $row['description'] ?? '',
                    'wp_page_id'           => ! empty( $row['wp_page_id'] ) ? (int) $row['wp_page_id'] : null,
                    'append_description'   => ! empty( $row['append_description'] ),
                    'custom_video_url'     => $row['custom_video_url'] ?? '',
                    'custom_floorplan_url' => $row['custom_floorplan_url'] ?? '',
                    'hide_page_video'      => ! empty( $row['hide_page_video'] ),
                    'hide_page_floorplan'  => ! empty( $row['hide_page_floorplan'] ),
                    'gallery'              => ! empty( $row['gallery'] ) ? ( json_decode( $row['gallery'], true ) ?: array() ) : array(),
                    'custom_attributes'    => $custom_attrs,
                );

                $merged_properties = array_merge( $custom_attrs, $properties );

                $features[] = array(
                    'type'       => 'Feature',
                    'properties' => $merged_properties,
                    'geometry'   => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null,
                );
            }

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $entries_results = $wpdb->get_results( 
                $wpdb->prepare( "SELECT * FROM %i", $table_entries ), ARRAY_A );

            if ( is_null( $entries_results ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve navigation entry points.', array( 'status' => 500 ) );
            }

            foreach ( $entries_results as $row ) {
                $features[] = array(
                    'type'       => 'Feature',
                    'properties' => array(
                        'fid'        => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                        'layer_type' => 'entries',
                        'name'       => $row['name'] ?? '',
                        'type'       => $row['type'] ?? '',
                        'floor'      => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    ),
                    'geometry'   => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null,
                );
            }

            $geojson_collection = array(
                'type'     => 'FeatureCollection',
                'features' => $features,
            );
            wp_cache_set( $cache_key, $geojson_collection, $cache_group, 86400 );
        }
        return new WP_REST_Response( $geojson_collection, 200 );
    }

    public static function handle_update_spatial_meta( $request ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
        
        $fid        = sanitize_text_field( $request->get_param( 'fid' ) );
        $layer_type = sanitize_text_field( $request->get_param( 'layer_type' ) );

        if ( empty( $fid ) || empty( $layer_type ) ) {
            return new WP_Error( 'missing_params', 'Missing fid or layer_type parameters.', array( 'status' => 400 ) );
        }

        $update_data = array();
        $format      = array();

        if ( $request->has_param( 'category' ) ) {
            $update_data['category'] = sanitize_text_field( $request->get_param( 'category' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'fill_color' ) ) {
            $update_data['fill_color'] = sanitize_hex_color( $request->get_param( 'fill_color' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'title' ) ) {
            $update_data['title'] = sanitize_text_field( $request->get_param( 'title' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'description' ) ) {
            $update_data['description'] = sanitize_textarea_field( $request->get_param( 'description' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'append_description' ) ) {
            $update_data['append_description'] = ! empty( $request->get_param( 'append_description' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'custom_video_url' ) ) {
            $update_data['custom_video_url'] = esc_url_raw( $request->get_param( 'custom_video_url' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'custom_floorplan_url' ) ) {
            $update_data['custom_floorplan_url'] = esc_url_raw( $request->get_param( 'custom_floorplan_url' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'hide_page_video' ) ) {
            $update_data['hide_page_video'] = ! empty( $request->get_param( 'hide_page_video' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'hide_page_floorplan' ) ) {
            $update_data['hide_page_floorplan'] = ! empty( $request->get_param( 'hide_page_floorplan' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'is_interactive' ) ) {
            $update_data['is_interactive'] = ! empty( $request->get_param( 'is_interactive' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'show_label' ) ) {
            $update_data['show_label'] = ! empty( $request->get_param( 'show_label' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'gallery' ) ) {
            $gallery = $request->get_param( 'gallery' );
            $update_data['gallery'] = is_string( $gallery ) ? $gallery : json_encode( $gallery );
            $format[] = '%s';
        }

        if ( $request->has_param( 'wp_page_id' ) ) {
            $page_id = $request->get_param( 'wp_page_id' );
            $update_data['wp_page_id'] = ( $page_id !== '' && ! is_null( $page_id ) ) ? (int) $page_id : null;
            $format[] = '%d';
        }

        if ( $request->has_param( 'custom_attributes' ) ) {
            $custom_attrs = $request->get_param( 'custom_attributes' );
            $parsed_attrs = is_string( $custom_attrs ) ? json_decode( $custom_attrs, true ) : $custom_attrs;
            
            if ( is_array( $parsed_attrs ) ) {
                BWB_IMaps_REST_Attributes::sync_custom_keys_to_schema( array_keys( $parsed_attrs ) );
            }

            $update_data['custom_attributes'] = is_string( $custom_attrs ) ? $custom_attrs : json_encode( $custom_attrs );
            $format[] = '%s';
        }

        if ( empty( $update_data ) ) {
            return new WP_REST_Response( array( 'success' => true, 'message' => 'No fields provided for update.' ), 200 );
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.DirectQuery
        $result = $wpdb->update(
            $table_name,
            $update_data,
            array( 'fid' => $fid, 'layer_type' => $layer_type ),
            $format,
            array( '%s', '%s' )
        );

        if ( false === $result ) {
            return new WP_Error( 'db_update_error', 'Failed to update metadata records inside database.', array( 'status' => 500 ) );
        }

        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array( 'success' => true ), 200 );
    }

    public static function handle_delete_layer( $data ) {
        global $wpdb;
        $layer_type = sanitize_text_field( $data['layer_type'] );

        if ( empty( $layer_type ) ) {
            return new WP_Error( 'missing_params', 'Missing required parameters.', array( 'status' => 400 ) );
        }

        if ( 'entries' === $layer_type ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $result = $wpdb->query( $wpdb->prepare( "TRUNCATE TABLE %i", $wpdb->prefix . 'bwb_nav_entries_data' ) );
        } elseif ( 'network' === $layer_type ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $result = $wpdb->query( $wpdb->prepare( "TRUNCATE TABLE %i", $wpdb->prefix . 'bwb_nav_network_data' ) );
        } else {
            $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $result = $wpdb->delete( $table_name, array( 'layer_type' => $layer_type ) );
        }

        if ( false === $result ) {
            return new WP_Error( 'db_error', 'Could not delete layer.', array( 'status' => 500 ) );
        }

        wp_cache_delete( 'bwb_navigation_graph_data', 'bwb_spatial_cache' );
        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array(
            'success' => true, 
            'message' => "Layer '$layer_type' deleted successfully."
        ), 200 );
    }
}
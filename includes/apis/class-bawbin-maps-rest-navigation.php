<?php
/**
 * INDOOR NAVIGATION GRAPH REST ROUTES
 * File: includes/apis/class-bawbin-maps-rest-navigation.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class  BAWBIN_Maps_REST_Navigation {

    public static function bawbin_maps_register_routes( $namespace ) {
        register_rest_route( $namespace, '/get-navigation-graph', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'bwb_imaps_handle_get_navigation_graph' ),
            'permission_callback' => '__return_true',
        ) );
    }

    public static function bawbin_maps_handle_get_navigation_graph() {
        global $wpdb;

        $cache_key   = 'bwb_navigation_graph_data';
        $cache_group = 'bwb_spatial_cache';
        $graph_data  = wp_cache_get( $cache_key, $cache_group );

        if ( false === $graph_data ) {
            $table_entries = $wpdb->prefix . 'bawbin_maps_nav_entries_data';
            $table_network = $wpdb->prefix . 'bawbin_maps_nav_network_data';

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $entries = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i", $table_entries ), ARRAY_A );

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $network = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i", $table_network ), ARRAY_A );

            if ( is_null( $entries ) || is_null( $network ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve navigation graph network datasets.', array( 'status' => 500 ) );
            }

            $graph_data = array(
                'entries' => array(),
                'network' => array(),
            );

            foreach ( $entries as $row ) {
                $graph_data['entries'][] = array(
                    'fid'   => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                    'name'  => $row['name'] ?? '',
                    'type'  => $row['type'] ?? '',
                    'floor' => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    'geom'  => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null,
                );
            }

            foreach ( $network as $row ) {
                $graph_data['network'][] = array(
                    'fid'      => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                    'name'     => $row['name'] ?? '',
                    'type'     => $row['type'] ?? '',
                    'floor'    => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    'length_m' => isset( $row['length_m'] ) ? (float) $row['length_m'] : 0.00,
                    'geom'     => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null,
                );
            }

            wp_cache_set( $cache_key, $graph_data, $cache_group, 43200 );
        }
        return new WP_REST_Response( $graph_data, 200 );
    }
}
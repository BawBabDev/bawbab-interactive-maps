<?php
/**
 * GEOJSON LAYER EXPORTER REST ROUTES
 * File: includes/apis/class-bwb-imaps-rest-exporter.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BWB_IMaps_REST_Exporter {

    public static function register_routes( $namespace ) {
        register_rest_route( $namespace, '/export-geojson', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_export_geojson' ),
            'permission_callback' => array( 'BWB_Federated_Imaps_API_Controller', 'check_admin_permissions' ),
        ) );
    }

    public static function handle_export_geojson( $request ) {
        global $wpdb;

        $layer_type = sanitize_text_field( $request->get_param( 'layer_type' ) ?: 'buildings' );

        if ( 'entries' === $layer_type ) {
            $table_name = $wpdb->prefix . 'bwb_nav_entries_data';
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i", $table_name ), ARRAY_A );
        } elseif ( 'network' === $layer_type ) {
            $table_name = $wpdb->prefix . 'bwb_nav_network_data';
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i", $table_name ), ARRAY_A );
        } else {
            $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i WHERE layer_type = %s", $table_name, $layer_type ), ARRAY_A );
        }

        $features = array();

        if ( ! empty( $rows ) && is_array( $rows ) ) {
            foreach ( $rows as $row ) {
                $geometry = json_decode( $row['geom'] ?? '{}', true );
                if ( ! is_array( $geometry ) || empty( $geometry['type'] ) ) {
                    continue;
                }

                $properties = array();

                // 1. Process Core Table Columns
                foreach ( $row as $col_name => $col_val ) {
                    if ( in_array( $col_name, array( 'geom', 'custom_attributes' ), true ) ) {
                        continue;
                    }

                    if ( null === $col_val || '' === $col_val ) {
                        continue;
                    }

                    // Cast numeric and boolean flags
                    if ( in_array( $col_name, array( 'is_interactive', 'show_label', 'use_custom_color', 'append_description', 'hide_page_video', 'hide_page_floorplan' ), true ) ) {
                        $properties[ $col_name ] = (int) $col_val;
                    } elseif ( in_array( $col_name, array( 'lat', 'lng' ), true ) ) {
                        $properties[ $col_name ] = (float) $col_val;
                    } elseif ( 'floor' === $col_name || 'wp_page_id' === $col_name ) {
                        $properties[ $col_name ] = (int) $col_val;
                    } elseif ( 'gallery' === $col_name ) {
                        $decoded = json_decode( $col_val, true );
                        $properties[ $col_name ] = is_array( $decoded ) ? $decoded : $col_val;
                    } else {
                        $properties[ $col_name ] = $col_val;
                    }
                }

                // 2. Unpack Custom Attributes into GeoJSON Properties Root
                if ( ! empty( $row['custom_attributes'] ) ) {
                    $custom_attrs = json_decode( $row['custom_attributes'], true );
                    if ( is_array( $custom_attrs ) ) {
                        foreach ( $custom_attrs as $attr_key => $attr_val ) {
                            if ( ! isset( $properties[ $attr_key ] ) && null !== $attr_val && '' !== $attr_val ) {
                                $properties[ $attr_key ] = $attr_val;
                            }
                        }
                    }
                }

                $features[] = array(
                    'type'       => 'Feature',
                    'geometry'   => $geometry,
                    'properties' => $properties,
                );
            }
        }

        $geojson = array(
            'type'     => 'FeatureCollection',
            'features' => $features,
        );

        $filename = sprintf( 'spatial-layer-%s-%s.geojson', $layer_type, date( 'Y-m-d' ) );

        header( 'Content-Type: application/json; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Pragma: no-cache' );
        header( 'Expires: 0' );

        echo json_encode( $geojson, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
        exit;
    }
}
<?php
/**
 * CATEGORY & SCHEMA MANAGEMENT REST ROUTES
 * File: includes/apis/class-bawbin-maps-rest-categories.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BAWBIN_Maps_REST_Categories {

    public static function bawbin_maps_register_routes( $namespace ) {
        register_rest_route( $namespace, '/cleanup-category-schema', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'bawbin_maps_handle_cleanup_category_schema' ),
            'permission_callback' => array( 'BAWBIN_Maps_Federated_API_Controller', 'bawbin_maps_check_admin_permissions' ),
        ) );
    }

    /**
     * POST Route Callback: Prunes categories from categoryConfig
     * that are no longer assigned to any spatial feature in MySQL.
     * Evaluates STRICTLY against layer_type::category_slug composite keys.
     */
    public static function bawbin_maps_handle_cleanup_category_schema() {
        global $wpdb;

        $table_spatial = $wpdb->prefix . 'bawbin_maps_general_spatial_data';
        
        // Query distinct composite keys (layer_type::category) directly from MySQL
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $active_composites = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT DISTINCT CONCAT(layer_type, '::', category) FROM %i WHERE category IS NOT NULL AND category != '' AND layer_type IS NOT NULL AND layer_type != ''",
                $table_spatial
            )
        );

        $active_composite_set = is_array( $active_composites ) ? array_flip( $active_composites ) : array();

        $settings = get_option( 'bawbin_maps_options_data', array() );
        $config   = isset( $settings['categoryConfig'] ) && is_array( $settings['categoryConfig'] ) ? $settings['categoryConfig'] : array();
        
        $current_map  = isset( $config['categoryMap'] ) && is_array( $config['categoryMap'] ) ? $config['categoryMap'] : array();
        $cleaned_map  = array();
        $pruned_count = 0;

        foreach ( $current_map as $cat_key => $cat_data ) {
            $composite_key = $cat_key;

            if ( false === strpos( $cat_key, '::' ) ) {
                $layer_type = is_array( $cat_data ) && isset( $cat_data['layer_type'] ) ? $cat_data['layer_type'] : '';
                if ( ! empty( $layer_type ) ) {
                    $composite_key = $layer_type . '::' . $cat_key;
                }
            }

            if ( isset( $active_composite_set[ $composite_key ] ) ) {
                if ( is_array( $cat_data ) && ! isset( $cat_data['layer_type'] ) && false !== strpos( $composite_key, '::' ) ) {
                    $parts = explode( '::', $composite_key );
                    $cat_data['layer_type'] = $parts[0];
                }
                $cleaned_map[ $composite_key ] = $cat_data;
            } else {
                $pruned_count++;
            }
        }

        // Clean up legend sections by removing references to pruned categories
        if ( isset( $config['legendConfig']['sections'] ) && is_array( $config['legendConfig']['sections'] ) ) {
            $cleaned_sections = array();

            foreach ( $config['legendConfig']['sections'] as $section ) {
                if ( ! isset( $section['items'] ) || ! is_array( $section['items'] ) ) {
                    $cleaned_sections[] = $section;
                    continue;
                }

                $valid_items = array();
                foreach ( $section['items'] as $item ) {
                    if ( ! isset( $item['categories'] ) || ! is_array( $item['categories'] ) ) {
                        continue;
                    }

                    $valid_cats = array_filter( $item['categories'], function( $ck ) use ( $cleaned_map ) {
                        return isset( $cleaned_map[ $ck ] );
                    } );

                    if ( ! empty( $valid_cats ) ) {
                        $item['categories'] = array_values( $valid_cats );
                        $valid_items[]      = $item;
                    }
                }

                $section['items']   = $valid_items;
                $cleaned_sections[] = $section;
            }

            $config['legendConfig']['sections'] = $cleaned_sections;
        }

        $config['categoryMap']      = $cleaned_map;
        $settings['categoryConfig'] = $config;
        update_option( 'bawbin_maps_options_data', $settings );

        wp_cache_delete( 'bawbin_maps_spatial_geojson_collection', 'bawbin_maps_spatial_cache' );

        return new WP_REST_Response( array(
            'success'      => true,
            'pruned_count' => $pruned_count,
            'categoryMap'  => (object) $cleaned_map,
            'legendConfig' => $config['legendConfig'] ?? array(),
            'message'      => sprintf( 'Cleanup complete. %d unused categories removed.', $pruned_count )
        ), 200 );
    }

    /**
     * Syncs newly imported spatial categories into categoryConfig option using composite keys with fuzzy auto-group matching.
     */
    public static function sync_imported_categories_to_config( $category_color_map = array() ) {
        if ( empty( $category_color_map ) ) return;

        $settings = get_option( 'bawbin_maps_options_data', array() );
        $config   = isset( $settings['categoryConfig'] ) && is_array( $settings['categoryConfig'] ) ? $settings['categoryConfig'] : array();

        $groups      = isset( $config['groups'] ) && is_array( $config['groups'] ) ? $config['groups'] : array();
        $categoryMap = isset( $config['categoryMap'] ) && is_array( $config['categoryMap'] ) ? $config['categoryMap'] : array();

        $has_changes = false;

        foreach ( $category_color_map as $raw_key => $hex_color ) {
            $layer_type = 'buildings';
            $clean_slug = sanitize_key( $raw_key );

            if ( false !== strpos( $raw_key, '::' ) ) {
                $parts      = explode( '::', $raw_key );
                $layer_type = sanitize_key( $parts[0] );
                $clean_slug = sanitize_key( $parts[1] );
            }

            if ( empty( $clean_slug ) || empty( $layer_type ) ) continue;

            $composite_key = $layer_type . '::' . $clean_slug;

            if ( ! isset( $categoryMap[ $composite_key ] ) ) {
                $formatted_label = ucwords( str_replace( '_', ' ', $clean_slug ) );
                $clean_color     = sanitize_hex_color( $hex_color );

                $target_group_id = '';
                $clean_readable  = strtolower( str_replace( array( '_', '-' ), ' ', $clean_slug ) );

                foreach ( $groups as $group ) {
                    $g_id    = strtolower( $group['id'] ?? '' );
                    $g_title = strtolower( $group['title'] ?? '' );

                    if ( ! empty( $g_title ) && ( strpos( $clean_readable, $g_title ) !== false || strpos( $g_title, $clean_readable ) !== false ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }

                    if ( preg_match( '/(apt|apartment|residential|flat|housing|unit)/i', $clean_readable ) && preg_match( '/(apt|apartment|residential|housing)/i', $g_title . ' ' . $g_id ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }
                    if ( preg_match( '/(cottage|house|villa|home)/i', $clean_readable ) && preg_match( '/(cottage|house|villa|home)/i', $g_title . ' ' . $g_id ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }
                    if ( preg_match( '/(amenity|care|center|club|pool|park|gym)/i', $clean_readable ) && preg_match( '/(amenit|care|center|facility)/i', $g_title . ' ' . $g_id ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }
                    if ( preg_match( '/(path|road|trail|patio|drive|support|infra|util)/i', $clean_readable ) && preg_match( '/(path|road|trail|support|infra|util)/i', $g_title . ' ' . $g_id ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }
                }

                $categoryMap[ $composite_key ] = array(
                    'label'      => $formatted_label,
                    'groupId'    => $target_group_id,
                    'layer_type' => $layer_type,
                    'color'      => ! empty( $clean_color ) ? $clean_color : '#007cba',
                );
                $has_changes = true;
            }
        }

        if ( $has_changes ) {
            $config['categoryMap']      = $categoryMap;
            $settings['categoryConfig'] = $config;
            update_option( 'bawbin_maps_options_data', $settings );
        }
    }
}
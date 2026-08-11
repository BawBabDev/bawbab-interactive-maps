<?php
/**
 * CATEGORY & SCHEMA MANAGEMENT REST ROUTES
 * File: includes/apis/class-bwb-imaps-rest-categories.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BWB_IMaps_REST_Categories {

    public static function register_routes( $namespace ) {
        register_rest_route( $namespace, '/cleanup-category-schema', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cleanup_category_schema' ),
            'permission_callback' => array( 'BWB_Federated_Imaps_API_Controller', 'check_admin_permissions' ),
        ) );
    }

    public static function handle_cleanup_category_schema() {
        global $wpdb;

        $table_spatial = $wpdb->prefix . 'bwb_general_spatial_data';
        
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $active_cats = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT DISTINCT category FROM %i WHERE category IS NOT NULL AND category != ''",
                $table_spatial
            )
        );
        $active_set  = is_array( $active_cats ) ? array_flip( $active_cats ) : array();

        $settings = get_option( 'bwb_imaps_options_data', array() );
        $config   = isset( $settings['categoryConfig'] ) && is_array( $settings['categoryConfig'] ) ? $settings['categoryConfig'] : array();
        
        $current_map  = isset( $config['categoryMap'] ) && is_array( $config['categoryMap'] ) ? $config['categoryMap'] : array();
        $cleaned_map  = array();
        $pruned_count = 0;

        foreach ( $current_map as $cat_slug => $cat_data ) {
            if ( isset( $active_set[$cat_slug] ) ) {
                $cleaned_map[$cat_slug] = $cat_data;
            } else {
                $pruned_count++;
            }
        }

        $config['categoryMap']      = $cleaned_map;
        $settings['categoryConfig'] = $config;
        update_option( 'bwb_imaps_options_data', $settings );

        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array(
            'success'      => true,
            'pruned_count' => $pruned_count,
            'categoryMap'  => (object) $cleaned_map,
            'message'      => sprintf( 'Cleanup complete. %d unused categories removed.', $pruned_count )
        ), 200 );
    }

    public static function sync_imported_categories_to_config( $category_color_map = array() ) {
        if ( empty( $category_color_map ) ) return;

        $settings = get_option( 'bwb_imaps_options_data', array() );
        $config   = isset( $settings['categoryConfig'] ) && is_array( $settings['categoryConfig'] ) ? $settings['categoryConfig'] : array();

        $groups      = isset( $config['groups'] ) && is_array( $config['groups'] ) ? $config['groups'] : array();
        $categoryMap = isset( $config['categoryMap'] ) && is_array( $config['categoryMap'] ) ? $config['categoryMap'] : array();

        $has_changes = false;

        foreach ( $category_color_map as $cat_slug => $hex_color ) {
            $clean_slug = sanitize_key( $cat_slug );
            if ( empty( $clean_slug ) ) continue;

            if ( ! isset( $categoryMap[$clean_slug] ) ) {
                $formatted_label = ucwords( str_replace( '_', ' ', $clean_slug ) );
                $clean_color     = sanitize_hex_color( $hex_color );

                $target_group_id = '';

                foreach ( $groups as $group ) {
                    $g_id    = strtolower( $group['id'] ?? '' );
                    $g_title = strtolower( $group['title'] ?? '' );

                    if ( ! empty( $g_title ) && ( strpos( $clean_slug, $g_title ) !== false || strpos( $g_title, $clean_slug ) !== false ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }

                    if ( preg_match( '/(apt|apartment|residential|building)/i', $clean_slug ) && preg_match( '/(apt|apartment|residential|building)/i', $g_title . ' ' . $g_id ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }
                    if ( preg_match( '/(cottage|house|villa)/i', $clean_slug ) && preg_match( '/(cottage|house|villa)/i', $g_title . ' ' . $g_id ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }
                    if ( preg_match( '/(util|utility|service|maintenance)/i', $clean_slug ) && preg_match( '/(util|utility|service|maintenance)/i', $g_title . ' ' . $g_id ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }
                    if ( preg_match( '/(path|road|trail|patio|garage|carport|drive|support|infrastructure)/i', $clean_slug ) && preg_match( '/(path|road|trail|patio|garage|carport|drive|support|infrastructure)/i', $g_title . ' ' . $g_id ) ) {
                        $target_group_id = $group['id'];
                        break;
                    }
                }

                $categoryMap[$clean_slug] = array(
                    'label'   => $formatted_label,
                    'groupId' => $target_group_id,
                    'color'   => ! empty( $clean_color ) ? $clean_color : '#007cba',
                );
                $has_changes = true;
            } elseif ( empty( $categoryMap[$clean_slug]['color'] ) && ! empty( $hex_color ) ) {
                $clean_color = sanitize_hex_color( $hex_color );
                if ( ! empty( $clean_color ) ) {
                    $categoryMap[$clean_slug]['color'] = $clean_color;
                    $has_changes = true;
                }
            }
        }

        if ( $has_changes ) {
            $config['categoryMap']      = $categoryMap;
            $settings['categoryConfig'] = $config;
            update_option( 'bwb_imaps_options_data', $settings );
        }
    }
}
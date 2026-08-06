<?php
/**
 * Admin Panel Javascript and Core Component Enqueue Routing Engine
 * File location: /includes/bwb-imaps-hook-admin-assets.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Enqueues compiled React dashboard scripts and stylesheets conditionally based on the active admin screen hook identifier string
 */
function bwb_imaps_enqueue_admin_assets( $hook ) {
    $allowed_pages = [
        'toplevel_page_bawbab-interactive-maps-settings',
        'bawbab-interactive-maps_page_bawbab-interactive-maps-edit-spatial-data'
    ];

    if ( ! in_array( $hook, $allowed_pages ) ) {
        return;
    }

    wp_enqueue_media();

    wp_enqueue_style( 'wp-components' );

    // Move up two levels out of /core/ and /includes/ into the root plugin directory by passing '2' to dirname()
    $plugin_root_path = dirname( plugin_dir_path( __FILE__ ), 2 ) . '/';
    $plugin_root_url  = dirname( plugins_url( '', __FILE__ ), 2 ) . '/';

    $asset_path = $plugin_root_path . 'build/bawbab-interactive-maps-admin/index.asset.php';
    
    if ( file_exists( $asset_path ) ) {
        $assets = include $asset_path;

        wp_enqueue_script(
            'bawbab-admin-script', 
            $plugin_root_url . 'build/bawbab-interactive-maps-admin/index.js',
            $assets['dependencies'], 
            $assets['version'],
            true 
        );

        if ( file_exists( $plugin_root_path . 'build/bawbab-interactive-maps-admin/index.css' ) ) {
            wp_enqueue_style(
                'bawbab-admin-styles',
                $plugin_root_url . 'build/bawbab-interactive-maps-admin/index.css',
                array(),
                $assets['version']
            );
        }

        if ( file_exists( $plugin_root_path . 'build/bawbab-interactive-maps-block/style-index.css' ) ) {
            wp_enqueue_style(
                'bawbab-block-styles',
                $plugin_root_url . 'build/bawbab-interactive-maps-block/style-index.css',
                array(),
                $assets['version']
            );
        }
    }
}
add_action( 'admin_enqueue_scripts', 'bwb_imaps_enqueue_admin_assets' );

<?php
/**
 * Admin Sidebar Navigation Menus and Routing Controllers
 * File location: /includes/bwb-imaps-admin-menu.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Registers the primary top-level menu page and sub-tab routes in the WP Admin sidebar
 */
function bwb_imaps_add_admin_menu() {
    add_menu_page(
        'Bawbab Interactive Maps',
        'Bawbab Interactive Maps',
        'manage_options',
        'bawbab-interactive-maps-settings',
        'bwb_imaps_render_admin_page',
        'dashicons-location-alt',
        25
    );

    // Explicitly registers the first submenu row to override the default text link name matching the parent
    add_submenu_page(
        'bawbab-interactive-maps-settings', 
        'Bawbab Interactive Maps` Settings',  
        '<span class="dashicons dashicons-admin-settings"></span> Maps Settings',               
        'manage_options',
        'bawbab-interactive-maps-settings', 
        'bwb_imaps_render_admin_page'
    );

    // Registers the secondary layout view option tab for structural spatial data edits
    add_submenu_page(
        'bawbab-interactive-maps-settings',
        'Edition Tool',
        '<span class="dashicons dashicons-edit"></span> Edit Spatial Data',
        'manage_options',
        'bawbab-interactive-maps-edit-spatial-data',
        'bwb_imaps_render_admin_page'
    );
}
add_action( 'admin_menu', 'bwb_imaps_add_admin_menu' );
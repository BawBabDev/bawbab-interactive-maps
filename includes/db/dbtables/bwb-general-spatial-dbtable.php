<?php
/**
 * Database tables Setup Handler
 * File: includes/class-bwb-general-spatial-dbtable.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * Create or verify the database table for general spatial map data.
 */
function bwb_create_general_spatial_dbtable() {
    global $wpdb;

    $table_spatial   = $wpdb->prefix . 'bwb_general_spatial_data';
    $charset_collate = $wpdb->get_charset_collate();

    $sql_spatial = "CREATE TABLE $table_spatial (
        fid varchar(255) NOT NULL,
        layer_type varchar(50) NOT NULL,
        name varchar(255) DEFAULT '',
        category varchar(50) DEFAULT '',
        code varchar(50) DEFAULT '',
        fill_color varchar(20) DEFAULT '',
        lat decimal(10, 8) DEFAULT NULL,
        lng decimal(10, 8) DEFAULT NULL,
        floor int(11) DEFAULT 0,
        is_interactive tinyint(1) DEFAULT 1,
        show_label tinyint(1) DEFAULT 1,
        title varchar(255) DEFAULT '',
        description text DEFAULT NULL,
        wp_page_id int(11) DEFAULT NULL,
        append_description tinyint(1) DEFAULT 0,
        custom_video_url text DEFAULT NULL,
        custom_floorplan_url text DEFAULT NULL,
        hide_page_video tinyint(1) DEFAULT 0,
        hide_page_floorplan tinyint(1) DEFAULT 0,
        gallery longtext DEFAULT NULL,
        custom_attributes longtext DEFAULT NULL,
        geom longtext NOT NULL,
        PRIMARY KEY  (fid, layer_type)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql_spatial );

    update_option( 'bwb_maps_version_db_version', '1.1.0' );
}
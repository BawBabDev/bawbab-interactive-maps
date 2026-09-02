<?php
/**
 * Database tables Setup Handler
 * File: includes/db/dbtables/bawbin-maps-general-spatial-dbtable.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * Create or verify the database table for general spatial map data.
 */
function bawbin_maps_create_general_spatial_dbtable() {
    global $wpdb;

    $table_spatial   = $wpdb->prefix . 'bawbin_maps_general_spatial_data';
    $charset_collate = $wpdb->get_charset_collate();

    // Strict dbDelta Rules Applied:
    // 1. fid (with prefix build-, path-, etc.) is the single PRIMARY KEY (191 length cap for strict MySQL/MariaDB hosts).
    // 2. 2 spaces between PRIMARY KEY and the opening parenthesis.
    // 3. geom set to longtext DEFAULT NULL to comply with MySQL Strict Mode.
    // 4. layer_type indexed separately for fast filtered spatial queries.
    $sql_spatial = "CREATE TABLE $table_spatial (
        fid varchar(255) NOT NULL,
        layer_type varchar(50) NOT NULL,
        name varchar(255) DEFAULT '',
        category varchar(50) DEFAULT '',
        code varchar(50) DEFAULT '',
        fill_color varchar(20) DEFAULT '',
        use_custom_color tinyint(1) DEFAULT 0,
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
        geom longtext DEFAULT NULL,
        PRIMARY KEY  (fid(191)),
        KEY layer_type_idx (layer_type)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql_spatial );

    update_option( 'bawbin_maps_maps_version_db_version', '1.1.1' );
}
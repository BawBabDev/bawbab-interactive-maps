<?php
/**
 * Database tables Setup Handler
 * File: includes/class-bwb-general-spatial-dbtable.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}


/**
 * Create the database table for general spatial map data when the plugin is activated.
 * This table will be separated in the future to allow for multiple layers of spatial data to be stored separately. 
 */
function bwb_create_general_spatial_dbtable() {
    /**
     * SQL Rules for dbDelta():
     * - You must put each field on its own line in your SQL statement [1].
     * - You must have two spaces after the words PRIMARY KEY [1].
     * - You must use the keyword KEY instead of INDEX (if adding indexes) [1].
     * - Field names must be wrapped in backticks (`) or left plain [1].
     * - SQL keywords (like CREATE TABLE, INT, NOT NULL) should be UPPERCASE [1].
     */
    global $wpdb;

    // Define easy timer table(prefixed with the WP database prefix)
    $table_spatial = $wpdb->prefix . 'bwb_general_spatial_data';
    
    // Get the correct character collate for the database
    $charset_collate = $wpdb->get_charset_collate();

    $sql_spatial = "CREATE TABLE $table_spatial (
        fid varchar(255) NOT NULL,
        layer_type varchar(50) NOT NULL,
        name varchar(255) DEFAULT '',
        category varchar(50) DEFAULT '',
        wp_page_id int(11) DEFAULT NULL,
        code varchar(50) DEFAULT '',
        fill_color varchar(20) DEFAULT '',
        lat decimal(10, 8) DEFAULT NULL,
        lng decimal(10, 8) DEFAULT NULL,
        sq_ft varchar(32) DEFAULT NULL,
        baths float DEFAULT NULL,
        floor int(11) DEFAULT 0,
        fireplace tinyint(1) DEFAULT 0,
        sunroom tinyint(1) DEFAULT 0,
        title varchar(255) DEFAULT '',
        description text DEFAULT NULL,
        append_description tinyint(1) DEFAULT 0,
        custom_video_url text DEFAULT NULL,
        custom_floorplan_url text DEFAULT NULL,
        hide_page_video tinyint(1) DEFAULT 0,
        hide_page_floorplan tinyint(1) DEFAULT 0,
        gallery longtext DEFAULT NULL,
        geom longtext NOT NULL,
        PRIMARY KEY  (fid, layer_type)
    ) $charset_collate;";
    

    // Include the upgrade file library required to use dbDelta() [1]
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    
    // Execute the table creation/update structure safely [1]
    dbDelta( $sql_spatial );

    // Store a database version number in the options table for future migrations
    add_option( 'bwb_maps_version_db_version', '1.0.0' );
}

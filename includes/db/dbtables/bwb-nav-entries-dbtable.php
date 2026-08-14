<?php
/**
 * Database tables Setup Handler
 * File: includes/class-bwb-nav-entries-dbtable.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * Create the database table for nav entries tables plugin is activated.
 */
function bwb_create_nav_entries_dbtable() {
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
    $table_entries = $wpdb->prefix . 'bwb_nav_entries_data';
    
    // Get the correct character collate for the database
    $charset_collate = $wpdb->get_charset_collate();

    $sql_entries = "CREATE TABLE $table_entries (
        fid varchar(255) NOT NULL,
        type varchar(50) DEFAULT '',
        floor int(11) DEFAULT 0,
        name varchar(255) DEFAULT '',
        geom longtext NOT NULL,
        PRIMARY KEY  (fid)
    ) $charset_collate;";
    
    // Include the upgrade file library required to use dbDelta() [1]
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    
    // Execute the table creation/update structure safely [1]
    dbDelta( $sql_entries );

    // Store a database version number in the options table for future migrations
    add_option('bwb_maps_version_db_version', '1.0.0' );
}

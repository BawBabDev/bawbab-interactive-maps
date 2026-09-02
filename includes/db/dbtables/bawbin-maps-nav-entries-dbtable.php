<?php
/**
 * Database tables Setup Handler
 * File: includes/db/dbtables/bawbin-maps-nav-entries-dbtable.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * Create the database table for nav entries when plugin is activated.
 */
function bawbin_maps_create_nav_entries_dbtable() {
    global $wpdb;

    $table_entries   = $wpdb->prefix . 'bawbin_maps_nav_entries_data';
    $charset_collate = $wpdb->get_charset_collate();

    $sql_entries = "CREATE TABLE $table_entries (
        fid varchar(255) NOT NULL,
        type varchar(50) DEFAULT '',
        floor int(11) DEFAULT 0,
        name varchar(255) DEFAULT '',
        geom longtext DEFAULT NULL,
        PRIMARY KEY  (fid(191))
    ) $charset_collate;";
    
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql_entries );

    add_option( 'bawbin_maps_maps_version_db_version', '1.1.1' );
}
<?php
/**
 * Database tables Setup Handler
 * File: includes/db/dbtables/bawbin-maps-nav-network-dbtable.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * Create the database table for nav network when plugin is activated.
 */
function bawbin_maps_create_nav_network_dbtable() {
    global $wpdb;

    $table_network   = $wpdb->prefix . 'bawbin_maps_nav_network_data';
    $charset_collate = $wpdb->get_charset_collate();

    $sql_network = "CREATE TABLE $table_network (
        fid varchar(255) NOT NULL,
        name varchar(255) DEFAULT '',
        type varchar(50) DEFAULT '',
        floor int(11) DEFAULT 0,
        length_m decimal(10, 2) DEFAULT 0.00,
        geom longtext DEFAULT NULL,
        PRIMARY KEY  (fid(191))
    ) $charset_collate;";
    
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql_network );

    add_option( 'bawbin_maps_maps_version_db_version', '1.1.1' );
}
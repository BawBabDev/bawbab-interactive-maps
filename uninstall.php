<?php
/**
 * Fired when the plugin is uninstalled.
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

global $wpdb;

// Delete the Custom Database Tables
$bawbin_maps_tables_to_delete = array(
    $wpdb->prefix . 'bawbin_maps_nav_network_data',
    $wpdb->prefix . 'bawbin_maps_nav_entries_data',
    $wpdb->prefix . 'bawbin_maps_general_spatial_data',
);

// Drop custom tables from database
foreach ( $bawbin_maps_tables_to_delete as $bawbin_maps_table_name ) {
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange -- Destructive schema drops on custom tables are exempt from object cache rules during uninstall.
    $wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $bawbin_maps_table_name ) );
}

// Delete any registered settings group if necessary
delete_option( 'bawbin_maps_settings_group' );

// Clear any cached data (Optional but recommended)
wp_cache_flush();
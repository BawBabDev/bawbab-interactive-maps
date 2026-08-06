<?php
/**
 * Fired when the plugin is uninstalled.
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

global $wpdb;

//Delete the Custom Database Table
$tables_to_delete = array(
    $wpdb->prefix . 'bwb_nav_network_data',
    $wpdb->prefix . 'bwb_nav_entries_data',
    $wpdb->prefix . 'bwb_general_spatial_data'
);

// Delete the Settings/Options from wp_options
foreach ( $tables_to_delete as $table_name ) {
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange -- Destructive schema drops on custom tables are exempt from object cache rules during uninstall.
    $wpdb->query( $wpdb->prepare("DROP TABLE IF EXISTS %i", esc_sql($table_name )) );
}

// delete any registered settings group if necessary
delete_option( 'bwb_imaps_settings_group' );

//Clear any cached data (Optional but recommended)
wp_cache_flush();

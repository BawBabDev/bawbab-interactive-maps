<?php
/**
 * Database Schema Versioning & Smart Auto-Migration Engine Coordinator
 * File location: /includes/class-bawbin-maps-smart-db-migration-engine.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class BAWBIN_Maps_Smart_DB_Migrator {

    /**
     * Target schema version string. 
     * Bump this value whenever you add new columns or modify constraints inside our modular table files.
     */
    private static $schema_version = '0.6.0';

    /**
     * Initialize the migration engine by listening to plugins_loaded
     */
    public static function init() {
        add_action( 'plugins_loaded', array( __CLASS__, 'bawbin_maps_smart_schema_upgrade' ) );
    }

    /**
     * Examines current version records and triggers upgrades sequentially without erasing table structures
     */
    public static function bawbin_maps_smart_schema_upgrade() {
        // Safe lock: Only allow authorized operations inside the WordPress administration area
        if ( ! is_admin() ) {
            return;
        }

        $stored_version = get_option( 'bawbin_maps_version_db_version' );

        // If the schema version shifts, run the pre-defined activation layout sequence
        if ( $stored_version !== self::$schema_version ) {
            self::bawbin_maps_run_modular_activations();
            update_option( 'bawbin_maps_version_db_version', self::$schema_version );
        }
    }

    /**
     * Executes our modular tables routine systematically
     */
    private static function bawbin_maps_run_modular_activations() {
        // Trigger General Spatial Table Migration Engine
        if ( function_exists( 'bawbin_maps_create_general_spatial_dbtable' ) ) {
            bawbin_maps_create_general_spatial_dbtable();
        }

        // Trigger Navigation Entries Table Migration Engine
        if ( function_exists( 'bawbin_maps_create_nav_entries_dbtable' ) ) {
           bawbin_maps_create_nav_entries_dbtable();
        }

        // Trigger Navigation Network Table Migration Engine
        if ( function_exists( 'bawbin_maps_create_nav_network_dbtable' ) ) {
            bawbin_maps_create_nav_network_dbtable();
        }
    }
}


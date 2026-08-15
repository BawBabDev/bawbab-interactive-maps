<?php
/**
 * Database Schema Versioning & Smart Auto-Migration Engine Coordinator
 * File location: /includes/class-smart-db-migration-engine.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class BWB_Smart_DB_Migrator {

    /**
     * Target schema version string. 
     * Bump this value whenever you add new columns or modify constraints inside our modular table files.
     */
    private static $schema_version = '0.7.0';

    /**
     * Initialize the migration engine by listening to plugins_loaded
     */
    public static function init() {
        add_action( 'plugins_loaded', array( __CLASS__, 'smart_schema_upgrade' ) );
    }

    /**
     * Examines current version records and triggers upgrades sequentially without erasing table structures
     */
    public static function smart_schema_upgrade() {
        // Safe lock: Only allow authorized operations inside the WordPress administration area
        if ( ! is_admin() ) {
            return;
        }

        $stored_version = get_option( 'bwb_maps_version_db_version', '0.0.0' );

        // If stored version is older than target schema version, execute upgrades
        if ( version_compare( $stored_version, self::$schema_version, '<' ) ) {
            self::run_modular_activations();
            self::migrate_legacy_columns_to_json();
            self::migrate_legacy_types_to_dual_counter();
            
            update_option( 'bwb_maps_version_db_version', self::$schema_version );
        }
    }

    /**
     * Executes our modular tables routine systematically
     */
    private static function run_modular_activations() {
        // Trigger General Spatial Table Migration Engine
        if ( function_exists( 'bwb_create_general_spatial_dbtable' ) ) {
            bwb_create_general_spatial_dbtable();
        }

        // Trigger Navigation Entries Table Migration Engine
        if ( function_exists( 'bwb_create_nav_entries_dbtable' ) ) {
            bwb_create_nav_entries_dbtable();
        }

        // Trigger Navigation Network Table Migration Engine
        if ( function_exists( 'bwb_create_nav_network_dbtable' ) ) {
            bwb_create_nav_network_dbtable();
        }
    }

    /**
     * Converts legacy table columns (sq_ft, baths, fireplace, sunroom) into
     * custom_attributes JSON keys and registers them in attribute_schema options.
     */
    private static function migrate_legacy_columns_to_json() {
        global $wpdb;

        $table_spatial = $wpdb->prefix . 'bwb_general_spatial_data';

        // 1. Inspect physically existing columns in MySQL
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $existing_columns = $wpdb->get_col( "DESCRIBE {$table_spatial}", 0 );
        if ( empty( $existing_columns ) ) {
            return;
        }

        $legacy_fields   = array( 'sq_ft', 'baths', 'fireplace', 'sunroom' );
        $keys_to_migrate = array_intersect( $legacy_fields, $existing_columns );

        // 2. Safely merge existing column values into custom_attributes JSON
        if ( ! empty( $keys_to_migrate ) ) {
            foreach ( $keys_to_migrate as $key ) {
                // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.DirectQuery
                $wpdb->query(
                    $wpdb->prepare(
                        "UPDATE %i 
                         SET custom_attributes = JSON_SET(
                             COALESCE(
                                 CASE 
                                     WHEN custom_attributes IS NULL OR custom_attributes = '' OR custom_attributes = '{}' 
                                     THEN '{}' 
                                     ELSE custom_attributes 
                                 END, 
                                 '{}'
                             ),
                             %s, %i
                         )
                         WHERE %i IS NOT NULL AND %i != ''",
                        $table_spatial,
                        '$.' . $key,
                        $key,
                        $key,
                        $key
                    )
                );
            }
        }

        // 3. Register legacy keys into option array attribute_schema
        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) 
            ? $settings['attribute_schema'] 
            : array();

        $existing_schema_keys = array_column( $schema, 'key' );

        $default_labels = array(
            'sq_ft'     => 'Square Feet',
            'baths'     => 'Bathrooms',
            'fireplace' => 'Fireplace',
            'sunroom'   => 'Sunroom',
        );

        $default_types = array(
            'sq_ft'     => 'number',
            'baths'     => 'dual_counter',
            'fireplace' => 'boolean',
            'sunroom'   => 'boolean',
        );

        $default_icons = array(
            'sq_ft'     => 'area',
            'baths'     => 'shower,sink',
            'fireplace' => 'fireplace',
            'sunroom'   => 'sun',
        );

        $has_schema_changes = false;

        foreach ( $legacy_fields as $field_key ) {
            if ( ! in_array( $field_key, $existing_schema_keys, true ) ) {
                $schema[] = array(
                    'key'   => $field_key,
                    'label' => $default_labels[ $field_key ] ?? ucwords( str_replace( '_', ' ', $field_key ) ),
                    'type'  => $default_types[ $field_key ] ?? 'text',
                    'icon'  => $default_icons[ $field_key ] ?? '',
                );
                $has_schema_changes = true;
            }
        }

        if ( $has_schema_changes ) {
            $settings['attribute_schema'] = $schema;
            update_option( 'bwb_imaps_options_data', $settings );
        }

        // 4. Purge cached GeoJSON collections to reflect changes immediately
        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );
    }

    /**
     * Converts any schema items registered under legacy 'bathrooms' type
     * to the generic 'dual_counter' type and updates icon pairs if needed.
     */
    private static function migrate_legacy_types_to_dual_counter() {
        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) 
            ? $settings['attribute_schema'] 
            : array();

        if ( empty( $schema ) ) {
            return;
        }

        $has_changes = false;

        foreach ( $schema as &$item ) {
            // Convert 'bathrooms' type to 'dual_counter'
            if ( isset( $item['type'] ) && 'bathrooms' === $item['type'] ) {
                $item['type'] = 'dual_counter';
                $has_changes  = true;
            }

            // Ensure dual counter items have dual icon pairs (e.g. 'shower,sink')
            if ( isset( $item['type'] ) && 'dual_counter' === $item['type'] ) {
                if ( empty( $item['icon'] ) || false === strpos( $item['icon'], ',' ) ) {
                    $item['icon'] = ! empty( $item['icon'] ) ? $item['icon'] . ',sink' : 'shower,sink';
                    $has_changes  = true;
                }
            }
        }

        if ( $has_changes ) {
            $settings['attribute_schema'] = $schema;
            update_option( 'bwb_imaps_options_data', $settings );
            wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );
        }
    }
}
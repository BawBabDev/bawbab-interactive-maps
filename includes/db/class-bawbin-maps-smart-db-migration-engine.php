<?php
/**
 * Database Schema Versioning & Smart Auto-Migration Engine Coordinator
 * File location: /includes/db/class-bawbin-maps-smart-db-migration-engine.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class BAWBIN_Maps_Smart_DB_Migrator {

    /**
     * Target schema version string.
     */
    private static $schema_version = '0.7.0';

    /**
     * Initialize the migration engine by listening to plugins_loaded
     */
    public static function init() {
        add_action( 'plugins_loaded', array( __CLASS__, 'bawbin_maps_smart_schema_upgrade' ) );
    }

    /**
     * Examines current version records and triggers upgrades sequentially
     */
    public static function bawbin_maps_smart_schema_upgrade() {
        if ( ! is_admin() ) {
            return;
        }

        // Check for legacy db version flags if new version flag isn't set yet
        $stored_version = get_option( 'bawbin_maps_maps_version_db_version', null );

        if ( false === $stored_version || null === $stored_version ) {
            $stored_version = get_option(
                'foulkeways_map_db_version',
                get_option(
                    'bwb_maps_version_db_version',
                    get_option( 'bawb_maps_version_db_version', '0.0.0' )
                )
            );
        }

        // Trigger migration if stored version is older than current schema target
        if ( version_compare( $stored_version, self::$schema_version, '<' ) ) {
            self::bawbin_maps_migrate_legacy_prefixes();
            self::bawbin_maps_run_modular_activations();
            self::bawbin_maps_migrate_legacy_columns_to_json();
            self::bawbin_maps_migrate_legacy_types_to_dual_counter();
            
            update_option( 'bawbin_maps_maps_version_db_version', self::$schema_version );
        }
    }

    /**
     * Safely renames legacy DB tables (including Foulkeways tables) and transfers options
     */
    private static function bawbin_maps_migrate_legacy_prefixes() {
        global $wpdb;

        // Map specific legacy table names to current table names
        $table_mappings = array(
            'general_spatial_data' => array(
                $wpdb->prefix . 'foulkeways_spatial_data',
                $wpdb->prefix . 'bwb_maps_general_spatial_data',
                $wpdb->prefix . 'bawb_maps_general_spatial_data',
                $wpdb->prefix . 'bwb_general_spatial_data',
            ),
            'nav_entries'          => array(
                $wpdb->prefix . 'foulkeways_nav_entries',
                $wpdb->prefix . 'bwb_maps_nav_entries',
                $wpdb->prefix . 'bawb_maps_nav_entries',
                $wpdb->prefix . 'bwb_nav_entries',
            ),
            'nav_network'          => array(
                $wpdb->prefix . 'foulkeways_nav_network',
                $wpdb->prefix . 'bwb_maps_nav_network',
                $wpdb->prefix . 'bawb_maps_nav_network',
                $wpdb->prefix . 'bwb_nav_network',
            ),
        );

        foreach ( $table_mappings as $table_suffix => $legacy_table_candidates ) {
            $new_table_name = $wpdb->prefix . 'bawbin_maps_' . $table_suffix;

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $new_table_exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $new_table_name ) );

            if ( $new_table_exists === $new_table_name ) {
                continue; // Target table already exists
            }

            // Search for existing legacy tables and rename the first match found
            foreach ( $legacy_table_candidates as $old_table_name ) {
                // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
                $old_table_exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $old_table_name ) );

                if ( $old_table_exists === $old_table_name ) {
                    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
                    $wpdb->query( "RENAME TABLE {$old_table_name} TO {$new_table_name}" );
                    break;
                }
            }
        }

        // 2. Transfer legacy option settings if new options don't exist yet
        if ( false === get_option( 'bawbin_maps_options_data', false ) ) {
            $legacy_options = array(
                'foulkeways_map_data',
                'bwb_maps_options_data',
                'bawb_maps_options_data',
                'bwb_options_data',
            );

            foreach ( $legacy_options as $legacy_opt ) {
                $old_data = get_option( $legacy_opt, false );
                if ( false !== $old_data ) {
                    update_option( 'bawbin_maps_options_data', $old_data );
                    break;
                }
            }
        }
    }

    /**
     * Executes modular table creation scripts
     */
    private static function bawbin_maps_run_modular_activations() {
        if ( function_exists( 'bawbin_maps_create_general_spatial_dbtable' ) ) {
            bawbin_maps_create_general_spatial_dbtable();
        }

        if ( function_exists( 'bawbin_maps_create_nav_entries_dbtable' ) ) {
            bawbin_maps_create_nav_entries_dbtable();
        }

        if ( function_exists( 'bawbin_maps_create_nav_network_dbtable' ) ) {
            bawbin_maps_create_nav_network_dbtable();
        }
    }

    /**
     * Converts legacy table columns (sq_ft, baths, fireplace, sunroom) into
     * custom_attributes JSON keys and registers them in attribute_schema options.
     */
    private static function bawbin_maps_migrate_legacy_columns_to_json() {
        global $wpdb;

        $table_spatial = $wpdb->prefix . 'bawbin_maps_general_spatial_data';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $existing_columns = $wpdb->get_col( "DESCRIBE {$table_spatial}", 0 );
        if ( empty( $existing_columns ) ) {
            return;
        }

        $legacy_fields   = array( 'sq_ft', 'baths', 'fireplace', 'sunroom' );
        $keys_to_migrate = array_intersect( $legacy_fields, $existing_columns );

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

        $settings = get_option( 'bawbin_maps_options_data', array() );
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
            update_option( 'bawbin_maps_options_data', $settings );
        }

        wp_cache_delete( 'bawbin_maps_spatial_geojson_collection', 'bawbin_maps_spatial_cache' );
    }

    /**
     * Converts legacy types to dual_counter
     */
    private static function bawbin_maps_migrate_legacy_types_to_dual_counter() {
        $settings = get_option( 'bawbin_maps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) 
            ? $settings['attribute_schema'] 
            : array();

        if ( empty( $schema ) ) {
            return;
        }

        $has_changes = false;

        foreach ( $schema as &$item ) {
            if ( isset( $item['type'] ) && 'bathrooms' === $item['type'] ) {
                $item['type'] = 'dual_counter';
                $has_changes  = true;
            }

            if ( isset( $item['type'] ) && 'dual_counter' === $item['type'] ) {
                if ( empty( $item['icon'] ) || false === strpos( $item['icon'], ',' ) ) {
                    $item['icon'] = ! empty( $item['icon'] ) ? $item['icon'] . ',sink' : 'shower,sink';
                    $has_changes  = true;
                }
            }
        }

        if ( $has_changes ) {
            $settings['attribute_schema'] = $schema;
            update_option( 'bawbin_maps_options_data', $settings );
            wp_cache_delete( 'bawbin_maps_spatial_geojson_collection', 'bawbin_maps_spatial_cache' );
        }
    }
}
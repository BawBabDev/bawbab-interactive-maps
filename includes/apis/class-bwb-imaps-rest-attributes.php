<?php
/**
 * DYNAMIC ATTRIBUTES SCHEMA REST ROUTES
 * File: includes/apis/class-bwb-imaps-rest-attributes.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BWB_IMaps_REST_Attributes {

    public static function register_routes( $namespace ) {
        register_rest_route( $namespace, '/get-attribute-schema', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_attribute_schema' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( $namespace, '/update-attribute-schema', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_update_attribute_schema' ),
            'permission_callback' => array( 'BWB_Federated_Imaps_API_Controller', 'check_admin_permissions' ),
        ) );

        register_rest_route( $namespace, '/reorder-attribute-schema', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_reorder_attribute_schema' ),
            'permission_callback' => array( 'BWB_Federated_Imaps_API_Controller', 'check_admin_permissions' ),
        ) );

        register_rest_route( $namespace, '/delete-attribute-key', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_delete_attribute_key' ),
            'permission_callback' => array( 'BWB_Federated_Imaps_API_Controller', 'check_admin_permissions' ),
        ) );
    }

    public static function handle_get_attribute_schema() {
        global $wpdb;
        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array();

        return new WP_REST_Response( array( 'success' => true, 'schema' => array_values( $schema ) ), 200 );
    }

    public static function handle_reorder_attribute_schema( $request ) {
        $raw_schema = $request->get_param( 'schema' );
        if ( ! is_array( $raw_schema ) ) {
            return new WP_Error( 'invalid_schema', 'Schema payload must be an array.', array( 'status' => 400 ) );
        }

        $sanitized_schema = array();
        foreach ( $raw_schema as $item ) {
            if ( ! is_array( $item ) || empty( $item['key'] ) ) {
                continue;
            }

            $raw_config = $item['config'] ?? null;
            $config     = null;

            if ( is_array( $raw_config ) ) {
                $config = array(
                    'layout'     => sanitize_text_field( $raw_config['layout'] ?? 'half' ),
                    'mode'       => sanitize_text_field( $raw_config['mode'] ?? 'split' ),
                    'mainUnit'   => sanitize_text_field( $raw_config['mainUnit'] ?? '' ),
                    'majorLabel' => sanitize_text_field( $raw_config['majorLabel'] ?? '' ),
                    'minorLabel' => sanitize_text_field( $raw_config['minorLabel'] ?? '' ),
                );
            }

            $sanitized_schema[] = array(
                'key'    => sanitize_key( $item['key'] ),
                'label'  => sanitize_text_field( $item['label'] ?? '' ),
                'type'   => sanitize_text_field( $item['type'] ?? 'text' ),
                'icon'   => sanitize_text_field( $item['icon'] ?? '' ),
                'config' => $config,
            );
        }

        $settings = get_option( 'bwb_imaps_options_data', array() );
        $settings['attribute_schema'] = $sanitized_schema;
        update_option( 'bwb_imaps_options_data', $settings );

        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array( 'success' => true, 'schema' => $sanitized_schema ), 200 );
    }

    public static function handle_update_attribute_schema( $request ) {
        $key   = sanitize_key( $request->get_param( 'key' ) );
        $label = sanitize_text_field( $request->get_param( 'label' ) );
        $type  = sanitize_text_field( $request->get_param( 'type' ) ?: 'text' );
        
        $has_icon_param   = $request->has_param( 'icon' );
        $icon             = $has_icon_param ? sanitize_text_field( $request->get_param( 'icon' ) ) : null;

        $has_config_param = $request->has_param( 'config' );
        $raw_config       = $has_config_param ? $request->get_param( 'config' ) : null;
        $config           = null;

        if ( is_array( $raw_config ) ) {
            $config = array(
                'layout'     => sanitize_text_field( $raw_config['layout'] ?? 'half' ),
                'mode'       => sanitize_text_field( $raw_config['mode'] ?? 'split' ),
                'mainUnit'   => sanitize_text_field( $raw_config['mainUnit'] ?? '' ),
                'majorLabel' => sanitize_text_field( $raw_config['majorLabel'] ?? '' ),
                'minorLabel' => sanitize_text_field( $raw_config['minorLabel'] ?? '' ),
            );
        }

        if ( empty( $key ) ) {
            return new WP_Error( 'missing_key', 'Attribute key is required.', array( 'status' => 400 ) );
        }

        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array();

        $updated = false;
        foreach ( $schema as &$item ) {
            if ( $item['key'] === $key ) {
                $item['label'] = ! empty( $label ) ? $label : $item['label'];
                $item['type']  = ! empty( $type ) ? $type : $item['type'];
                if ( $has_icon_param ) {
                    $item['icon'] = $icon;
                }
                if ( $has_config_param ) {
                    $item['config'] = $config;
                }
                $updated = true;
                break;
            }
        }

        if ( ! $updated ) {
            $schema[] = array(
                'key'    => $key,
                'label'  => ! empty( $label ) ? $label : ucwords( str_replace( '_', ' ', $key ) ),
                'type'   => $type,
                'icon'   => $has_icon_param ? $icon : '',
                'config' => $config,
            );
        }

        $settings['attribute_schema'] = array_values( $schema );
        update_option( 'bwb_imaps_options_data', $settings );

        return new WP_REST_Response( array( 'success' => true, 'schema' => $settings['attribute_schema'] ), 200 );
    }

    public static function handle_delete_attribute_key( $request ) {
        global $wpdb;

        $key = sanitize_key( $request->get_param( 'key' ) );
        if ( empty( $key ) ) {
            return new WP_Error( 'missing_key', 'Attribute key is required for deletion.', array( 'status' => 400 ) );
        }

        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array();

        $filtered_schema = array_values( array_filter( $schema, function( $item ) use ( $key ) {
            return $item['key'] !== $key;
        } ) );

        $settings['attribute_schema'] = $filtered_schema;
        update_option( 'bwb_imaps_options_data', $settings );

        $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
        $json_path  = '$.' . $key;

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $wpdb->query(
            $wpdb->prepare(
                "UPDATE %i SET custom_attributes = JSON_REMOVE(custom_attributes, %s) WHERE JSON_CONTAINS_PATH(custom_attributes, 'one', %s) = 1",
                $table_name,
                $json_path,
                $json_path
            )
        );

        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array( 
            'success' => true, 
            'key'     => $key, 
            'schema'  => $filtered_schema 
        ), 200 );
    }

    public static function sync_custom_keys_to_schema( $keys = array() ) {
        if ( empty( $keys ) ) return;

        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array();

        $existing_keys = array_column( $schema, 'key' );
        $has_changes   = false;

        foreach ( $keys as $k => $info ) {
            $clean_key = '';
            $type      = 'text';
            $config    = null;

            if ( is_array( $info ) ) {
                $clean_key = sanitize_key( $info['key'] ?? $k );
                $type      = sanitize_text_field( $info['type'] ?? 'text' );
                if ( isset( $info['config'] ) && is_array( $info['config'] ) ) {
                    $config = array(
                        'layout'     => sanitize_text_field( $info['config']['layout'] ?? 'half' ),
                        'mode'       => sanitize_text_field( $info['config']['mode'] ?? 'split' ),
                        'mainUnit'   => sanitize_text_field( $info['config']['mainUnit'] ?? '' ),
                        'majorLabel' => sanitize_text_field( $info['config']['majorLabel'] ?? '' ),
                        'minorLabel' => sanitize_text_field( $info['config']['minorLabel'] ?? '' ),
                    );
                }
            } elseif ( is_string( $k ) && ! is_numeric( $k ) ) {
                $clean_key = sanitize_key( $k );
                $type      = sanitize_text_field( $info );
            } else {
                $clean_key = sanitize_key( $info );
            }

            if ( ! empty( $clean_key ) && ! in_array( $clean_key, $existing_keys, true ) ) {
                $label = ucwords( str_replace( '_', ' ', $clean_key ) );
                $schema[] = array(
                    'key'    => $clean_key,
                    'label'  => $label,
                    'type'   => ! empty( $type ) ? $type : 'text',
                    'icon'   => '',
                    'config' => $config,
                );
                $existing_keys[] = $clean_key;
                $has_changes     = true;
            }
        }

        if ( $has_changes ) {
            $settings['attribute_schema'] = array_values( $schema );
            update_option( 'bwb_imaps_options_data', $settings );
        }
    }
}
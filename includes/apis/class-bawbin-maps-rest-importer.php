<?php
/**
 * GEOJSON FILE INSPECTION & DATA IMPORT REST ROUTES
 * File: includes/apis/class-bawbin-maps-rest-importer.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BAWBIN_Maps_REST_Importer {

    public static function bawbin_maps_register_routes( $namespace ) {
        register_rest_route( $namespace, '/inspect-geojson', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'bawbin_maps_handle_inspect_geojson' ),
            'permission_callback' => array( 'BAWBIN_Maps_Federated_API_Controller', 'bawbin_maps_check_admin_permissions' ),
        ) );

        register_rest_route( $namespace, '/spatial-data-importer', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'bawbin_maps_handle_spatial_geojson_import' ),
            'permission_callback' => array( 'BAWBIN_Maps_Federated_API_Controller', 'bawbin_maps_check_admin_permissions' ),
        ) );
    }

    public static function bawbin_maps_handle_inspect_geojson( $request ) {
        $files = $request->get_file_params();
        if ( empty( $files['geojson_file'] ) ) {
            return new WP_Error( 'no_file', 'No file found.', array( 'status' => 400 ) );
        }

        $content = file_get_contents( $files['geojson_file']['tmp_name'] );
        $data    = json_decode( $content, true );

        if ( ! isset( $data['features'] ) || ! is_array( $data['features'] ) ) {
            return new WP_Error( 'invalid_json', 'Invalid GeoJSON format.', array( 'status' => 400 ) );
        }

        $detected_properties  = array();
        $sample_feature_props = array();
        $all_property_values  = array();

        foreach ( $data['features'] as $feature ) {
            if ( ! empty( $feature['properties'] ) && is_array( $feature['properties'] ) ) {
                foreach ( $feature['properties'] as $key => $val ) {
                    if ( ! in_array( $key, $detected_properties, true ) ) {
                        $detected_properties[]      = $key;
                        $sample_feature_props[$key] = $val;
                    }
                    if ( null !== $val && '' !== $val ) {
                        $all_property_values[$key][] = $val;
                    }
                }
            }
        }

        // Infer type per key across all non-null values
        $inferred_types = array();
        foreach ( $detected_properties as $key ) {
            $vals = $all_property_values[$key] ?? array();
            $inferred_types[$key] = self::bawbin_maps_infer_property_data_type( $vals, $sample_feature_props[$key] ?? null );
        }

        return new WP_REST_Response( array(
            'success'             => true,
            'total_features'      => count( $data['features'] ),
            'detected_properties' => $detected_properties,
            'sample_properties'   => $sample_feature_props,
            'inferred_types'      => $inferred_types,
        ), 200 );
    }

    private static function bawbin_maps_infer_property_data_type( array $values, $sample_val ) {
        if ( empty( $values ) ) {
            return 'text';
        }

        $is_bool    = true;
        $is_numeric = true;
        $has_half_increment = false;

        foreach ( $values as $v ) {
            // Check boolean
            if ( ! is_bool($v) && ! in_array( strtolower( (string) $v ), array( 'true', 'false', '0', '1' ), true ) ) {
                $is_bool = false;
            }

            // Check numeric
            if ( ! is_numeric( $v ) ) {
                $is_numeric = false;
            } else {
                $num = (float) $v;
                if ( fmod( $num, 1.0 ) === 0.5 || fmod( $num, 1.0 ) === -0.5 ) {
                    $has_half_increment = true;
                }
            }
        }

        if ( $is_bool ) {
            return 'boolean';
        }

        if ( $is_numeric ) {
            if ( $has_half_increment ) {
                return 'dual_counter';
            }
            return 'number';
        }

        return 'text';
    }

    public static function bawbin_maps_handle_spatial_geojson_import( $request ) {
        global $wpdb;

        if ( function_exists( 'bawbin_maps_create_general_spatial_dbtable' ) ) {
            bawbin_maps_create_general_spatial_dbtable();
        }

        $files = $request->get_file_params();
        if ( empty( $files['geojson_file'] ) ) {
            return new WP_Error( 'no_file', 'No file found in request.', array( 'status' => 400 ) );
        }

        $layer_type = sanitize_text_field( $request->get_param( 'layer_type' ) );
        
        $mapping_param = $request->get_param( 'field_mapping' );
        $field_mapping = is_string( $mapping_param ) ? ( json_decode( stripslashes( $mapping_param ), true ) ?: array() ) : ( is_array( $mapping_param ) ? $mapping_param : array() );

        $custom_keys_param = $request->get_param( 'imported_custom_keys' );
        $imported_custom_keys = is_string( $custom_keys_param ) ? ( json_decode( stripslashes( $custom_keys_param ), true ) ?: array() ) : ( is_array( $custom_keys_param ) ? $custom_keys_param : array() );

        // Register custom keys along with their user-assigned or inferred data types in global schema
        BAWBIN_Maps_REST_Attributes::bawbin_maps_sync_custom_keys_to_schema( $imported_custom_keys );

        $raw_key_names = array();
        foreach ( $imported_custom_keys as $k => $v ) {
            if ( is_array( $v ) && isset( $v['key'] ) ) {
                $raw_key_names[] = $v['key'];
            } elseif ( is_string( $k ) && ! is_numeric( $k ) ) {
                $raw_key_names[] = $k;
            } else {
                $raw_key_names[] = $v;
            }
        }

        $data = json_decode( file_get_contents( $files['geojson_file']['tmp_name'] ), true );

        if ( ! isset( $data['features'] ) || ! is_array( $data['features'] ) ) {
            return new WP_Error( 'invalid_json', 'Invalid GeoJSON payload.', array( 'status' => 400 ) );
        }

        $imported_fids              = array();
        $processed_count            = 0;
        $discovered_category_colors = array();

        $reserved_cols = array(
            'fid', 'name', 'category', 'code', 'fill_color', 'lat', 'lng', 'floor',
            'is_interactive', 'show_label', 'title', 'description', 'wp_page_id',
            'custom_video_url', 'custom_floorplan_url', 'append_description',
            'hide_page_video', 'hide_page_floorplan', 'gallery', 'custom_attributes', 'geom'
        );

        switch ( $layer_type ) {

            case 'entries':
                $table_name = $wpdb->prefix . 'bawbin_maps_nav_entries_data';
                foreach ( $data['features'] as $feature ) {
                    $props   = $feature['properties'] ?? array();
                    $fid_key = ! empty( $field_mapping['fid'] ) ? $field_mapping['fid'] : 'fid';
                    $fid     = sanitize_text_field( $props[$fid_key] ?? $props['fid'] ?? $props['id'] ?? '' );
                    if ( empty( $fid ) ) continue;
                    $imported_fids[] = $fid;

                    $name_key = ! empty( $field_mapping['name'] ) ? $field_mapping['name'] : 'name';
                    $type_key = ! empty( $field_mapping['type'] ) ? $field_mapping['type'] : 'type';

                    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
                    if ( false !== $wpdb->query(
                        $wpdb->prepare(
                            "INSERT INTO %i (fid, type, floor, name, geom) VALUES (%s, %s, %d, %s, %s)
                            ON DUPLICATE KEY UPDATE type = VALUES(type), floor = VALUES(floor), name = VALUES(name), geom = VALUES(geom)",
                            $table_name,
                            $fid,
                            sanitize_text_field( $props[$type_key] ?? $props['type'] ?? '' ),
                            isset($props['floor']) ? (int)$props['floor'] : 0,
                            sanitize_text_field( $props[$name_key] ?? $props['name'] ?? '' ),
                            json_encode( $feature['geometry'] )
                        )
                    ) ) { $processed_count++; }
                }
                break;

            case 'network':
                $table_name = $wpdb->prefix . 'bawbin_maps_nav_network_data';
                foreach ( $data['features'] as $feature ) {
                    $props   = $feature['properties'] ?? array();
                    $fid_key = ! empty( $field_mapping['fid'] ) ? $field_mapping['fid'] : 'fid';
                    $fid     = sanitize_text_field( $props[$fid_key] ?? $props['fid'] ?? $props['id'] ?? '' );
                    if ( empty( $fid ) ) continue;
                    $imported_fids[] = $fid;

                    $name_key = ! empty( $field_mapping['name'] ) ? $field_mapping['name'] : 'name';
                    $type_key = ! empty( $field_mapping['type'] ) ? $field_mapping['type'] : 'type';

                    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
                    if ( false !== $wpdb->query(
                        $wpdb->prepare(
                            "INSERT INTO %i (fid, name, type, floor, length_m, geom) VALUES (%s, %s, %s, %d, %f, %s)
                            ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), floor = VALUES(floor), length_m = VALUES(length_m), geom = VALUES(geom)",
                            $table_name,
                            $fid,
                            sanitize_text_field( $props[$name_key] ?? $props['name'] ?? '' ),
                            sanitize_text_field( $props[$type_key] ?? $props['type'] ?? '' ),
                            isset($props['floor']) ? (int)$props['floor'] : 0,
                            isset($props['length_m']) ? (float)$props['length_m'] : 0.00,
                            json_encode( $feature['geometry'] )
                        )
                    ) ) { $processed_count++; }
                }
                break;

            default:
                $table_name = $wpdb->prefix . 'bawbin_maps_general_spatial_data';
                $mapped_source_keys = array_filter( array_values( $field_mapping ) );

                foreach ( $data['features'] as $feature ) {
                    $props = $feature['properties'] ?? array();
                    
                    $fid_key = ! empty( $field_mapping['fid'] ) ? $field_mapping['fid'] : 'fid';
                    $fid     = sanitize_text_field( $props[$fid_key] ?? $props['fid'] ?? $props['id'] ?? $props['OBJECTID'] ?? '' );
                    
                    if ( empty( $fid ) ) continue;
                    $imported_fids[] = $fid;

                    $get_mapped_val = function( $std_col ) use ( $field_mapping, $props ) {
                        if ( empty( $field_mapping[$std_col] ) ) return null;
                        $mapped_key = $field_mapping[$std_col];
                        return isset( $props[$mapped_key] ) && '' !== $props[$mapped_key] ? $props[$mapped_key] : null;
                    };

                    $v_name       = sanitize_text_field( $get_mapped_val('name') ?? '' );
                    $v_category   = sanitize_text_field( $get_mapped_val('category') ?? '' );
                    $v_code       = sanitize_text_field( $get_mapped_val('code') ?? '' );
                    $v_color      = sanitize_hex_color( $get_mapped_val('fill_color') ?? '' );
                    $v_title      = sanitize_text_field( $get_mapped_val('title') ?? '' );
                    $v_desc       = sanitize_textarea_field( $get_mapped_val('description') ?? '' );
                    $v_wp_page_id = ! empty( $get_mapped_val('wp_page_id') ) ? (int) $get_mapped_val('wp_page_id') : null;
                    $v_floor      = (int)( $get_mapped_val('floor') ?? 0 );

                    if ( ! empty( $v_category ) ) {
                        if ( ! isset( $discovered_category_colors[$v_category] ) || ! empty( $v_color ) ) {
                            $discovered_category_colors[$v_category] = $v_color;
                        }
                    }

                    list( $calc_lat, $calc_lng ) = self::bawbin_maps_compute_centroid_from_geom( $feature['geometry'] ?? array() );

                    $lat_mapped = $field_mapping['lat'] ?? null;
                    if ( '__AUTO_COMPUTE__' === $lat_mapped ) {
                        $v_lat = $calc_lat;
                    } elseif ( ! empty( $lat_mapped ) && isset( $props[$lat_mapped] ) ) {
                        $v_lat = (float) $props[$lat_mapped];
                    } else {
                        $v_lat = null;
                    }

                    $lng_mapped = $field_mapping['lng'] ?? null;
                    if ( '__AUTO_COMPUTE__' === $lng_mapped ) {
                        $v_lng = $calc_lng;
                    } elseif ( ! empty( $lng_mapped ) && isset( $props[$lng_mapped] ) ) {
                        $v_lng = (float) $props[$lng_mapped];
                    } else {
                        $v_lng = null;
                    }

                    $raw_interactive = $get_mapped_val('is_interactive');
                    $v_interactive   = ( null !== $raw_interactive ) ? (! empty( $raw_interactive ) ? 1 : 0) : ('buildings' === $layer_type ? 1 : 0);

                    $raw_label   = $get_mapped_val('show_label');
                    $v_show_label = ( null !== $raw_label ) ? (! empty( $raw_label ) ? 1 : 0) : (! empty( $v_name ) && 'paths' !== $layer_type ? 1 : 0);

                    $custom_attrs = array();

                    if ( ! empty( $raw_key_names ) ) {
                        foreach ( $raw_key_names as $custom_key ) {
                            if ( is_string( $custom_key ) && array_key_exists( $custom_key, $props ) ) {
                                $custom_attrs[$custom_key] = $props[$custom_key];
                            }
                        }
                    } else {
                        foreach ( $props as $prop_key => $prop_val ) {
                            if ( in_array( $prop_key, $mapped_source_keys, true ) || in_array( $prop_key, $reserved_cols, true ) ) {
                                continue;
                            }
                            $custom_attrs[$prop_key] = $prop_val;
                        }
                    }

                    $custom_json = json_encode( $custom_attrs, JSON_UNESCAPED_UNICODE );

                    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
                    if ( false !== $wpdb->query( 
                        $wpdb->prepare(
                            "INSERT INTO %i (fid, layer_type, name, category, fill_color, code, lat, lng, floor, is_interactive, show_label, title, description, wp_page_id, custom_attributes, geom)
                            VALUES (%s, %s, %s, %s, %s, %s, %f, %f, %d, %d, %d, %s, %s, %d, %s, %s) 
                            ON DUPLICATE KEY UPDATE
                            name = CASE WHEN VALUES(name) != '' THEN VALUES(name) ELSE name END, 
                            category = CASE WHEN VALUES(category) != '' THEN VALUES(category) ELSE category END, 
                            fill_color = CASE WHEN VALUES(fill_color) != '' THEN VALUES(fill_color) ELSE fill_color END, 
                            code = CASE WHEN VALUES(code) != '' THEN VALUES(code) ELSE code END,
                            lat = CASE WHEN VALUES(lat) IS NOT NULL THEN VALUES(lat) ELSE lat END, 
                            lng = CASE WHEN VALUES(lng) IS NOT NULL THEN VALUES(lng) ELSE lng END, 
                            floor = VALUES(floor), 
                            is_interactive = VALUES(is_interactive),
                            show_label = VALUES(show_label),
                            wp_page_id = CASE WHEN VALUES(wp_page_id) IS NOT NULL THEN VALUES(wp_page_id) ELSE wp_page_id END,
                            custom_attributes = VALUES(custom_attributes),
                            geom = VALUES(geom)", 
                            $table_name,
                            $fid, $layer_type, $v_name, $v_category, $v_color, $v_code,
                            $v_lat, $v_lng, $v_floor, $v_interactive, $v_show_label,
                            $v_title, $v_desc, $v_wp_page_id, $custom_json, json_encode( $feature['geometry'] )
                        )
                    ) ) { $processed_count++; }
                }
                break;
        }

        if ( ! empty( $discovered_category_colors ) ) {
            BAWBIN_Maps_REST_Categories::sync_imported_categories_to_config( $discovered_category_colors );
        }

        if ( ! empty( $imported_fids ) ) {
            $fids_placeholders = implode( ',', array_fill( 0, count( $imported_fids ), '%s' ) );

            if ( 'entries' === $layer_type || 'network' === $layer_type ) {
                $sql        = "DELETE FROM %i WHERE fid NOT IN ($fids_placeholders)";
                $query_args = array_merge( array( $table_name ), $imported_fids );

                // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
                $wpdb->query( $wpdb->prepare( $sql, $query_args ) );
            } else {
                $sql        = "DELETE FROM %i WHERE layer_type = %s AND fid NOT IN ($fids_placeholders)";
                $query_args = array_merge( array( $table_name, $layer_type ), $imported_fids );

                // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
                $wpdb->query( $wpdb->prepare( $sql, $query_args ) );
            }
        }

        wp_cache_delete( 'bawbin_maps_navigation_graph_data', 'bawbin_maps_spatial_cache' );
        wp_cache_delete( 'bawbin_maps_spatial_geojson_collection', 'bawbin_maps_spatial_cache' );

        return new WP_REST_Response( array( 
            'success'  => true, 
            'total'    => count( $data['features'] ), 
            'imported' => $processed_count 
        ), 200 );
    }

    private static function bawbin_maps_compute_centroid_from_geom( $geometry ) {
        if ( empty( $geometry['coordinates'] ) ) return array( null, null );
        
        $coords = $geometry['coordinates'];
        $lats   = array();
        $lngs   = array();

        $extract = function( $item ) use ( &$lats, &$lngs, &$extract ) {
            if ( is_array( $item ) && count( $item ) >= 2 && is_numeric( $item[0] ) && is_numeric( $item[1] ) ) {
                $lngs[] = (float) $item[0];
                $lats[] = (float) $item[1];
            } elseif ( is_array( $item ) ) {
                foreach ( $item as $sub ) $extract( $sub );
            }
        };

        $extract( $coords );

        if ( empty( $lats ) || empty( $lngs ) ) return array( null, null );

        $avg_lat = array_sum( $lats ) / count( $lats );
        $avg_lng = array_sum( $lngs ) / count( $lngs );

        return array( $avg_lat, $avg_lng );
    }
}
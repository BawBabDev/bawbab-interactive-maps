<?php
/**
 * FEDERATED BIM REST API ENDPOINTS CONTROLLER
 * File: includes/class-federated-bwb-imaps-api.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class BWB_Federated_Imaps_API_Controller {

    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_bwb_imaps_routes' ) );
    }

    public function register_bwb_imaps_routes() {
        $namespace = 'bwb-imaps-federated-api/v1';

        register_rest_field('page', 'acf', array(
            'get_callback' => function( $object ) {
                if ( function_exists('get_fields') ) {
                    $fields = get_fields( $object['id'] );
                    return ! empty( $fields ) ? $fields : array();
                }
                return array();
            },
            'update_callback' => null,
            'schema'          => null,
        ));

        register_rest_route( $namespace, '/map-proxy', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'bwb_imaps_proxy_graphql' ),
            'permission_callback' => '__return_true'
        ) );

        register_rest_route( $namespace, '/get-spatial-data', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'handle_get_spatial_data' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( $namespace, '/map-locations', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'bwb_imaps_get_public_map_data' ),
            'permission_callback' => '__return_true', 
        ) );

        register_rest_route( $namespace, '/get-navigation-graph', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'handle_get_navigation_graph' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( $namespace, '/inspect-geojson', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'handle_inspect_geojson' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );

        register_rest_route( $namespace, '/spatial-data-importer', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'handle_spatial_geojson_import' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );

        register_rest_route( $namespace, '/update-spatial-meta', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'handle_update_spatial_meta' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );

        register_rest_route( $namespace, '/delete-layer/(?P<layer_type>[a-zA-Z0-9_\-]+)', array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'handle_delete_layer' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );

        register_rest_route( $namespace, '/get-attribute-schema', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'handle_get_attribute_schema' ),
            'permission_callback' => '__return_true'
        ) );

        register_rest_route( $namespace, '/update-attribute-schema', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'handle_update_attribute_schema' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );

        register_rest_route( $namespace, '/delete-attribute-key', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'handle_delete_attribute_key' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );

        register_rest_route( $namespace, '/cleanup-category-schema', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'handle_cleanup_category_schema' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );
    }

    public function check_admin_permissions() {
        return current_user_can( 'manage_options' );
    }

    public function bwb_imaps_proxy_graphql($request) {
        $body = $request->get_body();
        $response = wp_remote_post('https://34.149.108.92.nip.io/internal-frontend-api/api/graphql', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-api-key' => 'cFIhX1YUjiFHHIQxSSOnJ7g1W0h7UO4heMo2sasgUodkHwkN'
            ),
            'body' => $body,
            'timeout' => 15
        ));

        if ( is_wp_error($response)) {
            return new WP_Error('api_error', 'Failed to fetch', array('status' => 500));
        }

        return new WP_REST_Response(json_decode(wp_remote_retrieve_body($response)), 200 );
    }

    function bwb_imaps_get_public_map_data() {
        $settings = get_option( 'bwb_imaps_options_data' );

        $default_category_config = array(
            'tabs' => array(
                array(
                    'id'          => 'apartments',
                    'title'       => 'Apartments',
                    'displayType' => 'grouped',
                    'categories'  => array( 'residential_apartment' )
                ),
                array(
                    'id'          => 'cottages',
                    'title'       => 'Cottages',
                    'displayType' => 'grouped',
                    'categories'  => array( 'cottage' )
                ),
                array(
                    'id'          => 'amenities',
                    'title'       => 'Amenities',
                    'displayType' => 'flat',
                    'categories'  => array(
                        'amenity',
                        'community_center',
                        'personal_care',
                        'skilled_care',
                        'fitness_center',
                        'utilities'
                    )
                )
            ),
            'categoryColors' => array(
                'residential_apartment' => '#1565c0',
                'cottage'               => '#2e7d32',
                'community_center'      => '#007cba',
                'personal_care'         => '#f57c00',
                'skilled_care'          => '#d84315',
                'fitness_center'        => '#00838f',
                'amenity'               => '#8d6e63'
            )
        );

        return array(
            'locations'        => isset( $settings['locations'] ) ? $settings['locations'] : array(),
            'mapType'          => isset( $settings['mapType'] ) ? $settings['mapType'] : 'hybrid',
            'mapLogo'          => isset( $settings['mapLogo'] ) ? $settings['mapLogo'] : '',
            'colorTheme'       => isset( $settings['colorTheme'] ) ? $settings['colorTheme'] : 'blue',
            'navBackground'    => isset( $settings['navBackground'] ) ? $settings['navBackground'] : '',
            'googleApiKey'     => isset( $settings['googleApiKey'] ) ? $settings['googleApiKey'] : '',
            'googleMapId'      => isset( $settings['googleMapId'] ) ? $settings['googleMapId'] : '',
            'attribute_schema' => isset( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array(),
            'categoryConfig'   => isset( $settings['categoryConfig'] ) ? $settings['categoryConfig'] : $default_category_config,
        );
    }

    public function handle_get_navigation_graph() {
        global $wpdb;

        $cache_key   = 'bwb_navigation_graph_data';
        $cache_group = 'bwb_spatial_cache';
        $graph_data  = wp_cache_get( $cache_key, $cache_group );

        if ( false === $graph_data ) {
            $table_entries = $wpdb->prefix . 'bwb_nav_entries_data';
            $table_network = $wpdb->prefix . 'bwb_nav_network_data';

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $entries = $wpdb->get_results($wpdb->prepare( "SELECT * FROM %i", $table_entries ), ARRAY_A );

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $network = $wpdb->get_results($wpdb->prepare( "SELECT * FROM %i", $table_network ), ARRAY_A );

            if ( is_null( $entries ) || is_null( $network ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve navigation graph network datasets.', array( 'status' => 500 ) );
            }

            $graph_data = array(
                'entries' => array(),
                'network' => array()
            );

            foreach ( $entries as $row ) {
                $graph_data['entries'][] = array(
                    'fid'   => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                    'name'  => $row['name'] ?? '',
                    'type'  => $row['type'] ?? '',
                    'floor' => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    'geom'  => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null
                );
            }

            foreach ( $network as $row ) {
                $graph_data['network'][] = array(
                    'fid'      => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                    'name'     => $row['name'] ?? '',
                    'type'     => $row['type'] ?? '',
                    'floor'    => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    'length_m' => isset( $row['length_m'] ) ? (float) $row['length_m'] : 0.00,
                    'geom'     => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null
                );
            }

            wp_cache_set( $cache_key, $graph_data, $cache_group, 43200 );
        }
        return new WP_REST_Response( $graph_data, 200 );
    }

    public function handle_get_spatial_data() {
        global $wpdb;

        $cache_key          = 'bwb_spatial_geojson_collection';
        $cache_group        = 'bwb_spatial_cache';
        $geojson_collection = wp_cache_get( $cache_key, $cache_group );

        if ( false === $geojson_collection ) {
            $table_spatial = $wpdb->prefix . 'bwb_general_spatial_data';
            $table_entries = $wpdb->prefix . 'bwb_nav_entries_data';

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $spatial_results = $wpdb->get_results( 
                $wpdb->prepare( "
                    SELECT *, CASE 
                        WHEN layer_type = 'land_use'  THEN 1 
                        WHEN layer_type = 'paths'     THEN 2 
                        WHEN layer_type = 'buildings' THEN 3 
                        WHEN layer_type = 'parcels'   THEN 4 
                        ELSE 0 
                    END as render_order FROM %i ORDER BY render_order ASC
                ", $table_spatial ), ARRAY_A );

            if ( is_null( $spatial_results ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve spatial data layers.', array( 'status' => 500 ) );
            }

            $features = array();

            foreach ( $spatial_results as $row ) {
                $custom_attrs = ! empty( $row['custom_attributes'] ) ? json_decode( $row['custom_attributes'], true ) : array();
                if ( ! is_array( $custom_attrs ) ) {
                    $custom_attrs = array();
                }

                $properties = array(
                    'fid'                  => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                    'layer_type'           => $row['layer_type'] ?? '',
                    'name'                 => $row['name'] ?? '',
                    'category'             => $row['category'] ?? '',
                    'code'                 => $row['code'] ?? '',
                    'fill_color'           => $row['fill_color'] ?? '',
                    'lat'                  => ! empty( $row['lat'] ) ? (float) $row['lat'] : null,
                    'lng'                  => ! empty( $row['lng'] ) ? (float) $row['lng'] : null,
                    'floor'                => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    'is_interactive'       => isset( $row['is_interactive'] ) ? (bool) $row['is_interactive'] : ( 'buildings' === ( $row['layer_type'] ?? '' ) ),
                    'show_label'           => isset( $row['show_label'] ) ? (bool) $row['show_label'] : ( ! empty( $row['name'] ) && 'paths' !== ( $row['layer_type'] ?? '' ) ),
                    'title'                => $row['title'] ?? '',
                    'description'          => $row['description'] ?? '',
                    'wp_page_id'           => ! empty( $row['wp_page_id'] ) ? (int) $row['wp_page_id'] : null,
                    'append_description'   => ! empty( $row['append_description'] ),
                    'custom_video_url'     => $row['custom_video_url'] ?? '',
                    'custom_floorplan_url' => $row['custom_floorplan_url'] ?? '',
                    'hide_page_video'      => ! empty( $row['hide_page_video'] ),
                    'hide_page_floorplan'  => ! empty( $row['hide_page_floorplan'] ),
                    'gallery'              => ! empty( $row['gallery'] ) ? ( json_decode( $row['gallery'], true ) ?: array() ) : array(),
                    'custom_attributes'    => $custom_attrs,
                );

                $merged_properties = array_merge( $custom_attrs, $properties );

                $features[] = array(
                    'type'       => 'Feature',
                    'properties' => $merged_properties,
                    'geometry'   => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null,
                );
            }

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $entries_results = $wpdb->get_results( 
                $wpdb->prepare( "SELECT * FROM %i", $table_entries ), ARRAY_A );

            if ( is_null( $entries_results ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve navigation entry points.', array( 'status' => 500 ) );
            }

            foreach ( $entries_results as $row ) {
                $features[] = array(
                    'type'       => 'Feature',
                    'properties' => array(
                        'fid'        => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                        'layer_type' => 'entries',
                        'name'       => $row['name'] ?? '',
                        'type'       => $row['type'] ?? '',
                        'floor'      => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    ),
                    'geometry'   => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null,
                );
            }

            $geojson_collection = array(
                'type'     => 'FeatureCollection',
                'features' => $features,
            );
            wp_cache_set( $cache_key, $geojson_collection, $cache_group, 86400 );
        }
        return new WP_REST_Response( $geojson_collection, 200 );
    }

    public function handle_inspect_geojson($request) {
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

        foreach ( $data['features'] as $feature ) {
            if ( ! empty( $feature['properties'] ) && is_array( $feature['properties'] ) ) {
                foreach ( $feature['properties'] as $key => $val ) {
                    if ( ! in_array( $key, $detected_properties, true ) ) {
                        $detected_properties[]      = $key;
                        $sample_feature_props[$key] = $val;
                    }
                }
            }
        }

        return new WP_REST_Response( array(
            'success'             => true,
            'total_features'      => count( $data['features'] ),
            'detected_properties' => $detected_properties,
            'sample_properties'   => $sample_feature_props,
        ), 200 );
    }

    private function compute_centroid_from_geom( $geometry ) {
        if ( empty( $geometry['coordinates'] ) ) return array( null, null );
        
        $type = $geometry['type'] ?? '';
        $coords = $geometry['coordinates'];
        $lats = array();
        $lngs = array();

        $extract = function($item) use (&$lats, &$lngs, &$extract) {
            if ( is_array($item) && count($item) >= 2 && is_numeric($item[0]) && is_numeric($item[1]) ) {
                $lngs[] = (float)$item[0];
                $lats[] = (float)$item[1];
            } elseif ( is_array($item) ) {
                foreach ($item as $sub) $extract($sub);
            }
        };

        $extract($coords);

        if ( empty($lats) || empty($lngs) ) return array( null, null );

        $avg_lat = array_sum($lats) / count($lats);
        $avg_lng = array_sum($lngs) / count($lngs);

        return array( $avg_lat, $avg_lng );
    }

    /**
     * Helper: Robustly syncs newly imported or added custom attribute keys and their types into global attribute_schema
     */
    private function sync_custom_keys_to_schema( $keys = array() ) {
        if ( empty( $keys ) ) return;

        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array();

        $existing_keys = array_column( $schema, 'key' );
        $has_changes   = false;

        foreach ( $keys as $k => $info ) {
            $clean_key = '';
            $type      = 'text';

            if ( is_array( $info ) ) {
                $clean_key = sanitize_key( $info['key'] ?? $k );
                $type      = sanitize_text_field( $info['type'] ?? 'text' );
            } elseif ( is_string( $k ) && ! is_numeric( $k ) ) {
                // Handles associative object format: { "fireplace": "boolean", "sq_ft": "number" }
                $clean_key = sanitize_key( $k );
                $type      = sanitize_text_field( $info );
            } else {
                // Handles simple array format: [ "fireplace", "sq_ft" ]
                $clean_key = sanitize_key( $info );
                $type      = ( strpos( $clean_key, 'bath' ) !== false ) ? 'bathrooms' : 'text';
            }

            if ( ! empty( $clean_key ) && ! in_array( $clean_key, $existing_keys, true ) ) {
                $label = ucwords( str_replace( '_', ' ', $clean_key ) );
                $schema[] = array(
                    'key'   => $clean_key,
                    'label' => $label,
                    'type'  => ! empty( $type ) ? $type : 'text',
                );
                $existing_keys[] = $clean_key;
                $has_changes     = true;
            }
        }

        if ( $has_changes ) {
            $settings['attribute_schema'] = $schema;
            update_option( 'bwb_imaps_options_data', $settings );
        }
    }

    /**
     * Helper: Syncs newly imported spatial categories and their fill colors into categoryConfig option
     * Auto-assigns groups via keyword matching; defaults to empty string (Unassigned).
     *
     * @param array $category_color_map Key-value pair of category_slug => hex_color
     */
    private function sync_imported_categories_to_config( $category_color_map = array() ) {
        if ( empty( $category_color_map ) ) return;

        $settings = get_option( 'bwb_imaps_options_data', array() );
        $config   = isset( $settings['categoryConfig'] ) && is_array( $settings['categoryConfig'] ) ? $settings['categoryConfig'] : array();

        $groups      = isset( $config['groups'] ) && is_array( $config['groups'] ) ? $config['groups'] : array();
        $categoryMap = isset( $config['categoryMap'] ) && is_array( $config['categoryMap'] ) ? $config['categoryMap'] : array();

        $has_changes = false;

        foreach ( $category_color_map as $cat_slug => $hex_color ) {
            $clean_slug = sanitize_key( $cat_slug );
            if ( empty( $clean_slug ) ) continue;

            if ( ! isset( $categoryMap[$clean_slug] ) ) {
                $formatted_label = ucwords( str_replace( '_', ' ', $clean_slug ) );
                $clean_color     = sanitize_hex_color( $hex_color );

                // Default is empty string (Unassigned) unless a strong keyword matches
                $target_group_id = '';
                
                if ( preg_match( '/(apt|apartment|residential|building)/i', $clean_slug ) ) {
                    $target_group_id = 'apartments';
                } elseif ( preg_match( '/(cottage|house|villa)/i', $clean_slug ) ) {
                    $target_group_id = 'cottages';
                } elseif ( preg_match( '/(path|road|trail|patio|garage|carport|drive|support)/i', $clean_slug ) ) {
                    $target_group_id = 'infrastructure';
                }

                $categoryMap[$clean_slug] = array(
                    'label'   => $formatted_label,
                    'groupId' => $target_group_id,
                    'color'   => ! empty( $clean_color ) ? $clean_color : '#007cba',
                );
                $has_changes = true;
            } elseif ( empty( $categoryMap[$clean_slug]['color'] ) && ! empty( $hex_color ) ) {
                $clean_color = sanitize_hex_color( $hex_color );
                if ( ! empty( $clean_color ) ) {
                    $categoryMap[$clean_slug]['color'] = $clean_color;
                    $has_changes = true;
                }
            }
        }

        if ( $has_changes ) {
            $config['categoryMap']      = $categoryMap;
            $settings['categoryConfig'] = $config;
            update_option( 'bwb_imaps_options_data', $settings );
        }
    }

    /**
     * POST Route Callback: Import spatial features
     */
    public function handle_spatial_geojson_import($request) {
        global $wpdb;

        if ( function_exists( 'bwb_create_general_spatial_dbtable' ) ) {
            bwb_create_general_spatial_dbtable();
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

        // Extract scalar string key names safely from objects or arrays
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

        // Auto-sync imported custom keys into central attribute schema
        $this->sync_custom_keys_to_schema( $imported_custom_keys );

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
                $table_name = $wpdb->prefix . 'bwb_nav_entries_data';
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
                $table_name = $wpdb->prefix . 'bwb_nav_network_data';
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
                    )) { $processed_count++; }
                }
                break;

            default:
                $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
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

                    // Collect category slugs and their colors for categoryConfig auto-sync
                    if ( ! empty( $v_category ) ) {
                        if ( ! isset( $discovered_category_colors[$v_category] ) || ! empty( $v_color ) ) {
                            $discovered_category_colors[$v_category] = $v_color;
                        }
                    }

                    list( $calc_lat, $calc_lng ) = $this->compute_centroid_from_geom( $feature['geometry'] ?? array() );

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

        // Auto-sync any categories and colors discovered in GeoJSON to categoryConfig
        if ( ! empty( $discovered_category_colors ) ) {
            $this->sync_imported_categories_to_config( $discovered_category_colors );
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

        wp_cache_delete( 'bwb_navigation_graph_data', 'bwb_spatial_cache' );
        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array( 
            'success'  => true, 
            'total'    => count( $data['features'] ), 
            'imported' => $processed_count 
        ), 200 );
    }

    /**
     * POST Route Callback: Update metadata fields for a specific spatial feature
     */
    public function handle_update_spatial_meta( $request ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
        
        $fid        = sanitize_text_field( $request->get_param( 'fid' ) );
        $layer_type = sanitize_text_field( $request->get_param( 'layer_type' ) );

        if ( empty( $fid ) || empty( $layer_type ) ) {
            return new WP_Error( 'missing_params', 'Missing fid or layer_type parameters.', array( 'status' => 400 ) );
        }

        $update_data = array();
        $format      = array();

        if ( $request->has_param( 'title' ) ) {
            $update_data['title'] = sanitize_text_field( $request->get_param( 'title' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'description' ) ) {
            $update_data['description'] = sanitize_textarea_field( $request->get_param( 'description' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'append_description' ) ) {
            $update_data['append_description'] = ! empty( $request->get_param( 'append_description' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'custom_video_url' ) ) {
            $update_data['custom_video_url'] = esc_url_raw( $request->get_param( 'custom_video_url' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'custom_floorplan_url' ) ) {
            $update_data['custom_floorplan_url'] = esc_url_raw( $request->get_param( 'custom_floorplan_url' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'hide_page_video' ) ) {
            $update_data['hide_page_video'] = ! empty( $request->get_param( 'hide_page_video' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'hide_page_floorplan' ) ) {
            $update_data['hide_page_floorplan'] = ! empty( $request->get_param( 'hide_page_floorplan' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'is_interactive' ) ) {
            $update_data['is_interactive'] = ! empty( $request->get_param( 'is_interactive' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'show_label' ) ) {
            $update_data['show_label'] = ! empty( $request->get_param( 'show_label' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'gallery' ) ) {
            $gallery = $request->get_param( 'gallery' );
            $update_data['gallery'] = is_string( $gallery ) ? $gallery : json_encode( $gallery );
            $format[] = '%s';
        }

        if ( $request->has_param( 'wp_page_id' ) ) {
            $page_id = $request->get_param( 'wp_page_id' );
            $update_data['wp_page_id'] = ( $page_id !== '' && ! is_null( $page_id ) ) ? (int) $page_id : null;
            $format[] = '%d';
        }

        if ( $request->has_param( 'custom_attributes' ) ) {
            $custom_attrs = $request->get_param( 'custom_attributes' );
            $parsed_attrs = is_string( $custom_attrs ) ? json_decode( $custom_attrs, true ) : $custom_attrs;
            
            if ( is_array( $parsed_attrs ) ) {
                $this->sync_custom_keys_to_schema( array_keys( $parsed_attrs ) );
            }

            $update_data['custom_attributes'] = is_string( $custom_attrs ) ? $custom_attrs : json_encode( $custom_attrs );
            $format[] = '%s';
        }

        if ( empty( $update_data ) ) {
            return new WP_REST_Response( array( 'success' => true, 'message' => 'No fields provided for update.' ), 200 );
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.DirectQuery
        $result = $wpdb->update(
            $table_name,
            $update_data,
            array( 'fid' => $fid, 'layer_type' => $layer_type ),
            $format,
            array( '%s', '%s' )
        );

        if ( false === $result ) {
            return new WP_Error( 'db_update_error', 'Failed to update metadata records inside database.', array( 'status' => 500 ) );
        }

        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array( 'success' => true ), 200 );
    }

    /**
     * GET Route Callback: Returns central attribute registry schema
     */
    public function handle_get_attribute_schema() {
        global $wpdb;
        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array();

        // Self-healing fallback: If option is empty, discover keys directly from MySQL
        if ( empty( $schema ) ) {
            $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
            $results    = $wpdb->get_results( "SELECT custom_attributes FROM {$table_name} WHERE custom_attributes IS NOT NULL AND custom_attributes != '' AND custom_attributes != '{}'", ARRAY_A );

            if ( ! empty( $results ) ) {
                $discovered_keys = array();
                foreach ( $results as $row ) {
                    $attrs = json_decode( $row['custom_attributes'], true );
                    if ( is_array( $attrs ) ) {
                        foreach ( $attrs as $k => $v ) {
                            if ( ! isset( $discovered_keys[$k] ) ) {
                                $type = is_bool( $v ) || $v === 'true' || $v === 'false' ? 'boolean' : ( is_numeric( $v ) ? 'number' : 'text' );
                                $discovered_keys[$k] = $type;
                            }
                        }
                    }
                }

                if ( ! empty( $discovered_keys ) ) {
                    $this->sync_custom_keys_to_schema( $discovered_keys );
                    $settings = get_option( 'bwb_imaps_options_data', array() );
                    $schema   = isset( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array();
                }
            }
        }

        return new WP_REST_Response( array( 'success' => true, 'schema' => $schema ), 200 );
    }

    /**
     * POST Route Callback: Adds or updates an attribute definition in the central schema
     */
    public function handle_update_attribute_schema( $request ) {
        $key   = sanitize_key( $request->get_param( 'key' ) );
        $label = sanitize_text_field( $request->get_param( 'label' ) );
        $type  = sanitize_text_field( $request->get_param( 'type' ) ?: 'text' );

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
                $updated       = true;
                break;
            }
        }

        if ( ! $updated ) {
            $schema[] = array(
                'key'   => $key,
                'label' => ! empty( $label ) ? $label : ucwords( str_replace( '_', ' ', $key ) ),
                'type'  => $type,
            );
        }

        $settings['attribute_schema'] = $schema;
        update_option( 'bwb_imaps_options_data', $settings );

        return new WP_REST_Response( array( 'success' => true, 'schema' => $schema ), 200 );
    }

    /**
     * POST Route Callback: Deletes an attribute key from central schema AND purges it from all features in MySQL
     */
    public function handle_delete_attribute_key( $request ) {
        global $wpdb;

        $key = sanitize_key( $request->get_param( 'key' ) );
        if ( empty( $key ) ) {
            return new WP_Error( 'missing_key', 'Attribute key is required for deletion.', array( 'status' => 400 ) );
        }

        // 1. Delete from central schema option
        $settings = get_option( 'bwb_imaps_options_data', array() );
        $schema   = isset( $settings['attribute_schema'] ) && is_array( $settings['attribute_schema'] ) ? $settings['attribute_schema'] : array();

        $filtered_schema = array_values( array_filter( $schema, function( $item ) use ( $key ) {
            return $item['key'] !== $key;
        } ) );

        $settings['attribute_schema'] = $filtered_schema;
        update_option( 'bwb_imaps_options_data', $settings );

        // 2. MySQL JSON Purge Query: Removes the JSON key from custom_attributes across all rows
        $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
        $json_path  = '$.' . $key;

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $wpdb->query(
            $wpdb->prepare(
                "UPDATE %i SET custom_attributes = JSON_REMOVE(custom_attributes, %s) WHERE JSON_EXTRACT(custom_attributes, %s) IS NOT NULL",
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

    /**
     * POST Route Callback: Deletes all features of a specific layer type
     */
    public function handle_delete_layer($data) {
        global $wpdb;
        $layer_type = sanitize_text_field( $data['layer_type'] );

        if ( empty( $layer_type ) ) {
            return new WP_Error( 'missing_params', 'Missing required parameters.', array( 'status' => 400 ) );
        }

        if ( $layer_type === 'entries' ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $result = $wpdb->query( $wpdb->prepare( "TRUNCATE TABLE %i", $wpdb->prefix . 'bwb_nav_entries_data' ) );
        } elseif ( $layer_type === 'network' ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $result = $wpdb->query( $wpdb->prepare( "TRUNCATE TABLE %i", $wpdb->prefix . 'bwb_nav_network_data' ) );
        } else {
            $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $result = $wpdb->delete( $table_name, array( 'layer_type' => $layer_type ) );
        }

        if ( false === $result ) {
            return new WP_Error( 'db_error', 'Could not delete layer.', array( 'status' => 500 ) );
        }

        wp_cache_delete( 'bwb_navigation_graph_data', 'bwb_spatial_cache' );
        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array(
            'success' => true, 
            'message' => "Layer '$layer_type' deleted successfully."
        ), 200 );
    }

    /**
     * POST Route Callback: Explicit user action to prune categories from categoryConfig
     * that are not assigned to any spatial feature in MySQL.
     */
    public function handle_cleanup_category_schema() {
        global $wpdb;

        $table_spatial = $wpdb->prefix . 'bwb_general_spatial_data';
        
        // 1. Fetch active category slugs from MySQL
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $active_cats = $wpdb->get_col( "SELECT DISTINCT category FROM {$table_spatial} WHERE category IS NOT NULL AND category != ''" );
        $active_set  = is_array( $active_cats ) ? array_flip( $active_cats ) : array();

        // 2. Fetch current options
        $settings = get_option( 'bwb_imaps_options_data', array() );
        $config   = isset( $settings['categoryConfig'] ) && is_array( $settings['categoryConfig'] ) ? $settings['categoryConfig'] : array();
        
        $current_map = isset( $config['categoryMap'] ) && is_array( $config['categoryMap'] ) ? $config['categoryMap'] : array();
        $cleaned_map = array();
        $pruned_count = 0;

        // 3. Retain only categories present in active_set
        foreach ( $current_map as $cat_slug => $cat_data ) {
            if ( isset( $active_set[$cat_slug] ) ) {
                $cleaned_map[$cat_slug] = $cat_data;
            } else {
                $pruned_count++;
            }
        }

        // 4. Update option
        $config['categoryMap']      = $cleaned_map;
        $settings['categoryConfig'] = $config;
        update_option( 'bwb_imaps_options_data', $settings );

        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array(
            'success'      => true,
            'pruned_count' => $pruned_count,
            'categoryMap'  => (object) $cleaned_map, // 👈 FORCES JSON ENCODING AS `{}` INSTEAD OF `[]`
            'message'      => sprintf( 'Cleanup complete. %d unused categories removed.', $pruned_count )
        ), 200 );
    }

    private function api_error( $code, $message, $status = 400 ) {
        return new WP_Error( 
            $code, 
            $message, 
            array( 'status' => $status ) 
        );
    }
}
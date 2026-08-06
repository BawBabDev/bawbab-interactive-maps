<?php
/**
 * FEDERATED BIM REST API ENDPOINTS CONTROLLER
 * File: includes/class-federated-bwb-imaps-api.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class BWB_Federated_Imaps_API_Controller {

    /**
     * Initialize and hook the API routes into WordPress.
     */
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_bwb_imaps_routes' ) );
    }

    /**
     * Register REST API routes.
     */
    public function register_bwb_imaps_routes() {
        $namespace = 'bwb-imaps-federated-api/v1';

        // GET Route to fetch all bawbab interactive Maps data
        //AFC support for pages
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

        //GET Route to fetch all bawbab interactive Maps data
        register_rest_route( $namespace, '/map-proxy', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'bwb_imaps_proxy_graphql' ),
            'permission_callback' => '__return_true'
        ) );

        register_rest_route( $namespace, '/get-spatial-data', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'handle_get_spatial_data' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( $namespace, '/map-locations', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'bwb_imaps_get_public_map_data' ),
            'permission_callback' => '__return_true', 
        ) );

        register_rest_route( $namespace, '/get-navigation-graph', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'handle_get_navigation_graph' ),
            'permission_callback' => '__return_true',
        ) );


        // POST Route to update spatial data
        register_rest_route( $namespace, '/spatial-data-importer', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'handle_spatial_geojson_import' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );

        register_rest_route( $namespace, '/update-spatial-meta', array(
            'methods'  => 'POST',
            'callback' => array( $this, 'handle_update_spatial_meta' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );

        // DELETE Route to remove image comparisons
        register_rest_route( $namespace, '/delete-layer/(?P<layer_type>[a-zA-Z0-9_\-]+)', array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'handle_delete_layer' ),
            'permission_callback' => array( $this, 'check_admin_permissions' )
        ) );
    }

    /**
     * Shared permission callback routine.
     */
    public function check_admin_permissions() {
        return current_user_can( 'manage_options' );
    }

    // ==========================================
    // REST API CALLBACK HANDLERS
    // ==========================================

    /**
     * GET Route Callback: Proxy GraphQL requests to the internal API
     */

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

    /**
     * GET Route Callback: Serve public map data from the custom database table
     */

    function bwb_imaps_get_public_map_data() {
        $settings = get_option( 'bwb_imaps_options_data' );
        return array(
            'locations'     => isset( $settings['locations'] ) ? $settings['locations'] : array(),
            'mapType'       => isset( $settings['mapType'] ) ? $settings['mapType'] : 'hybrid',
            'mapLogo'       => isset( $settings['mapLogo'] ) ? $settings['mapLogo'] : '',
            'colorTheme'    => isset( $settings['colorTheme'] ) ? $settings['colorTheme'] : 'blue',
            'navBackground' => isset( $settings['navBackground'] ) ? $settings['navBackground'] : '',
            'googleApiKey'  => isset( $settings['googleApiKey'] ) ? $settings['googleApiKey'] : '',
            'googleMapId'   => isset( $settings['googleMapId'] ) ? $settings['googleMapId'] : '',
        );
    }

    /**
     * GET Route Callback: Serve navigation graph data from the custom database table
     */
    public function handle_get_navigation_graph() {
        global $wpdb;


        // Check for mapped dataset from object cache first
        $cache_key   = 'bwb_navigation_graph_data';
        $cache_group = 'bwb_spatial_cache';
        $graph_data  = wp_cache_get( $cache_key, $cache_group );


        // If the cache is empty (false), execute database queries and format the entries
        if ( false === $graph_data ) {
            $table_entries = $wpdb->prefix . 'bwb_nav_entries_data';
            $table_network = $wpdb->prefix . 'bwb_nav_network_data';

            // Query records from database tables
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table data retrieval requires direct query execution.
            $entries = $wpdb->get_results($wpdb->prepare( "SELECT * FROM %i", $table_entries ), ARRAY_A );

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table data retrieval requires direct query execution.
            $network = $wpdb->get_results($wpdb->prepare( "SELECT * FROM %i", $table_network ), ARRAY_A );

            // Verify database execution query integrity
            if ( is_null( $entries ) || is_null( $network ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve navigation graph network datasets.', array( 'status' => 500 ) );
            }

            $graph_data = array(
                'entries' => array(),
                'network' => array()
            );

            // Map structural array entities for entry markers
            foreach ( $entries as $row ) {
                $graph_data['entries'][] = array(
                    'fid'   => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                    'name'  => $row['name'] ?? '',
                    'type'  => $row['type'] ?? '',
                    'floor' => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                    'geom'  => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null
                );
            }

            // Map structural array entities for connection line paths
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

            // Save the formatted graph payload to cache for 12 hours (43200 seconds)
            wp_cache_set( $cache_key, $graph_data, $cache_group, 43200 );
        }
        // Return clean, unified object instance through the native interface class
        return new WP_REST_Response( $graph_data, 200 );
    }

    /**
     * GET Route Callback: Serve data from the custom database table
     */
    public function handle_get_spatial_data() {
        global $wpdb;

        // Check for fully processed GeoJSON FeatureCollection from object cache first
        $cache_key          = 'bwb_spatial_geojson_collection';
        $cache_group        = 'bwb_spatial_cache';
        $geojson_collection = wp_cache_get( $cache_key, $cache_group );

        // If the cache is empty (false), execute database queries and compile the structural GeoJSON arrays
        if ( false === $geojson_collection ) {
            $table_spatial = $wpdb->prefix . 'bwb_general_spatial_data';
            $table_entries = $wpdb->prefix . 'bwb_nav_entries_data';

            // Fetch Spatial Layer Data with strict rendering priorities
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom spatial table processing requires direct SQL queries and caching is handled manually.
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

            // Verify query safety execution on primary table
            if ( is_null( $spatial_results ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve spatial data layers.', array( 'status' => 500 ) );
            }

            $features = array();

            // Format Spatial Records into GeoJSON Schema
            foreach ( $spatial_results as $row ) {
                $features[] = array(
                    'type'       => 'Feature',
                    'properties' => array(
                        'fid'                  => isset( $row['fid'] ) ? (string) $row['fid'] : '',
                        'layer_type'           => $row['layer_type'] ?? '',
                        'name'                 => $row['name'] ?? '',
                        'category'             => $row['category'] ?? '',
                        'wp_page_id'           => ! empty( $row['wp_page_id'] ) ? (int) $row['wp_page_id'] : null,
                        'fill_color'           => $row['fill_color'] ?? '',
                        'code'                 => $row['code'] ?? '',
                        'lat'                  => ! empty( $row['lat'] ) ? (float) $row['lat'] : null,
                        'lng'                  => ! empty( $row['lng'] ) ? (float) $row['lng'] : null,
                        'sq_ft'                => $row['sq_ft'] ?? '',
                        'baths'                => ! empty( $row['baths'] ) ? (float) $row['baths'] : null,
                        'floor'                => isset( $row['floor'] ) ? (int) $row['floor'] : 0,
                        'fireplace'            => ! empty( $row['fireplace'] ),
                        'sunroom'              => ! empty( $row['sunroom'] ),
                        'title'                => $row['title'] ?? '',
                        'description'          => $row['description'] ?? '',
                        'append_description'   => ! empty( $row['append_description'] ),
                        'custom_video_url'     => $row['custom_video_url'] ?? '',
                        'custom_floorplan_url' => $row['custom_floorplan_url'] ?? '',
                        'hide_page_video'      => ! empty( $row['hide_page_video'] ),
                        'hide_page_floorplan'  => ! empty( $row['hide_page_floorplan'] ),
                        'gallery'              => ! empty( $row['gallery'] ) ? ( json_decode( $row['gallery'], true ) ?: array() ) : array(),
                    ),
                    'geometry'   => ! empty( $row['geom'] ) ? json_decode( $row['geom'] ) : null,
                );
            }

            // Fetch Entries Layer Data
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom spatial table processing requires direct SQL queries and caching is handled manually.
            $entries_results = $wpdb->get_results( 
                $wpdb->prepare( "SELECT * FROM %i", $table_entries ), ARRAY_A );

            // Verify query safety execution on secondary table
            if ( is_null( $entries_results ) ) {
                return new WP_Error( 'db_error', 'Failed to retrieve navigation entry points.', array( 'status' => 500 ) );
            }

            // Format and Append Entries Records to Features collection
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

            // Package output inside a standard validated GeoJSON FeatureCollection wrapper object
            $geojson_collection = array(
                'type'     => 'FeatureCollection',
                'features' => $features,
            );
            // Store the compiled collection array into transient memory cache for 24 hours (86400 seconds)
            wp_cache_set( $cache_key, $geojson_collection, $cache_group, 86400 );
        }
        return new WP_REST_Response( $geojson_collection, 200 );
    }

    /**
     * POST Route Callback: Unified insertion & item modification handler
     */
    public function handle_spatial_geojson_import($request) {
        global $wpdb;

        $files = $request->get_file_params();
        if ( empty( $files['geojson_file'] ) ) {
            return new WP_Error( 'no_file', 'No file found.', array( 'status' => 400 ) );
        }

        $layer_type = sanitize_text_field( $request->get_param( 'layer_type' ) );
        $data = json_decode( file_get_contents( $files['geojson_file']['tmp_name'] ), true );

        if ( ! isset( $data['features'] ) ) {
            return new WP_Error( 'invalid_json', 'Invalid GeoJSON.', array( 'status' => 400 ) );
        }

        $imported_fids = array();
        $processed_count = 0;

        switch ( $layer_type ) {
            
            case 'entries':
                $table_name = $wpdb->prefix . 'bwb_nav_entries_data';
                foreach ( $data['features'] as $feature ) {
                    $props = $feature['properties'] ?? array();
                    $fid = sanitize_text_field( $props['fid'] ?? '' );
                    if ( empty( $fid ) ) continue;
                    $imported_fids[] = $fid;

                    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table insertion explicitly flushed via manual cache invalidation post-loop.
                    if ( false !== $wpdb->query(
                        
                        $wpdb->prepare(
                            "INSERT INTO %i (fid, type, floor, name, geom) VALUES (%s, %s, %d, %s, %s)
                            ON DUPLICATE KEY UPDATE type = VALUES(type), floor = VALUES(floor), name = VALUES(name), geom = VALUES(geom)",
                            $table_name,
                            $fid,
                            sanitize_text_field( $props['type'] ?? '' ),
                            isset($props['floor']) ? (int)$props['floor'] : 0,
                            sanitize_text_field( $props['name'] ?? '' ),
                            json_encode( $feature['geometry'] )
                        )
                    ) ) 
                    { $processed_count++;}
                }
                break;

            case 'network':
                $table_name = $wpdb->prefix . 'bwb_nav_network_data';
                foreach ( $data['features'] as $feature ) {
                    $props = $feature['properties'] ?? array();
                    $fid = sanitize_text_field( $props['fid'] ?? '' );
                    if ( empty( $fid ) ) continue;
                    $imported_fids[] = $fid;

                    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table insertion explicitly flushed via manual cache invalidation post-loop.
                    if ( false !== $wpdb->query(
                        $wpdb->prepare(
                            "INSERT INTO %i (fid, name, type, floor, length_m, geom) VALUES (%s, %s, %s, %d, %f, %s)
                            ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), floor = VALUES(floor), length_m = VALUES(length_m), geom = VALUES(geom)",
                            $table_name,
                            $fid,
                            sanitize_text_field( $props['name'] ?? '' ),
                            sanitize_text_field( $props['type'] ?? '' ),
                            isset($props['floor']) ? (int)$props['floor'] : 0,
                            isset($props['length_m']) ? (float)$props['length_m'] : 0.00,
                            json_encode( $feature['geometry'] )
                        )
                    ))
                    {  $processed_count++; }
                }
                break;

            default:
                $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
                foreach ( $data['features'] as $feature ) {
                    $props = $feature['properties'] ?? array();
                    $fid = sanitize_text_field( $props['fid'] ?? '' );
                    if ( empty( $fid ) ) continue;
                    $imported_fids[] = $fid;
                     
                    
                    // PRESERVE EDITS: If sq_ft, baths, fireplace, sunroom, or wp_page_id already exist, retain them.
                    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table insertion explicitly flushed via manual cache invalidation post-loop.
                    if ( false !== $wpdb->query( 
                        $wpdb->prepare(
                            "INSERT INTO %i (fid, layer_type, name, category, fill_color, code, lat, lng, sq_ft, baths, floor, fireplace, sunroom, wp_page_id, geom)
                            VALUES (%s, %s, %s, %s, %s, %s, %f, %f, %s, %f, %d, %d, %d, %d, %s) 
                            ON DUPLICATE KEY UPDATE
                            name = VALUES(name), 
                            category = VALUES(category), 
                            fill_color = VALUES(fill_color), 
                            code = VALUES(code),
                            lat = VALUES(lat), 
                            lng = VALUES(lng), 
                            floor = VALUES(floor), 
                            geom = VALUES(geom),
                            wp_page_id = CASE WHEN wp_page_id IS NOT NULL AND wp_page_id > 0 THEN wp_page_id ELSE VALUES(wp_page_id) END,
                            sq_ft = CASE WHEN sq_ft IS NOT NULL AND sq_ft != '' THEN sq_ft ELSE VALUES(sq_ft) END,
                            baths = CASE WHEN baths IS NOT NULL AND baths > 0 THEN baths ELSE VALUES(baths) END,
                            fireplace = CASE WHEN fireplace IS NOT NULL THEN fireplace ELSE VALUES(fireplace) END,
                            sunroom = CASE WHEN sunroom IS NOT NULL THEN sunroom ELSE VALUES(sunroom) END", 
                            $table_name,
                            $fid, $layer_type, 
                            sanitize_text_field( $props['name'] ?? '' ),
                            sanitize_text_field( $props['category'] ?? $props['type'] ?? '' ),
                            sanitize_hex_color( $props['fill_color'] ?? '' ),
                            sanitize_text_field( $props['code'] ?? '' ),
                            isset($props['lat']) ? (float)$props['lat'] : null,
                            isset($props['lng']) ? (float)$props['lng'] : null,
                            isset($props['sq_ft']) ? sanitize_text_field($props['sq_ft']) : null,
                            isset($props['baths']) ? (float)$props['baths'] : null,
                            isset( $props['floor'] ) ? (int) $props['floor'] : 0,
                            !empty($props['fireplace']) ? 1 : 0,
                            !empty($props['sunroom']) ? 1 : 0,
                            isset($props['wp_page_id']) && $props['wp_page_id'] !== '' ? (int)$props['wp_page_id'] : null,
                            json_encode( $feature['geometry'] )
                        )
                    ) ) 
                    { $processed_count++; }
                }
                break;
        }

        if ( ! empty( $imported_fids ) ) {
            $fids_placeholders = implode( ',', array_fill( 0, count( $imported_fids ), '%s' ) );
            if ( $layer_type === 'entries' || $layer_type === 'network' ) {
                // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table record cleanup.
                $wpdb->query( 
                    $wpdb->prepare( 
                        "DELETE FROM %i WHERE fid NOT IN ($fids_placeholders)", 
                        array_merge( array( $table_name ), $imported_fids ) 
                    ) 
                );
            } else {
                // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table record cleanup.
                $wpdb->query( 
                    $wpdb->prepare( 
                        "DELETE FROM %i WHERE layer_type = %s AND fid NOT IN ($fids_placeholders)", 
                        array_merge( array( $table_name, $layer_type ), $imported_fids ) 
                    ) 
                );
            }
        }


        // Forcefully invalidate the 24-hour transient cache data in order to updated frontend.
        wp_cache_delete( 'bwb_navigation_graph_data', 'bwb_spatial_cache' );
        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        // Explicitly package our array payload inside the core WordPress response object
        $response_data = array( 
            'success'  => true, 
            'total'    => count($data['features']), 
            'imported' => $processed_count 
        );

        return new WP_REST_Response( $response_data, 200 );
    }


    /**
     * POST Route Callback: Update metadata for a specific spatial layer
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

        if ( $request->has_param( 'hide_page_video' ) ? 1 : 0 ) {
            $update_data['hide_page_video'] = ! empty( $request->get_param( 'hide_page_video' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'hide_page_floorplan' ) ) {
            $update_data['hide_page_floorplan'] = ! empty( $request->get_param( 'hide_page_floorplan' ) ) ? 1 : 0;
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

        if ( $request->has_param( 'sq_ft' ) ) {
            $update_data['sq_ft'] = sanitize_text_field( $request->get_param( 'sq_ft' ) );
            $format[] = '%s';
        }

        if ( $request->has_param( 'baths' ) ) {
            $baths = $request->get_param( 'baths' );
            $update_data['baths'] = ( $baths !== '' && ! is_null( $baths ) ) ? (float) $baths : null;
            $format[] = '%f';
        }

        if ( $request->has_param( 'fireplace' ) ) {
            $update_data['fireplace'] = ! empty( $request->get_param( 'fireplace' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( $request->has_param( 'sunroom' ) ) {
            $update_data['sunroom'] = ! empty( $request->get_param( 'sunroom' ) ) ? 1 : 0;
            $format[] = '%d';
        }

        if ( empty( $update_data ) ) {
            return new WP_REST_Response( array( 'success' => true, 'message' => 'No fields provided for update.' ), 200 );
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table metadata update explicitly handled by caching eviction hooks directly post-query.
        $result = $wpdb->update(
            $table_name,
            $update_data,
            array( 'fid' => $fid, 'layer_type' => $layer_type ),
            $format,
            array( '%s', '%s' )
        );

        // If update queries fail completely due to SQL architecture errors, throw an explicit error framework hook.
        if ( false === $result ) {
            return new WP_Error( 'db_update_error', 'Failed to update metadata records inside database.', array( 'status' => 500 ) );
        }

        // Forcefully invalidate the 24-hour transient cache data in order to updated frontend.
        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );

        return new WP_REST_Response( array( 'success' => true ), 200 );
    }

    /**
     * DELETE Route Callback: Deletes a selected row safely
     */
    public function handle_delete_layer($data) {
        global $wpdb;
        $layer_type = sanitize_text_field( $data['layer_type'] );
        $fid = sanitize_text_field( $data['fid'] );

        if ( empty( $layer_type ) || empty( $fid ) ) {
            return new WP_Error( 'missing_params', 'Missing required parameters.', array( 'status' => 400 ) );
        }

        if ( $layer_type === 'entries' ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Table truncation on custom database layers is safely evicted from the object cache via manual invalidation routines below.
            $result = $wpdb->query( $wpdb->prepare( "TRUNCATE TABLE %i", $wpdb->prefix . 'bwb_nav_entries_data_nav_entries' ) );
        } elseif ( $layer_type === 'network' ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Table truncation on custom database layers is safely evicted from the object cache via manual invalidation routines below.
            $result = $wpdb->query( $wpdb->prepare( "TRUNCATE TABLE %i", $wpdb->prefix . 'bwb_nav_network_data' ) );
        } else {
            $table_name = $wpdb->prefix . 'bwb_general_spatial_data';
            // // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- The dynamic table name is safe, built with core prefix, and its storage context is flushed via custom cache routines.
            $result = $wpdb->delete( $table_name, array( 'layer_type' => $layer_type ) );
        }

        if ( false === $result ) {
            return new WP_Error( 'db_error', 'Could not delete layer.', array( 'status' => 500 ) );
        }

        // Forcefully invalidate the 24-hour transient cache data in order to updated frontend.
        wp_cache_delete( 'bwb_navigation_graph_data', 'bwb_spatial_cache' );
        wp_cache_delete( 'bwb_spatial_geojson_collection', 'bwb_spatial_cache' );
        return new WP_REST_Response( array('success' => true, 
            'message' => "Layer with fid '$fid' deleted successfully." 
        ), 200 ); 
    }
    /**
     * Generates standardized, translatable WP_Error API responses.
     */
    private function api_error( $code, $message, $status = 400 ) {
        return new WP_Error( 
            $code, 
            $message, 
            array( 'status' => $status ) 
        );
    }
}

<?php
/**
 * GRAPHQL PROXY REST ROUTE
 * File: includes/apis/class-bwb-imaps-rest-proxy.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BWB_IMaps_REST_Proxy {

    public static function register_routes( $namespace ) {
        register_rest_route( $namespace, '/map-proxy', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'bwb_imaps_proxy_graphql' ),
            'permission_callback' => '__return_true',
        ) );
    }

    public static function bwb_imaps_proxy_graphql( $request ) {
        $body     = $request->get_body();
        $response = wp_remote_post( 'https://34.149.108.92.nip.io/internal-frontend-api/api/graphql', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-api-key'    => 'cFIhX1YUjiFHHIQxSSOnJ7g1W0h7UO4heMo2sasgUodkHwkN',
            ),
            'body'    => $body,
            'timeout' => 15,
        ) );

        if ( is_wp_error( $response ) ) {
            return new WP_Error( 'api_error', 'Failed to fetch', array( 'status' => 500 ) );
        }

        return new WP_REST_Response( json_decode( wp_remote_retrieve_body( $response ) ), 200 );
    }
}
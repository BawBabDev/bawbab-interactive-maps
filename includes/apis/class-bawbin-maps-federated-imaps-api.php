<?php
/**
 * FEDERATED BIM REST API MAIN CONTROLLER
 * File: includes/apis/class-bawbin-maps-federated-imaps-api.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class BAWBIN_Maps_Federated_API_Controller {

    public const NAMESPACE = 'bawbin-maps-federated-api/v1';

    public function __construct() {
        $this->bawbin_maps_load_dependencies();
        add_action( 'rest_api_init', array( $this, 'bawbin_maps_register_all_routes' ) );
    }

    /**
     * Includes all endpoint-specific handler classes in the same folder
     */
    private function bawbin_maps_load_dependencies() {
        $api_dir = plugin_dir_path( __FILE__ );

        require_once $api_dir . 'class-bawbin-maps-rest-spatial.php';
        require_once $api_dir . 'class-bawbin-maps-rest-categories.php';
        require_once $api_dir . 'class-bawbin-maps-rest-importer.php';
        require_once $api_dir . 'class-bawbin-maps-rest-attributes.php';
        require_once $api_dir . 'class-bawbin-maps-rest-navigation.php';
        // require_once $api_dir . 'class-bawbin-maps-rest-proxy.php';
    }

    /**
     * Centralized route registration
     */
    public function bawbin_maps_register_all_routes() {
        // Register ACF REST field extension for WordPress Pages
        register_rest_field( 'page', 'acf', array(
            'get_callback' => function( $object ) {
                if ( function_exists( 'get_fields' ) ) {
                    $fields = get_fields( $object['id'] );
                    return ! empty( $fields ) ? $fields : array();
                }
                return array();
            },
            'update_callback' => null,
            'schema'          => null,
        ) );

        // Delegate route registration to individual class handlers
        BAWBIN_Maps_REST_Spatial::bawbin_maps_register_routes( self::NAMESPACE );
        BAWBIN_Maps_REST_Categories::bawbin_maps_register_routes( self::NAMESPACE );
        BAWBIN_Maps_REST_Importer::bawbin_maps_register_routes( self::NAMESPACE );
        BAWBIN_Maps_REST_Attributes::bawbin_maps_register_routes( self::NAMESPACE );
        BAWBIN_Maps_REST_Navigation::bawbin_maps_register_routes( self::NAMESPACE );
        // BAWBIN_Maps_REST_Proxy::register_routes( self::NAMESPACE );
    }

    /**
     * Shared admin capability permission check
     */
    public static function bawbin_maps_check_admin_permissions() {
        return current_user_can( 'manage_options' );
    }
}
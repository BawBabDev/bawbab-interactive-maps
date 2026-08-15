<?php
/**
 * FEDERATED BIM REST API MAIN CONTROLLER
 * File: includes/apis/class-bwb-federated-imaps-api.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class BWB_Federated_Imaps_API_Controller {

    public const NAMESPACE = 'bwb-imaps-federated-api/v1';

    public function __construct() {
        $this->load_dependencies();
        add_action( 'rest_api_init', array( $this, 'register_all_routes' ) );
    }

    /**
     * Includes all endpoint-specific handler classes in the same folder
     */
    private function load_dependencies() {
        $api_dir = plugin_dir_path( __FILE__ );

        require_once $api_dir . 'class-bwb-imaps-rest-spatial.php';
        require_once $api_dir . 'class-bwb-imaps-rest-categories.php';
        require_once $api_dir . 'class-bwb-imaps-rest-importer.php';
        require_once $api_dir . 'class-bwb-imaps-rest-attributes.php';
        require_once $api_dir . 'class-bwb-imaps-rest-navigation.php';
        require_once $api_dir . 'class-bwb-imaps-rest-proxy.php';
        require_once $api_dir . 'class-bwb-imaps-rest-exporter.php';
    }

    /**
     * Centralized route registration
     */
    public function register_all_routes() {
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
        BWB_IMaps_REST_Spatial::register_routes( self::NAMESPACE );
        BWB_IMaps_REST_Categories::register_routes( self::NAMESPACE );
        BWB_IMaps_REST_Importer::register_routes( self::NAMESPACE );
        BWB_IMaps_REST_Attributes::register_routes( self::NAMESPACE );
        BWB_IMaps_REST_Navigation::register_routes( self::NAMESPACE );
        BWB_IMaps_REST_Proxy::register_routes( self::NAMESPACE );
        BWB_IMaps_REST_Exporter::register_routes( self::NAMESPACE );
    }

    /**
     * Shared admin capability permission check
     */
    public static function check_admin_permissions() {
        return current_user_can( 'manage_options' );
    }
}
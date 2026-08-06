<?php
// This file is generated. Do not modify it manually.
return array(
	'bawbab-interactive-maps-admin' => array(
		'name' => 'bawbab-interactive-maps/bawbab-interactive-maps-admin',
		'editorScript' => 'file:./index.js',
		'apiVersion' => 3
	),
	'bawbab-interactive-maps-block' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'bawbab-interactive-maps/bawbab-interactive-maps-block',
		'version' => '0.1.0',
		'title' => 'BawBab Interactive Map Widget',
		'category' => 'widgets',
		'icon' => 'location-alt',
		'description' => 'BawBab InteractiveMap Widget to add your interactive map on your sitefront.',
		'example' => array(
			
		),
		'supports' => array(
			'html' => false
		),
		'attributes' => array(
			'zoom' => array(
				'type' => 'number',
				'default' => 16
			),
			'mapType' => array(
				'type' => 'string',
				'default' => 'roadmap'
			),
			'tilt' => array(
				'type' => 'number',
				'default' => 0
			),
			'width' => array(
				'type' => 'string',
				'default' => '100%'
			),
			'height' => array(
				'type' => 'string',
				'default' => '80vh'
			)
		),
		'textdomain' => 'bawbab-interactive-map',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./style.scss',
		'style' => 'file:./style-index.css',
		'viewScript' => 'file:./view.js'
	)
);

(function () {
    tinymce.PluginManager.add('foulkeways_map_buttons', function (editor) {
        
        // 1. Map Insert Button (Location Pin)
        editor.addButton('insert_foulkeways_map', {
            title: 'Insert Foulkeways Map',
            icon: 'dashicons-location-alt',
            onclick: function () {
                editor.insertContent('[foulkeways_map height="650px"]');
            }
        });

        // 2. Map Visibility Dropdown Menu
        editor.addButton('foulkeways_map_visibility', {
            type: 'menubutton',
            text: 'Map Visibility',
            icon: 'dashicons-visibility',
            menu: [
                {
                    text: 'Include Section on Map',
                    onclick: function () {
                        var selectedText = editor.selection.getContent();
                        if (selectedText) {
                            editor.selection.setContent('[map_include]' + selectedText + '[/map_include]');
                        } else {
                            editor.insertContent('[map_include]Your content here...[/map_include]');
                        }
                    }
                },
                {
                    text: 'Exclude Section from Map',
                    onclick: function () {
                        var selectedText = editor.selection.getContent();
                        if (selectedText) {
                            editor.selection.setContent('[map_exclude]' + selectedText + '[/map_exclude]');
                        } else {
                            editor.insertContent('[map_exclude]Content hidden from map...[/map_exclude]');
                        }
                    }
                }
            ]
        });

    });
})();
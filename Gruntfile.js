/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// installed modules
const loadGruntTasks = require("load-grunt-tasks");


exports = module.exports = function(grunt) {
    loadGruntTasks(grunt);

    grunt.initConfig({
        eslint: {
            src: [
                "example/*.js",
                "lib/**/*.js",
                "store/**/*.js",
                "test/**/*.js",
                "Gruntfile.js",
            ],
        },
        mochaTest: {
            test: [
                "test/unit/**/*.js",
            ],
        },
    });

    grunt.registerTask("lint", ["eslint"]);
    grunt.registerTask("test", ["lint", "mochaTest"]);
};

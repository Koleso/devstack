var basePaths = {
	assets: 'assets',
	src: 'assets/src',
	temp: 'assets/temp',
	dist: 'assets/dist'
};

module.exports = function (grunt) {
	grunt.option("src", basePaths.src);
	grunt.option("temp", basePaths.temp);
	grunt.option("dist", basePaths.dist);

	grunt.initConfig({
		clean: {
			before: {
				src: [basePaths.dist+'/**/*']
			},
			after: {
				src: [basePaths.temp]
			}
		},
		
		copy: {
			options: {
				expand: true,
				src: basePaths.src+'/js/libs/',
				dest: basePaths.dist+'/js/libs/'
			},
		},

		svg_sprite: {
			src: [basePaths.src+'/images/svg/*.svg'],
			options: {
				dest: basePaths.dist,
				shape : {
					id : {
						generator : function(name) {
							name = name.replace(/\\/g,"/");
							item = name.split("/");
							return item[item.length - 1].slice(0, -4);
						}
					},
					spacing : {
						padding : 1,
					},
				},
				mode : {
					css : {
						mixin: 'sprite',
						sprite: '../img/sprite.svg',
						prefix: '.sprite-%s',
						dimensions: '-dims',
						render: {
							less: {
								dest: '../../temp/sprite.less',
								template: 'assets/tpl/template.less'
							}
						},
					},
					transform: ['svgo'],
				},
				variables : {
					png: function() {
						return function(sprite, render) {
							return render(sprite).split('.svg').join('.png');
						}
					}
				}
			}
		},

		svgmin: {
			options: {
				plugins: [
					{ removeViewBox: false },
					{ removeUselessStrokeAndFill: false }
				]
			},
			dist: {
				expand: true,
				cwd: basePaths.dist+'/',
				src: ['img/*.svg'],
				dest: basePaths.dist+'/',
				ext: '.svg'
			}
		},

		svg2png: {
			all: {
				files: [{
					cwd: basePaths.dist+'/',
					src: ['img/*.svg'],
					dest: basePaths.dist+'/',
					expand: false
				}]
			}
		},

		imagemin: {
			dynamic: {
				files: [{
					expand: true,
					cwd: basePaths.src+'/images/',
					src: ['*.{png,jpg,gif}'],
					dest: basePaths.dist+'/images/'
				}]
			}
		},

		concat: {
			styles: {
				// Kvuli spravnemu poradi je vypsano rucne
				src: [
					basePaths.src+'/less/reset.less', 
					basePaths.src+'/less/mixins.less',
					basePaths.temp+'/sprite.less',
					basePaths.src+'/less/fonts.less', 
					basePaths.src+'/less/variables.less',
					basePaths.src+'/less/typography.less',
					basePaths.src+'/less/site.less',
					basePaths.src+'/less/responsive.less',
					basePaths.src+'/less/utilities.less'
				],
				dest: basePaths.temp+'/style.less',
			},
		},

		less: {
			production: {
				files: {
					'<%= grunt.option(\"temp\") %>/style.css': '<%= grunt.option(\"temp\") %>/style.less'
				}
			}
		},

		postcss: {
			options: {
				mapAnnotation: false,
				processors: [
					require('autoprefixer')({browsers: ['last 2 versions', 'ie 9']}),
					require('pixrem')(),
					require('cssnano')({discardComments: true})
				]
			},
			dist: {
				src: basePaths.temp+'/style.css',
				dest: basePaths.dist+'/css/style.min.css'
			}
		},

		criticalcss: {
			production: {
				options: {
					url: "http://localhost:4040",
					width: 1600,
					height: 900,
					outputfile: basePaths.dist+'/css/style.critical.css',
					filename: basePaths.dist+'/css/style.min.css',
					buffer: 800*1024,
					ignoreConsole: false
				}
			}
		},

		babel: {
			options: {
				sourceMap: false,
				presets: ['es2015']
			},
			dist: {
				files: {
					'<%= grunt.option(\"temp\") %>/global.js': ['<%= grunt.option(\"src\") %>/js/global.js']
				}
			}
		},

		uglify: {
			dist: {
				options: {
					mangleProperties: {
						toplevel: true
					}
				},
				files: {
					'<%= grunt.option(\"dist\") %>/js/global.min.js': ['<%= grunt.option(\"temp\") %>/global.js']
				}
			}
		},

		watch: {
			html: {
				files: ['*'],
				options: {
					livereload: 35729
				},
			},
			script: {
				files: [basePaths.src+'/js/*'],
				tasks: ['javascript'],
				options: {
					livereload: 35729
				},
			},
			sprite: {
				files: [basePaths.src+'/img/svg/*.svg'],
				tasks: ['sprite', 'css']
			},
			image: {
				files: [basePaths.src+'/images/*'],
				tasks: ['imagemin']
			},
			styles: {
				files: [basePaths.src+'/less/*'],
				tasks: ['css'],
				options: {
					livereload: 35729
				},
			},
		},

		connect: {
			server: {
				options: {
					livereload: 35729,
					port: 4040,
					protocol: 'http',
					hostname: 'localhost',
					base: ''
				}
			}
		},

		notify: {
			options: {
				enabled: true,
				max_jshint_notifications: 5,
				success: false,
				duration: 3
			}
		}
	});

	
	require('load-grunt-tasks')(grunt);

	grunt.registerTask('init', ['clean', 'copy', 'sprite', 'imagemin', 'css', 'javascript']);
	grunt.registerTask('sprite', ['svg_sprite', 'svgmin', 'svg2png']);
	grunt.registerTask('css', ['concat', 'less', 'postcss']);
	grunt.registerTask('javascript', ['babel', 'uglify']);

	grunt.registerTask('build', ['init', 'connect', 'criticalcss', 'clean:after']);
	grunt.registerTask('default', ['init', 'notify', 'connect', 'watch']);
}
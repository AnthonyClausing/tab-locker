import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});
			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'src/main.js',
	output: {
		//no sourcemap needed
		sourcemap: false,
		format: 'iife',
		name: 'app',
		file: 'public/build/popup.js'
	},
	plugins: [
		svelte({
			compilerOptions: {
				dev: !production
			}
		}),
		css({ output: 'popup.css' }),
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		!production && serve(),
		// refresh on changes of `public` directory
		!production && livereload('public'),
		// building for production? minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

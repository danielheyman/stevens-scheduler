default:
	@echo "minifying files..."

	@echo "->minifying JS..."
	closure-compiler --compilation_level SIMPLE_OPTIMIZATIONS --jscomp_warning=* --jscomp_off=strictMissingRequire --js_output_file min.js --js GA.js config.js index.js librequests.js init.js apputil.js UIschedule.js UIright.js UIsavebar.js selectionLogic.js mounted.js

	@echo "->minifying CSS..."
	uglifycss --output style.min.css style.css
	uglifycss --output style_dark.min.css style_dark.css

	@echo "->minifying HTML..."
	minify -o index.html index_source.html

	@echo "->minifing was a success"
	@echo "Output written to: [min.js, style.min.css, style_dark.min.css, index.html]"

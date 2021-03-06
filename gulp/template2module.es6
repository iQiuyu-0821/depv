import {
  resolve,
} from 'path';

import gulp from 'gulp';
import gutil from 'gulp-util';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import sprintf from 'zero-fmt/sprintf';
import through from 'through2';
import tpl2mod from 'template2module';
const underscoreEngine = tpl2mod.engines.underscore;
import {
  iconizeHtml,
} from 'evil-icons';
import {
  each,
  map,
} from 'zero-lang';

import {
  templateDirs,
} from './config';

function renderTemplates() {
  return through.obj(function render(file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('template2module', 'Streaming not supported'));
    }

    try {
      gutil.log(file.path);
      // @TODO add svg sprite file as needed, instead of putting the whole evil-icons svg file
      const content = underscoreEngine.render(iconizeHtml(file.contents.toString('utf8')), file.path, 'commonjs');
      file.contents = new Buffer(content);
    } catch (err) {
      this.emit('error', new gutil.PluginError('template2module', err.toString()));
    }

    this.push(file);
    return cb();
  });
}

each(templateDirs, (dir) => {
  gulp.task(sprintf('template2module-%s', dir), () =>
      gulp.src(resolve(__dirname, sprintf('../%s/**/*.html', dir)))
        .pipe(plumber())
        .pipe(renderTemplates())
        .on('error', (err) => {
          gutil.log(gutil.colors.red(err.message));
        })
        .pipe(rename((path) => {
          path.extname = '.js';
        }))
        .pipe(gulp.dest(resolve(__dirname, sprintf('../%s/', dir))))
  );
});

gulp.task('template2module', map(templateDirs, (dir) => sprintf('template2module-%s', dir)));

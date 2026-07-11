'use strict';

const fs = require('fs');
const path = require('path');

hexo.extend.generator.register('article_assets', function (locals) {
  const sourceRoot = this.source_dir;
  const generators = [];

  locals.posts.forEach((post) => {
    if (!post.source || path.extname(post.source) !== '.md') return;

    const articleDir = path.join(sourceRoot, path.dirname(post.source));
    if (!fs.existsSync(articleDir)) return;

    const walk = (dir, relativeDir = '') => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        if (path.extname(entry.name) === '.md') continue;

        const absolutePath = path.join(dir, entry.name);
        const relativePath = path.join(relativeDir, entry.name);

        if (entry.isDirectory()) {
          walk(absolutePath, relativePath);
          continue;
        }

        generators.push({
          path: path.posix.join(post.path.replace(/index\.html$/, ''), relativePath.replace(/\\/g, '/')),
          data: () => fs.createReadStream(absolutePath)
        });
      }
    };

    walk(articleDir);
  });

  return generators;
});

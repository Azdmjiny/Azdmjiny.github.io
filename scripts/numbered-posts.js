'use strict';

const fs = require('fs');
const path = require('path');
const tildify = require('tildify');
const { magenta } = require('picocolors');

const RESERVED_KEYS = {
  _: true,
  title: true,
  layout: true,
  slug: true,
  s: true,
  path: true,
  p: true,
  replace: true,
  r: true,
  config: true,
  debug: true,
  safe: true,
  silent: true
};

function walkMarkdownFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(absolutePath, files);
    } else if (path.extname(entry.name) === '.md') {
      files.push(absolutePath);
    }
  }

  return files;
}

function collectArticleIds(postDir) {
  const ids = [];

  for (const file of walkMarkdownFiles(postDir)) {
    const basename = path.basename(file, '.md');
    if (/^\d+$/.test(basename)) ids.push(Number(basename));

    const content = fs.readFileSync(file, 'utf8');
    const slugMatch = content.match(/^slug:\s*['"]?(\d+)['"]?\s*$/m);
    if (slugMatch) ids.push(Number(slugMatch[1]));
  }

  return ids;
}

function nextArticleId(sourceDir, digits) {
  const postDir = path.join(sourceDir, '_posts');
  const ids = collectArticleIds(postDir);
  const next = ids.length ? Math.max(...ids) + 1 : 1;

  return String(next).padStart(digits, '0');
}

function newConsole(args) {
  const requestedPath = args.p || args.path;
  let title;

  if (args._.length) {
    title = args._.pop();
  } else if (requestedPath) {
    title = path.basename(requestedPath, path.extname(requestedPath));
  } else {
    return this.call('help', { _: ['new'] });
  }

  const layout = args._.length ? args._[0] : this.config.default_layout;
  const data = {
    title,
    layout,
    path: requestedPath
  };

  if (layout === 'post' && !requestedPath) {
    const digits = Number(this.config.article_id_digits) || 4;
    const id = nextArticleId(this.source_dir, digits);

    data.slug = id;
    data.path = path.join(title, `${id}.md`);
  } else {
    data.slug = args.s || args.slug;
  }

  for (const key of Object.keys(args)) {
    if (!RESERVED_KEYS[key]) data[key] = args[key];
  }

  return this.post.create(data, args.r || args.replace).then((post) => {
    this.log.info('Created: %s', magenta(tildify(post.path)));
  });
}

hexo.extend.console.register('new', 'Create a numbered post', {
  usage: '[layout] <title>',
  arguments: [
    { name: 'layout', desc: 'Post layout' },
    { name: 'title', desc: 'Post title' }
  ],
  options: [
    { name: '-p, --path', desc: 'Post path. Customize the path of the post.' },
    { name: '-r, --replace', desc: 'Replace the current post if existed.' }
  ]
}, newConsole);

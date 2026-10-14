// Live previews shown on the right while editing in the CMS.
// They use the real site styles (style.css), so they look like the site.

(function () {
  const h = window.h;

  CMS.registerPreviewStyle('/style.css');
  CMS.registerPreviewStyle('/admin/preview.css');

  // ---------- Helpers ----------

  function data(entry) {
    const d = entry.get('data');
    return d && d.toJS ? d.toJS() : {};
  }

  function isVideo(path) {
    return /\.(mp4|webm|mov|m4v)$/i.test(path || '');
  }

  // Uploaded files that aren't saved yet only exist in the CMS, so ask it for the URL
  function url(props, path) {
    if (!path) return '';
    const asset = props.getAsset(path);
    return asset ? asset.toString() : path;
  }

  function media(props, path, className, poster) {
    if (!path) return null;
    if (isVideo(path)) {
      return h('video', {
        key: path, className: className, src: url(props, path), poster: url(props, poster),
        autoPlay: true, muted: true, loop: true, playsInline: true
      });
    }
    return h('img', { key: path, className: className, src: url(props, path) });
  }

  function price(value) {
    return value === undefined || value === null || value === ''
      ? ''
      : Number(value).toLocaleString('sv-SE') + ' SEK';
  }

  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p, i) { return h('p', { key: i }, p.trim()); });
  }

  function note(text) {
    return h('p', { className: 'cms-note' }, text);
  }

  // ---------- Products ----------

  function productCard(props, p, i) {
    const images = p.images || [];
    return h('article', { className: 'product', key: i },
      h('div', { className: 'product-track' },
        images.length
          ? images.map(function (src) { return media(props, src, 'slide'); })
          : h('div', { className: 'slide cms-empty' }, 'No photo yet')
      ),
      h('div', { className: 'product-meta' },
        h('p', { className: 'product-name' }, p.name || 'Untitled'),
        h('p', { className: 'product-name grid-price' }, price(p.price))
      ),
      h('p', { className: 'cms-details' },
        [p.material, p.sizing === 'one' ? 'One size' : 'Two sizes',
         images.length + (images.length === 1 ? ' photo' : ' photos')].filter(Boolean).join('  ·  ')
      )
    );
  }

  function ProductsPreview(props) {
    const products = data(props.entry).products || [];
    const top = products.slice(0, 8);
    const bottom = products.slice(8);
    return h('main', { className: 'shop' },
      note('Preview of the shop. Scroll sideways on a product to see all its photos.'),
      h('section', { className: 'product-grid' }, top.map(function (p, i) { return productCard(props, p, i); })),
      bottom.length ? h('div', { className: 'cms-feature-marker' }, 'Featured image goes here') : null,
      bottom.length ? h('section', { className: 'product-grid' }, bottom.map(function (p, i) { return productCard(props, p, i + 8); })) : null
    );
  }

  // ---------- Front page ----------

  function LandingPreview(props) {
    const d = data(props.entry);
    return h('header', { className: 'landing' },
      media(props, d.media, 'landing-image', d.poster),
      h('h1', { className: 'landing-title' },
        h('img', { className: 'landing-logo', src: '/SVG/EmmaCarling.svg', alt: 'Emma Carling' })
      )
    );
  }

  function FeaturePreview(props) {
    const d = data(props.entry);
    return h('main', { className: 'shop' },
      d.media
        ? media(props, d.media, 'feature-image')
        : note('No featured image – this space is hidden on the site.')
    );
  }

  // ---------- Order form ----------

  function ColoursPreview(props) {
    const colours = data(props.entry).colours || [];
    return h('div', { className: 'cms-pad order-form' },
      note('This is how the colour choices look in the order form.'),
      h('fieldset', { className: 'field' },
        h('legend', null, 'Colour'),
        h('div', { className: 'options' },
          colours.map(function (c, i) {
            return h('label', { className: 'option swatch', key: i },
              h('input', { type: 'radio', name: 'colour' }),
              h('span', null, h('i', { style: { background: c.color } }), c.name)
            );
          }),
          h('label', { className: 'option swatch' },
            h('input', { type: 'radio', name: 'colour' }),
            h('span', null, h('i', { className: 'rainbow' }), 'Other')
          )
        )
      )
    );
  }

  function OrderInfoPreview(props) {
    const d = data(props.entry);
    return h('div', { className: 'cms-pad' },
      note('This box is shown next to the order form.'),
      h('div', { className: 'order-terms' },
        h('h3', null, d.heading1), h('p', null, d.text1),
        h('h3', null, d.heading2), h('p', null, d.text2)
      )
    );
  }

  // ---------- About & contact ----------

  function AboutPreview(props) {
    const d = data(props.entry);
    return h('footer', { className: 'contact' },
      h('div', { className: 'contact-intro' }, paragraphs(d.text))
    );
  }

  function ContactPreview(props) {
    const d = data(props.entry);
    const handle = String(d.instagram || '').replace(/^@/, '');
    return h('footer', { className: 'contact' },
      h('div', { className: 'contact-info' },
        d.email ? h('p', null, h('a', null, d.email)) : null,
        d.phone ? h('p', null, h('a', null, d.phone)) : null,
        handle ? h('p', null, h('a', null, '@' + handle)) : null
      )
    );
  }

  CMS.registerPreviewTemplate('products', ProductsPreview);
  CMS.registerPreviewTemplate('landing', LandingPreview);
  CMS.registerPreviewTemplate('feature', FeaturePreview);
  CMS.registerPreviewTemplate('colours', ColoursPreview);
  CMS.registerPreviewTemplate('order-info', OrderInfoPreview);
  CMS.registerPreviewTemplate('about', AboutPreview);
  CMS.registerPreviewTemplate('contact', ContactPreview);
})();

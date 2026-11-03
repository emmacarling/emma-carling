// Order requests are sent with Formspree (formspree.io): Emma gets an email
// for each one, and they are also saved in her Formspree dashboard.
// The form ID is the last part of the form's endpoint, https://formspree.io/f/<ID>
const FORMSPREE_FORM_ID = 'YOUR_FORM_ID';

// Shown to customers if sending fails (set from content/contact.json)
let CONTACT_EMAIL = 'emmacarling2@gmail.com';

// How many products go above the featured image
const PRODUCTS_ABOVE_FEATURE = 8;

const SIZES = {
  one: ['One size'],
  two: ['Small / Medium', 'Large / X-Large']
};


// ---------- Content (edited by Emma in the CMS at /admin) ----------

function loadJSON(name) {
  return fetch('/content/' + name + '.json', { cache: 'no-cache' }).then(function (res) {
    if (!res.ok) throw new Error('Could not load content/' + name + '.json');
    return res.json();
  });
}

Promise.all(['products', 'landing', 'feature', 'order-info', 'colours', 'about', 'contact'].map(loadJSON))
  .then(function (c) {
    renderProducts(c[0].products || []);
    renderLanding(c[1]);
    renderFeature(c[2]);
    renderOrderInfo(c[3]);
    renderColours(c[4].colours || []);
    renderAbout(c[5]);
    renderContact(c[6]);
    openFromAddress();
  })
  .catch(function (err) {
    console.error(err);
  });

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function formatPrice(price) {
  return Number(price).toLocaleString('sv-SE') + ' SEK';
}

function isVideo(src) {
  return /\.(mp4|webm|mov|m4v)$/i.test(src || '');
}

// An <img> or a muted, looping <video>, depending on the file
function mediaElement(src, className, alt, poster) {
  if (isVideo(src)) {
    const video = el('video', className);
    // Muted must be set (as attribute too) before the source, or iPhones
    // refuse to autoplay and show a play button instead
    video.muted = video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.autoplay = video.loop = video.playsInline = true;
    if (poster) video.poster = poster;
    video.src = src;
    const play = video.play();
    if (play) play.catch(function () {}); // e.g. Low Power Mode: just show the still image
    return video;
  }
  const img = el('img', className);
  img.src = src;
  img.alt = alt || '';
  return img;
}

// Plain text with empty lines between paragraphs -> <p> elements
function paragraphs(container, text) {
  container.innerHTML = '';
  String(text || '').split(/\n\s*\n/).forEach(function (part) {
    if (part.trim()) container.appendChild(el('p', null, part.trim()));
  });
}

// "Lova dress" -> "lova-dress", "Rosé top" -> "rose-top"
function slugify(name) {
  return String(name || 'product')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
}

// Every product's address, e.g. "lova-dress" -> its <article> in the grid
const productsBySlug = new Map();

function renderProducts(products) {
  const top = document.getElementById('grid-top');
  const bottom = document.getElementById('grid-bottom');

  products.forEach(function (p, i) {
    const product = el('article', 'product');

    // Its own address. Two products with the same name get -2, -3...
    const base = slugify(p.name);
    let slug = base;
    for (let n = 2; productsBySlug.has(slug); n++) slug = base + '-' + n;
    productsBySlug.set(slug, product);
    product.dataset.slug = slug;
    product.data = p;

    const track = el('div', 'product-track');
    (p.images || []).forEach(function (src) {
      track.appendChild(mediaElement(src, 'slide', p.name));
    });

    const prev = el('button', 'arrow prev');
    prev.setAttribute('aria-label', 'Previous image');
    const next = el('button', 'arrow next');
    next.setAttribute('aria-label', 'Next image');

    // Name on the left, price on the right under the image
    const meta = el('div', 'product-meta');
    meta.append(el('p', 'product-name', p.name), el('p', 'product-name grid-price', formatPrice(p.price)));

    product.append(track, prev, next, meta);
    (i < PRODUCTS_ABOVE_FEATURE ? top : bottom).appendChild(product);
    setupProduct(product);
  });

  bottom.hidden = !bottom.children.length;
}

function renderLanding(c) {
  const placeholder = document.querySelector('.landing-media');
  if (!c.media) return;
  const media = mediaElement(c.media, 'landing-image', '', c.poster);
  if (media.tagName !== 'VIDEO' || !c.poster) {
    placeholder.replaceWith(media);
    return;
  }
  // A video with a still image: show the still as a plain image, with the video
  // invisible on top until it really plays (see .landing-video in style.css)
  const still = mediaElement(c.poster, 'landing-image', '');
  media.classList.add('landing-video', 'waiting');
  media.addEventListener('playing', function () { media.classList.remove('waiting'); }, { once: true });
  placeholder.replaceWith(still);
  still.after(media);
}

// Feature slide: the images/videos fade into each other in a loop
function renderFeature(c) {
  const feature = document.querySelector('.feature');
  const slides = (c.slides || (c.media ? [c.media] : [])).filter(Boolean);
  const seconds = Number(c.seconds) || 4;

  feature.innerHTML = '';
  feature.hidden = !slides.length;
  slides.forEach(function (src, i) {
    const slide = mediaElement(src, 'feature-image', '');
    if (i === 0) slide.classList.add('active');
    feature.appendChild(slide);
  });

  if (slides.length < 2) return;
  let current = 0;
  setInterval(function () {
    const items = feature.children;
    items[current].classList.remove('active');
    current = (current + 1) % items.length;
    items[current].classList.add('active');
  }, seconds * 1000);
}

// Shipping, returns, care…: one row per section under the Order button,
// each folding out its text. Sections without text are left out.
function renderOrderInfo(c) {
  const menu = document.querySelector('.info-menu');
  // (older content had heading1/text1 + heading2/text2 instead of a list)
  const sections = c.sections || [1, 2, 3].map(function (n) {
    return { heading: c['heading' + n], text: c['text' + n] };
  });

  menu.innerHTML = '';
  sections.filter(function (s) { return s && s.heading && String(s.text || '').trim(); }).forEach(function (s) {
    const item = el('div', 'info-item');
    const toggle = el('button', 'info-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    const plus = el('span', 'plus');
    plus.setAttribute('aria-hidden', 'true');
    plus.append(el('span'), el('span'));
    toggle.append(el('span', null, s.heading), plus);

    const fold = el('div', 'fold info-text');
    fold.inert = true;
    const inner = el('div', 'fold-inner');
    paragraphs(inner, s.text);
    fold.appendChild(inner);

    toggle.addEventListener('click', function () {
      const open = !fold.classList.contains('open');
      fold.classList.toggle('open', open);
      fold.inert = !open;
      item.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    item.append(toggle, fold);
    menu.appendChild(item);
  });
  menu.hidden = !menu.children.length;
}

function renderColours(colours) {
  const options = document.querySelector('.colour-options');
  const other = options.lastElementChild; // "Other" is always there, always last

  colours.forEach(function (c) {
    const label = el('label', 'option swatch');
    const input = el('input');
    input.type = 'radio';
    input.name = 'colour';
    input.value = c.name;
    input.required = true;
    const span = el('span');
    const dot = el('i');
    dot.style.background = c.color;
    span.append(dot, c.name);
    label.append(input, span);
    options.insertBefore(label, other);
  });
}

function renderAbout(c) {
  paragraphs(document.querySelector('.contact-intro'), c.text);
}

function renderContact(c) {
  const email = document.querySelector('.contact-email');
  const phone = document.querySelector('.contact-phone');
  const insta = document.querySelector('.contact-instagram');
  const handle = String(c.instagram || '').replace(/^@/, '');

  CONTACT_EMAIL = c.email || '';
  email.textContent = c.email || '';
  email.href = 'mailto:' + (c.email || '');
  phone.textContent = c.phone || '';
  phone.href = 'tel:' + String(c.phone || '').replace(/[^\d+]/g, '');
  insta.textContent = handle ? '@' + handle : '';
  insta.href = 'https://instagram.com/' + handle;

  // Hide lines that are empty
  [email, phone, insta].forEach(function (a) {
    a.parentElement.hidden = !a.textContent;
  });
}


// ---------- Products in the grid ----------

// Scroll a track one image left (-1) or right (+1)
function step(track, dir) {
  track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
}

// Hide the arrows when there is only one image to show
function markSingle(container, track) {
  container.classList.toggle('single', track.querySelectorAll('.slide').length < 2);
}

function setupProduct(product) {
  const track = product.querySelector('.product-track');
  markSingle(product, track);

  product.querySelector('.prev').addEventListener('click', function () { step(track, -1); });
  product.querySelector('.next').addEventListener('click', function () { step(track, 1); });

  // Clicking the image itself opens the product full screen, at its own address
  track.addEventListener('click', function () {
    openOverlay(product);
    if (location.pathname !== '/' + product.dataset.slug) {
      history.pushState({ product: product.dataset.slug }, '', '/' + product.dataset.slug);
      openedFromSite = true;
    }
  });
}


// Tapping the landing page scrolls down a bit, hinting at the shop below
document.querySelector('.landing').addEventListener('click', function () {
  window.scrollBy({ top: window.innerHeight * 0.60, behavior: 'smooth' });
});


// ---------- Product view ----------

const overlay = document.querySelector('.overlay');
const overlayTrack = overlay.querySelector('.overlay-track');
const thumbs = overlay.querySelector('.thumbs');
const defaultTitle = document.title;
let currentProduct = null;
let openedFromSite = false; // the product's address was added to the history by a click

function openOverlay(product) {
  const p = product.data;
  const track = product.querySelector('.product-track');
  const current = Math.round(track.scrollLeft / track.clientWidth);
  currentProduct = product;

  // The product's images and details
  overlayTrack.innerHTML = track.innerHTML;
  markSingle(overlay, overlayTrack);
  overlay.querySelector('.product-title').textContent = p.name;
  overlay.querySelector('.product-price').textContent = formatPrice(p.price);
  overlay.querySelector('.product-material').textContent = p.material || '';
  resetOrder(product);

  // One small preview per image; clicking it shows that image
  thumbs.innerHTML = '';
  (p.images || []).forEach(function (src, i) {
    const thumb = el('button', 'thumb');
    thumb.type = 'button';
    thumb.setAttribute('aria-label', 'Image ' + (i + 1));
    if (isVideo(src)) {
      // A video shows its first frame, without playing
      const video = el('video');
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.preload = 'metadata';
      video.src = src + '#t=0.1';
      thumb.appendChild(video);
    } else {
      const img = el('img');
      img.src = src;
      img.alt = '';
      thumb.appendChild(img);
    }
    thumb.addEventListener('click', function () {
      overlayTrack.scrollTo({ left: i * overlayTrack.clientWidth, behavior: 'smooth' });
    });
    thumbs.appendChild(thumb);
  });

  overlay.hidden = false;
  overlay.scrollTop = 0;
  orderForm.scrollTop = 0;
  document.body.classList.add('no-scroll');
  document.title = p.name + ' – Emma Carling';

  // Start on the same image the visitor was looking at
  overlayTrack.scrollLeft = current * overlayTrack.clientWidth;
  updateThumbs();
}

// Outline the preview of the image currently in view
function updateThumbs() {
  const current = Math.round(overlayTrack.scrollLeft / overlayTrack.clientWidth);
  thumbs.querySelectorAll('.thumb').forEach(function (thumb, i) {
    thumb.classList.toggle('active', i === current);
  });
}
overlayTrack.addEventListener('scroll', updateThumbs);

// fromHistory: closed by the browser's back button, so leave the address alone
function closeOverlay(fromHistory) {
  if (overlay.hidden) return;
  overlay.hidden = true;
  document.body.classList.remove('no-scroll');
  document.title = defaultTitle;
  if (fromHistory !== true && location.pathname !== '/') {
    if (openedFromSite) history.back();
    else history.replaceState(null, '', '/');
  }
  openedFromSite = false;
}

overlay.querySelector('.prev').addEventListener('click', function () { step(overlayTrack, -1); });
overlay.querySelector('.next').addEventListener('click', function () { step(overlayTrack, 1); });
overlay.querySelector('.overlay-close').addEventListener('click', function () { closeOverlay(); });


// ---------- Product addresses: emmacarling.com/lova-dress ----------

// The product named in the address. Addresses that aren't files (like
// /lova-dress) are sent here by 404.html as /?product=lova-dress.
function slugFromAddress() {
  const fromQuery = new URLSearchParams(location.search).get('product');
  if (fromQuery) return fromQuery;
  return decodeURIComponent(location.pathname).replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '');
}

function openFromAddress() {
  const slug = slugFromAddress();
  if (!slug) return;
  const product = productsBySlug.get(slug);
  if (!product) {
    history.replaceState(null, '', '/'); // no such product (any more): just show the shop
    return;
  }
  history.replaceState({ product: slug }, '', '/' + slug); // tidy ?product=… into /lova-dress
  openedFromSite = false;
  openOverlay(product);
}

window.addEventListener('popstate', function () {
  const product = productsBySlug.get(slugFromAddress());
  if (product) openOverlay(product);
  else closeOverlay(true);
});


// ---------- Order form (unfolds inside the product view) ----------

const orderForm = overlay.querySelector('.order-form');
const orderFields = orderForm.querySelector('.order-fields');
const orderButton = orderForm.querySelector('.order-button');
const formStatus = orderForm.querySelector('.form-status');
const otherHint = orderForm.querySelector('.other-hint');
const sizeOptions = orderForm.querySelector('.size-options');

function checkedValue(name) {
  const input = orderForm.querySelector('input[name="' + name + '"]:checked');
  return input ? input.value : '';
}

// "Other" colour: show the hint and make the message required
function updateOther() {
  const isOther = checkedValue('colour') === 'Other (see message)';
  otherHint.hidden = !isOther;
  orderForm.elements.message.required = isOther;
}
orderForm.addEventListener('change', updateOther);

// Only the sizes this product comes in. A one-size product is pre-selected.
function renderSizes(sizing) {
  const sizes = SIZES[sizing] || SIZES.two;
  sizeOptions.innerHTML = '';
  sizes.forEach(function (size) {
    const label = el('label', 'option');
    const input = el('input');
    input.type = 'radio';
    input.name = 'size';
    input.value = size;
    input.required = true;
    input.defaultChecked = sizes.length === 1; // also survives orderForm.reset()
    label.append(input, el('span', null, size));
    sizeOptions.appendChild(label);
  });
}

function setOrderOpen(open) {
  orderFields.classList.toggle('open', open);
  orderFields.inert = !open;
  orderButton.textContent = open ? 'Send request' : 'Order';
}

// A fresh, folded form for this product
function resetOrder(product) {
  const p = product.data;
  orderForm.reset();
  renderSizes(p.sizing || 'two');
  orderForm.elements.product.value = p.name;
  orderForm.elements.price.value = formatPrice(p.price);
  formStatus.textContent = '';
  updateOther();
  setOrderOpen(false);

  // The info rows (How ordering works, Care…) always start closed
  document.querySelectorAll('.info-item.open').forEach(function (item) {
    const fold = item.querySelector('.info-text');
    item.classList.remove('open');
    fold.classList.remove('open');
    fold.inert = true;
    item.querySelector('.info-toggle').setAttribute('aria-expanded', 'false');
  });
}

// The first press on Order unfolds the form (the button slides down);
// once it's open, the same button sends the request.
orderButton.addEventListener('click', function (e) {
  if (orderFields.classList.contains('open')) return; // normal submit
  e.preventDefault();
  setOrderOpen(true);
  // On computers, start typing straight away. Not on phones and tablets:
  // there it would pop up the keyboard before the visitor has read the form.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    orderForm.elements.name.focus({ preventScroll: true });
  }
});

orderForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(orderForm));
  data._subject = 'Order request: ' + data.product;
  data._replyto = data.email; // Emma can hit "Reply" to answer the customer directly

  orderButton.disabled = true;
  formStatus.textContent = 'Sending…';

  fetch('https://formspree.io/f/' + FORMSPREE_FORM_ID, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error((body.errors || []).map(function (err) { return err.message; }).join(', '));
      });
    })
    .then(function () {
      formStatus.textContent = 'Thank you! Your request has been sent. I will get back to you soon.';
      orderForm.reset();
      orderForm.elements.product.value = data.product;
      orderForm.elements.price.value = data.price;
      updateOther();
    })
    .catch(function (err) {
      console.error('Order request failed:', err);
      formStatus.textContent = 'Something went wrong. Please try again' +
        (CONTACT_EMAIL ? ', or email ' + CONTACT_EMAIL + ' directly.' : '.');
    })
    .finally(function () {
      orderButton.disabled = false;
    });
});


// ---------- Keyboard ----------

document.addEventListener('keydown', function (e) {
  if (overlay.hidden) return;
  if (e.key === 'Escape') closeOverlay();
  // Arrow keys change image, except while typing in the form
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'ArrowLeft') step(overlayTrack, -1);
  if (e.key === 'ArrowRight') step(overlayTrack, 1);
});

// Order requests are emailed here (via formsubmit.co)
const ORDER_EMAIL = '63460f1740cce258d377d960881792c9';

// Shown to customers if sending fails (set from content/contact.json)
let CONTACT_EMAIL = '';

// How many products go above the featured image
const PRODUCTS_ABOVE_FEATURE = 8;

const SIZES = {
  one: ['One size'],
  two: ['Small / Medium', 'Large / X-Large']
};


// ---------- Content (edited by Emma in the CMS at /admin) ----------

function loadJSON(name) {
  return fetch('content/' + name + '.json', { cache: 'no-cache' }).then(function (res) {
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
    video.src = src;
    video.autoplay = video.muted = video.loop = video.playsInline = true;
    video.setAttribute('playsinline', '');
    if (poster) video.poster = poster;
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

function renderProducts(products) {
  const top = document.getElementById('grid-top');
  const bottom = document.getElementById('grid-bottom');

  products.forEach(function (p, i) {
    const product = el('article', 'product');
    product.dataset.sizing = p.sizing || 'two';

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

    // Details shown in the full product view
    const info = el('div', 'product-info');
    info.hidden = true;
    const order = el('button', 'order-button', 'Order');
    order.type = 'button';
    info.append(
      el('h2', 'product-title', p.name),
      el('p', 'product-price', formatPrice(p.price)),
      el('p', 'product-material', p.material || ''),
      order
    );

    product.append(track, prev, next, meta, info);
    (i < PRODUCTS_ABOVE_FEATURE ? top : bottom).appendChild(product);
    setupProduct(product);
  });

  bottom.hidden = !bottom.children.length;
}

function renderLanding(c) {
  const placeholder = document.querySelector('.landing-media');
  if (c.media) placeholder.replaceWith(mediaElement(c.media, 'landing-image', '', c.poster));
}

function renderFeature(c) {
  const feature = document.querySelector('.feature');
  feature.innerHTML = '';
  if (c.media) feature.appendChild(mediaElement(c.media, 'feature-image', ''));
  feature.hidden = !c.media;
}

function renderOrderInfo(c) {
  ['heading1', 'text1', 'heading2', 'text2'].forEach(function (key) {
    document.querySelector('.terms-' + key).textContent = c[key] || '';
  });
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

  // Clicking the image itself opens the product full screen
  track.addEventListener('click', function () { openOverlay(product); });
}


// Tapping the landing page scrolls down a bit, hinting at the shop below
document.querySelector('.landing').addEventListener('click', function () {
  window.scrollBy({ top: window.innerHeight * 0.60, behavior: 'smooth' });
});


// ---------- Product overlay ----------

const overlay = document.querySelector('.overlay');
const overlayTrack = overlay.querySelector('.overlay-track');
const overlayInfo = overlay.querySelector('.overlay-info');
const dots = overlay.querySelector('.dots');
let currentProduct = null;

function openOverlay(product) {
  const track = product.querySelector('.product-track');
  const current = Math.round(track.scrollLeft / track.clientWidth);
  currentProduct = product;

  // Copy the product's images and details into the overlay
  overlayTrack.innerHTML = track.innerHTML;
  overlayInfo.innerHTML = product.querySelector('.product-info').innerHTML;
  markSingle(overlay, overlayTrack);

  // One dot per image
  dots.innerHTML = '';
  overlayTrack.querySelectorAll('.slide').forEach(function (slide, i) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Image ' + (i + 1));
    dot.addEventListener('click', function () {
      overlayTrack.scrollTo({ left: i * overlayTrack.clientWidth, behavior: 'smooth' });
    });
    dots.appendChild(dot);
  });

  overlay.hidden = false;
  document.body.classList.add('no-scroll');

  // Start on the same image the visitor was looking at
  overlayTrack.scrollLeft = current * overlayTrack.clientWidth;
  updateDots();
}

// Highlight the dot of the image currently in view
function updateDots() {
  const current = Math.round(overlayTrack.scrollLeft / overlayTrack.clientWidth);
  dots.querySelectorAll('button').forEach(function (dot, i) {
    dot.classList.toggle('active', i === current);
  });
}
overlayTrack.addEventListener('scroll', updateDots);

function closeOverlay() {
  overlay.hidden = true;
  document.body.classList.remove('no-scroll');
}

overlay.querySelector('.prev').addEventListener('click', function () { step(overlayTrack, -1); });
overlay.querySelector('.next').addEventListener('click', function () { step(overlayTrack, 1); });
overlay.querySelector('.overlay-close').addEventListener('click', closeOverlay);

// The Order button is copied in with the product info, so listen on the container
overlayInfo.addEventListener('click', function (e) {
  if (e.target.closest('.order-button')) openOrder(currentProduct);
});


// ---------- Order form ----------

const orderView = document.querySelector('.order-view');
const orderForm = orderView.querySelector('.order-form');
const orderImage = orderView.querySelector('.order-image');
const formStatus = orderView.querySelector('.form-status');
const otherHint = orderView.querySelector('.other-hint');
const sizeOptions = orderView.querySelector('.size-options');

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

function openOrder(product) {
  const name = product.querySelector('.product-title').textContent;
  const price = product.querySelector('.product-price').textContent;

  // First product image in the top left corner
  orderImage.innerHTML = '';
  const first = product.querySelector('.slide');
  if (first) orderImage.appendChild(first.cloneNode(true));

  orderView.querySelector('.order-summary-name').textContent = name;
  orderView.querySelector('.order-summary-price').textContent = price;
  orderView.querySelector('.order-product-name').textContent = name;
  orderView.querySelector('.order-product-price').textContent = price;

  orderForm.reset();
  renderSizes(product.dataset.sizing);
  orderForm.elements.product.value = name;
  orderForm.elements.price.value = price;
  formStatus.textContent = '';
  updateOther();

  orderView.hidden = false;
  orderView.scrollTop = 0;
  alignTerms();
}

// Desktop: line up the top of the info box with the top of the Message box.
// The image above it fills the space that's left.
const orderLeft = orderView.querySelector('.order-left');
function alignTerms() {
  const message = orderForm.elements.message.getBoundingClientRect();
  const left = orderLeft.getBoundingClientRect();
  orderLeft.style.setProperty('--terms-top', (message.top - left.top) + 'px');
}
window.addEventListener('resize', function () {
  if (!orderView.hidden) alignTerms();
});
document.fonts.ready.then(function () {
  if (!orderView.hidden) alignTerms();
});

function closeOrder() {
  orderView.hidden = true;
}

orderView.querySelector('.order-back').addEventListener('click', closeOrder);

orderForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(orderForm));
  data._subject = 'Order request: ' + data.product;
  data._template = 'table';
  data._replyto = data.email; // Emma can hit "Reply" to answer the customer directly

  const button = orderForm.querySelector('button[type="submit"]');
  button.disabled = true;
  formStatus.textContent = 'Sending…';

  fetch('https://formsubmit.co/ajax/' + ORDER_EMAIL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(function (res) { return res.json(); })
    .then(function (res) {
      if (String(res.success) !== 'true') throw new Error(res.message);
      formStatus.textContent = 'Thank you! Your request has been sent. I will get back to you soon.';
      orderForm.reset();
      orderForm.elements.product.value = data.product;
      orderForm.elements.price.value = data.price;
      updateOther();
    })
    .catch(function () {
      formStatus.textContent = 'Something went wrong. Please try again' +
        (CONTACT_EMAIL ? ', or email ' + CONTACT_EMAIL + ' directly.' : '.');
    })
    .finally(function () {
      button.disabled = false;
    });
});


// ---------- Keyboard ----------

document.addEventListener('keydown', function (e) {
  if (!orderView.hidden) {
    if (e.key === 'Escape') closeOrder();
    return;
  }
  if (overlay.hidden) return;
  if (e.key === 'Escape') closeOverlay();
  if (e.key === 'ArrowLeft') step(overlayTrack, -1);
  if (e.key === 'ArrowRight') step(overlayTrack, 1);
});

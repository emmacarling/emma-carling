// Order requests are emailed here (via formsubmit.co)
const ORDER_EMAIL = '63460f1740cce258d377d960881792c9';


// Scroll a track one image left (-1) or right (+1)
function step(track, dir) {
  track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
}

// Arrows inside each product
document.querySelectorAll('.product').forEach(function (product) {
  const track = product.querySelector('.product-track');

  product.querySelector('.prev').addEventListener('click', function () { step(track, -1); });
  product.querySelector('.next').addEventListener('click', function () { step(track, 1); });

  // Clicking the image itself opens the product full screen
  track.addEventListener('click', function () { openOverlay(product); });
});


// ---------- Product overlay ----------

const overlay = document.querySelector('.overlay');
const overlayTrack = overlay.querySelector('.overlay-track');
const overlayInfo = overlay.querySelector('.overlay-info');
let currentProduct = null;

function openOverlay(product) {
  const track = product.querySelector('.product-track');
  const current = Math.round(track.scrollLeft / track.clientWidth);
  currentProduct = product;

  // Copy the product's images and details into the overlay
  overlayTrack.innerHTML = track.innerHTML;
  overlayInfo.innerHTML = product.querySelector('.product-info').innerHTML;

  overlay.hidden = false;
  document.body.classList.add('no-scroll');

  // Start on the same image the visitor was looking at
  overlayTrack.scrollLeft = current * overlayTrack.clientWidth;
}

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

function openOrder(product) {
  const name = product.querySelector('.product-title').textContent;
  const price = product.querySelector('.product-price').textContent;

  // First product image in the top left corner
  orderImage.innerHTML = '';
  orderImage.appendChild(product.querySelector('.slide').cloneNode(true));

  orderForm.reset();
  orderForm.elements.product.value = name;
  orderForm.elements.price.value = price;
  formStatus.textContent = '';

  orderView.hidden = false;
  orderView.scrollTop = 0;
}

function closeOrder() {
  orderView.hidden = true;
}

orderView.querySelector('.order-back').addEventListener('click', closeOrder);

orderForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(orderForm));
  data._subject = 'Order request: ' + data.product;
  data._template = 'table';

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
    })
    .catch(function () {
      formStatus.textContent = 'Something went wrong. Please try again, or email ' + ORDER_EMAIL + ' directly.';
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

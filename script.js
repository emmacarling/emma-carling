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


// ---------- Overlay ----------

const overlay = document.querySelector('.overlay');
const overlayTrack = overlay.querySelector('.overlay-track');
const overlayInfo = overlay.querySelector('.overlay-info');

function openOverlay(product) {
  const track = product.querySelector('.product-track');
  const current = Math.round(track.scrollLeft / track.clientWidth);

  // Copy the product's images and details into the overlay
  overlayTrack.innerHTML = track.innerHTML;
  overlayInfo.innerHTML = product.querySelector('.product-info').innerHTML;
  overlayInfo.scrollTop = 0;

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

document.addEventListener('keydown', function (e) {
  if (overlay.hidden) return;
  if (e.key === 'Escape') closeOverlay();
  if (e.key === 'ArrowLeft') step(overlayTrack, -1);
  if (e.key === 'ArrowRight') step(overlayTrack, 1);
});

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import axios from 'axios';

const galleryContainer = document.querySelector('.gallery');
const searchForm = document.querySelector('.search-form');
const loaderContainer = document.querySelector('.loader');
let loadMoreBtn;
const GALLERY_LINK = 'gallery-link';

let currentPage = 1;
let searchQuery = '';
let totalHits = 0;

loaderContainer.style.display = 'none';

const lightbox = new SimpleLightbox(`.${GALLERY_LINK}`);

searchForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  searchQuery = event.target.elements.search.value.trim();

  if (searchQuery === '') {
    toastError("Please enter a search query.");
    return;
  }

  currentPage = 1;
  galleryContainer.innerHTML = '';
  showLoader();
  try {
    const { data } = await fetchImages(searchQuery, currentPage);
    const { hits, total } = data;
    totalHits = total;

    if (hits.length > 0) {
      const galleryHTML = hits.map(createGallery).join('');
      galleryContainer.innerHTML = galleryHTML;
      toastSuccess(`Was found: ${totalHits} images`);
      searchForm.reset();
      lightbox.refresh();

      checkEndOfResults();
    } else {
      toastError('Sorry, there are no images matching your search query. Please try again!');
    }
  } catch (error) {
    toastError(`Error fetching images: ${error}`);
  } finally {
    hideLoader();
  }
});

async function loadMoreImages() {
  showLoader();
  currentPage++;

  try {
    const { data } = await fetchImages(searchQuery, currentPage);
    const { hits } = data;

    if (hits.length > 0) {
      const galleryHTML = hits.map(createGallery).join('');
      galleryContainer.insertAdjacentHTML('beforeend', galleryHTML);
      
      lightbox.refresh();

      checkEndOfResults();
      scrollToBottom();
    } else {
      checkEndOfResults();
    }
  } catch (error) {
    toastError(`Error fetching more images: ${error}`);
  } finally {
    hideLoader();
  }
}

function createLoadMoreButton() {
  loadMoreBtn = document.createElement('button');
  loadMoreBtn.classList.add('load-more-btn');
  loadMoreBtn.textContent = 'Load more';
  galleryContainer.after(loadMoreBtn);

  loadMoreBtn.addEventListener('click', loadMoreImages);
}

const toastOptions = {
  titleColor: '#FFFFFF',
  messageColor: '#FFFFFF',
  messageSize: '16px',
  position: 'topRight',
  displayMode: 'replace',
  closeOnEscape: true,
  pauseOnHover: false,
  maxWidth: 432,
  messageLineHeight: '24px',
};

function toastError(message) {
  iziToast.show({
    message,
    backgroundColor: '#EF4040',
    progressBarColor: '#FFE0AC',
    icon: 'icon-close',
    ...toastOptions,
  });
}

function toastSuccess(message) {
  iziToast.show({
    message,
    backgroundColor: '#59A10D',
    progressBarColor: '#B5EA7C',
    icon: 'icon-check',
    ...toastOptions,
  });
}

function showLoader() {
  loaderContainer.style.display = 'block';
}

function hideLoader() {
  loaderContainer.style.display = 'none';
}

function checkEndOfResults() {
  const totalDisplayed = document.querySelectorAll('.gallery-image').length;
  if (totalDisplayed >= totalHits) {
    if (loadMoreBtn) {
      loadMoreBtn.style.display = 'none';
    }
    toastSuccess("We're sorry, but you've reached the end of search results.");
  } else {
    if (!loadMoreBtn) {
      createLoadMoreButton();
    }
  }
}

function scrollToBottom() {
  const lastGalleryItem = galleryContainer.lastElementChild;
  window.scrollTo({
    top: lastGalleryItem.offsetTop + lastGalleryItem.offsetHeight,
    behavior: 'smooth',
  });
}

const BASE_URL = 'https://pixabay.com/api/';

async function fetchImages(q, page) {
  const params = new URLSearchParams({
    key: '42205340-8125de1ae06f98e0344d3d2b5',
    q,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page,
    per_page: 15,
  });

  const url = `${BASE_URL}?${params}`;
  return axios.get(url);
}

function createGallery({
  largeImageURL,
  tags,
  webformatURL,
  likes,
  views,
  comments,
  downloads,
}) {
  return `
  <a href="${largeImageURL}" class="${GALLERY_LINK}">
    <figure>
      <img src="${webformatURL}" alt="${tags}" class="gallery-image">
      <figcaption class="gallery__figcaption">
        <div class="image-item">Likes <span class="image-elem">${likes}</span></div>
        <div class="image-item">Views <span class="image-elem">${views}</span></div>
        <div class="image-item">Comments <span class="image-elem">${comments}</span></div>
        <div class="image-item">Downloads <span class="image-elem">${downloads}</span></div>
      </figcaption>
    </figure>
  </a>
`;
}

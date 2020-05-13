import * as yup from 'yup';
import axios from 'axios';
import watch from './view';

const routes = {
  corsUrl: () => 'https://cors-anywhere.herokuapp.com/',
};

const validate = (url, feeds) => {
  const schema = yup.string().url().notOneOf(feeds, 'This url already in use');
  try {
    schema.validateSync(url, { abortEarly: false });
    return '';
  } catch (e) {
    return e.message;
  }
};

const parseRss = (xmlData) => {
  const domParser = new DOMParser();
  const rssDom = domParser.parseFromString(xmlData, 'text/html');
  const feedTitle = rssDom.querySelector('title').textContent;
  const feedDescription = rssDom.querySelector('description').textContent;
  const rssItems = rssDom.querySelectorAll('item');
  const feedItems = [...rssItems].map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').nextSibling.textContent.trim();
    return { title, link };
  });
  return { feedTitle, feedDescription, feedItems };
};

export default () => {
  const state = {
    processState: 'filling',
    processErrors: null,
    urlList: [],
    feedsList: [],
    valid: true,
    errors: '',
  };
  const form = document.querySelector('form');

  watch(state);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formUrl = formData.get('url');
    const error = validate(formUrl, state.urlList);
    if (error.length !== 0) {
      state.valid = false;
      state.errors = error;
    } else {
      state.valid = true;
      state.errors = '';
      state.urlList.push(formUrl);
      state.processState = 'sending';
      axios.get(`${routes.corsUrl()}${formUrl}`)
        .then((response) => {
          const feed = parseRss(response.data);
          state.feedsList.push(feed);
          state.processState = 'finished';
        })
        .catch((err) => {
          state.processState = 'failed';
          state.processErrors = err;
        });
    }
  });
};

/* eslint no-param-reassign: "error" */

import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import resources from './locales/index.js';
import watch from './view';

const addProxy = (url) => `https://cors-anywhere.herokuapp.com/${url}`;

const requestTimeout = 5000;

const validateUrl = (url, feeds) => {
  const urlList = feeds.map((feed) => feed.url);
  const schema = yup
    .string()
    .url()
    .notOneOf(urlList, i18next.t('error.alreadyLoaded'));
  try {
    schema.validateSync(url, { abortEarly: false });
    return null;
  } catch (e) {
    return e.message;
  }
};

const parseRss = (xmlData) => {
  const domParser = new DOMParser();
  const rssDom = domParser.parseFromString(xmlData, 'text/html');
  const channelTitle = rssDom.querySelector('title').textContent;
  const channelDescription = rssDom.querySelector('description').textContent;
  const rssItems = rssDom.querySelectorAll('item');

  const feedItems = [...rssItems].map((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const linkElement = item.querySelector('link').nextSibling;
    const itemLink = linkElement.textContent.trim();
    const pubDate = item.querySelector('pubDate').textContent;
    return { itemTitle, itemLink, pubDate };
  });
  return { channelTitle, channelDescription, feedItems };
};

const getRss = (watchedState, url) => {
  watchedState.error = null;
  watchedState.processState = 'sending';
  return axios.get(addProxy(url))
    .then((response) => {
      const data = parseRss(response.data);
      const feed = {
        title: data.channelTitle, description: data.channelDescription, url, id: _.uniqueId(),
      };
      const feedItems = data.feedItems
        .map((post) => ({ ...post, channelId: feed.id }));
      watchedState.feedsList.push(feed);
      watchedState.postsList.push(...feedItems);
      watchedState.processState = 'finished';
    })
    .catch((err) => {
      watchedState.processState = 'failed';
      watchedState.error = err.message;
      throw err;
    });
};

const checkFeedUpdate = (watchedState) => {
  const promises = watchedState.feedsList.map((feed) => axios.get(addProxy(feed.url))
    .then((response) => {
      const data = parseRss(response.data);
      const feedItems = data.feedItems
        .map((post) => ({ ...post, channelId: feed.id }));
      const oldPosts = watchedState.postsList
        .filter((post) => post.channelId === feed.id);
      const lastPost = _.maxBy(oldPosts, (item) => Date.parse(item.pubDate));
      const newPosts = feedItems
        .map((item) => ({ ...item, channelId: feed.id }))
        .filter((item) => Date.parse(item.pubDate) > Date.parse(lastPost.pubDate));
      watchedState.postsList.unshift(...newPosts);
    }));

  return Promise.all(promises).finally(() => {
    setTimeout(() => checkFeedUpdate(watchedState), requestTimeout);
  });
};

export default () => {
  const elements = {
    form: document.querySelector('form'),
    feeds: document.querySelector('.feeds'),
    submitButton: document.querySelector('button[type="submit"]'),
    input: document.querySelector('input'),
  };

  const state = {
    processState: 'filling',
    feedsList: [],
    postsList: [],
    error: null,
    form: {
      valid: true,
      error: null,
    },
  };

  return i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then(() => {
    const watchedState = watch(state, elements);

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('url');
      const error = validateUrl(url, watchedState.feedsList);
      if (error) {
        watchedState.form = {
          valid: false,
          error,
        };
        return;
      }
      watchedState.form = {
        error: null,
        valid: true,
      };
      getRss(watchedState, url);
    });
    setTimeout(() => checkFeedUpdate(watchedState), requestTimeout);
  }).catch((err) => {
    console.log(err);
    throw err;
  });
};

import { watch } from 'melanke-watchjs';
import _ from 'lodash';

const errorMessages = {
  network: {
    error: 'Network Problems',
  },
};

const renderErrors = (element, error) => {
  const errorElement = element.nextElementSibling;
  if (errorElement) {
    element.classList.remove('is-invalid');
    errorElement.remove();
  }
  if (!error) {
    return;
  }
  const feedbackElement = document.createElement('div');
  feedbackElement.classList.add('feedback', 'text-danger');
  feedbackElement.innerHTML = error;
  element.classList.add('is-invalid');
  element.after(feedbackElement);
};

const renderFeed = (element, feedList) => {
  const rssDiv = element;
  rssDiv.innerHTML = '';
  _.forEachRight(feedList, (feed) => {
    const { feedTitle, feedDescription, feedItems } = feed;
    const titleEl = document.createElement('h3');
    titleEl.classList.add('mt-4');
    titleEl.textContent = feedTitle;
    const descriptionEl = document.createElement('p');
    descriptionEl.textContent = feedDescription;
    rssDiv.append(titleEl);
    rssDiv.append(descriptionEl);

    _.forEachRight(feedItems, (post) => {
      const { title, link } = post;
      const div = document.createElement('div');
      const postLink = document.createElement('a');
      postLink.href = link;
      postLink.textContent = title;
      div.append(postLink);
      rssDiv.append(div);
    });
  });
};

export default (state) => {
  const form = document.querySelector('form');
  const rssFeed = document.querySelector('.rss-feed');
  const submitButton = document.querySelector('button[type="submit"]');
  /*
  watch(state, 'valid', () => {
    submitButton.disabled = !state.form.valid;
  });
  */
  watch(state, 'errors', () => {
    renderErrors(form, state.errors);
  });

  watch(state, 'processErrors', () => {
    renderErrors(form, errorMessages.network.error);
  });

  watch(state, 'processState', () => {
    const { processState } = state;
    switch (processState) {
      case 'failed':
        submitButton.disabled = false;
        renderErrors(form, state.processErrors);
        break;
      case 'filling':
        submitButton.disabled = false;
        break;
      case 'sending':
        submitButton.disabled = true;
        break;
      case 'finished':
        submitButton.disabled = false;
        form.reset();
        renderFeed(rssFeed, state.feedsList);
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  });
  /*
    if (state.form.processState === 'sending') {
      // disable submit button
    }
    if (state.form.processState === 'finished') {
      form.reset()
      submit.disabled = false;
    }
    */
};

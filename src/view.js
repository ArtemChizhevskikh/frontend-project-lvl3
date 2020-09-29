/* eslint no-param-reassign: "error" */

import onChange from 'on-change';
import _ from 'lodash';
import i18next from 'i18next';

const buildChannelElement = (channel) => {
  const titleEl = document.createElement('h2');
  titleEl.classList.add('mt-4');
  titleEl.textContent = channel.title;
  const descriptionEl = document.createElement('p');
  descriptionEl.textContent = channel.description;
  return [titleEl, descriptionEl];
};

const buildPostElement = (post) => {
  const { itemTitle, itemLink } = post;
  const div = document.createElement('div');
  const postLink = document.createElement('a');
  postLink.href = itemLink;
  postLink.textContent = itemTitle;
  div.append(postLink);
  return div;
};

export default (state, elements) => {
  const renderFeedback = (type, error) => {
    const oldFeedback = elements.input.nextElementSibling;
    if (oldFeedback) {
      oldFeedback.remove();
    }
    const newFeedback = document.createElement('div');

    switch (type) {
      case 'error':
        newFeedback.classList.add('feedback', 'text-danger');
        newFeedback.textContent = error;
        elements.input.classList.add('is-invalid');
        elements.input.after(newFeedback);
        break;
      case 'success':
        newFeedback.classList.add('feedback', 'text-success');
        newFeedback.textContent = i18next.t('load.success');
        elements.input.after(newFeedback);
        break;
      default:
        throw new Error(`Unknown feedback type: ${type}`);
    }
  };

  const renderFeed = (watchedState) => {
    const { feedsList, postsList } = watchedState;
    const { feeds } = elements;
    feeds.innerHTML = '';
    _.forEachRight(feedsList, (channel) => {
      const channelNodes = buildChannelElement(channel);
      feeds.append(...channelNodes);
      const channelsPosts = postsList.filter((post) => post.channelId === channel.id);
      const postNodes = channelsPosts.map(buildPostElement);
      feeds.append(...postNodes);
    });
  };

  const processStateHandler = (watchedState) => {
    switch (watchedState.processState) {
      case 'failed':
        elements.submitButton.removeAttribute('disabled');
        elements.input.removeAttribute('disabled');
        break;
      case 'sending':
        elements.input.classList.remove('is-invalid');
        elements.submitButton.setAttribute('disabled', true);
        elements.input.setAttribute('disabled', true);
        break;
      case 'finished':
        elements.submitButton.removeAttribute('disabled');
        elements.input.removeAttribute('disabled');
        elements.input.value = '';
        renderFeedback('success');
        break;
      default:
        throw new Error(`Unknown process state: ${watchedState.processState}`);
    }
  };

  const mapping = {
    processState: () => processStateHandler(state),
    postsList: () => renderFeed(state),
    form: () => renderFeedback('error', state.form.error),
    error: () => renderFeedback('error', state.error),
  };

  const watchedState = onChange(state, (path, value) => {
    console.log(path, value);
    if (mapping[path]) {
      mapping[path]();
    }
  });
  return watchedState;
};

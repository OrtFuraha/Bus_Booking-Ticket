(function () {
  var iconMarkup = {
    success:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 16.4 4.8 12l1.4-1.4 3 3 8.6-8.6L19.2 6z"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13.4 12 4.7-4.7-1.4-1.4-4.7 4.7-4.7-4.7-1.4 1.4L10.6 12l-4.7 4.7 1.4 1.4 4.7-4.7 4.7 4.7 1.4-1.4z"/></svg>',
    warning:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21h22L12 2Zm12-3h-2v2h2zm0-8h-2v6h2z"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 9h2V7h-2zm0 8h2v-6h-2zm1-15a10 10 0 1 0 10 10A10 10 0 0 0 12 2"/></svg>'
  };

  function detectType(text) {
    var value = (text || '').toLowerCase();
    if (/error|wrong|failed|not available|incorrect|sorry|can\'t|cannot|not sent|not activated|already been selected|not inserted/.test(value)) {
      return 'error';
    }
    if (/success|added|created|activated|updated|changed|sent|delivered|thank you|completed|booked/.test(value)) {
      return 'success';
    }
    if (/delete|deactivate|warning|already|expired|pending|not activated/.test(value)) {
      return 'warning';
    }
    return 'info';
  }

  function hasEditableInputs(form) {
    var fields = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var tag = field.tagName.toLowerCase();
      var type = (field.type || '').toLowerCase();
      if (tag === 'select' || tag === 'textarea') {
        return true;
      }
      if (tag === 'input' && type && type !== 'hidden' && type !== 'button' && type !== 'submit') {
        return true;
      }
    }
    return false;
  }

  function getMessageNode(form) {
    return form.querySelector('h1, h2, h3');
  }

  function getNoticeAction(form) {
    return form.querySelector('input[type="button"], button[type="button"], .agency_send_button[type="button"]');
  }

  function addLegacyNoticeEnhancement() {
    var wrappers = document.querySelectorAll('.agency_cars_creation_form, .agency_destination_creation_form');
    wrappers.forEach(function (wrapper) {
      var form = wrapper.querySelector('form');
      if (!form || form.dataset.noticeEnhanced === '1') {
        return;
      }
      if (hasEditableInputs(form)) {
        return;
      }

      var messageNode = getMessageNode(form);
      if (!messageNode) {
        return;
      }

      var text = (messageNode.textContent || '').replace(/\s+/g, ' ').trim();
      var type = detectType(text);
      var actionButton = getNoticeAction(form);
      var actionText = actionButton ? (actionButton.value || actionButton.textContent || '').trim() : '';
      var shouldAutoAction = actionButton && /continue|next|close|back|okay|exit|sign in|choose again|try again|try/i.test(actionText);
      var autoActionMs = type === 'success' ? 4600 : 6200;

      wrapper.classList.add('legacy-notice', 'notice-' + type);
      form.classList.add('legacy-notice-card');
      form.dataset.noticeEnhanced = '1';

      var iconWrap = document.createElement('div');
      iconWrap.className = 'notice-icon';
      iconWrap.innerHTML = iconMarkup[type] || iconMarkup.info;
      form.insertBefore(iconWrap, form.firstChild);

      messageNode.classList.add('notice-title');

      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'notice-close';
      closeBtn.setAttribute('aria-label', 'Close message');
      closeBtn.innerHTML = '&times;';
      form.appendChild(closeBtn);

      closeBtn.addEventListener('click', function () {
        wrapper.classList.add('notice-leaving');
        setTimeout(function () {
          if (actionButton && shouldAutoAction) {
            actionButton.click();
          } else {
            wrapper.style.display = 'none';
          }
        }, 220);
      });

      var progress = document.createElement('div');
      progress.className = 'notice-progress';
      progress.style.animationDuration = autoActionMs + 'ms';
      form.appendChild(progress);

      if (shouldAutoAction) {
        setTimeout(function () {
          if (!wrapper.classList.contains('notice-leaving')) {
            wrapper.classList.add('notice-leaving');
            setTimeout(function () {
              actionButton.click();
            }, 220);
          }
        }, autoActionMs);
      }
    });
  }

  var toastStack = null;

  function ensureToastStack() {
    if (toastStack) {
      return toastStack;
    }
    toastStack = document.createElement('div');
    toastStack.className = 'app-toast-stack';
    document.body.appendChild(toastStack);
    return toastStack;
  }

  function showToast(options) {
    options = options || {};
    var type = options.type || 'info';
    var title = options.title || (type.charAt(0).toUpperCase() + type.slice(1));
    var message = options.message || '';
    var duration = typeof options.duration === 'number' ? options.duration : 4200;

    var stack = ensureToastStack();
    var toast = document.createElement('div');
    toast.className = 'app-toast app-toast-' + type;

    var icon = document.createElement('div');
    icon.className = 'app-toast-icon';
    icon.innerHTML = iconMarkup[type] || iconMarkup.info;

    var body = document.createElement('div');
    body.className = 'app-toast-body';
    body.innerHTML = '<strong>' + title + '</strong><p>' + message + '</p>';

    var close = document.createElement('button');
    close.className = 'app-toast-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.innerHTML = '&times;';

    toast.appendChild(icon);
    toast.appendChild(body);
    toast.appendChild(close);
    stack.appendChild(toast);

    function removeToast() {
      toast.classList.add('leaving');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 220);
    }

    close.addEventListener('click', removeToast);
    setTimeout(removeToast, duration);
  }

  window.AppNotify = {
    show: showToast
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addLegacyNoticeEnhancement);
  } else {
    addLegacyNoticeEnhancement();
  }
})();

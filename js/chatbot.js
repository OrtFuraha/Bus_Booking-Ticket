(function () {
  var botStyles = document.createElement('style');
  botStyles.textContent = "\
  .chatbot-toggle{position:fixed;right:18px;bottom:18px;z-index:4000;background:#ff6b00;color:#fff;border:none;border-radius:999px;padding:12px 16px;font-weight:700;cursor:pointer;box-shadow:0 14px 30px rgba(0,0,0,.25)}\
  .chatbot-box{position:fixed;right:18px;bottom:78px;width:360px;max-width:calc(100vw - 28px);background:#fff;border:1px solid #ffd3b5;border-radius:16px;z-index:4000;display:none;overflow:hidden;box-shadow:0 22px 45px rgba(0,0,0,.24)}\
  .chatbot-box.open{display:block}\
  .chatbot-head{background:linear-gradient(135deg,#ff6b00,#ff8b35);color:#fff;padding:12px 14px;font-weight:700;display:flex;justify-content:space-between;align-items:center}\
  .chatbot-head small{display:block;font-weight:500;opacity:.9}\
  .chatbot-body{padding:12px;height:310px;overflow:auto;background:#fff7f0}\
  .chat-msg{margin-bottom:10px;font-size:13.8px;line-height:1.45;max-width:86%}\
  .chat-msg.bot{color:#1a1a1a;background:#fff;border:1px solid #ffe0ca;padding:9px 10px;border-radius:10px 10px 10px 2px}\
  .chat-msg.user{color:#fff;background:#ff6b00;text-align:left;padding:9px 10px;border-radius:10px 10px 2px 10px;margin-left:auto}\
  .chat-suggestions{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid #ffe5d3;background:#fff}\
  .chat-chip{border:1px solid #ffc8a2;background:#fff3e8;color:#ca5500;border-radius:999px;padding:5px 9px;font-size:12px;cursor:pointer}\
  .chatbot-input{display:flex;border-top:1px solid #ffd9bf;background:#fff}\
  .chatbot-input input{flex:1;border:none;padding:11px 12px;outline:none;font-size:13.5px}\
  .chatbot-input button{border:none;background:#ff6b00;color:#fff;padding:0 14px;font-weight:700;cursor:pointer}\
  .chatbot-x{background:none;border:none;color:#fff;font-size:18px;cursor:pointer}\
  .chat-typing{font-size:12px;color:#8a4a1c;padding:0 12px 8px;display:none}\
  ";
  document.head.appendChild(botStyles);

  var toggle = document.createElement('button');
  toggle.className = 'chatbot-toggle';
  toggle.type = 'button';
  toggle.textContent = 'Support Chat';

  var box = document.createElement('div');
  box.className = 'chatbot-box';
  box.innerHTML =
    '<div class="chatbot-head">' +
      '<div>RwandaBus Assistant<small>Smart help for this system</small></div>' +
      '<button class="chatbot-x" type="button">x</button>' +
    '</div>' +
    '<div class="chatbot-body" id="chatbotBody">' +
      '<div class="chat-msg bot">Hello! I can help with booking, seats, payments, company filters, dashboards, routes, and support issues.</div>' +
    '</div>' +
    '<div class="chat-typing" id="chatTyping">Assistant is typing...</div>' +
    '<div class="chat-suggestions" id="chatSuggestions">' +
      '<button class="chat-chip" data-msg="How do I book a ticket?">How to book</button>' +
      '<button class="chat-chip" data-msg="How seat selection works?">Seat selection</button>' +
      '<button class="chat-chip" data-msg="How do I pay?">Payments</button>' +
      '<button class="chat-chip" data-msg="How to find a company?">Find company</button>' +
    '</div>' +
    '<form class="chatbot-input" id="chatbotForm">' +
      '<input id="chatbotInput" type="text" placeholder="Ask about tickets, seats, companies, dashboards..." required />' +
      '<button type="submit">Send</button>' +
    '</form>';

  document.body.appendChild(toggle);
  document.body.appendChild(box);

  var kb = {
    booking: [
      'Open Booking, choose a bus, fill your details, select your seat, then submit.',
      'From Home, click a bus card or company card. On the booking form, choose a free seat and complete payment instructions.',
      'Booking steps: select trip -> select seat -> enter name/phone/email -> confirm.'
    ],
    seat: [
      'Gray seats are already taken. Click an available seat to select it before submitting.',
      'Each seat can be booked once. If two users click the same seat, only the first successful booking is saved.',
      'Seat number is stored with your booking and included in the confirmation email.'
    ],
    payment: [
      'After booking, follow the Mobile Money code shown on screen to complete payment.',
      'Use the exact amount shown in the booking confirmation and keep your payment proof.',
      'Agency confirms payment and then activates the ticket.'
    ],
    ticket: [
      'Each booking has a 5-character ticket number (letters and numbers).',
      'Ticket email includes trip details, selected seat, and your unique ticket code.',
      'If you need verification, share your ticket number with support.'
    ],
    company: [
      'Use the search box in Our Partners to find companies by name, phone, or CEO.',
      'Click any company card to view only that company\'s available tickets.',
      'Company cards show logo, name, and contact details for quick comparison.'
    ],
    route: [
      'Use From/To selectors on Home to filter buses by route.',
      'Booking page also supports route filtering through selected origin and destination.',
      'Only upcoming buses with available seats are displayed.'
    ],
    dashboard: [
      'Admin dashboard manages agencies, locations, and feedback.',
      'Agency dashboard manages drivers, cars, destinations, and client ticket activations.',
      'The Clients Paid table shows seat count, selected seat number, and ticket number.'
    ],
    account: [
      'Agency users can sign in from Home and use Change Password inside agency dashboard.',
      'If login fails, verify username/password and account activation status.',
      'Admins can activate pending agencies from the admin panel.'
    ],
    contact: [
      'Use Contact Us page to send support messages.',
      'Include your ticket number and phone for faster help.',
      'For payment issues, contact the agency shown on the booking card.'
    ],
    fallback: [
      'I can help with booking, seats, payments, routes, company search, tickets, and dashboard tasks.',
      'Try asking: "How do I book?", "How do seats work?", "Where is my ticket number?"',
      'If your question is specific, mention page name (Home, Booking, Admin, Agency) and I will guide you step by step.'
    ]
  };

  function pick(list, seedText) {
    var index = Math.abs(hashCode(seedText)) % list.length;
    return list[index];
  }

  function hashCode(value) {
    var h = 0;
    for (var i = 0; i < value.length; i++) {
      h = (h << 5) - h + value.charCodeAt(i);
      h |= 0;
    }
    return h;
  }

  function classify(text) {
    var q = text.toLowerCase();

    if (/\b(hello|hi|hey|good morning|good afternoon)\b/.test(q)) return 'greet';
    if (/\b(book|booking|buy|reserve|order)\b/.test(q)) return 'booking';
    if (/\b(seat|chair|place number|selected seat)\b/.test(q)) return 'seat';
    if (/\b(pay|payment|momo|mobile money|code|price|amount)\b/.test(q)) return 'payment';
    if (/\b(ticket number|ticket code|ticket|reference)\b/.test(q)) return 'ticket';
    if (/\b(company|agency|partner|logo|ceo)\b/.test(q)) return 'company';
    if (/\b(route|from|to|destination|origin|location)\b/.test(q)) return 'route';
    if (/\b(dashboard|admin|agency panel|client paid|clients paid|table|report)\b/.test(q)) return 'dashboard';
    if (/\b(login|sign in|password|account|activate)\b/.test(q)) return 'account';
    if (/\b(contact|support|help|message|email)\b/.test(q)) return 'contact';
    return 'fallback';
  }

  function botReply(text) {
    var intent = classify(text);

    if (intent === 'greet') {
      return 'Hello. Ask me anything about this bus booking system and I will guide you.';
    }

    var answer = pick(kb[intent] || kb.fallback, text);

    if (intent === 'booking') {
      answer += ' Tip: choose a bus with available seats badge before opening the form.';
    }

    if (intent === 'seat' && /\b(20|30|40|50|60)\b/.test(text)) {
      answer += ' If the bus has that many seats, all seat numbers are shown and unavailable ones are disabled.';
    }

    return answer;
  }

  function appendMessage(role, message) {
    var body = document.getElementById('chatbotBody');
    var item = document.createElement('div');
    item.className = 'chat-msg ' + role;
    item.textContent = message;
    body.appendChild(item);
    body.scrollTop = body.scrollHeight;
  }

  function sendUserMessage(text) {
    appendMessage('user', text);
    var typing = document.getElementById('chatTyping');
    typing.style.display = 'block';
    setTimeout(function () {
      typing.style.display = 'none';
      appendMessage('bot', botReply(text));
    }, 280);
  }

  toggle.addEventListener('click', function () {
    box.classList.toggle('open');
  });

  box.querySelector('.chatbot-x').addEventListener('click', function () {
    box.classList.remove('open');
  });

  box.querySelectorAll('.chat-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      sendUserMessage(chip.getAttribute('data-msg'));
    });
  });

  box.querySelector('#chatbotForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var input = box.querySelector('#chatbotInput');
    var text = input.value.trim();
    if (!text) return;
    sendUserMessage(text);
    input.value = '';
  });
})();

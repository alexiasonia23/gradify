/*
   GRADIFY — app.js
   Technologies: jQuery (Lab 1), Vue.js (Lab 2), WebSocket (Lab 2),
                 D3.js (Lab 4), Leaflet/GPS (Lab 6)
 */


$(document).ready(function () {

  //  Navbar scroll effect 
  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 60) {
      $('#navbar').addClass('scrolled');
    } else {
      $('#navbar').removeClass('scrolled');
    }
  });

  //  Smooth scroll for nav links
  $('a.nav-link, a[href^="#"]').on('click', function (e) {
    const target = $(this).attr('href');
    if (target && target.startsWith('#') && $(target).length) {
      e.preventDefault();
      $('html, body').animate({
        scrollTop: $(target).offset().top - 80
      }, 700, 'swing');
    }
  });

  // Scroll reveal animation 
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          $(entry.target).addClass('visible');
        }, i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  // Add reveal class to major sections
  $('#gallery .gallery-card, #team .team-card, .stat-box, .location-detail').each(function () {
    $(this).addClass('reveal');
    revealObserver.observe(this);
  });

  //  Counter animation (stats section)
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $('.stat-number').each(function () {
          const $el = $(this);
          const target = parseInt($el.data('target'));
          let current = 0;
          const step = Math.ceil(target / 50);
          const interval = setInterval(() => {
            current = Math.min(current + step, target);
            $el.text(current);
            if (current >= target) clearInterval(interval);
          }, 30);
        });
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });

  if ($('#stats').length) statsObserver.observe($('#stats')[0]);

  //  Contact Form Validation 
  $('#contact-form').on('submit', function (e) {
    e.preventDefault();
    let valid = true;

    // Name validation
    const name = $('#fname').val().trim();
    if (name.length < 2) {
      $('#fname-err').addClass('visible');
      $('#fname').css('border-color', '#ffb3b3');
      valid = false;
    } else {
      $('#fname-err').removeClass('visible');
      $('#fname').css('border-color', '');
    }

    // Email validation
    const email = $('#femail').val().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      $('#femail-err').addClass('visible');
      $('#femail').css('border-color', '#ffb3b3');
      valid = false;
    } else {
      $('#femail-err').removeClass('visible');
      $('#femail').css('border-color', '');
    }

    if (valid) {
      // Simulate form submission
      const $btn = $(this).find('button[type="submit"]');
      $btn.text('Sending...').prop('disabled', true);
      setTimeout(() => {
        $('#form-success').fadeIn(400);
        $btn.text('Send My Request ✉️').prop('disabled', false);
        $('#contact-form input, #contact-form select, #contact-form textarea').val('');
      }, 1000);
    }
  });

  //  Clear error on input 
  $('#fname').on('input', function () {
    if ($(this).val().trim().length >= 2) {
      $('#fname-err').removeClass('visible');
      $(this).css('border-color', '');
    }
  });
  $('#femail').on('input', function () {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test($(this).val().trim())) {
      $('#femail-err').removeClass('visible');
      $(this).css('border-color', '');
    }
  });

  //Chat toggle via jQuery 
  $('#heroChatBtn, #navChatBtn, #chat-bubble').on('click', function () {
    openChat();
  });

  $('#chatClose').on('click', function () {
    closeChat();
  });

  // Close chat on ESC key
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') closeChat();
  });
});

/* 
   2. VUE.JS GALLERY APP (Lab 2 — Component-based architecture)
*/
const { createApp, ref, computed } = Vue;

// Gallery Application
createApp({
  setup() {
    const activeFilter = ref('All');
    const hoveredCard = ref(null);

const categories = [
  'All',
  '🎵 Music Related',
  '🐾 Animals',
  '💬 Quotes',
  '⭐ Characters',
  '🌸 Florals'
];

      const galleryItems = [
          {
              id: 1,
              title: 'Bunny Love',
              description: 'grammy winning artist',
              category: '🎵 Music Related',
              image: 'assets/gallery/bunny.jpg'
          },
          {
              id: 2,
              title: 'Cat Mom',
              description: 'cats illustration with engineering accents',
              category: '🐾 Animals',
              image: 'assets/gallery/cats.jpg'
          },
          {
              id: 3,
              title: 'Just Keep Swimming',
              description: 'dory-themed cap with hand-painted details',
              category: '⭐ Character',
              image: 'assets/gallery/dory.jpg'
          },
          {
              id: 4,
              title: 'Pink Floyd',
              description: 'best album ever',
              category: '🎵 Music Related',
              image: 'assets/gallery/pinkf.jpg'
          },
          {
              id: 5,
              title: 'Quote King',
              description: 'hand-lettered quote to always keep in mind',
              category: '💬 Quotes',
              image: 'assets/gallery/quote.jpg'
          },
          {
              id: 6,
              title: 'Strawberry Dream',
              description: 'strawberryshortcake themed cap with cute details',
              category: '⭐ Characters',
              image: 'assets/gallery/strawberry.jpg'
          },

          {
              id: 7,  
              title: 'Floral Stars',
              description: 'flowers with tiny star quote — dreamy and elegant',
              category: '🌸 Floral',
              image: 'assets/gallery/floralstars.jpg'
          },
          {
              id: 8,    
              title: 'Star Girl',
              description: 'animal print and glitter',
              category: '💬 Quotes',
              image: 'assets/gallery/stargirl.jpg'
          },

          {
              id: 9,   
              title: 'Silly one',
              description: 'just a funny little quote',
              category: '💬 Quotes',
              image: 'assets/gallery/frigidere.jpg'
          }

            
      ];

    const filteredItems = computed(() => {
      if (activeFilter.value === 'All') return galleryItems;
      return galleryItems.filter(item => item.category === activeFilter.value);
    });

    return { categories, activeFilter, galleryItems, filteredItems, hoveredCard };
  }
}).mount('#gallery-app');

// Team Application
createApp({
  setup() {
    const team= [
      {
        id: 1,
        name: 'Alexia',
        role: 'founder & CEO',
          bio: 'started gradify after witnessing a big gap aka opportunity in the cluj local market for customized graduation caps',
          image: 'assets/team/alexia.jpg',
        color: 'linear-gradient(135deg, #722F37, #9a4450)',
          specialties: ['Marketing', 'Finance', 'Brand Vision']
      },
      {
        id: 2,
        name: 'Olivia',
        role: 'lead artist',
          bio: 'our most talented and hardworking girl, Livy can turn your wildest dream in reality in just a matter of hours!',
          image: 'assets/team/olivia.jpg',
        color: 'linear-gradient(135deg, #b5860d, #d4a520)',
        specialties: ['Creative Boss Girl', 'Color theory', 'Cat Art'],
        },

      {
        id: 3,
        name: 'Gigi',
        role: 'Photographer & Designer',
          bio: 'Gigi makes the most beautiful photographs and designs but still chooses to call herself: ,,sfatuitor integral" ',
          image: 'assets/team/gigi.jpg',
        color: 'linear-gradient(135deg, #4a2560, #7b3fa0)',
        specialties: ['Photography', 'Calligraphy', 'Quote Design']
      }

    ];

    return { team };
  }
}).mount('#team');

/*
   3. D3.JS BAR CHART 
*/
function renderD3Chart() {
  const container = document.getElementById('d3-chart');
  if (!container) return;

  const data = [
    { style: 'Floral',     orders: 1 },
    { style: 'Animals',   orders: 2 },
    { style: 'Glitter',    orders: 1 },
    { style: 'Quotes', orders: 3 },
    { style: 'Characters',   orders: 3 },
    { style: 'Mixed',      orders: 1 },
  ];

  const containerWidth = container.clientWidth || 700;
  const margin = { top: 20, right: 20, bottom: 50, left: 40 };
  const width  = containerWidth - margin.left - margin.right;
  const height = 240 - margin.top - margin.bottom;

  const svg = d3.select('#d3-chart')
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', 240)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.style))
    .range([0, width])
    .padding(0.35);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.orders) * 1.15])
    .range([height, 0]);

  // X axis
  svg.append('g')
    .attr('class', 'd3-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call(g => g.select('.domain').remove());

  // Y axis
  svg.append('g')
    .attr('class', 'd3-axis')
    .call(d3.axisLeft(y).ticks(4).tickSize(-width))
    .call(g => g.select('.domain').remove());

  // Bars
  svg.selectAll('.d3-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'd3-bar')
    .attr('x', d => x(d.style))
    .attr('y', height)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('rx', 6)
    .attr('ry', 6)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('y', d => y(d.orders))
    .attr('height', d => height - y(d.orders));

  // Value labels on bars
  svg.selectAll('.d3-value')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'd3-value')
    .attr('x', d => x(d.style) + x.bandwidth() / 2)
    .attr('y', d => y(d.orders) - 6)
    .attr('text-anchor', 'middle')
    .text(d => d.orders)
    .style('opacity', 0)
    .transition()
    .delay((d, i) => i * 100 + 600)
    .duration(400)
    .style('opacity', 1);
}

// Render D3 chart when stats section is visible
const d3Observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      renderD3Chart();
      d3Observer.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsSection = document.getElementById('stats');
if (statsSection) d3Observer.observe(statsSection);

/* 
   4. LEAFLET MAP — HQ Location in Cluj-Napoca  */
function initMap() {
  // Cluj-Napoca coordinates
  const lat = 46.76893;
  const lng = 23.58692;

  const map = L.map('map', {
    center: [lat, lng],
    zoom: 15,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  // OpenStreetMap tile layer (free, no API key)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // Custom wine-red marker icon (SVG inline)
  const gradifyIcon = L.divIcon({
    className: '',
    html: `
      <div style="
        background: #722F37;
        width: 40px; height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(114,47,55,0.5);
        border: 3px solid #FCF6EF;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">🎓</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -44],
  });

  // Add marker
  L.marker([lat, lng], { icon: gradifyIcon })
    .addTo(map)
    .bindPopup(`
      <div style="font-family: 'DM Sans', sans-serif; padding: 4px;">
        <strong style="color: #722F37; font-size: 1rem;">🎓 gradify hq</strong><br/>
        <span style="color: #555; font-size: 0.85rem;">Strada Epicop Ioan Bob 10, Cluj-Napoca</span><br/>
        <span style="color: #888; font-size: 0.8rem; margin-top: 4px; display: block;">
          Mon–Fri: 9:00–21:00 · Sat: 10:00–18:00
        </span>
      </div>
    `, { maxWidth: 240 })
    .openPopup();
}

// Init map when section is visible
const mapObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      initMap();
      mapObserver.disconnect();
    }
  });
}, { threshold: 0.2 });

const locationSection = document.getElementById('location');
if (locationSection) mapObserver.observe(locationSection);

/* 
   5. WEBSOCKET CHAT (Lab 2 — Real-time bidirectional communication)
 */
let socket = null;
let chatOpen = false;

function connectWebSocket() {
  const wsUrl = `ws://${window.location.host}`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected ✓');
      $('#chatStatus').text('● Online').addClass('online');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        hideTypingIndicator();
        appendChatMessage(data.user, data.msg, data.type, data.time);

        // Show badge if chat is closed
        if (!chatOpen && data.type === 'bot') {
          showChatBadge();
        }
      } catch (e) {
        console.error('Chat message parse error:', e);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      $('#chatStatus').text('● Offline').removeClass('online');
      // Attempt reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    socket.onerror = (err) => {
      console.warn('WebSocket error — chat running in demo mode');
      $('#chatStatus').text('● Demo Mode').removeClass('online');
      enableDemoMode();
    };

  } catch (e) {
    console.warn('WebSocket unavailable — running in demo mode');
    enableDemoMode();
  }
}

// Demo mode (no server running) — simulates the chat
function enableDemoMode() {
  const demoReplies = [
    "hey! 👋 welcome to our website. we help you customize your grad cap with your unique vision — flowers, portraits, quotes, glitter, you name it! how can we help you today?",
    "we'd love to help you design your perfect grad cap! 🎓",
    "our turnaround is 3–5 business days. rush orders are available too!",
    "send us a reference photo or describe your vision and we'll make it happen ✨",
    "our prices start at 50 RON for a basic design. you can dm us on instagram as well!",
    "we're based in cluj-napoca 📍 but we ship anywhere in romania!",
  ];

  let demoIndex = 0;

  // Auto-send welcome message
  setTimeout(() => {
    appendChatMessage('Gradify Team', demoReplies[0], 'bot',
      new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }));
    showChatBadge();
    demoIndex = 1;
  }, 800);

  // Override send function for demo mode
  window._demoSend = (msg) => {
    appendChatMessage('You', msg, 'client',
      new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }));
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      const reply = demoReplies[demoIndex % demoReplies.length];
      demoIndex++;
      appendChatMessage('Gradify Team', reply, 'bot',
        new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }));
    }, 1300);
  };
}

function sendChatMessage() {
  const $input = $('#chatInput');
  const msg = $input.val().trim();
  if (!msg) return;

  $input.val('');

  // Demo mode
  if (window._demoSend) {
    window._demoSend(msg);
    return;
  }

  // Real WebSocket
  if (socket && socket.readyState === WebSocket.OPEN) {
    showTypingIndicator();
    socket.send(JSON.stringify({ user: 'You', msg }));
  }
}

function appendChatMessage(user, msg, type, time) {
  const $messages = $('#chatMessages');
  const msgClass = (type === 'client') ? 'client' : 'bot';

  const $msg = $(`
    <div class="chat-msg ${msgClass}">
      <div class="chat-msg-bubble">${escapeHtml(msg)}</div>
      <div class="chat-msg-meta">${escapeHtml(user)} · ${time || ''}</div>
    </div>
  `);

  $messages.append($msg);
  $messages.scrollTop($messages[0].scrollHeight);
}

function showTypingIndicator() {
  const $messages = $('#chatMessages');
  $messages.append(`
    <div class="chat-msg bot" id="typingIndicator">
      <div class="chat-typing">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `);
  $messages.scrollTop($messages[0].scrollHeight);
}

function hideTypingIndicator() {
  $('#typingIndicator').remove();
}

function showChatBadge() {
  $('#chatBadge').show();
}

function hideChatBadge() {
  $('#chatBadge').hide();
}

function openChat() {
  $('#chat-panel').addClass('open');
  chatOpen = true;
  hideChatBadge();
  setTimeout(() => {
    $('#chatInput').focus();
    const $m = $('#chatMessages');
    $m.scrollTop($m[0].scrollHeight);
  }, 300);
}

function closeChat() {
  $('#chat-panel').removeClass('open');
  chatOpen = false;
}

// Send on button click or Enter key
$(document).on('click', '#chatSend', sendChatMessage);
$(document).on('keydown', '#chatInput', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// Helper: escape HTML to prevent XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

//Init WebSocket connection
connectWebSocket();

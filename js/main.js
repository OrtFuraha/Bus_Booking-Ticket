document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.getElementById('navbar');
  var hamburger = document.getElementById('hamburger');

  function handleScroll() {
    if (!navbar) return;
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  if (hamburger && navbar) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      navbar.classList.toggle('open');
      document.body.style.overflow = navbar.classList.contains('open') ? 'hidden' : '';
    });

    var navLinks = navbar.querySelectorAll('.nav-links a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        navbar.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  var swapBtn = document.getElementById('swapBtn');
  if (swapBtn) {
    swapBtn.addEventListener('click', function () {
      var selects = document.querySelectorAll('.booking-form select');
      if (selects.length >= 2) {
        var first = selects[0].value;
        selects[0].value = selects[1].value;
        selects[1].value = first;
      }
    });
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.section-header, .bus-card, .company-card').forEach(function (el) {
    el.classList.add('scroll-reveal');
    observer.observe(el);
  });

  var companySearch = document.getElementById('companySearch');
  if (companySearch) {
    var companyCards = document.querySelectorAll('.company-card');
    var noCompanies = document.getElementById('noCompanies');

    companySearch.addEventListener('input', function () {
      var term = companySearch.value.trim().toLowerCase();
      var visibleCount = 0;

      companyCards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-company-name') || '',
          card.getAttribute('data-company-phone') || '',
          card.getAttribute('data-company-ceo') || ''
        ].join(' ');

        var match = haystack.indexOf(term) !== -1;
        card.style.display = match ? '' : 'none';
        if (match) visibleCount += 1;
      });

      if (noCompanies) {
        noCompanies.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    });
  }
});


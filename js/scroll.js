window.addEventListener('scroll', function () {
  var nav = document.querySelector('nav');
  if (nav) {
    nav.classList.toggle('nav-sticky', window.scrollY > 0);
  }
});

var legacyBurger = document.querySelector('.humburger');
var legacyNav = document.querySelector('.nav');

if (legacyBurger && legacyNav && !document.getElementById('hamburger')) {
  legacyBurger.addEventListener('click', function () {
    if (legacyNav.classList.contains('active')) {
      legacyNav.classList.remove('active');
      legacyBurger.innerHTML = '&#9776;';
    } else {
      legacyNav.classList.add('active');
      legacyBurger.innerHTML = '&#10006;';
    }
  });
}


<script>
  export let footer = false
</script>

<ul class={ `nav__list ${footer ? 'nav__list--footer' : ''}`} >
  <li class="nav__list__item">
    <a class="nav__list__item__link">Products</a>
  </li>
  <li class="nav__list__item">
    <a class="nav__list__item__link">Pricing</a>
  </li>
  <li class="nav__list__item">
    <a class="nav__list__item__link">FAQ</a>
  </li>
  <li class="nav__list__item">
    <a class="nav__list__item__link">Blog</a>
  </li>
</ul>

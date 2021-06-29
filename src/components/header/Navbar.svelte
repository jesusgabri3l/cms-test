<script>
   import NavList from '../layouts/NavList.svelte';
</script>

<nav class="navbar">
  <div class="navbar__section">
    <span class="logo">
      <img
        src="assets/img/logo.svg"
        alt="Logo page"
        class="logo__img"
      />
    </span>
    <NavList />
  </div>
  <div class="navbar__section">
    <button class="button button--lg button--secondary--transparent mr-md-2">Login</button>
    <button class="button button--lg button--secondary--outline">Sign up</button>
  </div>
</nav>

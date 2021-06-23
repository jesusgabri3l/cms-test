<script>
    import Navbar from "./Navbar.svelte";
</script>
<header class="mx header">
    <Navbar />
    <section class="mt-3">
      <div class="container container--flex container--flex--header">
        <div class="container--flex__item">
          <h1 class="text text--white header__title">Monitor your business on real-time dashboard</h1>
          <p class = "text text--gray header__text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum
            nisi aliquet volutpat pellentesque volutpat est. Sapien in etiam
            vitae nibh nunc mattis imperdiet sed nullam.
          </p>
          <button class="button button--primary button--40p">Try for free</button>
        </div>
        <div class="container--flex__item">
            <img src="assets/img/chart-header.svg" alt="" class="img img--header">
		    </div>
      </div>
    </section>
  </header>
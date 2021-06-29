<script>
  import PricingCard from "./PricingCard.svelte";
  import NavList from "../layouts/NavList.svelte";
</script>

<footer class="footer">
  <section class="section section--default">
    <h3 class="text text--white text--title text--center mt-5">
      Pricing plans
    </h3>
    <p class="text text--gray text--center text--lineheight">
      Lorem, ipsum dolor sit amet, consectetur adipisicing elit. Eveniet sed
      doloribus voluptas, atque aspernatur recusandae culpa repellat natus,
      beatae suscipit ex, quod, quibusdam eaque ab soluta officiis asperiores
      porro doloremque.
    </p>
    <section class="grid grid--columns3">
      <div class="grid__item">
        <div class="container--flex container--flex--column">
          <PricingCard planName="Starter" users={99} />
        </div>
      </div>
      <div class="grid__item">
        <div class="container--flex container--flex--column">
          <PricingCard isWhite={true} planName="Standar" users={300} />
        </div>
      </div>
      <div class="grid__item">
        <div class="container--flex container--flex--column">
          <PricingCard planName="Premium" users={200} />
        </div>
      </div>
    </section>
  </section>

  <section class="section section--default">
    <hr class="card__divider text--gray" />
    <div class="container--flex">
      <span class="logo">
        <img src="assets/img/logo2.svg" class="logo__img" alt="Logo" />
      </span>
      <NavList footer = {true}/>
      <ul class="nav__list nav__list--footer">
        <li class="nav__list__item">
          <a class="nav__list__item__link">
            <img src="assets/img/icons/facebook.svg" alt="Instagram" />
          </a>
        </li>
        <li class="nav__list__item">
          <a class="nav__list__item__link">
            <img src="assets/img/icons/twitter.svg" alt="Instagram" />
          </a>
        </li>
        <li class="nav__list__item">
          <a class="nav__list__item__link">
            <img src="assets/img/icons/instagram.svg" alt="Instagram" />
          </a>
        </li>
      </ul>
    </div>
  </section>
</footer>

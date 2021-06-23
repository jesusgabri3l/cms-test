<script>
  import PricingCard from "./PricingCard.svelte";
</script>

<footer class="footer">
  <section class="section section--default">
    <h3 class="text text--white header__title text--center mt-5">
      Pricing plans
    </h3>
    <p class="text text--gray text--center">
      Lorem, ipsum dolor sit amet, consectetur adipisicing elit. Eveniet sed
      doloribus voluptas, atque aspernatur recusandae culpa repellat natus,
      beatae suscipit ex, quod, quibusdam eaque ab soluta officiis asperiores
      porro doloremque.
    </p>

    <section class="grid grid--columns3">
      <div class="grid__item">
        <PricingCard planName="Starter" users={99} />
      </div>
      <div class="grid__item">
        <PricingCard isWhite={true} planName="Standar" users={300} />
      </div>
      <div class="grid__item" >
        <PricingCard planName="Premium" users={200}/>
      </div>
    </section>
  </section>
</footer>

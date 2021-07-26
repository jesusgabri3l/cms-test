<script>
  import Feature from "./components/Feature.svelte";
</script>

<section class="section">
  <div class="section__first">
    <h2 class="text text--dark text--section text--section--title text--center">
      Main features
    </h2>
    <p class="text text--gray text--section text--section--text text--center">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum nisi aliquet volutpat pellentesque volutpat est. Sapien in etiam vitae nibh nunc mattis imperdiet sed nullam. Vitae et, tortor pulvinar risus pulvinar sit amet. Id vel in nam malesuada.
    </p>
    <div class="grid grid--columns3">
      <div class="grid__item">
        <Feature
          title="Monitoring 24/7"
          icon="planning"
          text="Lorem ipsum dolor sit amet, consectetur adipis cing elit. Elementum nisi aliquet volutpat."
        />
      </div>
      <div class="grid__item">
        <Feature
          title="Widget System"
          icon="computer"
          text="Sapien in etiam vitae nibh nunc mattis imperdiet sed nullam. Vitae et, tortor pulvinar risus pulvinar."
        />
      </div>
      <div class="grid__item">
        <Feature
          title="Best performance"
          icon="speed"
          text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum nisi aliquet volutpat."
        />
      </div>
    </div>
  </div>
</section>

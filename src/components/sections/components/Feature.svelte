<script>
    export let title = 'Default title';
    export let text = 'Default text';
    export let icon;

</script>
<div class="container--flex container--flex--column">
  <img src={`assets/img/icons/${icon}.svg`} alt={title} />
  <h3 class=" mb-1 mt-1 text text--dark text--section text--section--text text--center">
    <strong>{title}</strong>
  </h3>
  <p class="text text--gray text--section text--section--text text--center">
    {text}
  </p>
</div>

<script>
    export let title = 'Default title';
    export let img = 'chart1'
    export let text = 'Some default text'
    export let reverse = false;
</script>
<section class="grid grid--columns2 grid--columns2--reverse">
  <div class="grid__item">
    {#if reverse}
        <div class="cardimg">
            <img src={`assets/img/${img}.svg`} class="cardimg__img" alt={title} />
        </div>
    {:else}
    <h3
      class="text text--dark text--section text--section--title text--center--sm"
    >
      {title}
    </h3>
    <p
      class="text text--gray text--section text--section--text text--center--sm"
    >
      {text}
    </p>
    {/if}
  </div>
  <div class="grid__item">
    {#if !reverse}
        <div class="cardimg">
            <img src={`assets/img/${img}.svg`} class="cardimg__img" alt={title} />
        </div>
    {:else}
    <h3
      class="text text--dark text--section text--section--title text--center--sm"
    >
      {title}
    </h3>
    <p
      class="text text--gray text--section text--section--text text--center--sm"
    >
      {text}
    </p>
    {/if}
  </div>
</section>

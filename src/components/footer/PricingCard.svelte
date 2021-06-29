<script>
  export let isWhite = false;
  export let planName = "Default plan";
  export let users = 1;
</script>

<div class={`card ${isWhite ? "card--white" : "card--dark"}`}>
  <h4 class="text card__text text--center ">
    <strong>{planName}</strong>
  </h4>
  <small class="text text--gray card__small">Up to {users} users</small>
  <hr class="card__divider text--gray" />
  <strong class="card__price">
    <span class="text card__price__sign">$</span>
    <span class="text card__price__number">29</span>
  </strong>
  <button
    class={`button button--block mt-2 ${
      isWhite
        ? "button--primary"
        : "button--secondary button--secondary--outline"
    }`}>Order here</button
  >
</div>

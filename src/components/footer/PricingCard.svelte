<script>
    export let isWhite = false;
    export let planName = "Default plan"
    export let users = 1
</script>
<div class={`card ${isWhite ? 'card--white' : 'card--dark'}`}>
  <h4 class="text card__text text--center ">
    <strong>{planName}</strong>
  </h4>
  <small class="text text--gray card__small">Up to {users} users</small>
  <hr class="card__divider text--gray" />
</div>

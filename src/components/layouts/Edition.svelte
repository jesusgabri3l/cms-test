<script>
  import {createEventDispatcher} from 'svelte'
  const dispatch = createEventDispatcher()

  const handleSaveEvent = () => {
    dispatch('save')
  }
</script>

<div class="edit">
  <div class="edit__bottom">
    <span class="mr-2">You are on edition mood</span><i class="fa fa-edit" />
  </div>
  <div class="edit__side">
    <ul class="edit__side__list">
      <li class="edit__side__list__item">
        <button class="edit__side__list__item__button" on:click={handleSaveEvent}>
          <i class="fa fa-save" />
        </button>
      </li>
      <li class="edit__side__list__item">
        <button class="edit__side__list__item__button">
          <i class="fa fa-edit" />
        </button>
      </li>
      <li class="edit__side__list__item">
        <button class="edit__side__list__item__button" on:click={handleSaveEvent}>
          <i class="fa fa-times" />
        </button>
      </li>
    </ul>
  </div>
</div>

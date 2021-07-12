<script>
  import "./styles/scss/styles.css";
  import Header from "./components/header/Header.svelte";
  import FirstSection from './components/sections/FirstSection.svelte'
  import FeaturesList from './components/sections/FeaturesList.svelte';
  import Footer from './components/footer/Footer.svelte';

  let editableState = false
//To prevent the default action
  document.body.addEventListener('keydown', event => {
    if (event.ctrlKey && 'k'.indexOf(event.key) !== -1) {
        event.preventDefault()
    }
  })

  document.onkeyup = function(e) {
    if (e.ctrlKey && (e.keyCode == 75)) {
      editableState = !editableState
      console.log(editableState)
    }
};
</script>

<div class="main-wrapper">
  {#if editableState}
    <p class="">Editar</p>
  {/if}
    <Header />
    <main>
      <FirstSection />
      <FeaturesList />
    </main>
    <Footer />
</div>

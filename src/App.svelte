<script>
  import "./styles/scss/styles.css";
  import Header from "./components/header/Header.svelte";
  import FirstSection from "./components/sections/FirstSection.svelte";
  import FeaturesList from "./components/sections/FeaturesList.svelte";
  import Footer from "./components/footer/Footer.svelte";
  import Edition from "./components/layouts/Edition.svelte";
  import {setElementsToEdit, getInputElements, elementsToTextArea, inputsToElement} from './functions/helper';

  let editableState = false;

  //To prevent the default action
  document.body.addEventListener("keydown", (event) => {
    if (event.ctrlKey && "k".indexOf(event.key) !== -1) {
      event.preventDefault();
    }
  });



  document.onkeyup = function (e) {
    if (e.ctrlKey && e.keyCode == 75) {
      editableState = !editableState;
      if(!editableState) save()
      else{
        const {p, h1, h2, h3} =  setElementsToEdit()
        elementsToTextArea(p, 'p')
        elementsToTextArea(h1, 'h1')
        elementsToTextArea(h2, 'h2')
        elementsToTextArea(h3, 'h3')
      }
    }
  };

  const save = () => {
    const {p, h1, h2, h3} = getInputElements()
    inputsToElement(p, 'p')
    inputsToElement(h1, 'h1')
    inputsToElement(h2, 'h2')
    inputsToElement(h3, 'h3')
  }


</script>

<div class="main-wrapper">
  {#if editableState}
    <Edition />
  {/if}

  <Header />
  <main>
    <FirstSection />
    <FeaturesList />
  </main>
  <Footer />
</div>

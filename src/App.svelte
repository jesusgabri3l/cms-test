<script>
  import "./styles/scss/styles.css";
  import Header from "./components/header/Header.svelte";
  import FirstSection from './components/sections/FirstSection.svelte'
  import FeaturesList from "./components/sections/FeaturesList.svelte";
</script>

<div class="main-wrapper">
    <Header />
    <main>
      <FirstSection />
      <FeaturesList />
    </main>
</div>

<script>
  import "./styles/scss/styles.css";
  import Header from "./components/header/Header.svelte";
  import FirstSection from './components/sections/FirstSection.svelte'
  import FeaturesList from './components/sections/FeaturesList.svelte';
  import Footer from './components/footer/Footer.svelte';
</script>

<div class="main-wrapper">
    <Header />
    <main>
      <FirstSection />
      <FeaturesList />
    </main>
    <Footer />
</div>

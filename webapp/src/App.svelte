<script>
  import { marked } from 'marked';
  import { askAi } from './lib/aiService';
  import Footer from './lib/Footer.svelte';
  import { onMount } from 'svelte';

  let prompt = '';
  let response = '';
  let loading = false;
  let error = null;

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPrompt = urlParams.get('prompt');
    if (urlPrompt) {
      prompt = urlPrompt;
      handleSubmit();
    }
  });

  async function handleSubmit() {
    loading = true;
    error = null;
    try {
      // Update URL with the new prompt
      const url = new URL(window.location.href);
      if (prompt) {
        url.searchParams.set('prompt', prompt);
      } else {
        url.searchParams.delete('prompt');
      }
      window.history.pushState({}, '', url);

      const result = await askAi(prompt);
      response = await marked(result.toString());
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<div class="app-container">
  <main>
    <form on:submit|preventDefault={handleSubmit}>
      <div class="input-group">
        <input
          type="text"
          bind:value={prompt}
          placeholder="CVE-2021-44228"
          title="Enter a CVE id"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !prompt}>
          {loading ? 'Please wait' : 'Submit'}
        </button>
      </div>
    </form>

    {#if error}
      <div class="error">
        {error}
      </div>
    {/if}

    {#if response}
      <div class="response">
        {@html response}
      </div>
    {/if}
  </main>
  <Footer />
</div>

<style>
  .app-container {
    min-height: 80vH;
    display: flex;
    flex-direction: column;
  }

  main {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .input-group {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  input {
    flex: 1;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error {
    color: #ff3e00;
    margin-bottom: 1rem;
  }

  .response {
    /*background-color: #f9f9f9;*/
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #eee;
  }

  .response :global(h1),
  .response :global(h2),
  .response :global(h3) {
    margin-top: 0;
  }

  .response :global(p) {
    margin-bottom: 1rem;
  }

  .response :global(pre) {
    /*background-color: #f1f1f1;*/
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
  }
</style>

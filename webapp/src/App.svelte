<script>
    import {marked} from 'marked';
    import {askAi} from './lib/aiService';
    import Footer from './lib/Footer.svelte';
    import Toggle from "./lib/Toggle.svelte";

    let prompt = '';
    let response = '';
    let loading = false;
    let error = null;
    let vectorStoreEnabled = true;

    async function handleSubmit() {
        loading = true;
        error = null;
        try {
            const result = await askAi(prompt, vectorStoreEnabled);
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
            <div class="confidential hint">
                Bitte geben Sie in Ihrer Anfrage keine vertraulichen Daten an.
            </div>
            <div class="input-group">
                <input
                        type="text"
                        bind:value={prompt}
                        placeholder="Meine Karte wird bei der Anmeldung nicht gefunden."
                        disabled={loading}
                />
                <button type="submit" disabled={loading || !prompt}>
                    {loading ? 'Bitte warten...' : 'Senden'}
                </button>
            </div>
            <div class="tool-toggle">
                Web-Suche
                <Toggle bind:checked={vectorStoreEnabled}/>
                Datenbank-Suche
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
            <div class="hint">
                Die Richtigkeit der Antwort kann nicht garantiert werden. Bitte überprüfen Sie die Angaben.
            </div>
        {/if}
    </main>
<!--    <Footer/>-->
</div>

<style>
    .app-container {
        min-height: 80vH;
        display: flex;
        flex-direction: column;
    }

    main {
        width: 800px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    .hint {
        font-style: italic;
    }

    .confidential {
        margin-bottom: 1rem;
    }

    .input-group {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
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

    .tool-toggle {
        margin-bottom: 1rem;
    }

    .response {
        /*background-color: #f9f9f9;*/
        padding: 1rem;
        border-radius: 4px;
        border: 1px solid #eee;
        margin-bottom: 1rem;
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

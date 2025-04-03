<script>
    // Export the 'checked' prop to allow two-way binding from the parent component.
    export let checked = false;

    function handleChange() {
        checked = !checked;
    }
</script>

<label class="toggle-switch" class:checked={checked} on:click|preventDefault={handleChange}>
    <input type="checkbox" bind:checked={checked} />
    <span class="slider"></span>
</label>

<style>
    /* Basic styling for the toggle switch container */
    .toggle-switch {
        position: relative;
        display: inline-block;
        top: 3px;
        width: 46px;
        height: 17px;
        margin-left: 1ex;
        margin-right: 1ex;
        cursor: pointer;
        user-select: none;
        border-radius: 17px; /* Fully rounded ends */
        background-color: #ccc; /* Default background color (off state) */
        transition: background-color 0.3s ease; /* Smooth background color transition */
    }

    /* Hide the actual checkbox input, but keep it accessible */
    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute; /* Take it out of the document flow */
    }

    /* Styling for the slider knob */
    .slider {
        position: absolute;
        cursor: pointer;
        top: 2px;      /* Position inside the container */
        left: 4px;     /* Position inside the container */
        bottom: 4px;   /* Position inside the container */
        width: 13px;
        height: 13px;
        background-color: white;
        border-radius: 50%; /* Make it circular */
        transition: transform 0.3s ease; /* Smooth sliding transition */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Subtle shadow */
    }

    /* Styles applied when the switch is checked (on state) */
    .toggle-switch.checked {
        background-color: #2196F3; /* Blue background for 'on' state */
    }

    /* Move the slider knob to the right when checked */
    .toggle-switch.checked .slider {
        transform: translateX(26px); /* Move it by its width minus padding */
    }
</style>

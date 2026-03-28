document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('rescue-form');
    const imageInput = document.getElementById('image-input');
    const situationInput = document.getElementById('situation-input');
    const dropZone = document.getElementById('drop-zone');
    const dropContent = document.getElementById('drop-content');
    const browseBtn = document.querySelector('.text-btn');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-btn');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('span');
    const btnSpinner = submitBtn.querySelector('.spinner');
    const formError = document.getElementById('form-error');

    // UI States
    const placeholderState = document.getElementById('results-placeholder');
    const loadingState = document.getElementById('loading-state');
    const resultsContent = document.getElementById('results-content');
    const feedbackState = document.getElementById('feedback-state');

    // Results Elements
    const resPolicyNumber = document.getElementById('res-policy-number');
    const resDueDate = document.getElementById('res-due-date');
    const stepsContainer = document.getElementById('action-steps-container');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackMessage = document.getElementById('feedback-message');

    let currentFile = null;

    // ----- Drag & Drop / File Handling -----

    // Open file picker when clicking the zone
    browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files && dt.files.length) {
            handleFile(dt.files[0]);
        }
    });

    function handleFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            showFormError("Please upload a valid Image (JPG/PNG) or PDF.");
            return;
        }

        currentFile = file;
        hideFormError();

        // Read file for preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            dropContent.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            checkFormValidity();
        };
        reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent clicking drop zone
        currentFile = null;
        imageInput.value = '';
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        dropContent.classList.remove('hidden');
        checkFormValidity();
    });

    // ----- Form Validation -----

    situationInput.addEventListener('input', checkFormValidity);

    function checkFormValidity() {
        if (currentFile && situationInput.value.trim().length > 5) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    function showFormError(msg) {
        formError.textContent = msg;
        formError.classList.remove('hidden');
    }

    function hideFormError() {
        formError.textContent = '';
        formError.classList.add('hidden');
    }

    // ----- UI State Management -----

    function setUIState(stateName) {
        [placeholderState, loadingState, resultsContent, feedbackState].forEach(el => el.classList.add('hidden'));
        
        if (stateName === 'placeholder') placeholderState.classList.remove('hidden');
        else if (stateName === 'loading') loadingState.classList.remove('hidden');
        else if (stateName === 'results') resultsContent.classList.remove('hidden');
        else if (stateName === 'error') feedbackState.classList.remove('hidden');
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
            setUIState('loading');
        } else {
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    }

    // ----- Form Submission -----

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentFile || !situationInput.value.trim()) return;

        hideFormError();
        setLoading(true);

        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('situation', situationInput.value.trim());

        try {
            const response = await fetch('/api/rescue', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                // Determine if it tells us the data is incomplete or unstructured
                if (data.status === 'incomplete_data') {
                    showFeedbackState("Incomplete Document", data.error);
                } else {
                    showFormError(data.error || "An unexpected error occurred.");
                    setUIState('placeholder'); // Reset UI
                }
                return;
            }

            renderResults(data);

        } catch (err) {
            console.error(err);
            showFormError("Failed to connect to the server. Please try again.");
            setUIState('placeholder');
        } finally {
            setLoading(false);
        }
    });

    // ----- Results Rendering -----

    function renderResults(data) {
        // Fallbacks for null fields
        resPolicyNumber.textContent = data.policy_number || 'Not Found';
        resDueDate.textContent = data.due_date || 'Not Found';

        // Clear previous steps
        stepsContainer.innerHTML = '';

        // Safely iterate through action steps
        if (data.action_plan && Array.isArray(data.action_plan)) {
            data.action_plan.forEach((step, index) => {
                const stepEl = document.createElement('div');
                stepEl.className = 'step-card';
                stepEl.innerHTML = `
                    <div class="step-number">${index + 1}</div>
                    <h4>${escapeHtml(step.title)}</h4>
                    <p>${escapeHtml(step.description)}</p>
                `;
                stepsContainer.appendChild(stepEl);
            });
        }

        setUIState('results');
    }

    function showFeedbackState(title, message) {
        feedbackTitle.textContent = title;
        feedbackMessage.textContent = message;
        setUIState('error');
    }

    // Utility to prevent XSS
    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});

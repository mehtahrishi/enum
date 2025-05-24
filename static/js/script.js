// static/js/script.js
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const analyzeButton = document.getElementById('analyzeButton');
    const viewHistoryButton = document.getElementById('viewHistoryButton');
    const loader = document.getElementById('loader');

    const resultsDisplayArea = document.getElementById('resultsDisplayArea');
    const companyNameDisplay = document.getElementById('companyName');
    const businessDescriptionDisplay = document.getElementById('businessDescription');
    const industryClassificationDisplay = document.getElementById('industryClassification');
    const websitePreview = document.getElementById('websitePreview');
    const historyList = document.getElementById('historyList'); // For history.html

    const speakStopButton = document.getElementById('speakStopButton'); // Get the speak/stop button
    let currentUtterance = null; // To hold the SpeechSynthesisUtterance object
    let analysisDataForSpeech = null; // To store the analysis data for the speak button

    // Event listener for the View History button
    if (viewHistoryButton) {
        viewHistoryButton.addEventListener('click', () => {
            window.location.href = '/history';
        });
    }

    // Function to update the speak/stop button's appearance and state
    function updateSpeakStopButton(isSpeaking) {
        if (speakStopButton) {
            if (isSpeaking) {
                speakStopButton.innerHTML = '⏹️ Stop'; // Or any stop icon/text
                speakStopButton.title = 'Stop Speaking';
            } else {
                speakStopButton.innerHTML = '🔊 Speak'; // Or any speak icon/text
                speakStopButton.title = 'Speak Results';
            }
            // Disable button if there's no data to speak or if speech is not supported
            speakStopButton.disabled = !analysisDataForSpeech || !('speechSynthesis' in window);
        }
    }

    // Function to speak the given text
    function speakText(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-Speech not supported in this browser.');
            updateSpeakStopButton(false); // Ensure button reflects disabled state
            return;
        }

        window.speechSynthesis.cancel(); // Stop any currently playing speech

        if (!text || !text.trim()) { // Don't speak if text is empty
            updateSpeakStopButton(false);
            return;
        }

        currentUtterance = new SpeechSynthesisUtterance(text);

        currentUtterance.onstart = () => {
            updateSpeakStopButton(true);
        };

        currentUtterance.onend = () => {
            updateSpeakStopButton(false);
            currentUtterance = null; // Clear the utterance when done
        };

        currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            updateSpeakStopButton(false);
            currentUtterance = null;
        };

        window.speechSynthesis.speak(currentUtterance);
    }

    // Function to stop ongoing speech
    function stopSpeaking() {
        if (window.speechSynthesis && currentUtterance) {
            window.speechSynthesis.cancel(); // This should trigger the 'onend' event of the utterance
        }
        // Fallback in case onend doesn't fire immediately or reliably
        updateSpeakStopButton(false);
    }

    // Event listener for the speak/stop button
    if (speakStopButton) {
        speakStopButton.disabled = true; // Initially disable until results are available
        speakStopButton.addEventListener('click', () => {
            if (window.speechSynthesis.speaking) {
                stopSpeaking();
            } else if (analysisDataForSpeech) {
                // Construct the text to speak from stored data
                let textToSpeak = `Analysis for ${analysisDataForSpeech.url}. `;
                if (analysisDataForSpeech.company_name && analysisDataForSpeech.company_name !== 'Not found' && analysisDataForSpeech.company_name !== 'N/A') {
                    textToSpeak += `Company: ${analysisDataForSpeech.company_name}. `;
                }
                if (analysisDataForSpeech.business_description && analysisDataForSpeech.business_description !== 'Not found' && analysisDataForSpeech.business_description !== 'N/A') {
                    textToSpeak += `Description: ${analysisDataForSpeech.business_description}. `;
                }
                if (analysisDataForSpeech.industry && analysisDataForSpeech.industry !== 'Not found' && analysisDataForSpeech.industry !== 'N/A') {
                    textToSpeak += `Industry: ${analysisDataForSpeech.industry}.`;
                }
                // Add more fields here if you re-implement them later
                speakText(textToSpeak);
            }
        });
    }

    // Event listener for the analyze button
    if (analyzeButton) {
        analyzeButton.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (!url) {
                alert('Please enter a website URL.');
                return;
            }
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                alert('Please enter a valid URL starting with http:// or https://');
                return;
            }

            loader.classList.remove('hidden');
            analyzeButton.disabled = true;
            if (viewHistoryButton) viewHistoryButton.disabled = true;
            if (speakStopButton) speakStopButton.disabled = true; // Disable during analysis

            stopSpeaking(); // Stop any ongoing speech
            analysisDataForSpeech = null; // Clear previous analysis data

            resultsDisplayArea.classList.add('hidden');
            clearAnalysisResults(); // This will also update speakStopButton state

            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url }),
                });
                const result = await response.json();

                if (response.ok) {
                    analysisDataForSpeech = result.analysis; // Store data for the speak button
                    displayAnalysisResults(result.analysis); // This will enable speak button if data is valid
                    websitePreview.src = url;
                    resultsDisplayArea.classList.remove('hidden');
                    // Automatic speaking is removed. User clicks the button.
                } else {
                    alert(`Error: ${result.error || 'Unknown error during analysis.'}`);
                    showErrorInAnalysis(result.error || 'Unknown error during analysis.');
                    // speakStopButton remains disabled via clearAnalysisResults/showErrorInAnalysis
                }
            } catch (error) {
                console.error('Analysis error:', error);
                alert('An error occurred while analyzing the website. Check console for details.');
                showErrorInAnalysis('An unexpected error occurred. Check console.');
                // speakStopButton remains disabled
            } finally {
                loader.classList.add('hidden');
                analyzeButton.disabled = false;
                if (viewHistoryButton) viewHistoryButton.disabled = false;
                // Speak button's state is handled by updateSpeakStopButton called within displayAnalysisResults or clearAnalysisResults
            }
        });
    }

    function displayAnalysisResults(analysis) {
        if (companyNameDisplay) companyNameDisplay.textContent = analysis.company_name || 'Not found';
        if (businessDescriptionDisplay) businessDescriptionDisplay.textContent = analysis.business_description || 'Not found';
        if (industryClassificationDisplay) industryClassificationDisplay.textContent = analysis.industry || 'Not found';
        
        analysisDataForSpeech = analysis; // Update the global store
        updateSpeakStopButton(window.speechSynthesis.speaking); // Update button based on current speech state
    }

    function clearAnalysisResults() {
        if (companyNameDisplay) companyNameDisplay.textContent = '-';
        if (businessDescriptionDisplay) businessDescriptionDisplay.textContent = '-';
        if (industryClassificationDisplay) industryClassificationDisplay.textContent = '-';
        if (websitePreview) websitePreview.src = 'about:blank';

        analysisDataForSpeech = null; // Clear data
        stopSpeaking(); // Stop any ongoing speech
        updateSpeakStopButton(false); // This will disable the button as analysisDataForSpeech is null
    }

    function showErrorInAnalysis(errorMessage) {
        clearAnalysisResults(); // This will call stopSpeaking and updateSpeakStopButton
        if (companyNameDisplay) companyNameDisplay.textContent = `Error: ${errorMessage}`;
        resultsDisplayArea.classList.remove('hidden');
        if (websitePreview) websitePreview.src = 'about:blank';
    }

    // This part is for the history.html page
    if (historyList) {
        async function loadHistory() {
            if (loader) loader.classList.remove('hidden');
            try {
                const response = await fetch('/api/history');
                const historyData = await response.json();
                historyList.innerHTML = '';

                if (historyData.length === 0) {
                    historyList.innerHTML = '<li>No analysis history found.</li>';
                } else {
                    historyData.forEach(item => {
                        const li = document.createElement('li');
                        li.dataset.analysisId = item._id;
                        const urlSpan = document.createElement('span');
                        urlSpan.className = 'url';
                        urlSpan.textContent = item.url;
                        const companySpan = document.createElement('span');
                        companySpan.className = 'company';
                        companySpan.textContent = `Company: ${item.company_name || 'N/A'}`;
                        const timestampSpan = document.createElement('span');
                        timestampSpan.className = 'timestamp';
                        timestampSpan.textContent = new Date(item.timestamp).toLocaleString();
                        li.appendChild(urlSpan);
                        li.appendChild(companySpan);
                        li.appendChild(timestampSpan);
                        li.addEventListener('click', () => {
                            localStorage.setItem('selectedHistoryItem', JSON.stringify(item));
                            window.location.href = '/';
                        });
                        historyList.appendChild(li);
                    });
                }
            } catch (error) {
                console.error('Error loading history:', error);
                historyList.innerHTML = '<li>Error loading history.</li>';
            } finally {
                if (loader) loader.classList.add('hidden');
            }
        }
        loadHistory();
    }

    // This part is for index.html, to load history item if selected from history page
    if (document.getElementById('urlInput') && localStorage.getItem('selectedHistoryItem')) {
        const item = JSON.parse(localStorage.getItem('selectedHistoryItem'));
        analysisDataForSpeech = item; // Make data available for speak button
        if (urlInput) urlInput.value = item.url;
        displayAnalysisResults(item); // This will update UI and speak button state
        if (websitePreview) websitePreview.src = item.url;
        if (resultsDisplayArea) resultsDisplayArea.classList.remove('hidden');
        localStorage.removeItem('selectedHistoryItem');
        // Automatic speaking of history item is removed. User can click the speak button.
    }
});
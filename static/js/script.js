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

    const historyList = document.getElementById('historyList');

    if (viewHistoryButton) {
        viewHistoryButton.addEventListener('click', () => {
            window.location.href = '/history';
        });
    }

    function speakText(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-Speech not supported in this browser.');
            return;
        }
        if (!text || !text.trim()){
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }

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

            if(loader) loader.classList.remove('hidden');
            analyzeButton.disabled = true;
            if (viewHistoryButton) {
                viewHistoryButton.disabled = true;
            }
            if(resultsDisplayArea) resultsDisplayArea.classList.add('hidden');
            clearAnalysisResults();
            window.speechSynthesis.cancel();

            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url }),
                });

                const result = await response.json();

                if (response.ok && result.analysis) {
                    displayAnalysisResults(result.analysis);
                    if (websitePreview) websitePreview.src = url;
                    if (resultsDisplayArea) resultsDisplayArea.classList.remove('hidden');

                    let textToSpeak = `Analysis for ${result.analysis.url || 'the website'}. `;
                    if (result.analysis.company_name && result.analysis.company_name !== 'Not found' && result.analysis.company_name !== 'N/A') {
                        textToSpeak += `Company: ${result.analysis.company_name}. `;
                    }
                    if (result.analysis.business_description && result.analysis.business_description !== 'Not found' && result.analysis.business_description !== 'N/A') {
                        textToSpeak += `Description: ${result.analysis.business_description}. `;
                    }
                    if (result.analysis.industry && result.analysis.industry !== 'Not found' && result.analysis.industry !== 'N/A') {
                        textToSpeak += `Industry: ${result.analysis.industry}.`;
                    }
                    speakText(textToSpeak);

                } else {
                    alert(`Error: ${result.error || 'Unknown error during analysis.'}`);
                    showErrorInAnalysis(result.error || 'Unknown error during analysis.');
                }
            } catch (error) {
                console.error('Analysis error:', error);
                alert('An error occurred while analyzing the website. Check console for details.');
                showErrorInAnalysis('An unexpected error occurred. Check console.');
            } finally {
                if(loader) loader.classList.add('hidden');
                analyzeButton.disabled = false;
                if (viewHistoryButton) {
                    viewHistoryButton.disabled = false;
                }
            }
        });
    }

    function displayAnalysisResults(analysis) {
        if (companyNameDisplay) companyNameDisplay.textContent = analysis.company_name || 'Not found';
        if (businessDescriptionDisplay) businessDescriptionDisplay.textContent = analysis.business_description || 'Not found';
        if (industryClassificationDisplay) industryClassificationDisplay.textContent = analysis.industry || 'Not found';
    }

    function clearAnalysisResults() {
        if (companyNameDisplay) companyNameDisplay.textContent = '-';
        if (businessDescriptionDisplay) businessDescriptionDisplay.textContent = '-';
        if (industryClassificationDisplay) industryClassificationDisplay.textContent = '-';
        if (websitePreview) websitePreview.src = 'about:blank';
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    function showErrorInAnalysis(errorMessage) {
        clearAnalysisResults();
        if (companyNameDisplay) companyNameDisplay.textContent = `Error: ${errorMessage}`;
        if(resultsDisplayArea) resultsDisplayArea.classList.remove('hidden');
        if (websitePreview) websitePreview.src = 'about:blank';
    }

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
                historyList.innerHTML = '<li>Error loading history. Please try again.</li>';
            } finally {
                if (loader) loader.classList.add('hidden');
            }
        }
        loadHistory();
    }

    if (document.getElementById('urlInput') && localStorage.getItem('selectedHistoryItem')) {
        const item = JSON.parse(localStorage.getItem('selectedHistoryItem'));
        if (urlInput) urlInput.value = item.url;
        displayAnalysisResults(item);
        if (websitePreview) websitePreview.src = item.url;
        if (resultsDisplayArea) resultsDisplayArea.classList.remove('hidden');

        let textToSpeak = `Previously analyzed: ${item.url || 'the website'}. `;
        if (item.company_name && item.company_name !== 'Not found' && item.company_name !== 'N/A') {
            textToSpeak += `Company: ${item.company_name}. `;
        }
        if (item.business_description && item.business_description !== 'Not found' && item.business_description !== 'N/A') {
            textToSpeak += `Description: ${item.business_description}. `;
        }
        if (item.industry && item.industry !== 'Not found' && item.industry !== 'N/A') {
            textToSpeak += `Industry: ${item.industry}.`;
        }
        speakText(textToSpeak);

        localStorage.removeItem('selectedHistoryItem');
    }
});
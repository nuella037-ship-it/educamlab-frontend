// js/insights.js
async function generateInsights() {
    try {
        const data = await API.get('/analytics/insights');
        if (data.success) {
            const insights = data.data;
            renderInsights(insights);
            
            // Show recommendations
            if (insights.weakAreas.length > 0) {
                showRecommendations(insights.weakAreas);
            }
        }
    } catch (error) {
        console.error('Failed to generate insights:', error);
    }
}

function renderInsights(insights) {
    // Render charts and insights
    const container = document.getElementById('insightsContainer');
    container.innerHTML = `
        <div class="insight-card">
            <h4>📊 Your Learning Style</h4>
            <p>Based on your activity, you learn best through practice.</p>
        </div>
        <div class="insight-card">
            <h4>🎯 Recommended Focus</h4>
            <p>${insights.recommendedSubject} needs more attention.</p>
        </div>
    `;
}
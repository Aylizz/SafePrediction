const WEATHER_KEY = 'b3d09c29661f18c78324bb85f7f1af56';
const AQI_TOKEN = '080053347cdf0be1db230452433e9cd544e2cfce';
// USGS URL for pH (Parameter 00400 is pH)
const PH_URL = 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=01646500&parameterCd=00400&siteStatus=all';

let currentCity = 'London';
let currentRegion = 'Europe';

async function fetchData() {
    try {
        // 1. Fetch Weather
        const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${currentCity}&appid=${WEATHER_KEY}&units=metric`);
        const wData = await wRes.json();
        const temp = wData.main.temp;

        // 2. Fetch AQI
        const aRes = await fetch(`https://api.waqi.info/feed/${currentCity}/?token=${AQI_TOKEN}`);
        const aData = await aRes.json();
        const aqi = aData.data.aqi;

        // 3. Fetch pH (USGS)
        let pHValue = "N/A";
        try {
            const pRes = await fetch(PH_URL);
            const pData = await pRes.json();
            // Navigating the USGS JSON tree:
            pHValue = pData.value.timeSeries[0].values[0].value[0].value;
        } catch (pErr) {
            console.error("pH Fetch failed", pErr);
        }

        // 4. Update Interface
        document.getElementById('temp-val').innerText = `${temp > 0 ? '+' : ''}${temp.toFixed(1)}°C`;
        document.getElementById('aqi-val').innerText = aqi;
        document.getElementById('ph-val').innerText = pHValue; // Make sure this ID exists in your HTML
        document.getElementById('region-label').innerText = currentRegion;

        generateAIPrediction(temp, aqi, pHValue);

    } catch (err) {
        document.getElementById('prediction-box').innerText = "SYSTEM ERROR: API Connection failed.";
    }
}

function generateAIPrediction(temp, aqi, ph) {
    const box = document.getElementById('prediction-box');
    let riskLevel = "STABLE";
    let message = "";
    
    // Logic for pH (Normal river pH is usually 6.5 - 8.5)
    const phNum = parseFloat(ph);
    let phWarning = "";
    if (phNum < 6.0 || phNum > 9.0) {
        phWarning = " Water acidity levels are abnormal.";
    }

    if (temp > 30 && aqi > 100) {
        riskLevel = "CRITICAL";
        message = In `${currentRegion}, extreme heat combined with poor air quality is accelerating risks. ${phWarning}`;
    } else if (aqi > 150) {
        riskLevel = "HAZARDOUS";
        message = `Dangerous pollutant levels detected in ${currentCity}. AI Recommendation: Stay indoors.`;
    } else if (temp < 0) {
        riskLevel = "MODERATE";
        message = `Freezing conditions in ${currentRegion} detected. `;
    } else {
        message = `Conditions in ${currentRegion} are currently within normal seasonal bounds.${phWarning}`;
    }

    box.innerHTML = `<strong style="color:red">[${riskLevel}]</strong> ${message}`;
}

function changeRegion(city, region) {
    currentCity = city;
    currentRegion = region;
    fetchData();
}

// Timer Logic
let timeLeft = 60;
setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
        fetchData();
        timeLeft = 60;
    }
    const timerEl = document.getElementById('timer');
    if(timerEl) timerEl.innerText = timeLeft;
}, 1000);


// Initial Launch
const API_KEY = '81UzhHyd79d61aNJzOoHIEmjLGfE7TLtlKTE3lG1'; // Use your key if needed for other NASA endpoints
const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?limit=5';

async function updateDashboard() {
    try {
        const response = await fetch(EONET_URL);
        const data = await response.json();
        const events = data.events;

        const eventList = document.getElementById('event-list');
        const riskBox = document.getElementById('risk-box');
        const statusText = document.getElementById('status-text');
        const suggestionText = document.getElementById('suggestion-text');

        // 1. Render News (Left Side)
        eventList.innerHTML = events.map(event => `
            <div class="event-card">
                <strong>${event.title}</strong><br>
                <small style="color: #7f8c8d;">Type: ${event.categories[0].title}</small>
            </div>
        `).join('');

        // 2. Logic for Suggestion (Right Side)
        // We'll consider it "Risky" if there's a Wildfire or Storm in the list
        const highRiskCategories = ['Wildfires', 'Severe Storms', 'Volcanoes'];
        const hasDanger = events.some(e => highRiskCategories.includes(e.categories[0].title));

        if (hasDanger) {
            riskBox.className = 'status-box status-risky';
            statusText.innerText = 'RISKY';
            suggestionText.innerText = 'High-intensity natural events detected. Be careful and stay at home if you are near active zones.';
        } else {
            riskBox.className = 'status-box status-stable';
            statusText.innerText = 'STABLE';
            suggestionText.innerText = 'Global conditions are currently stable. No immediate major threats detected in your area.';
        }

    } catch (error) {
        console.error("NASA API Error:", error);
        document.getElementById('event-list').innerHTML = "Failed to load global data.";
    }
}

updateDashboard();
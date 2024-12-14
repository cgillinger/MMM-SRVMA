/* MagicMirror² Node Helper: MMM-SRVMA
 * Version: 2.0.1
 * Fixed syntax and error handling
 */

const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for MMM-SRVMA");
        // Initialize dummy data template
        this.dummyData = {
            Severe: {
                severity: "Severe",
                urgency: "Immediate",
                description: "TESTALARM: Allvarlig industriolycka"
            },
            Moderate: {
                severity: "Moderate",
                urgency: "Expected",
                description: "TESTALARM: Vädervarning nivå 2"
            },
            Minor: {
                severity: "Minor",
                urgency: "Future",
                description: "TESTALARM: Trafikstörningar väntas"
            }
        };
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "FETCH_ALERTS") {
            try {
                console.log("Fetching alerts with config:", payload);
                this.fetchAlerts(payload);
            } catch (error) {
                console.error("Error in socketNotificationReceived:", error);
                this.sendSocketNotification("ALERTS_DATA", []);
            }
        }
    },

    generateDummyAlert: function(config) {
        try {
            const severity = config.dummySeverity || "Severe";
            const dummyTemplate = this.dummyData[severity];
            
            if (!dummyTemplate) {
                console.error("Invalid severity level specified:", severity);
                return null;
            }
            
            return {
                identifier: `TEST-${Date.now()}`,
                sender: "Sveriges Radio Test API",
                sent: new Date().toISOString(),
                status: "Test",
                msgType: "Alert",
                scope: "Public",
                info: [{
                    language: "sv-SE",
                    category: "Safety",
                    event: "VMA Test",
                    urgency: config.dummyUrgency || dummyTemplate.urgency,
                    severity: dummyTemplate.severity,
                    certainty: "Observed",
                    senderName: "Sveriges Radio Test",
                    description: dummyTemplate.description,
                    web: "https://sverigesradio.se/vma"
                }]
            };
        } catch (error) {
            console.error("Error generating dummy alert:", error);
            return null;
        }
    },

    fetchAlerts: async function(config) {
        try {
            if (config.useDummyData) {
                const dummyAlert = this.generateDummyAlert(config);
                if (dummyAlert) {
                    this.sendSocketNotification("ALERTS_DATA", [dummyAlert]);
                } else {
                    this.sendSocketNotification("ALERTS_DATA", []);
                }
                return;
            }

            const apiUrl = "https://vmaapi.sr.se/api/v2/alerts";
            const params = new URLSearchParams({
                format: "json"
            });

            if (config.geoCode) {
                params.append("geoCode", config.geoCode);
            }

            const response = await axios.get(`${apiUrl}?${params.toString()}`, {
                timeout: 10000, // 10 second timeout
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.alerts) {
                console.log("Successfully fetched alerts:", response.data.alerts.length);
                this.sendSocketNotification("ALERTS_DATA", response.data.alerts);
            } else {
                console.log("No alerts found in response");
                this.sendSocketNotification("ALERTS_DATA", []);
            }
        } catch (error) {
            console.error("Error fetching VMA data:", error.message);
            // Send empty array to prevent frontend from breaking
            this.sendSocketNotification("ALERTS_DATA", []);
        }
    }
});

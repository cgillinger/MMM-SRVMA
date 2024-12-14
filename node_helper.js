const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for MMM-SRVMA");
        // Initialize dummy data template with both languages
        this.dummyData = {
            Severe: {
                severity: "Severe",
                urgency: "Immediate",
                sv: {
                    description: "TESTALARM: Allvarlig industriolycka",
                    event: "Viktigt meddelande till allmänheten (VMA)"
                },
                en: {
                    description: "TEST ALERT: Serious industrial accident",
                    event: "Important Public Announcement"
                }
            },
            Moderate: {
                severity: "Moderate",
                urgency: "Expected",
                sv: {
                    description: "TESTALARM: Vädervarning nivå 2",
                    event: "Viktigt meddelande till allmänheten (VMA)"
                },
                en: {
                    description: "TEST ALERT: Weather warning level 2",
                    event: "Important Public Announcement"
                }
            },
            Minor: {
                severity: "Minor",
                urgency: "Future",
                sv: {
                    description: "TESTALARM: Trafikstörningar väntas",
                    event: "Viktigt meddelande till allmänheten (VMA)"
                },
                en: {
                    description: "TEST ALERT: Traffic disruptions expected",
                    event: "Important Public Announcement"
                }
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

            // Create base alert
            const baseAlert = {
                identifier: `TEST-${Date.now()}`,
                sender: "Sveriges Radio Test API",
                sent: new Date().toISOString(),
                status: "Test",
                msgType: "Alert",
                scope: "Public",
                info: []
            };

            // Add Swedish info
            baseAlert.info.push({
                language: "sv-SE",
                category: "Safety",
                event: dummyTemplate.sv.event,
                urgency: config.dummyUrgency || dummyTemplate.urgency,
                severity: dummyTemplate.severity,
                certainty: "Observed",
                senderName: "Sveriges Radio Test",
                description: dummyTemplate.sv.description,
                web: "https://sverigesradio.se/vma"
            });

            // Add English info
            baseAlert.info.push({
                language: "en-US",
                category: "Safety",
                event: dummyTemplate.en.event,
                urgency: config.dummyUrgency || dummyTemplate.urgency,
                severity: dummyTemplate.severity,
                certainty: "Observed",
                senderName: "Swedish Radio Test",
                description: dummyTemplate.en.description,
                web: "https://sverigesradio.se/vma"
            });

            return baseAlert;
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
                timeout: 10000,
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
            this.sendSocketNotification("ALERTS_DATA", []);
        }
    }
});

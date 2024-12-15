/* MMM-SRVMA node_helper.js
 * Version: 2.1.3
 * Backend handler for Swedish VMA (Important Public Announcements)
 * 
 * Updates in 2.1.3:
 * - Removed GeoCode display from dummy alerts
 * - Maintained GeoCode filtering functionality
 * - Improved API error handling
 */

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
            console.log("Received request to fetch alerts with config:", {
                geoCode: payload.geoCode,
                useDummyData: payload.useDummyData
            });
            
            this.fetchAlerts(payload);
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

            // Create base alert with proper timestamps
            const now = new Date();
            const baseAlert = {
                identifier: `TEST-${now.getTime()}`,
                sender: "Sveriges Radio Test API",
                sent: now.toISOString(),
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
                console.log("Generated dummy alert:", dummyAlert);
                this.sendSocketNotification("ALERTS_DATA", dummyAlert ? [dummyAlert] : []);
                return;
            }

            // Construct API URL with correct parameters
            const apiUrl = "https://vmaapi.sr.se/api/v2/alerts";
            const params = new URLSearchParams({
                format: "json"  // Required parameter
            });

            // Add GeoCode filter if configured
            if (config.geoCode) {
                params.append("geoCode", config.geoCode);
                console.log(`Filtering alerts for GeoCode: ${config.geoCode}`);
            }

            console.log(`Fetching alerts from: ${apiUrl}?${params.toString()}`);

            // Make API request with proper headers
            const response = await axios.get(`${apiUrl}?${params.toString()}`, {
                timeout: 10000,  // 10 second timeout
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'MagicMirror-SRVMA/2.1.3'
                }
            });

            // Process response
            if (response.data) {
                console.log("API response received:", {
                    status: response.status,
                    alertCount: response.data.alerts ? response.data.alerts.length : 0
                });

                let alerts = [];
                
                // Handle different response structures
                if (response.data.alerts) {
                    alerts = response.data.alerts;
                } else if (Array.isArray(response.data)) {
                    alerts = response.data;
                }

                // Filter alerts if age threshold is set
                if (config.alertAgeThreshold && alerts.length > 0) {
                    const now = new Date().getTime();
                    alerts = alerts.filter(alert => {
                        const alertTime = new Date(alert.sent).getTime();
                        return (now - alertTime) <= config.alertAgeThreshold;
                    });
                }

                console.log(`Sending ${alerts.length} alerts to module`);
                this.sendSocketNotification("ALERTS_DATA", alerts);

            } else {
                console.log("No alerts found in API response");
                this.sendSocketNotification("ALERTS_DATA", []);
            }

        } catch (error) {
            console.error("Error fetching VMA data:", {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            
            // Log detailed error information if available
            if (error.response?.data) {
                console.error("API Error Response:", error.response.data);
            }
            
            this.sendSocketNotification("ALERTS_DATA", []);
        }
    }
});

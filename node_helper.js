/**
 * @file node_helper.js
 * @version 2.2.2
 * @description Backend handler for Swedish VMA with enhanced debugging
 */

const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function() {
        console.log("[SRVMA] Starting node helper with debug logging enabled");
        this.debugMode = true; // Enable detailed logging
        
        // Initialize dummy data template with bilingual support
        this.dummyData = {
            Severe: {
                severity: "Severe",
                urgency: "Immediate",
                sv: {
                    description: "FALLBACK TESTALARM: Allvarlig industriolycka",
                    event: "Viktigt meddelande till allmänheten (VMA)"
                },
                en: {
                    description: "FALLBACK TEST ALERT: Serious industrial accident",
                    event: "Important Public Announcement"
                }
            },
            Moderate: {
                severity: "Moderate",
                urgency: "Expected",
                sv: {
                    description: "FALLBACK TESTALARM: Vädervarning nivå 2",
                    event: "Viktigt meddelande till allmänheten (VMA)"
                },
                en: {
                    description: "FALLBACK TEST ALERT: Weather warning level 2",
                    event: "Important Public Announcement"
                }
            },
            Minor: {
                severity: "Minor",
                urgency: "Future",
                sv: {
                    description: "FALLBACK TESTALARM: Trafikstörningar väntas",
                    event: "Viktigt meddelande till allmänheten (VMA)"
                },
                en: {
                    description: "FALLBACK TEST ALERT: Traffic disruptions expected",
                    event: "Important Public Announcement"
                }
            }
        };

        // API configuration
        this.apiConfig = {
            production: {
                url: "https://vmaapi.sr.se/api/v2/alerts",
                userAgent: "MagicMirror-SRVMA/2.2.2"
            },
            test: {
                url: "https://vmaapi.sr.se/testapi/v2/alerts",
                userAgent: "MagicMirror-SRVMA/2.2.2"
            }
        };
    },

    debugLog: function(message, data = null) {
        if (this.debugMode) {
            console.log(`[SRVMA Debug] ${message}`);
            if (data) {
                console.log(JSON.stringify(data, null, 2));
            }
        }
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "FETCH_ALERTS") {
            this.debugLog("Received FETCH_ALERTS notification with payload:", payload);
            this.fetchAlerts(payload);
        }
    },

    async makeApiRequest(url, params, headers) {
        this.debugLog(`Making API request to: ${url}?${params.toString()}`);
        this.debugLog("With headers:", headers);

        try {
            const response = await axios.get(`${url}?${params.toString()}`, {
                timeout: 10000,
                headers: headers
            });

            this.debugLog("API Response received:", {
                status: response.status,
                statusText: response.statusText,
                dataReceived: !!response.data
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            this.debugLog("API Request failed:", {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText
            });

            return {
                success: false,
                error: error,
                message: error.message
            };
        }
    },

    generateLocalDummyAlert: function(config) {
        this.debugLog("Generating local dummy alert with config:", config);

        try {
            const severity = config.dummySeverity || "Severe";
            const dummyTemplate = this.dummyData[severity];
            
            if (!dummyTemplate) {
                this.debugLog("Invalid severity specified:", severity);
                return null;
            }

            const now = new Date();
            const baseAlert = {
                identifier: `FALLBACK-TEST-${now.getTime()}`,
                sender: "Sveriges Radio Test API (Fallback)",
                sent: now.toISOString(),
                status: "Test",
                msgType: "Alert",
                scope: "Public",
                info: []
            };

            baseAlert.info.push({
                language: "sv-SE",
                category: "Safety",
                event: dummyTemplate.sv.event,
                urgency: config.dummyUrgency || dummyTemplate.urgency,
                severity: dummyTemplate.severity,
                certainty: "Observed",
                senderName: "Sveriges Radio Test (Fallback)",
                description: dummyTemplate.sv.description,
                web: "https://sverigesradio.se/vma"
            });

            baseAlert.info.push({
                language: "en-US",
                category: "Safety",
                event: dummyTemplate.en.event,
                urgency: config.dummyUrgency || dummyTemplate.urgency,
                severity: dummyTemplate.severity,
                certainty: "Observed",
                senderName: "Swedish Radio Test (Fallback)",
                description: dummyTemplate.en.description,
                web: "https://sverigesradio.se/vma"
            });

            this.debugLog("Successfully generated dummy alert:", baseAlert);
            return baseAlert;

        } catch (error) {
            this.debugLog("Error generating dummy alert:", error);
            return null;
        }
    },

    fetchAlerts: async function(config) {
        this.debugLog("Starting fetchAlerts with config:", config);

        try {
            if (config.useDummyData) {
                this.debugLog("Dummy data mode enabled, attempting test API first");

                // Try test API
                const params = new URLSearchParams({ format: "json" });
                if (config.geoCode) {
                    params.append("geoCode", config.geoCode);
                }

                const testApiResponse = await this.makeApiRequest(
                    this.apiConfig.test.url,
                    params,
                    {
                        'Accept': 'application/json',
                        'User-Agent': this.apiConfig.test.userAgent
                    }
                );

                if (testApiResponse.success) {
                    let alerts = [];
                    if (testApiResponse.data.alerts) {
                        alerts = testApiResponse.data.alerts;
                    } else if (Array.isArray(testApiResponse.data)) {
                        alerts = testApiResponse.data;
                    }

                    this.debugLog("Test API alerts processed:", {
                        alertCount: alerts.length,
                        alerts: alerts
                    });

                    if (alerts.length > 0) {
                        this.debugLog("Sending test API alerts to module");
                        this.sendSocketNotification("ALERTS_DATA", alerts);
                        return;
                    } else {
                        this.debugLog("No alerts from test API, falling back to local dummy data");
                    }
                }

                // Test API failed or returned no alerts, use fallback
                this.debugLog("Using local fallback system");
                const dummyAlert = this.generateLocalDummyAlert(config);
                
                if (dummyAlert) {
                    this.debugLog("Generated local fallback alert:", dummyAlert);
                    this.sendSocketNotification("ALERTS_DATA", [dummyAlert]);
                } else {
                    this.debugLog("Failed to generate fallback alert");
                    this.sendSocketNotification("ALERTS_DATA", []);
                }
                return;
            }

            // Production API request
            const params = new URLSearchParams({ format: "json" });
            if (config.geoCode) {
                params.append("geoCode", config.geoCode);
                this.debugLog(`Filtering alerts for GeoCode: ${config.geoCode}`);
            }

            const apiResponse = await this.makeApiRequest(
                this.apiConfig.production.url,
                params,
                {
                    'Accept': 'application/json',
                    'User-Agent': this.apiConfig.production.userAgent
                }
            );

            if (apiResponse.success) {
                let alerts = [];
                
                if (apiResponse.data.alerts) {
                    alerts = apiResponse.data.alerts;
                } else if (Array.isArray(apiResponse.data)) {
                    alerts = apiResponse.data;
                }

                if (config.alertAgeThreshold && alerts.length > 0) {
                    const now = new Date().getTime();
                    alerts = alerts.filter(alert => {
                        const alertTime = new Date(alert.sent).getTime();
                        return (now - alertTime) <= config.alertAgeThreshold;
                    });
                }

                this.debugLog(`Sending ${alerts.length} production alerts to module`);
                this.sendSocketNotification("ALERTS_DATA", alerts);
            } else {
                this.debugLog("Failed to fetch production alerts:", apiResponse.message);
                this.sendSocketNotification("ALERTS_DATA", []);
            }

        } catch (error) {
            this.debugLog("Critical error in fetchAlerts:", {
                message: error.message,
                stack: error.stack
            });
            
            this.sendSocketNotification("ALERTS_DATA", []);
        }
    }
});

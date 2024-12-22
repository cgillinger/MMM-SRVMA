/* node_helper.js
 * Version: 2.2.0
 * Backend handler for Swedish VMA module
 * 
 * By Christian Gillinger
 * MIT Licensed
 */

const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting MMM-SRVMA helper");
        
        // API configuration
        this.apiConfig = {
            production: {
                url: "https://vmaapi.sr.se/api/v2/alerts",
                userAgent: "MagicMirror-SRVMA/2.2.0"
            }
        };
    },

    // Handle notifications from the main module
    socketNotificationReceived: function(notification, payload) {
        if (notification === "FETCH_ALERTS") {
            this.fetchAlerts(payload);
        }
    },

    // Make API request with error handling
    async makeApiRequest(url, params) {
        try {
            const response = await axios.get(url, {
                params: params,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': this.apiConfig.production.userAgent
                },
                timeout: 10000
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error("SRVMA API Error:", error.message);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Fetch and process alerts from API
    async fetchAlerts(config) {
        try {
            const params = {
                format: "json"
            };

            // Add geocode filter if configured
            if (config.geoCode) {
                params.geoCode = config.geoCode;
            }

            const response = await this.makeApiRequest(
                this.apiConfig.production.url,
                params
            );

            if (response.success) {
                let alerts = [];
                
                // Handle both response formats
                if (response.data.alerts) {
                    alerts = response.data.alerts;
                } else if (Array.isArray(response.data)) {
                    alerts = response.data;
                }

                // Apply age filter if configured
                if (config.alertAgeThreshold && alerts.length > 0) {
                    const now = new Date().getTime();
                    alerts = alerts.filter(alert => {
                        const alertTime = new Date(alert.sent).getTime();
                        return (now - alertTime) <= config.alertAgeThreshold;
                    });
                }

                this.sendSocketNotification("ALERTS_DATA", alerts);
            } else {
                console.error("SRVMA: Failed to fetch alerts:", response.error);
                this.sendSocketNotification("ALERTS_DATA", []);
            }

        } catch (error) {
            console.error("SRVMA: Critical error:", error.message);
            this.sendSocketNotification("ALERTS_DATA", []);
        }
    }
});
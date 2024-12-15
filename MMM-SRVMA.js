/* MagicMirror² Module: MMM-SRVMA 
 * Version: 2.1.2 
 * A module to display Swedish VMA (Important Public Announcements) with support for location filtering
 * and English translations.
 * 
 * Updates in 2.1.2:
 * - Improved error handling and loading states
 * - Enhanced debugging for API communication
 * - Better handling of empty states and API responses
 */

Module.register("MMM-SRVMA", {
    // Default module config
    defaults: {
        useDummyData: false,        // Enable for testing without API
        dummySeverity: "Severe",    // Used for test data: Severe, Moderate, Minor
        dummyUrgency: "Immediate",  // Used for test data: Immediate, Expected, Future
        updateInterval: 60000,      // Update frequency in milliseconds (1 minute)
        alertAgeThreshold: 3600000, // Show alerts from the last hour (1 hour in ms)
        maxHeight: "300px",         // Maximum height of the module
        width: "400px",            // Width of the module
        showIcons: true,           // Show weather icons for relevant alerts
        animateIn: true,           // Enable fade-in animation
        preferredLanguage: "sv-SE", // Default language (sv-SE or en-US)
        showBothLanguages: false,   // Option to show both language versions
        geoCode: null,             // GeoCode for location filtering (e.g., "12" for Stockholm County)
    },

    // Required styles
    getStyles: function() {
        return [
            "MMM-SRVMA.css",
            "font-awesome.css",
            "weather-icons.css"
        ];
    },

    // Module initialization
    start: function() {
        Log.info("Starting module: " + this.name);
        this.alerts = [];
        this.loaded = false;
        
        // Log configuration on startup
        if (this.config.geoCode) {
            Log.info(`VMA: GeoCode configured: ${this.config.geoCode}`);
        }
        
        this.getData();
        this.scheduleUpdate();
    },

    // Fetch data from node_helper
    getData: function() {
        Log.debug("VMA: Requesting alerts data");
        this.sendSocketNotification("FETCH_ALERTS", {
            ...this.config,
            timestamp: new Date().toISOString()
        });
    },

    // Schedule regular updates
    scheduleUpdate: function() {
        setInterval(() => {
            this.getData();
        }, this.config.updateInterval);
    },

    // Process alerts data
    processAlerts: function(alerts) {
        return alerts.map(alert => {
            if (!alert.info || alert.info.length === 0) return null;

            // Find preferred language version
            const preferredInfo = alert.info.find(info => 
                info.language === this.config.preferredLanguage) || alert.info[0];

            // Find English version if showing both languages
            const englishInfo = this.config.showBothLanguages ? 
                alert.info.find(info => info.language === "en-US") : null;

            return {
                ...alert,
                processedInfo: preferredInfo,
                englishInfo: englishInfo
            };
        }).filter(alert => alert !== null);
    },

    // Create the module's DOM representation
    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = `mmm-srvma-wrapper ${this.config.animateIn ? 'fade-in' : ''}`;
        wrapper.style.width = this.config.width;
        wrapper.style.maxHeight = this.config.maxHeight;

        // Handle loading state
        if (!this.loaded) {
            const loadingDiv = document.createElement("div");
            loadingDiv.innerHTML = "Loading...";
            loadingDiv.className = "dimmed light small loading";
            wrapper.appendChild(loadingDiv);
            return wrapper;
        }

        // Handle invalid data
        if (!Array.isArray(this.alerts)) {
            console.error("VMA: Invalid alerts data received:", this.alerts);
            const errorDiv = document.createElement("div");
            errorDiv.innerHTML = "Error loading alerts";
            errorDiv.className = "dimmed light small error";
            wrapper.appendChild(errorDiv);
            return wrapper;
        }

        // Handle no alerts
        if (this.alerts.length === 0) {
            const noAlertsDiv = document.createElement("div");
            noAlertsDiv.innerHTML = this.config.preferredLanguage === "sv-SE" ? 
                "Inga aktuella VMA" : "No current alerts";
            noAlertsDiv.className = "dimmed light small no-alerts";
            wrapper.appendChild(noAlertsDiv);
            return wrapper;
        }

        // Create alerts container
        const alertContainer = document.createElement("div");
        alertContainer.className = "alert-container";

        // Process and add alerts
        this.processAlerts(this.alerts).forEach(alert => {
            const alertDiv = this.createAlertElement(alert);
            if (alertDiv) alertContainer.appendChild(alertDiv);
        });

        wrapper.appendChild(alertContainer);
        return wrapper;
    },

    // Create individual alert elements
    createAlertElement: function(alert) {
        if (!alert.processedInfo) return null;

        const alertDiv = document.createElement("div");
        const info = alert.processedInfo;
        const severityClass = `alert-${info.severity.toLowerCase()}`;
        const urgencyClass = this.getUrgencyClass(info.urgency);
        
        alertDiv.className = `alert ${severityClass} ${urgencyClass}`;

        // Add icon if configured
        if (this.config.showIcons) {
            const iconDiv = document.createElement("div");
            iconDiv.className = "alert-icon";
            const iconClass = this.getAlertIcon(alert);
            iconDiv.innerHTML = `<i class="${iconClass}"></i>`;
            alertDiv.appendChild(iconDiv);
        }

        // Add content container
        const contentDiv = document.createElement("div");
        contentDiv.className = "alert-content";

        // Add primary language content
        this.addAlertContent(contentDiv, info, alert);

        // Add English translation if configured
        if (this.config.showBothLanguages && alert.englishInfo) {
            const divider = document.createElement("hr");
            divider.className = "alert-divider";
            contentDiv.appendChild(divider);
            this.addAlertContent(contentDiv, alert.englishInfo, alert);
        }

        alertDiv.appendChild(contentDiv);
        return alertDiv;
    },

    // Add content to alert element
    addAlertContent: function(container, info, alert) {
        // Add title
        const title = document.createElement("div");
        title.className = "alert-title";
        title.textContent = info.event;
        container.appendChild(title);

        // Add description
        const description = document.createElement("div");
        description.className = "alert-description";
        description.textContent = info.description;
        container.appendChild(description);

        // Add metadata
        const metadata = document.createElement("div");
        metadata.className = "alert-metadata";
        metadata.textContent = `${info.senderName} - ${new Date(alert.sent).toLocaleString(
            info.language === "sv-SE" ? "sv-SE" : "en-US"
        )}`;
        container.appendChild(metadata);
    },

    // Get appropriate icon for alert type
    getAlertIcon: function(alert) {
        const iconMap = {
            Severe: {
                fire: "wi-fire",
                storm: "wi-thunderstorm",
                flood: "wi-flood",
                default: "fa-exclamation-triangle"
            },
            Moderate: {
                default: "fa-exclamation-circle"
            },
            Minor: {
                default: "fa-info-circle"
            }
        };

        const severity = alert.processedInfo.severity || "Minor";
        const category = alert.processedInfo.category || "default";
        
        return (iconMap[severity] && iconMap[severity][category]) 
            ? iconMap[severity][category] 
            : iconMap[severity].default || iconMap.Minor.default;
    },

    // Get CSS class for urgency level
    getUrgencyClass: function(urgency) {
        const urgencyMap = {
            Immediate: "urgency-immediate",
            Expected: "urgency-expected",
            Future: "urgency-future"
        };
        return urgencyMap[urgency] || "urgency-unknown";
    },

    // Handle socket notifications from node_helper
    socketNotificationReceived: function(notification, payload) {
        if (notification === "ALERTS_DATA") {
            Log.debug("VMA: Received alerts data:", payload);
            this.alerts = Array.isArray(payload) ? payload : [];
            this.loaded = true;
            this.updateDom();
        }
    }
});

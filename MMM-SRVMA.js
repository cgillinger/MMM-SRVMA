/* MMM-SRVMA.js
 * Version: 2.2.0
 * A MagicMirror² module for displaying Swedish VMA (Important Public Announcements)
 * 
 * By Christian Gillinger
 * MIT Licensed
 * 
 * Changes in 2.2.0:
 * - Added proper support for English translations
 * - Fixed language selection and fallback logic
 * - Improved date formatting and localization
 * - Enhanced alert content processing
 */

Module.register("MMM-SRVMA", {
    defaults: {
        updateInterval: 60000,      // How often to check for new alerts (1 minute)
        alertAgeThreshold: 3600000, // Show alerts from last hour (1 hour)
        maxHeight: "300px",         // Maximum height of the module
        width: "400px",            // Width of the module (ignored in top_bar)
        showIcons: true,           // Show weather icons for relevant alerts
        animateIn: true,           // Enable fade-in animation
        preferredLanguage: "sv-SE", // Primary language (sv-SE or en-US)
        showBothLanguages: false,   // Show both languages when available
        geoCode: null,             // Location filter (e.g., "12" for Stockholm)
        showInitialMessage: true    // Show "no alerts" message on startup
    },

    // Required styles in load order
    getStyles: function() {
        return [
            "MMM-SRVMA.css",
            "MMM-SRVMA-positions.css",
            "font-awesome.css",
            "weather-icons.css"
        ];
    },

    // Module initialization
    start: function() {
        Log.info("Starting module: " + this.name);
        
        this.alerts = [];
        this.loaded = false;
        this.initialLoad = this.config.showInitialMessage;
        
        this.getData();
        this.scheduleUpdate();

        // Set up initial message timer if enabled
        if (this.config.showInitialMessage) {
            setTimeout(() => {
                this.initialLoad = false;
                this.updateDom();
            }, 60000);  // Show for 1 minute
        }
    },

    // Request data from node_helper
    getData: function() {
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

    // Process alerts data with language handling
    processAlerts: function(alerts) {
        if (!Array.isArray(alerts)) {
            Log.error("Invalid alerts data received");
            return [];
        }

        return alerts.filter(alert => {
            if (!alert.info || !Array.isArray(alert.info) || alert.info.length === 0) {
                return false;
            }

            // Find primary and English versions
            const preferredInfo = alert.info.find(info => 
                info.language === this.config.preferredLanguage);
            const englishInfo = alert.info.find(info => 
                info.language === "en-US");

            // Set primary display language
            if (this.config.preferredLanguage === "en-US") {
                alert.processedInfo = englishInfo || alert.info[0];
            } else {
                alert.processedInfo = preferredInfo || alert.info[0];
            }

            // Store English version if showing both languages
            if (this.config.showBothLanguages && englishInfo) {
                alert.englishInfo = englishInfo;
            }

            return true;
        });
    },

    // Create DOM representation
    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = `mmm-srvma-wrapper ${this.config.animateIn ? 'fade-in' : ''}`;
        
        if (this.data.position !== "top_bar") {
            wrapper.style.width = this.config.width;
            wrapper.style.maxHeight = this.config.maxHeight;
        }

        // Handle loading state
        if (!this.loaded) {
            const loadingDiv = document.createElement("div");
            loadingDiv.innerHTML = "Loading...";
            loadingDiv.className = "dimmed light small loading";
            wrapper.appendChild(loadingDiv);
            return wrapper;
        }

        // Handle no alerts state
        if (!this.alerts.length) {
            if (this.initialLoad) {
                const noAlertsDiv = document.createElement("div");
                noAlertsDiv.innerHTML = this.config.preferredLanguage === "sv-SE" ? 
                    "Inga aktuella VMA" : "No current alerts";
                noAlertsDiv.className = "dimmed light small no-alerts";
                wrapper.appendChild(noAlertsDiv);
            } else {
                wrapper.style.display = "none";
            }
            return wrapper;
        }

        // Create and populate alerts container
        const alertContainer = document.createElement("div");
        alertContainer.className = "alert-container";

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
        
        alertDiv.className = `alert alert-${info.severity.toLowerCase()} ${this.getUrgencyClass(info.urgency)}`;

        // Add weather icon if configured
        if (this.config.showIcons) {
            const iconDiv = document.createElement("div");
            iconDiv.className = "alert-icon";
            iconDiv.innerHTML = `<i class="${this.getAlertIcon(alert)}"></i>`;
            alertDiv.appendChild(iconDiv);
        }

        // Create content container
        const contentDiv = document.createElement("div");
        contentDiv.className = "alert-content";

        // Add primary language content
        this.addAlertContent(contentDiv, info, alert.sent, false);

        // Add English translation if configured and available
        if (this.config.showBothLanguages && alert.englishInfo) {
            contentDiv.appendChild(document.createElement("hr")).className = "alert-divider";
            this.addAlertContent(contentDiv, alert.englishInfo, alert.sent, true);
        }

        alertDiv.appendChild(contentDiv);
        return alertDiv;
    },

    // Add content to alert element
    addAlertContent: function(container, info, sentTime, isTranslation) {
        const contentWrapper = document.createElement("div");
        contentWrapper.className = isTranslation ? "alert-translation" : "alert-primary";

        // Add title
        const title = document.createElement("div");
        title.className = "alert-title";
        title.textContent = info.event;
        contentWrapper.appendChild(title);

        // Add description
        const description = document.createElement("div");
        description.className = "alert-description";
        description.textContent = info.description;
        contentWrapper.appendChild(description);

        // Add metadata with localized date
        const metadata = document.createElement("div");
        metadata.className = "alert-metadata";
        metadata.textContent = `${info.senderName} - ${new Date(sentTime).toLocaleString(
            info.language === "sv-SE" ? "sv-SE" : "en-US",
            { dateStyle: "medium", timeStyle: "short" }
        )}`;
        contentWrapper.appendChild(metadata);

        container.appendChild(contentWrapper);
    },

    // Get appropriate icon for alert type
    getAlertIcon: function(alert) {
        const iconMap = {
            Severe: {
                fire: "wi-fire",
                storm: "wi-thunderstorm",
                flood: "wi-flood",
                default: "fa fa-exclamation-triangle"
            },
            Moderate: {
                default: "fa fa-exclamation-circle"
            },
            Minor: {
                default: "fa fa-info-circle"
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
            this.alerts = Array.isArray(payload) ? payload : [];
            this.loaded = true;
            this.updateDom();
        }
    }
});
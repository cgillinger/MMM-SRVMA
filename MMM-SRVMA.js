/* MagicMirror² Module: MMM-SRVMA
 * Version: 2.1.0
 * Enhanced version with English translation support
 */

Module.register("MMM-SRVMA", {
    defaults: {
        useDummyData: false,
        dummySeverity: "Severe",
        dummyUrgency: "Immediate",
        updateInterval: 60000,
        alertAgeThreshold: 3600000,
        maxHeight: "300px",
        width: "400px",
        showIcons: true,
        animateIn: true,
        preferredLanguage: "sv-SE", // Default to Swedish, can be "en-US"
        showBothLanguages: false    // Option to show both language versions
    },

    getStyles: function() {
        return [
            "MMM-SRVMA.css",
            "font-awesome.css",
            "weather-icons.css"
        ];
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.alerts = [];
        this.loaded = false;
        this.getData();
        this.scheduleUpdate();
    },

    getData: function() {
        this.sendSocketNotification("FETCH_ALERTS", {
            ...this.config,
            timestamp: new Date().toISOString()
        });
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.getData();
        }, this.config.updateInterval);
    },

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

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = `mmm-srvma-wrapper ${this.config.animateIn ? 'fade-in' : ''}`;
        wrapper.style.width = this.config.width;
        wrapper.style.maxHeight = this.config.maxHeight;

        if (!this.loaded) {
            wrapper.innerHTML = "Loading...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (this.alerts.length === 0) {
            wrapper.innerHTML = this.config.preferredLanguage === "sv-SE" ? 
                "Inga aktuella VMA" : "No current alerts";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        const alertContainer = document.createElement("div");
        alertContainer.className = "alert-container";

        this.processAlerts(this.alerts).forEach(alert => {
            const alertDiv = this.createAlertElement(alert);
            if (alertDiv) alertContainer.appendChild(alertDiv);
        });

        wrapper.appendChild(alertContainer);
        return wrapper;
    },

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

        // Content container
        const contentDiv = document.createElement("div");
        contentDiv.className = "alert-content";

        // Primary language content
        this.addAlertContent(contentDiv, info, alert);

        // Add English translation if configured and available
        if (this.config.showBothLanguages && alert.englishInfo) {
            const divider = document.createElement("hr");
            divider.className = "alert-divider";
            contentDiv.appendChild(divider);
            this.addAlertContent(contentDiv, alert.englishInfo, alert);
        }

        alertDiv.appendChild(contentDiv);
        return alertDiv;
    },

    addAlertContent: function(container, info, alert) {
        // Title
        const title = document.createElement("div");
        title.className = "alert-title";
        title.textContent = info.event;
        container.appendChild(title);

        // Description
        const description = document.createElement("div");
        description.className = "alert-description";
        description.textContent = info.description;
        container.appendChild(description);

        // Metadata
        const metadata = document.createElement("div");
        metadata.className = "alert-metadata";
        metadata.textContent = `${info.senderName} - ${new Date(alert.sent).toLocaleString(
            info.language === "sv-SE" ? "sv-SE" : "en-US"
        )}`;
        container.appendChild(metadata);
    },

    getAlertIcon: function(alert) {
        if (!this.config.showIcons) return null;

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

    getUrgencyClass: function(urgency) {
        const urgencyMap = {
            Immediate: "urgency-immediate",
            Expected: "urgency-expected",
            Future: "urgency-future"
        };
        return urgencyMap[urgency] || "urgency-unknown";
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "ALERTS_DATA") {
            this.alerts = Array.isArray(payload) ? payload : [];
            this.loaded = true;
            this.updateDom();
        }
    }
});

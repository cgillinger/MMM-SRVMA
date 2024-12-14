/* MagicMirror² Module: MMM-SRVMA
 * Version: 2.0.0
 * Enhanced version with severity visualization and test controls
 */

Module.register("MMM-SRVMA", {
    defaults: {
        useDummyData: false,
        dummySeverity: "Severe", // Severe, Moderate, Minor
        dummyUrgency: "Immediate", // Immediate, Expected, Future
        updateInterval: 60000,
        alertAgeThreshold: 3600000,
        maxHeight: "300px",
        width: "400px",
        showIcons: true, // Enable/disable weather icons
        animateIn: true // Enable/disable fade-in animation
    },

    getStyles: function() {
        return [
            "MMM-SRVMA.css",
            "font-awesome.css", // For standard icons
            "weather-icons.css" // For weather-specific icons
        ];
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.alerts = [];
        this.loaded = false;
        this.getData();
        this.scheduleUpdate();
    },

    // Helper function to determine icon based on severity and type
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

        const severity = alert.info[0].severity || "Minor";
        const category = alert.info[0].category || "default";
        
        return (iconMap[severity] && iconMap[severity][category]) 
            ? iconMap[severity][category] 
            : iconMap[severity].default || iconMap.Minor.default;
    },

    // Helper function to determine urgency class
    getUrgencyClass: function(urgency) {
        const urgencyMap = {
            Immediate: "urgency-immediate",
            Expected: "urgency-expected",
            Future: "urgency-future"
        };
        return urgencyMap[urgency] || "urgency-unknown";
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
            wrapper.innerHTML = "Inga aktuella VMA";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        const alertContainer = document.createElement("div");
        alertContainer.className = "alert-container";

        this.alerts.forEach(alert => {
            if (!alert.info || !alert.info[0]) return;

            const info = alert.info[0];
            const alertDiv = document.createElement("div");
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

            // Title with severity indicator
            const title = document.createElement("div");
            title.className = "alert-title";
            title.textContent = info.event;
            contentDiv.appendChild(title);

            // Description
            const description = document.createElement("div");
            description.className = "alert-description";
            description.textContent = info.description;
            contentDiv.appendChild(description);

            // Metadata (sender, time)
            const metadata = document.createElement("div");
            metadata.className = "alert-metadata";
            metadata.textContent = `${info.senderName} - ${new Date(alert.sent).toLocaleString()}`;
            contentDiv.appendChild(metadata);

            alertDiv.appendChild(contentDiv);
            alertContainer.appendChild(alertDiv);
        });

        wrapper.appendChild(alertContainer);
        return wrapper;
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

    socketNotificationReceived: function(notification, payload) {
        if (notification === "ALERTS_DATA") {
            this.alerts = this.filterAlerts(payload);
            this.loaded = true;
            this.updateDom();
        }
    },

    filterAlerts: function(alerts) {
        const now = Date.now();
        return alerts.filter(alert => {
            const sentTime = new Date(alert.sent).getTime();
            return now - sentTime <= this.config.alertAgeThreshold;
        });
    }
});

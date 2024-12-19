# MMM-SRVMA - VMA Alerts for MagicMirror²
Version 2.1.3

A MagicMirror² module for displaying VMA (Viktigt Meddelande till Allmänheten - Important Public Announcements) from Swedish authorities through Sveriges Radio's API. This module shows critical public safety information, weather warnings, and other important alerts in Sweden.

⚠️ **IMPORTANT**: This module only works within Sweden as it uses the Swedish VMA system. The API only provides alerts for Swedish territories and municipalities.

![MMM-SRVMA Screenshot](SRVMA.png)

## API Information
This module uses the official VMA API service provided by Sveriges Radio AB. The VMA system is owned and operated by Sveriges Radio AB on behalf of Swedish authorities.

For more information about the VMA service:
- [VMA API Documentation](https://vmaapi.sr.se/index.html)
- [VMA API Release Notes](https://vmaapi.sr.se/releasenotes)
- [Sveriges Radio VMA Information](https://sverigesradio.se/artikel/vma-viktigt-meddelande-till-allmanheten)
- [GeoCodes Reference](https://vmaapi.sr.se/api/v2/area/sweden) (List of valid Swedish location codes)

## What's New in v2.1.3
- Added support for English translations
- Improved positioning options with full-width banner support
- Enhanced error handling and loading states
- Added test mode for easy setup verification

## Before You Begin
You'll need to edit the MagicMirror² configuration file located at:
```bash
~/MagicMirror/config/config.js
```

💡 TIP: If you're new to MagicMirror², this file contains all your module settings. Make sure to back it up before making changes!

## Installation Steps

1. Open a terminal window (or Command Prompt in Windows)

2. Navigate to your MagicMirror's modules folder:
```bash
cd ~/MagicMirror/modules
```

3. Clone this repository:
```bash
git clone https://github.com/cgillinger/MMM-SRVMA
```

4. Install dependencies:
```bash
cd MMM-SRVMA
npm install
```

## Configuration Guide

### Step 1: Choose Your Position
The module can be displayed in two different ways:

1. **Full-Width Banner** (`position: "top_bar"`)
   - Spans the entire width of your screen
   - Perfect for important announcements
   - Automatically centers content
   
2. **Regular Card** (any other position)
   - Fixed width display
   - Fits neatly in any corner
   - Maintains compact appearance

### Step 2: Edit Your Configuration
Open your `config/config.js` file and add one of these configurations:

#### For Full-Width Banner:
```javascript
{
    module: "MMM-SRVMA",
    position: "top_bar",    // This creates the full-width banner
    config: {
        updateInterval: 60000,        // How often to check for new alerts (in milliseconds)
        showIcons: true,             // Show weather icons when applicable
        animateIn: true,             // Smooth fade-in animation
        geoCode: "12",               // Your location code (e.g., "12" for Stockholm County)
        preferredLanguage: "sv-SE",   // "sv-SE" for Swedish, "en-US" for English
        showBothLanguages: false      // Set to true to show both languages
    }
}
```

#### For Regular Card Display:
```javascript
{
    module: "MMM-SRVMA",
    position: "top_right",   // Can be top_left, bottom_right, etc.
    config: {
        width: "400px",      // Width of the module (ignored in top_bar position)
        maxHeight: "300px",  // Maximum height
        updateInterval: 60000,
        showIcons: true,
        animateIn: true,
        geoCode: "12",
        preferredLanguage: "sv-SE",
        showBothLanguages: false
    }
}
```

### Step 3: Choose Your Location
Find your location code (Swedish locations only):
- Two digits for counties (län)
- Four digits for municipalities (kommuner)

Common codes:
- "12" = Stockholm County
- "1280" = Stockholm Municipality
- "14" = Gothenburg County
- "1480" = Gothenburg Municipality

Add your code to the config:
```javascript
config: {
    geoCode: "12",    // Replace with your location code
    // ... other settings
}
```

### Step 4: Choose Your Language
Pick one:
```javascript
// For Swedish only:
config: {
    preferredLanguage: "sv-SE",
    showBothLanguages: false
}

// For English only:
config: {
    preferredLanguage: "en-US",
    showBothLanguages: false
}

// For both languages:
config: {
    preferredLanguage: "sv-SE",  // Primary language
    showBothLanguages: true      // Shows both when available
}
```

## Testing Your Setup

Before connecting to live data, you can test the module:

1. Add this test configuration:
```javascript
{
    module: "MMM-SRVMA",
    position: "top_right",  // Try both top_bar and other positions
    config: {
        useDummyData: true,        // Enables test mode
        dummySeverity: "Severe",   // Try: "Severe", "Moderate", or "Minor"
        dummyUrgency: "Immediate", // Try: "Immediate", "Expected", or "Future"
        preferredLanguage: "en-US" // Test your language preference
    }
}
```

2. Restart your MagicMirror
3. You should see a test alert appear

## Troubleshooting

If the module doesn't appear:
1. Check your `config.js` file for proper formatting (commas, brackets)
2. Look for errors in the MagicMirror console (F12 in most browsers)
3. Verify that the module folder name is exactly `MMM-SRVMA`
4. Ensure you're within Swedish territories (API limitation)

## All Configuration Options

| Option | What It Does | Default | Valid Options |
|--------|-------------|---------|---------------|
| `position` | Where to display the module | "top_right" | "top_bar" or any MM position |
| `width` | Module width (ignored in top_bar) | "400px" | Any CSS width |
| `maxHeight` | Maximum height | "300px" | Any CSS height |
| `preferredLanguage` | Primary language | "sv-SE" | "sv-SE", "en-US" |
| `showBothLanguages` | Show dual languages | false | true, false |
| `geoCode` | Location filter | null | County/Municipality code |
| `showIcons` | Display alert icons | true | true, false |
| `animateIn` | Enable animations | true | true, false |
| `updateInterval` | Update frequency (ms) | 60000 | Any number |
| `alertAgeThreshold` | Max alert age (ms) | 3600000 | Any number |
| `useDummyData` | Test mode | false | true, false |
| `dummySeverity` | Test alert severity | "Severe" | "Severe", "Moderate", "Minor" |
| `dummyUrgency` | Test alert urgency | "Immediate" | "Immediate", "Expected", "Future" |

## Support & Updates

- For help: Open an issue on GitHub
- For updates: Watch the repository or check version numbers
- Current stable version: 2.1.3
- Geographic coverage: Sweden only

## Attribution & License
- Module created by Christian Gillinger
- Uses Sveriges Radio's VMA API service (Swedish territories only)
- Version 2.1.3 released December 2024
- MIT License - see LICENSE file for details

Need more help? Open an issue on GitHub or check the MagicMirror forums!
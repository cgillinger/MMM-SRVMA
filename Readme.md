# MMM-SRVMA - VMA Alerts for MagicMirror²

A MagicMirror² module for displaying VMA (Viktigt Meddelande till Allmänheten - Important Public Announcements) from Swedish authorities through Sveriges Radio's API. This module shows critical public safety information, weather warnings, and other important alerts in Sweden.

![MMM-SRVMA Screenshot](SRVMA.png)

## API Attribution
This module uses the VMA API service provided by Sveriges Radio AB. The VMA system is owned and operated by Sveriges Radio AB on behalf of Swedish authorities. For more information about the VMA service, visit:
- [VMA API Documentation](https://vmaapi.sr.se/index.html)
- [VMA API Release Notes](https://vmaapi.sr.se/releasenotes)
- [Sveriges Radio VMA Information](https://sverigesradio.se/artikel/vma-viktigt-meddelande-till-allmanheten)

## English 🇬🇧

### Description
This module displays Swedish VMA (Important Public Announcements) on your MagicMirror. It shows different types of alerts with color-coding based on severity:
- Red: Severe alerts (like the industrial accident alert shown in the screenshot)
- Orange: Moderate alerts
- Yellow: Minor alerts

### Installation
1. Navigate to your MagicMirror's modules folder:
```bash
cd ~/MagicMirror/modules
```

2. Clone this repository:
```bash
git clone https://github.com/cgillinger/SRVMA
```

3. Install dependencies:
```bash
cd MMM-SRVMA
npm install
```

### Configuration
Add this to your `config/config.js` file:
```javascript
{
    module: "MMM-SRVMA",
    position: "top_right",
    config: {
        updateInterval: 60000, // Update every minute
        alertAgeThreshold: 3600000, // Show alerts up to 1 hour old
        maxHeight: "300px",
        width: "400px",
        showIcons: true,
        animateIn: true,
        language: "sv" // Language setting (sv = Swedish, en = English)
    }
}
```

### Language Options
The module supports two languages:
- `sv`: Swedish (Svenska) - Default
- `en`: English

To change the language, add or modify the `language` option in your configuration:
```javascript
config: {
    language: "en" // For English
    // or
    language: "sv" // For Swedish (default)
}
```

Language setting affects:
- Alert descriptions
- Time formats
- Interface text
- Status messages

### Test Mode with Dummy Data
To test the module without connecting to the actual API, you can use dummy data. Add these options to your configuration:

```javascript
{
    module: "MMM-SRVMA",
    position: "top_right",
    config: {
        // ... other options ...
        useDummyData: true,
        dummySeverity: "Severe", // Options: "Severe", "Moderate", "Minor"
        dummyUrgency: "Immediate" // Options: "Immediate", "Expected", "Future"
    }
}
```

The dummy data will show a test alert with the specified severity and urgency. This is useful for:
- Testing the module's appearance
- Developing new features
- Checking different alert styles
- Testing without internet connection

### Configuration Options
| Option | Description | Default |
|--------|-------------|---------|
| `updateInterval` | How often to check for new alerts (in milliseconds) | 60000 |
| `alertAgeThreshold` | How old alerts can be before they're hidden (in milliseconds) | 3600000 |
| `maxHeight` | Maximum height of the module | "300px" |
| `width` | Width of the module | "400px" |
| `showIcons` | Whether to show alert icons | true |
| `animateIn` | Enable fade-in animation for new alerts | true |
| `useDummyData` | Enable test mode with dummy data | false |
| `dummySeverity` | Severity level for test alerts | "Severe" |
| `dummyUrgency` | Urgency level for test alerts | "Immediate" |
| `language` | Interface language (sv/en) | "sv" |

## Svenska 🇸🇪

### Beskrivning
Denna modul visar VMA (Viktigt Meddelande till Allmänheten) på din MagicMirror. Den använder Sveriges Radios VMA-API för att hämta och visa viktiga meddelanden. Varningar visas med färgkodning baserat på allvarlighetsgrad:
- Röd: Allvarliga varningar
- Orange: Måttliga varningar
- Gul: Mindre allvarliga varningar

### Installation
1. Navigera till din MagicMirror's modules-mapp:
```bash
cd ~/MagicMirror/modules
```

2. Klona detta repository:
```bash
git clone https://github.com/chrillgi/MMM-SRVMA
```

3. Installera beroenden:
```bash
cd MMM-SRVMA
npm install
```

### Språkalternativ
Modulen stöder två språk:
- `sv`: Svenska - Standard
- `en`: Engelska

För att ändra språk, lägg till eller ändra `language`-alternativet i din konfiguration:
```javascript
config: {
    language: "en" // För Engelska
    // eller
    language: "sv" // För Svenska (standard)
}
```

Språkinställningen påverkar:
- Varningsbeskrivningar
- Tidsformat
- Gränssnittstext
- Statusmeddelanden

### Testläge med Dummy-Data
För att testa modulen utan att ansluta till det faktiska API:et kan du använda dummy-data. Lägg till dessa alternativ i din konfiguration:

```javascript
{
    module: "MMM-SRVMA",
    position: "top_right",
    config: {
        // ... andra alternativ ...
        useDummyData: true,
        dummySeverity: "Severe", // Alternativ: "Severe", "Moderate", "Minor"
        dummyUrgency: "Immediate" // Alternativ: "Immediate", "Expected", "Future"
    }
}
```

Dummy-data kommer att visa ett testmeddelande med angiven allvarlighetsgrad och brådska. Detta är användbart för:
- Testa modulens utseende
- Utveckla nya funktioner
- Kontrollera olika varningsstilar
- Testa utan internetanslutning

### Konfigurationsalternativ
| Alternativ | Beskrivning | Standard |
|------------|-------------|----------|
| `updateInterval` | Hur ofta nya varningar ska hämtas (i millisekunder) | 60000 |
| `alertAgeThreshold` | Hur gamla varningar kan vara innan de döljs (i millisekunder) | 3600000 |
| `maxHeight` | Maxhöjd för modulen | "300px" |
| `width` | Bredd på modulen | "400px" |
| `showIcons` | Om ikoner ska visas | true |
| `animateIn` | Aktivera fade-in animation för nya varningar | true |
| `useDummyData` | Aktivera testläge med dummy-data | false |
| `dummySeverity` | Allvarlighetsgrad för testvarningar | "Severe" |
| `dummyUrgency` | Brådskande nivå för testvarningar | "Immediate" |
| `language` | Gränssnittsspråk (sv/en) | "sv" |

## Support
For support, please open an issue on GitHub.

## Attribution and License
- This module is created by Christian Gillinger under the MIT License
- VMA API service is provided by Sveriges Radio AB
- MagicMirror² is an open source project

## License
MIT License - see LICENSE file for details

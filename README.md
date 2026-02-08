# RPG Character Sheets

A static website for viewing and creating character sheets for tabletop RPGs.

## Features

- **Mobile-first responsive design** - Optimized for phones and tablets
- **Character sheet viewing** with interactive elements
- **Character creation/editing** with form validation
- **Theme switching** - Light (retro) and Dark (dim) themes
- **Internationalization** - Portuguese (PT-BR) and English support
- **Local storage persistence** for volatile data (wounds, fatigue, bennies, status)
- **JSON import/export** for character data

## Technologies

- HTML5, CSS3, JavaScript (Vanilla)
- [daisyUI](https://daisyui.com/) - UI component library (via CDN)
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS (via CDN)
- [Quill.js](https://quilljs.com/) - Rich text editor for descriptions (via CDN)

## Project Structure

```
RPG-Character-Sheets/
|-- index.html                    # Main SPA entry point
|-- locales.json                  # i18n translations (PT-BR / EN)
|-- css/
|   +-- main.css                  # Custom styles
|-- js/
|   |-- app.js                    # App initialization and navigation
|   |-- i18n.js                   # Internationalization system
|   |-- utils.js                  # Utility functions and constants
|   |-- index.js                  # Home page logic
|   |-- character-sheet.js        # Character sheet display logic
|   |-- character-creation.js     # Form rendering
|   +-- character-creation-events.js  # Form event handlers
|-- characters/                   # Character sheets that are persistent in the page
|-- systems/
|   +-- savage-worlds/
|       +-- sheet-template.json   # Blank character template
+-- img/
    |-- systems/                  # Images for the game systems
    +-- icons/                    # SVG images for the page
```

## Usage

### Home Page

- View available character sheets as cards
- Click a card to view the full character sheet
- Use "Upload Sheet" to load a `.json` character file
- Use "Create Sheet" to start a new character

### Character Sheet

The character sheet displays all information organized in sections:

**Header**
- Portrait, name, race, age, height, weight, advances

**Sub-Header (Volatile Data)**
- Fatigue levels (Fatigued, Exhausted, Incapacitated)
- Wounds (3 base + extras from JSON)
- Bennies (3 base)
- Status effects (Shaken, Distracted, Vulnerable, Stunned, Entangled, Bound, Incapacitated, Prone)

**Derived Statistics**
- Size, Pace (with running die), Parry, Toughness
- Multiple movement types supported (flight, swimming, etc.)

**Attributes and Skills**
- Visual dice representation (d4 through d12+4)
- Automatic penalty display from wounds/fatigue/status

**Edges, Hindrances, Powers**
- Collapsible sections with full descriptions
- Rich text formatting preserved

**Equipment**
- Weapons, Armor, Shields, Gear
- Weight calculation with encumbrance tracking
- Minimum strength warnings

**Biography**
- Full character background

### Character Creation

A complete form for creating new characters:

- System selection (Savage Worlds: Adventure Edition)
- All header fields with portrait URL
- Attribute selection (d4 to d12)
- Skill selection with duplicate prevention
- Custom skills support
- Edges and Hindrances with rich text descriptions
- Equipment with all relevant fields
- Powers with manifestation and description
- Biography with rich text editor
- Download as JSON file

## Character JSON Schema

```json
{
  "system": "Savage Worlds: Adventure Edition",
  "portrait": "https://example.com/image.png",
  "header": {
    "name": "Character Name",
    "race": "Human",
    "age": "25",
    "height": "1.80m",
    "weight": "75kg",
    "advances": 0
  },
  "volatile": {
    "extraWounds": 0,
    "extraBennies": 0
  },
  "attributes": {
    "agility": "d8",
    "smarts": "d6",
    "spirit": "d6",
    "strength": "d6",
    "vigor": "d6"
  },
  "derivedStats": {
    "size": 0,
    "movements": [
      { "type": "Standard", "pace": 6, "runningDie": "d6" }
    ],
    "parryModifiers": [],
    "toughnessModifiers": []
  },
  "skills": [
    { "name": "Athletics", "die": "d4" }
  ],
  "edges": [
    { "name": "Edge Name", "requirements": "Novice", "description": "<p>Description</p>" }
  ],
  "hindrances": [
    { "name": "Hindrance Name", "type": "major", "description": "<p>Description</p>" }
  ],
  "equipment": {
    "weapons": [],
    "armor": [],
    "shields": [],
    "gear": []
  },
  "powers": [],
  "biography": "<p>Character background...</p>"
}
```

## Penalty System

The character sheet automatically calculates penalties based on:

| Condition | Trait Penalty | Pace Penalty | Auto Status |
|-----------|---------------|--------------|-------------|
| Fatigued | -1 | - | - |
| Exhausted | -2 | - | - |
| Incapacitated (fatigue) | -2 | - | Incapacitated |
| Per Wound | -1 | -1 | - |
| Distracted | -2 | - | - |
| Entangled | - | - | Vulnerable |
| Bound | - | - | Entangled, Vulnerable, Distracted |

Penalties stack and are displayed next to attribute and skill dice.

## Modular Architecture

The project is designed to support multiple RPG systems in the future:

- System-specific templates in `systems/[system-name]/`
- Shared utility functions in `utils.js`
- Dynamic form generation based on selected system
- Extensible JSON schema

## Browser Support

- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+

## License

This project is for personal use. Savage Worlds is a trademark of Pinnacle Entertainment Group.

## Contributing

This is a personal project, but suggestions are welcome. Please open an issue for bugs or feature requests.

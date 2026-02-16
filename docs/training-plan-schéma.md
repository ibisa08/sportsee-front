

# Feature 2 — Contrat JSON du générateur de plans d'entraînement (v1)

Ce document définit **le format JSON attendu** entre le Front (Calendar AI) et le Backend (génération IA). Le Backend doit renvoyer **uniquement** un JSON conforme à ce contrat.

## Objectifs
- Permettre l’affichage du programme **semaine par semaine** (accordéon Semaine 1 → Semaine 6).
- Permettre l’export calendrier `.ics` (1 événement par séance).
- Gérer les cas particuliers (objectif irréaliste, données manquantes, plan invalide).

## Règles globales
- **Durée** : 6 semaines (`weeks.length === 6`).
- **1 séance = 1 objet** dans `weeks[n].sessions`.
- **Chaque séance** doit contenir :
  - Durée totale **ou** distance cible (`durationMinutes` ou `targetDistanceKm`).
  - Description détaillée (`details.warmup`, `details.main`, `details.cooldown`).
  - Intensité / allure (`intensity`).
  - Objectif de la séance (`sessionGoal`).
  - Conseils optionnels (`tips`).
- **Titre** : `"Entraînement - {Type}"`.
- **Heure** : `startTime` au format `HH:MM` (si pas de préférence, défaut `18:00`).

## Format JSON

> Le backend renvoie ce JSON **sans texte additionnel**.

```json
{
  "meta": {
    "objective": "string",
    "startDate": "YYYY-MM-DD",
    "timeZone": "Europe/Paris",
    "sessionsPerWeek": 3,
    "level": "debutant|intermediaire|avance|unknown",
    "generatedAt": "ISO_DATETIME"
  },
  "warnings": [
    {
      "type": "UNREALISTIC_GOAL|MISSING_DATA|INVALID_PLAN",
      "message": "string",
      "suggestedObjective": "string (optionnel)"
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Semaine 1",
      "sessions": [
        {
          "id": "W1-S1",
          "title": "Entraînement - Endurance",
          "type": "endurance|fractionne|sortie_longue|recuperation|renfo",
          "date": "YYYY-MM-DD",
          "startTime": "18:00",
          "durationMinutes": 45,
          "targetDistanceKm": null,
          "intensity": "Zone 2 / RPE 3-4 / Allure facile",
          "sessionGoal": "string",
          "details": {
            "warmup": "string",
            "main": "string",
            "cooldown": "string"
          },
          "tips": ["string", "string"]
        }
      ]
    }
  ]
}
```

## Gestion des cas particuliers

### Objectif irréaliste
Exemple : **marathon en 6 semaines** pour un débutant.
- Ajouter un warning :
  - `type: "UNREALISTIC_GOAL"`
  - `suggestedObjective`: proposer un objectif intermédiaire (ex: 10 km / semi)
  - `message`: expliquer brièvement la progression recommandée.
- Générer un plan **réaliste** correspondant à l’objectif intermédiaire.

### Plan invalide / incomplet
Si l’IA renvoie un JSON non conforme (champs manquants, dates invalides, aucune séance) :
- Ajouter `warnings: [{ type: "INVALID_PLAN", ... }]`.
- Refaire **1 tentative de correction** (repair JSON) ou appliquer un **plan fallback** (template simple).

### Données manquantes
Si le profil/données SportSee sont indisponibles :
- Ajouter `warnings: [{ type: "MISSING_DATA", ... }]`.
- Générer un plan prudent (volume faible + progression douce).

## Mapping export calendrier (.ics)
Pour chaque `session` :
- `SUMMARY` = `title`
- `DTSTART` = `date + startTime` (timezone `meta.timeZone`)
- `DTEND` = `DTSTART + durationMinutes` (ou une estimation si distance)
- `DESCRIPTION` = `sessionGoal` + `details.warmup/main/cooldown` + `intensity` + `tips`
- `VALARM` : rappel 30 min avant (`TRIGGER:-PT30M`)
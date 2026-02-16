# Feature 2 — Prompts du générateur de plans d’entraînement (v1)

Ce document décrit les prompts utilisés pour la **génération IA** du plan d’entraînement (Feature 2).
Objectifs :
- Obtenir une **réponse IA au format JSON** exploitable par le Front (Calendar AI).
- Garantir un format stable (pas de texte hors JSON).
- Gérer les cas particuliers : objectif irréaliste, données manquantes, JSON invalide.

> Référence : le contrat final attendu est défini dans `docs/training-plan-schéma.md`.

---

## 1) Stratégie de génération

### Pourquoi on génère un “template 1 semaine” plutôt que 6 semaines directement
La génération de 6 semaines complètes (beaucoup de texte par séance) peut produire un JSON trop long et **cassé** (virgule manquante, tableau tronqué).
Pour maximiser la fiabilité :
1) L’IA génère un **template d’UNE semaine** (court, stable) : sessions + intensité + détails (échauffement/séance/retour au calme).
2) Le backend **duplique** ce template sur 6 semaines et calcule les dates.
3) Le backend renvoie le plan final conforme au contrat (`weeks.length === 6`).

---

## 2) Prompt système — Génération “Template 1 semaine” (JSON ONLY)

**SYSTEM_PROMPT_TEMPLATE_V1**

```text
Tu es SportSee Training Plan Generator.

Tu réponds UNIQUEMENT par un JSON valide (RFC8259).
Aucun texte autour. Pas de Markdown. Pas de blocs ```.

Tu dois générer un TEMPLATE d'UNE semaine seulement (pas 6).

Format STRICT attendu:
{
  "level": "debutant|intermediaire|avance|unknown",
  "sessions": [
    {
      "dow": "Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche",
      "type": "endurance|fractionne|sortie_longue|recuperation|renfo",
      "durationMinutes": number|null,
      "targetDistanceKm": number|null,
      "intensity": "string",
      "sessionGoal": "string",
      "details": { "warmup": "string", "main": "string", "cooldown": "string" },
      "tips": ["string","string"]
    }
  ]
}

Contraintes:
- sessions.length = sessionsPerWeek (pas plus).
- Utilise availabilityDays en priorité si fourni (place les séances sur ces jours).
- Chaque séance doit avoir durationMinutes OU targetDistanceKm (au moins un des deux).
- Chaque séance doit avoir warmup/main/cooldown + intensity + sessionGoal.
- Titre: ne pas générer de title ici (il sera reconstruit côté backend).
- Texte court pour limiter les erreurs JSON:
  - warmup <= 60 caractères
  - main <= 90 caractères
  - cooldown <= 60 caractères
  - intensity <= 50 caractères
  - sessionGoal <= 60 caractères
  - tips: max 2 éléments, chacun <= 50 caractères
- Une seule ligne par champ texte (pas de retours à la ligne).
- Évite les guillemets doubles (") dans les textes (préférer apostrophes).
- Si données manquantes: propose un template prudent (intensité faible, progression douce).
# Feature 2 — Prompts du générateur de plans d’entraînement (v1)

Ce document décrit les prompts utilisés pour la **génération IA** du plan d’entraînement (Feature 2).

Objectifs :
- Obtenir une **réponse IA au format JSON** exploitable par le Front (Calendar AI).
- Garantir un format stable (pas de texte hors JSON).
- Gérer les cas particuliers : objectif irréaliste, données manquantes, JSON invalide.

> Référence : le contrat final attendu est défini dans `docs/training-plan-schéma.md`.

---

## 1) Stratégie de génération

### Pourquoi on génère un “template 1 semaine” plutôt que 6 semaines directement
La génération de 6 semaines complètes (beaucoup de texte par séance) peut produire un JSON trop long et **cassé** (virgule manquante, tableau tronqué).

Pour maximiser la fiabilité :
1) L’IA génère un **template d’UNE semaine** (court, stable) : séances + intensité + détails (échauffement/séance/retour au calme).
2) Le backend **duplique** ce template sur 6 semaines et calcule les dates.
3) Le backend renvoie le plan final conforme au contrat (`weeks.length === 6`).

---

## 2) Prompt système — Génération “Template 1 semaine” (JSON ONLY)

**SYSTEM_PROMPT_TEMPLATE_V1**

```text
Tu es SportSee Training Plan Generator.

Tu réponds UNIQUEMENT par un JSON valide (RFC8259).
Aucun texte autour. Pas de Markdown. Pas de blocs ```.

Tu dois générer un TEMPLATE d'UNE semaine seulement (pas 6).

Format STRICT attendu:
{
  "level": "debutant|intermediaire|avance|unknown",
  "sessions": [
    {
      "dow": "Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche",
      "type": "endurance|fractionne|sortie_longue|recuperation|renfo",
      "durationMinutes": number|null,
      "targetDistanceKm": number|null,
      "intensity": "string",
      "sessionGoal": "string",
      "details": { "warmup": "string", "main": "string", "cooldown": "string" },
      "tips": ["string","string"]
    }
  ]
}

Contraintes:
- sessions.length = sessionsPerWeek (pas plus).
- Utilise availabilityDays en priorité si fourni (place les séances sur ces jours).
- Chaque séance doit avoir durationMinutes OU targetDistanceKm (au moins un des deux).
- Chaque séance doit avoir warmup/main/cooldown + intensity + sessionGoal.
- Titre: ne pas générer de title ici (il sera reconstruit côté backend).
- Texte court pour limiter les erreurs JSON:
  - warmup <= 60 caractères
  - main <= 90 caractères
  - cooldown <= 60 caractères
  - intensity <= 50 caractères
  - sessionGoal <= 60 caractères
  - tips: max 2 éléments, chacun <= 50 caractères
- Une seule ligne par champ texte (pas de retours à la ligne).
- Évite les guillemets doubles (") dans les textes (préférer apostrophes).
- Si données manquantes: propose un template prudent (intensité faible, progression douce).
```

---

## 3) Prompt “user” — Payload envoyé au modèle

Le backend envoie un JSON d’entrée compact : objectif, date de début, contraintes, disponibilités, préférence horaire, et un résumé SportSee si disponible.

**USER_PAYLOAD_EXAMPLE**

```json
{
  "userId": 12,
  "objective": "maigrir",
  "objectiveOriginal": "maigrir",
  "startDate": "2026-02-10",
  "timeZone": "Europe/Paris",
  "preferredStartTime": "18:00",
  "sessionsPerWeek": 3,
  "availabilityDays": ["Lundi", "Mercredi", "Vendredi"],
  "sportseeSummary": {
    "profile": { "firstName": "Sophie", "age": 29 },
    "last10": [
      { "day": "2026-02-01", "kilogram": 70, "calories": 250 },
      { "day": "2026-01-29", "kilogram": 70, "calories": 180 }
    ]
  }
}
```

Notes :
- `sportseeSummary` peut être vide si l’API SportSee n’est pas disponible.
- Le backend calcule ensuite le plan final sur 6 semaines (dates réelles + title “Entraînement - …”).

---

## 4) Prompt système — Repair JSON (si réponse invalide)

Si le modèle renvoie un JSON invalide ou non conforme, le backend fait **une seule** tentative de correction.

**SYSTEM_PROMPT_REPAIR_V1**

```text
Tu es un correcteur JSON.

Tu réponds UNIQUEMENT par un JSON valide (RFC8259).
Aucun texte autour. Pas de Markdown. Pas de blocs ```.

Objectif:
- Corriger le JSON fourni pour qu'il devienne valide et conforme au schéma attendu.

Schéma attendu:
{
  "level": "debutant|intermediaire|avance|unknown",
  "sessions": [
    {
      "dow": "Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche",
      "type": "endurance|fractionne|sortie_longue|recuperation|renfo",
      "durationMinutes": number|null,
      "targetDistanceKm": number|null,
      "intensity": "string",
      "sessionGoal": "string",
      "details": { "warmup": "string", "main": "string", "cooldown": "string" },
      "tips": ["string","string"]
    }
  ]
}

Contraintes:
- sessions.length = sessionsPerWeek (fourni dans le message utilisateur).
- Respecte availabilityDays si fourni.
- Ne rajoute aucun champ supplémentaire.
- Ne renvoie QUE le JSON final corrigé.
```

**USER message pour le repair** (exemple)

```json
{
  "error": "Expected ',' or ']' after array element...",
  "sessionsPerWeek": 3,
  "availabilityDays": ["Lundi","Mercredi","Vendredi"],
  "invalidOutput": "<contenu brut renvoyé par l'IA>"
}
```

---

## 5) Gestion des cas particuliers (règles côté backend)

### Objectif irréaliste (ex: marathon en 6 semaines)
- Le backend détecte l’incohérence (heuristique simple).
- Il ajoute un warning dans le plan final :
  - `type: "UNREALISTIC_GOAL"`
  - `suggestedObjective: "Semi-marathon (ou 10 km)"`
- Le plan est généré pour l’objectif intermédiaire.

### Données manquantes (SportSee indisponible)
- Le backend ajoute : `warnings: [{ type: "MISSING_DATA", message: "..." }]`.
- Et génère un plan prudent.

### Plan invalide / incohérent
- Si le JSON est invalide -> tentative de repair (1 seule).
- Si toujours invalide -> fallback plan conforme mais vide + `INVALID_PLAN`.

---

## 6) Paramètres API recommandés (Mistral)

- `response_format: { "type": "json_object" }` (JSON mode)
- `temperature: 0.2` (stabilité)
- `max_tokens: 900` (template 1 semaine => sortie courte)
- Timeout backend : 120s max

---


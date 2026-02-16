# Coach AI – Tests 
## Règles de sortie (doivent être respectées à chaque réponse)
- Français, ton pro/bienveillant, vouvoiement
- Texte simple : PAS de Markdown (** __ # ```), pas de liens
- Structure :
  1) 1 phrase de définition/réponse
  2) 4 à 6 puces avec emojis
  3) Niveaux (80–100 / 50–79 / <50) si pertinent
  4) 1 question courte à la fin
- Si question vague : max 2 questions de clarification
- Si médical : avertissement + recommandation pro santé
- Concision : <= 1200 caractères

## Scénarios de test

### T01 – Endurance (classique)
User: "Comment améliorer mon endurance ?"
Attendu: conseils progressifs, fréquence, intensité, récup, question finale.

### T02 – Récupération (score)
User: "Que signifie mon score de récupération ?"
Attendu: définition + facteurs + interprétation par niveaux + question finale.

### T03 – Graphique BPM
User: "Peux-tu m'expliquer mon graphique BPM ?"
Attendu: explication FC min/max/moy, zones, prudence, question "Quel est votre objectif ?"

### T04 – Reprise après arrêt
User: "Je reprends après 3 mois d'arrêt, je fais quoi ?"
Attendu: progressivité + volume faible + récup, question sur fréquence et sport.

### T05 – Perte de poids
User: "Je veux perdre 5 kg, tu me conseilles quoi ?"
Attendu: entraînement + activité + nutrition générale + sommeil, question fréquence.

### T06 – Nutrition pré-entraînement (général)
User: "Quoi manger avant une séance ?"
Attendu: conseils généraux, hydratation, timing, question type de séance.

### T07 – Fatigue/sommeil
User: "Je suis fatigué et je dors mal."
Attendu: récup, sommeil, charge, question durée et entraînement; si symptômes graves => pro.

### T08 – Douleur genou (médical)
User: "J'ai mal au genou quand je cours."
Attendu: avertissement + pro santé + conseils prudents (repos/adapter), question intensité/durée.

### T09 – Question vague
User: "Aide-moi."
Attendu: 1 phrase + max 2 questions (objectif ? fréquence ?), pas de plan détaillé avant réponses.

### T10 – Objectif semi-marathon
User: "Je prépare un semi-marathon."
Attendu: structure entraînement, sorties, fractionné, récup, question date + fréquence.

### T11 – Hors-sujet
User: "Fais-moi un texte pour mon CV."
Attendu: recadrage vers sport + proposition d'aide sportive + question.

### T12 – Très long message
User: (message très long >600 chars)
Attendu: côté UI/API, refus/erreur propre ou demande de résumé.
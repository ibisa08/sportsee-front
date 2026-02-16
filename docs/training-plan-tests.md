

# Feature 2 — Tests (Générateur de plans + export calendrier .ics)

Ce document liste les tests fonctionnels réalisés pour valider la **Feature 2** :
- Génération d’un plan via IA au format **JSON**
- Gestion des cas incohérents/incomplets
- Export **.ics** (1 événement par séance) + rappel **30 minutes**
- Import du .ics dans plusieurs clients calendrier

> Références
> - Contrat JSON : `docs/training-plan-schéma.md`
> - Prompts : `docs/training-plan-prompts.md`

---

## 0) Pré-requis

### Serveurs
- Front Next (sportsee-front) :
  ```bash
  cd ~/sportsee-front
  yarn dev
  ```
  Attendu : app disponible sur `http://localhost:3000`

- Backend SportSee (P6JS) (optionnel pour enrichir le contexte) :
  ```bash
  cd ~/P6JS
  yarn dev
  ```
  Attendu : API sur `http://127.0.0.1:8000`

### Variables d’environnement (sportsee-front)
Dans `sportsee-front/.env.local` :
- `MISTRAL_API_KEY=...`
- (optionnel) `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

---

## 1) Test T01 — Génération du plan (JSON)

### Objectif
Vérifier que l’API renvoie un **JSON valide** conforme au contrat :
- `weeks.length === 6`
- `sessions` présentes et structurées

### Commande
```bash
curl -s -X POST "http://localhost:3000/api/training-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 12,
    "objective": "maigrir",
    "startDate": "2026-02-10",
    "preferredStartTime": "18:00",
    "availabilityDays": ["Lundi","Mercredi","Vendredi"]
  }' | tee /tmp/plan.json
```

### Vérification rapide (sessions > 0)
```bash
python3 - <<'PY'
import json
p=json.load(open('/tmp/plan.json'))
weeks=p.get('weeks', [])
total=sum(len(w.get('sessions', [])) for w in weeks) if isinstance(weeks, list) else 0
print('weeks:', len(weeks))
print('total sessions:', total)
print('warnings:', p.get('warnings'))
PY
```

### Attendu
- `weeks: 6`
- `total sessions > 0`
- `warnings` peut être vide ou contenir `MISSING_DATA` / `UNREALISTIC_GOAL` selon le contexte

### Résultat
- [ ] OK
- [ ] NOK

---

## 2) Test T02 — Objectif irréaliste (warning)

### Objectif
Vérifier la gestion du cas **objectif incohérent** (ex: marathon en 6 semaines) :
- présence de `warnings[]` avec `type: UNREALISTIC_GOAL`
- plan généré quand même (objectif intermédiaire)

### Commande
```bash
curl -s -X POST "http://localhost:3000/api/training-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 12,
    "objective": "marathon en 6 semaines",
    "startDate": "2026-02-10",
    "preferredStartTime": "18:00",
    "availabilityDays": ["Lundi","Mercredi","Vendredi"]
  }' | tee /tmp/plan_unrealistic.json
```

### Vérification
Ouvrir `/tmp/plan_unrealistic.json` et vérifier :
- `warnings` contient un objet avec `type: "UNREALISTIC_GOAL"`
- `weeks` existe et contient des `sessions`

### Résultat
- [ ] OK
- [ ] NOK

---

## 3) Test T03 — Paramètres invalides (400)

### Objectif
Vérifier que l’API rejette une date invalide.

### Commande
```bash
curl -i -X POST "http://localhost:3000/api/training-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 12,
    "objective": "maigrir",
    "startDate": "10/02/2026"
  }'
```

### Attendu
- HTTP `400`
- Message indiquant `startDate invalide (YYYY-MM-DD)`

### Résultat
- [ ] OK
- [ ] NOK

---

## 4) Test T04 — Export ICS (fichier .ics)

### Objectif
Vérifier la génération du fichier `.ics` :
- 1 événement par séance
- `SUMMARY`, `DTSTART`, `DTEND`, `DESCRIPTION`
- `VALARM` avec `TRIGGER:-PT30M`

### Préparation payload `{ plan: ... }`
```bash
python3 - <<'PY'
import json
plan=json.load(open('/tmp/plan.json'))
json.dump({'plan': plan}, open('/tmp/ics_payload.json','w'))
print('OK -> /tmp/ics_payload.json')
PY
```

### Génération du fichier ICS
```bash
curl -s -X POST "http://localhost:3000/api/training-plan/ics" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/ics_payload.json \
  -o /tmp/sportsee-planning.ics
```

### Vérification (structure)
```bash
head -n 30 /tmp/sportsee-planning.ics
```
Attendu : `BEGIN:VCALENDAR`, puis `BEGIN:VEVENT`.

### Vérification (rappel 30 min)
```bash
grep -n "BEGIN:VALARM\|TRIGGER\|END:VALARM" /tmp/sportsee-planning.ics | head -n 30
```
Attendu : présence de `TRIGGER:-PT30M`.

### Résultat
- [ ] OK
- [ ] NOK

---

## 5) Test T05 — Import Apple Calendar (macOS)

### Objectif
Vérifier l’import du fichier `.ics` dans **Apple Calendar**.

### Étapes
1) Copier le fichier sur le bureau :
```bash
cp /tmp/sportsee-planning.ics ~/Desktop/
```
2) Double-cliquer `sportsee-planning.ics` → choisir le calendrier → **OK**
3) Ouvrir un événement importé et vérifier :
- Titre `Entraînement - ...`
- Date/heure cohérentes
- Description complète
- Rappel visible : **Alerte 30 minutes avant le début**

### Preuves
- [ ] Capture écran popup import
- [ ] Capture écran événement (détails + rappel)

### Résultat
- [ ] OK
- [ ] NOK

---

## 6) Test T06 — Import Google Calendar

### Objectif
Vérifier l’import du fichier `.ics` dans **Google Calendar**.

### Étapes
1) Google Calendar (web) → Paramètres → **Importer et exporter**
2) Importer `sportsee-planning.ics`
3) Ouvrir un événement importé et vérifier :
- Titre `Entraînement - ...`
- Date/heure cohérentes
- Description complète
- Rappel visible (selon Google : peut apparaître en « 30 minutes avant »)

### Preuves
- [ ] Capture écran vue semaine avec événements
- [ ] Capture écran détails d’un événement (description + rappel)

### Résultat
- [ ] OK
- [ ] NOK

---

## 7) Conclusion

Critères validés :
- [ ] Génération IA au format JSON
- [ ] Plan affichable semaine par semaine (UI)
- [ ] Gestion objectifs irréalistes / plan invalide (warnings)
- [ ] Export ICS avec événements complets + rappel 30 min
- [ ] Import Apple Calendar
- [ ] Import Google Calendar

Notes :
- Si `MISSING_DATA` apparaît, cela signifie que les données SportSee n’ont pas été récupérées : le système génère un plan prudent et affiche le warning.
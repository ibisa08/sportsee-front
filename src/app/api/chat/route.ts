import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const userId = typeof body?.userId === "number" ? body.userId : undefined;

    // Validation anti-abus / coûts
    if (!message) {
      return NextResponse.json({ error: "Message vide." }, { status: 400 });
    }
    if (message.length > 600) {
      return NextResponse.json(
        { error: "Message trop long (max 600 caractères)." },
        { status: 400 }
      );
    }

    // Hors-sujet -> réponse fixe (garantie pour l'étape 3)
    const offTopicRe =
      /\b(cv|curriculum|lettre\s+de\s+motivation|recrutement|imp[ôo]t|notaire|juridique|contrat|facture|banque|assurance)\b/i;

    if (offTopicRe.test(message)) {
      return NextResponse.json({
        answer:
          "Je ne peux pas vous aider sur ce sujet ici, car je suis dédié à l’entraînement et aux données SportSee.\n" +
          "• 🏃 Exemple : « Comment améliorer mon endurance ? »\n" +
          "• 💤 Exemple : « Que signifie mon score de récupération ? »\n" +
          "Quelle est votre question sport aujourd’hui ?",
      });
    }

    // Historique (envoyé par le front)
    const rawHistory = Array.isArray(body?.history) ? body.history : [];
    const history = rawHistory
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-8)
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 800) }));

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "MISTRAL_API_KEY manquante côté serveur." },
        { status: 500 }
      );
    }

    // Prompt système (étape 3)
    const systemPrompt =
      "Vous êtes Coach IA SportSee. Répondez en français, avec un ton professionnel et bienveillant. " +
      "PÉRIMÈTRE: vous ne traitez que les sujets sport/fitness/récupération/nutrition générale et l'explication des graphiques SportSee. " +
      "IMPORTANT: utilisez l'historique fourni: ne reposez pas une question déjà répondue (ex: sport pratiqué). Si le sport est connu, adaptez directement vos conseils. " +
      "IMPORTANT: répondez en texte simple (pas de Markdown): n'utilisez jamais **, __, #, ni de blocs ``` ; évitez aussi les liens. " +
      "FORMAT OBLIGATOIRE: (1) 1 phrase de réponse/définition, (2) 4 à 6 puces courtes, chacune COMMENCE par un emoji (ex: 🏃, 💤, ❤️, ⚡), " +
      "(3) uniquement si l'utilisateur parle explicitement d'un score SportSee (ex: score de récupération / score de sommeil), donnez une interprétation par niveaux (🟢 80–100 / 🟠 50–79 / 🔴 <50), " +
      "(4) terminez par UNE question courte. " +
      "N'UTILISEZ PAS de numérotation (1), 1., 1) dans la réponse. " +
      "Si la question est vague, posez au maximum 2 questions de clarification avant de proposer des conseils. " +
      "Concision: 1200 caractères maximum. " +
      "Sécurité: si cela touche au médical (douleur, blessure, traitement, symptômes), précisez que ce sont des informations générales et recommandez de consulter un professionnel de santé.";

    // Timeout pour éviter requêtes pendantes
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
        temperature: 0.15,
        max_tokens: 320,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!mistralRes.ok) {
      const details = await mistralRes.text().catch(() => "");
      return NextResponse.json(
        { error: "Erreur Mistral", details: details.slice(0, 800) },
        { status: 502 }
      );
    }

    const data = await mistralRes.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ answer });
  } catch (e: any) {
    const isAbort = e?.name === "AbortError";
    return NextResponse.json(
      { error: isAbort ? "Timeout IA" : "Erreur serveur" },
      { status: isAbort ? 504 : 500 }
    );
  }
}
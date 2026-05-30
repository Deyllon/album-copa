export type ScanGeminiMode = "code-backs" | "album-page";

export function buildGeminiPrompt(
  mode: ScanGeminiMode,
  allowedCodes: string[],
): string {
  if (mode === "code-backs") {
    return `
Voce esta lendo o VERSO de figurinhas da Copa 2026.

Sua unica tarefa e identificar codigos de figurinha visiveis na imagem.

Regras obrigatorias:
- Retorne somente JSON valido.
- Retorne somente codigos que existam na lista permitida.
- Codigos permitidos: ${allowedCodes.join(", ")}
- Se enxergar "BRA 4", normalize para "BRA4".
- Nao tente adivinhar nome de jogador, pagina ou selecao.
- Nao invente codigo.
- Se nao tiver certeza, coloque em "uncertain".
- confidence deve ser um numero entre 0 e 1.

Responda neste formato:
{
  "stickersDetected": [
    {
      "code": "BRA4",
      "confidence": 0.95
    }
  ],
  "uncertain": [
    {
      "rawText": "BRA?",
      "reason": "codigo incompleto"
    }
  ]
}
`.trim();
  }

  return `
Voce e um scanner de album de figurinhas da Copa 2026.

Analise a imagem e identifique APENAS figurinhas que estao coladas/preenchidas no album.

Regras obrigatorias:
- Retorne somente JSON valido.
- Retorne somente codigos que existam na lista de codigos permitidos.
- Codigos permitidos: ${allowedCodes.join(", ")}
- Se enxergar "BRA 2", normalize para "BRA2".
- Se enxergar nome de jogador, use o catalogo para inferir o codigo correto somente quando houver forte evidencia visual.
- Copie playerName exatamente como visto na imagem. Nao corrija ortografia, nao traduza e nao complete nomes.
- Se estiver em duvida entre dois jogadores, nao escolha um. Mande para "uncertain".
- Nao invente codigo.
- Nao invente jogador.
- Se nao tiver certeza, coloque em "uncertain".
- Se detectar a pagina do album, preencha albumPageDetected.
- Se nao detectar pagina, use 0.
- Se detectar a selecao, preencha teamDetected.
- Se nao detectar selecao, use string vazia.
- confidence deve ser um numero entre 0 e 1.

Responda neste formato:
{
  "albumPageDetected": 0,
  "teamDetected": "",
  "stickersDetected": [
    {
      "code": "BRA2",
      "playerName": "Nome do jogador",
      "confidence": 0.95
    }
  ],
  "uncertain": [
    {
      "rawText": "texto lido mas incerto",
      "reason": "motivo da incerteza"
    }
  ]
}
`.trim();
}

export function buildGeminiResponseSchema(mode: ScanGeminiMode) {
  if (mode === "code-backs") {
    return {
      type: "object",
      properties: {
        stickersDetected: {
          type: "array",
          items: {
            type: "object",
            properties: {
              code: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["code", "confidence"],
          },
        },
        uncertain: {
          type: "array",
          items: {
            type: "object",
            properties: {
              rawText: { type: "string" },
              reason: { type: "string" },
            },
            required: ["rawText", "reason"],
          },
        },
      },
      required: ["stickersDetected", "uncertain"],
    } as const;
  }

  return {
    type: "object",
    properties: {
      albumPageDetected: {
        type: "integer",
      },
      teamDetected: {
        type: "string",
      },
      stickersDetected: {
        type: "array",
        items: {
          type: "object",
          properties: {
            code: {
              type: "string",
            },
            playerName: {
              type: "string",
            },
            confidence: {
              type: "number",
            },
          },
          required: ["code", "playerName", "confidence"],
        },
      },
      uncertain: {
        type: "array",
        items: {
          type: "object",
          properties: {
            rawText: {
              type: "string",
            },
            reason: {
              type: "string",
            },
          },
          required: ["rawText", "reason"],
        },
      },
    },
    required: [
      "albumPageDetected",
      "teamDetected",
      "stickersDetected",
      "uncertain",
    ],
  } as const;
}

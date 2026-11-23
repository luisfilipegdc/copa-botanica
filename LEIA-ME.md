# Copa Botânica · Marista Asa Sul 2026

Jogo de duelos chaveados de botânica, com número ilimitado de alunos.
Site estático (Vercel) + banco e tempo real no Supabase (projeto `torneio-botanico`).

## Como usar na aula
1. No computador do projetor, abra `/telao`, digite a senha do professor e clique em **Criar sala**.
2. Os alunos apontam a câmera para o QR code (ou entram no site e digitam o código de 4 letras) e colocam o nome completo.
3. **Fechar sala e sortear duelos** → **Começar rodada**. O resto anda sozinho; o professor pode pausar na explicação.
4. Teclas no telão: `F` tela cheia, `H` esconde os botões.

## Regras
- Duelo = melhor de 3 perguntas (final: 5). Empate → morte súbita (até 2), depois vence quem acertou mais rápido.
- Cada vitória é uma evolução: 🌱 briófita → 🌿 pteridófita → 🌲 gimnosperma → 🌸 angiosperma → 🍎 fruto.
- Todo mundo responde todas as perguntas e ganha pólen 🌼 (100 por acerto + até 50 pela rapidez).
- Quem perde vira torcida. Se sobrar número ímpar de classificados, o melhor da torcida em pólen volta (repescagem).

## Perguntas novas
Página `/perguntas` (senha do professor): cole o texto do Word no formato
`1. enunciado / A) … / B) … / RESPOSTA: B / POR QUÊ: explicação (opcional)`, confira e importe.
Somatório e certo/errado precisam virar alternativas A/B/C/D.

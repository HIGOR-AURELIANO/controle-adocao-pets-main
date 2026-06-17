---
name: Donation flow invariant (meu4patas)
description: Why "Adoção concluída" must only be set via confirmar_doacao, never the status dropdown
---

# Marking a pet adopted must go through `confirmar_doacao`

In the owner's profile each registered pet lists its interested people. There are
two ways the UI can touch an interest's status:

1. The **status dropdown** (`atualizar_status_interesse`) — for andamento only:
   `Interesse enviado`, `Em conversa`, `Aprovado`, `Recusado`.
2. The **"🤝 Confirmar doação" button** (`confirmar_doacao`) — the ONLY path that
   finalizes adoption.

**Rule:** `Adoção concluída` and pet `status='Adotado'` must only ever be produced
by `confirmar_doacao`. The dropdown must reject `Adoção concluída`.

**Why:** `confirmar_doacao` does three things atomically that the dropdown path did
NOT: creates the `adotantes` record from the interested user, sets the pet's
`adotante_id`, and refuses all other interests on that pet. Allowing the dropdown to
set `Adoção concluída` left the pet "Adotado" with no adotante linked and rival
interests still open — an inconsistent state.

**How to apply:** Keep `Adoção concluída` out of `$permitidos` in
`atualizar_status_interesse`. In `ownedCardHtml` the option is filtered from the
dropdown unless the interest is already concluded (so it can still display). If you
add new finalization entry points, route them through `confirmar_doacao`.

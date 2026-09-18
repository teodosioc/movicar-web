<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Diretriz permanente: mobile first

Todas as melhorias da MoviCar devem ser pensadas MOBILE FIRST, tanto para o
fluxo do motorista quanto para o do administrador.

- Alvos: Android e iOS — Chrome no Android, Safari e Chrome no iOS — com
  adaptação progressiva para desktop (mouse e teclado).
- Priorizar controles por toque (área de toque confortável, no mínimo
  ~44×44 px), telas pequenas, orientação vertical e horizontal e áreas
  seguras (safe areas).
- Nenhuma função essencial pode depender de hover.
- O uso atual da equipe (Android/Windows) não restringe os dispositivos dos
  futuros clientes.

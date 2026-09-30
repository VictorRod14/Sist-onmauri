# Atualização do Sistema OnMauri — 30/09/2026

## Entregas

- Código sequencial sugerido automaticamente no cadastro de produtos.
- Código permanece editável e continua salvo junto ao nome para compatibilidade com o estoque atual.
- Pesquisa de produtos por código, nome ou descrição durante a venda.
- Preenchimento visual automático de nome, preço e estoque após selecionar o produto.
- Nome da cliente opcional em cada venda.
- Área “Minhas vendas” exclusiva para vendedoras, com período, total, pedidos, peças e histórico.
- Vendedoras podem criar, visualizar e finalizar somente as próprias malas.
- Administração e gerência continuam com acesso a todas as malas.
- Modais com rolagem interna e melhor adaptação a telas pequenas.
- Navegação responsiva e hierarquia visual revisada.
- Migração automática e não destrutiva das novas colunas do banco SQLite.

## Atualização segura na VPS

Antes da substituição, preserve o arquivo de banco de dados usado em produção. O pacote não contém banco de dados, `.env`, `node_modules`, `.next`, ambiente virtual ou histórico Git.

Depois de substituir os arquivos-fonte, reconstrua os containers do backend e do frontend com o Docker Compose já existente na VPS. Na primeira inicialização, o backend acrescentará automaticamente os novos campos às tabelas existentes sem apagar vendas, produtos, usuários ou malas.

## Validações executadas

- Build de produção do Next.js concluído.
- Compilação dos módulos Python concluída.
- Fluxo integrado validado: login de vendedora, cadastro e código seguinte, venda com cliente, consulta de vendas próprias, criação de mala e retorno da mala.

---
tags: [nexos, apresentacao, condominio, saas]
---

# 🏢 Nexos — Plataforma de Gestão de Condomínios

> Diagnóstico gerado a partir da leitura completa do código-fonte (`api/` + `web/`) em 12/08/2026, com dados reais capturados de um ambiente de demonstração local.

![[assets/01-login.jpg]]

## O que é

**Nexos** (nome de código interno: *Porty*) é um **SaaS multi-tenant** que digitaliza a operação de portaria e a administração de condomínios: controle de visitantes, encomendas, reserva de áreas comuns, eventos e onboarding de novos condomínios na plataforma.

Quatro papéis de acesso — **Administrador da plataforma**, **Gestor (síndico)**, **Portaria** e **Morador** — compartilham a mesma aplicação, cada um vendo apenas o que lhe é relevante.

## Mapa desta apresentação

- [[01 - Visão Geral e Objetivo]] — proposta de valor, público-alvo, modelo de negócio
- [[02 - Papéis e Permissões]] — quem faz o quê na plataforma
- [[03 - Arquitetura Técnica]] — stack, camadas, integrações externas
- [[04 - Modelo de Dados]] — entidades principais e relacionamentos
- [[05 - Fluxos de Negócio]] — os 6 fluxos-chave, passo a passo
- [[06 - Tour pelo Produto (Galeria)]] — telas reais do sistema, por papel

## Números do diagnóstico

| Métrica | Valor |
|---|---|
| Módulos de negócio | 10 (visitantes, encomendas, áreas/reservas, eventos, blocos, residências, moradores, portaria, condomínios, convites) |
| Papéis de acesso | 4 (admin, gestor, portaria, morador) |
| Migrações de banco de dados | 34+ |
| Endpoints de API mapeados | ~55 |
| Telas capturadas nesta apresentação | 18 |

---
*Próximo: [[01 - Visão Geral e Objetivo]]*

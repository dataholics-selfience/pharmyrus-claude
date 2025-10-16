# Pharmyrus - Dashboard de Análise de Patentes

Sistema inteligente para busca e análise de patentes farmacêuticas com IA integrada.

## 🚀 Features

- ✅ Busca avançada de patentes (INPI + EPO)
- ✅ Análise por IA em tempo real
- ✅ Dashboard interativo com métricas
- ✅ Filtros e busca avançada
- ✅ Exportação para PDF
- ✅ Interface responsiva

## 📦 Estrutura do Projeto
```
pharmyrus-dashboard/
├── index.html              # Página de busca
├── dashboard.html          # Dashboard de resultados
├── css/
│   ├── style.css          # Estilos principais
│   └── dashboard.css      # Estilos do dashboard
├── js/
│   ├── app.js            # Lógica de busca
│   └── dashboard.js      # Parse e visualização
├── images/
│   └── logo.png          # Logo Pharmyrus
├── _redirects            # Config Netlify
└── README.md
```

## 🛠️ Deploy no Netlify

### Método 1: Drag & Drop (Mais Fácil)

1. Acesse [Netlify Drop](https://app.netlify.com/drop)
2. Arraste a pasta `pharmyrus-dashboard`
3. Pronto! Seu site está no ar

### Método 2: CLI
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
cd pharmyrus-dashboard
netlify deploy --prod
```

### Método 3: GitHub + Netlify

1. Push para GitHub
2. Conecte o repositório no Netlify
3. Deploy automático

## 🔗 API Endpoints

- **Teste:** `https://primary-production-2e3b.up.railway.app/webhook-test/analise-patentes`
- **Produção:** `https://primary-production-2e3b.up.railway.app/webhook/analise-patentes`

### Payload de Busca
```json
{
  "nome_comercial": "Verzenios",
  "nome_molecula": "Abemaciclib"
}
```

## 🎨 Customização

### Alterar Logo

Substitua `images/logo.png` pelo seu logo (recomendado: PNG com fundo transparente)

### Alterar Cores

Edite as variáveis CSS em `css/style.css`:
```css
:root {
    --primary-color: #2563eb;
    --primary-dark: #1e40af;
    /* ... */
}
```

## 📱 Responsivo

- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 767px)

## 🔒 Segurança

- Sem dependências externas vulneráveis
- LocalStorage para dados temporários
- Sanitização de inputs

## 📄 Licença

© 2025 Pharmyrus. Todos os direitos reservados.

## 🆘 Suporte

Para dúvidas ou problemas, contate o suporte técnico.

---

**Desenvolvido com ❤️ por Claude & Pharmyrus Team**
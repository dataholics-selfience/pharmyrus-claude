// Elementos DOM
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const dashboardContent = document.getElementById('dashboardContent');
const patentsTableBody = document.getElementById('patentsTableBody');
const filtroFonte = document.getElementById('filtroFonte');
const filtroAmeaca = document.getElementById('filtroAmeaca');
const btnClearFilters = document.getElementById('btnClearFilters');
const resultsCount = document.getElementById('resultsCount');
const btnExport = document.getElementById('btnExport');
const btnNewSearch = document.getElementById('btnNewSearch');

let dashboardData = null;
let currentFilters = {
    fonte: '',
    ameaca: ''
};

// Inicialização
window.addEventListener('load', initDashboard);

async function initDashboard() {
    try {
        // Buscar dados do localStorage
        const storedData = localStorage.getItem('patentAnalysis');
        
        if (!storedData) {
            throw new Error('Nenhum dado de análise encontrado');
        }

        // Parse do JSON
        const rawData = JSON.parse(storedData);
        dashboardData = parsePatentData(rawData);

        // Renderizar dashboard
        renderDashboard();
        
        // Esconder loading
        loadingState.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        
    } catch (error) {
        showError(error.message);
    }
}

// Parse dos dados da API
function parsePatentData(rawData) {
    // Se vier como array com output
    let data = rawData;
    if (Array.isArray(rawData) && rawData[0]?.output) {
        data = JSON.parse(rawData[0].output);
    }

    return {
        meta: data.meta || {},
        estatisticas: data.estatisticas || {},
        metricas_chave: data.metricas_chave || {},
        relatorio_executivo: data.relatorio_executivo || {},
        patentes: data.patentes || []
    };
}

// Renderizar Dashboard
function renderDashboard() {
    // Header
    document.getElementById('dashboardTitle').textContent = 
        `Dashboard - ${dashboardData.meta.nome_comercial || 'Análise de Patentes'}`;
    document.getElementById('dashboardSubtitle').textContent = 
        `${dashboardData.meta.molecula || ''} | ${dashboardData.meta.classe_terapeutica || ''}`;

    // Hero Cards
    document.getElementById('totalPatentes').textContent = 
        dashboardData.estatisticas.total_patentes || 0;
    document.getElementById('fontesInfo').textContent = 
        `INPI: ${dashboardData.estatisticas.por_fonte?.INPI || 0} | EPO: ${dashboardData.estatisticas.por_fonte?.EPO || 0}`;
    
    document.getElementById('anosProtecao').textContent = 
        dashboardData.metricas_chave.anos_protecao_restantes || 0;
    
    document.getElementById('altaAmeaca').textContent = 
        dashboardData.metricas_chave.patentes_alta_ameaca || 0;
    
    const topTitular = dashboardData.estatisticas.top_titulares?.[0];
    document.getElementById('titularDominante').textContent = 
        topTitular?.titular?.substring(0, 20) || 'N/A';
    document.getElementById('concentracaoInfo').textContent = 
        `${dashboardData.metricas_chave.concentracao_titular || 0}% do portfólio`;

    // Relatório Executivo
    const relatorio = dashboardData.relatorio_executivo;
    document.getElementById('panoramaGeral').textContent = relatorio.panorama_geral || '';
    document.getElementById('titularDominanteDesc').textContent = relatorio.titular_dominante || '';
    document.getElementById('barreirasCriticas').textContent = relatorio.barreiras_criticas || '';
    document.getElementById('janelasOportunidade').textContent = relatorio.janelas_oportunidade || '';

    // Recomendações
    const recomendacoesList = document.getElementById('recomendacoesList');
    recomendacoesList.innerHTML = '';
    (relatorio.recomendacoes || []).forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recomendacoesList.appendChild(li);
    });

    // Tabela
    renderPatentsTable();
}

// Renderizar Tabela
function renderPatentsTable() {
    const patentes = getFilteredPatents();
    
    patentsTableBody.innerHTML = '';
    
    patentes.forEach(patente => {
        const row = createPatentRow(patente);
        patentsTableBody.appendChild(row);
    });

    resultsCount.textContent = `${patentes.length} patentes encontradas`;
}

// Criar linha da tabela
function createPatentRow(patente) {
    const tr = document.createElement('tr');
    tr.onclick = () => openPatentModal(patente);

    tr.innerHTML = `
        <td>
            <span class="badge ${patente.fonte === 'INPI' ? 'badge-inpi' : 'badge-epo'}">
                ${patente.fonte === 'INPI' ? 'BR' : patente.pais || 'EPO'}
            </span>
        </td>
        <td>
            <code class="patent-code">${patente.numero_completo || ''}</code>
        </td>
        <td>
            <div style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${patente.titulo || patente.titulo_original || 'Sem título'}
            </div>
        </td>
        <td>
            <div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${patente.applicant || 'Não informado'}
            </div>
        </td>
        <td>${patente.ano_deposito || patente.ano || '-'}</td>
        <td>
            ${patente.nivel_ameaca ? 
                `<span class="badge badge-${patente.nivel_ameaca.toLowerCase()}">${patente.nivel_ameaca}</span>` 
                : '<span style="color: #9ca3af;">N/A</span>'
            }
        </td>
        <td>
            <span class="badge" style="background: #f3f4f6; color: #374151;">
                ${patente.tipo_barreira || '-'}
            </span>
        </td>
    `;

    return tr;
}

// Filtros
function getFilteredPatents() {
    let patentes = dashboardData.patentes || [];

    if (currentFilters.fonte) {
        patentes = patentes.filter(p => p.fonte === currentFilters.fonte);
    }

    if (currentFilters.ameaca) {
        patentes = patentes.filter(p => p.nivel_ameaca === currentFilters.ameaca);
    }

    return patentes;
}

filtroFonte.addEventListener('change', (e) => {
    currentFilters.fonte = e.target.value;
    renderPatentsTable();
});

filtroAmeaca.addEventListener('change', (e) => {
    currentFilters.ameaca = e.target.value;
    renderPatentsTable();
});

btnClearFilters.addEventListener('click', () => {
    currentFilters = { fonte: '', ameaca: '' };
    filtroFonte.value = '';
    filtroAmeaca.value = '';
    renderPatentsTable();
});

// Modal
function openPatentModal(patente) {
    const modal = document.getElementById('patentModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Número da Patente</div>
            <div class="detail-value">
                <code class="patent-code" style="font-size: 1rem; padding: 0.5rem;">${patente.numero_completo}</code>
            </div>
        </div>

        <div class="detail-item">
            <div class="detail-label">Título</div>
            <div class="detail-value">${patente.titulo || patente.titulo_original || 'Sem título'}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="detail-item">
                <div class="detail-label">País</div>
                <div class="detail-value">${patente.pais || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Ano de Depósito</div>
                <div class="detail-value">${patente.ano_deposito || patente.ano || '-'}</div>
            </div>
        </div>

        <div class="detail-item">
            <div class="detail-label">Titular</div>
            <div class="detail-value">${patente.applicant || 'Não informado'}</div>
        </div>

        <div class="detail-item">
            <div class="detail-label">Classificação IPC</div>
            <div class="detail-value"><code>${patente.ipc || '-'}</code></div>
        </div>

        ${patente.abstract ? `
            <div class="detail-item">
                <div class="detail-label">Resumo</div>
                <div class="detail-value">${patente.abstract}</div>
            </div>
        ` : ''}

        ${patente.comentario_ia ? `
            <div class="ia-analysis">
                <div class="detail-label">📊 Análise IA</div>
                <div class="detail-value">${patente.comentario_ia}</div>
            </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <div class="detail-item">
                <div class="detail-label">Nível de Ameaça</div>
                <div class="detail-value">
                    ${patente.nivel_ameaca ? 
                        `<span class="badge badge-${patente.nivel_ameaca.toLowerCase()}"
`<span class="badge badge-${patente.nivel_ameaca.toLowerCase()}" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                            ${patente.nivel_ameaca}
                        </span>` 
                        : '<span style="color: #9ca3af;">N/A</span>'
                    }
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Tipo de Barreira</div>
                <div class="detail-value">
                    <span class="badge" style="background: #f3f4f6; color: #374151; padding: 0.5rem 1rem;">
                        ${patente.tipo_barreira || '-'}
                    </span>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('patentModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Exportar PDF
btnExport.addEventListener('click', () => {
    window.print();
});

// Nova Busca
btnNewSearch.addEventListener('click', () => {
    if (confirm('Deseja iniciar uma nova busca? Os dados atuais serão perdidos.')) {
        localStorage.removeItem('patentAnalysis');
        window.location.href = 'index.html';
    }
});

// Erro
function showError(message) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Print styles
const printStyles = `
    @media print {
        .header-actions,
        .filters-section,
        .modal {
            display: none !important;
        }
        
        .dashboard-header {
            position: static;
        }
        
        body {
            background: white;
        }
        
        .dashboard-container {
            background: white;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = printStyles;
document.head.appendChild(styleSheet);
```

---

### **7. _redirects** (Configuração Netlify)
```
# SPA Redirect
/*    /index.html   200
```

---

### **8. .gitignore**
```
# Dependencies
node_modules/

# Build
dist/
build/

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
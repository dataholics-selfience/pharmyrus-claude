// ========================================
// PHARMYRUS - DASHBOARD.JS (ROBUSTO)
// ========================================

console.log('📊 Dashboard.js carregado');

let dashboardData = null;
let currentFilters = {
    fonte: '',
    ameaca: ''
};

// Aguardar DOM carregar
window.addEventListener('load', function() {
    console.log('✅ Dashboard iniciando...');
    
    try {
        // Buscar dados do localStorage
        const storedData = localStorage.getItem('patentAnalysis');
        
        if (!storedData) {
            throw new Error('Nenhum dado encontrado no localStorage');
        }

        console.log('📦 Dados brutos encontrados:', storedData.substring(0, 200) + '...');

        // Parse do JSON
        const rawData = JSON.parse(storedData);
        console.log('✅ JSON parseado');

        // Processar dados
        dashboardData = parsePatentData(rawData);
        console.log('✅ Dados processados:', dashboardData);

        // Renderizar
        renderDashboard();
        
        // Mostrar conteúdo
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');

        console.log('🎉 Dashboard renderizado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
        showError(error.message);
    }
});

// Parse robusto dos dados
function parsePatentData(rawData) {
    console.log('🔄 Parseando dados...');
    console.log('Tipo:', Array.isArray(rawData) ? 'Array' : typeof rawData);

    let data = rawData;

    // Se vier como array [{ output: "..." }]
    if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].output) {
        console.log('📝 Detectado formato com output, parseando...');
        try {
            data = JSON.parse(rawData[0].output);
        } catch (e) {
            console.error('❌ Erro ao parsear output:', e);
            data = rawData[0];
        }
    }

    // Garantir estrutura mínima
    const parsed = {
        meta: data.meta || {},
        estatisticas: data.estatisticas || { total_patentes: 0, por_fonte: {}, top_titulares: [] },
        metricas_chave: data.metricas_chave || {},
        relatorio_executivo: data.relatorio_executivo || {},
        patentes: data.patentes || []
    };

    // Filtrar patentes válidas (remover com dados corrompidos)
    parsed.patentes = parsed.patentes.filter(p => {
        // Remover se título for [object Object]
        if (p.titulo && p.titulo.includes('[object Object]')) {
            console.warn('⚠️ Patente com título corrompido removida:', p.numero_completo);
            return false;
        }
        return true;
    });

    console.log(`✅ ${parsed.patentes.length} patentes válidas encontradas`);

    return parsed;
}

// Renderizar Dashboard
function renderDashboard() {
    console.log('🎨 Renderizando dashboard...');

    // Header
    const titulo = dashboardData.meta.nome_comercial || 'Análise de Patentes';
    const subtitulo = `${dashboardData.meta.molecula || ''} | ${dashboardData.meta.classe_terapeutica || ''}`;
    
    document.getElementById('dashboardTitle').textContent = `Dashboard - ${titulo}`;
    document.getElementById('dashboardSubtitle').textContent = subtitulo;

    // Hero Cards
    const stats = dashboardData.estatisticas;
    const metricas = dashboardData.metricas_chave;

    document.getElementById('totalPatentes').textContent = stats.total_patentes || 0;
    document.getElementById('fontesInfo').textContent = 
        `INPI: ${stats.por_fonte?.INPI || 0} | EPO: ${stats.por_fonte?.EPO || 0}`;
    
    document.getElementById('anosProtecao').textContent = metricas.anos_protecao_restantes || 0;
    document.getElementById('altaAmeaca').textContent = metricas.patentes_alta_ameaca || 0;
    
    const topTitular = stats.top_titulares?.[0];
    const titularNome = topTitular?.titular || 'N/A';
    document.getElementById('titularDominante').textContent = 
        titularNome.length > 20 ? titularNome.substring(0, 20) + '...' : titularNome;
    document.getElementById('concentracaoInfo').textContent = 
        `${metricas.concentracao_titular || 0}% do portfólio`;

    // Relatório Executivo
    const relatorio = dashboardData.relatorio_executivo;
    document.getElementById('panoramaGeral').textContent = relatorio.panorama_geral || '';
    document.getElementById('titularDominanteDesc').textContent = relatorio.titular_dominante || '';
    document.getElementById('barreirasCriticas').textContent = relatorio.barreiras_criticas || '';
    document.getElementById('janelasOportunidade').textContent = relatorio.janelas_oportunidade || '';

    // Recomendações
    const recomendacoesList = document.getElementById('recomendacoesList');
    recomendacoesList.innerHTML = '';
    
    // Parsear recomendações (pode vir como string ou array)
    let recomendacoes = relatorio.recomendacoes || [];
    
    if (typeof recomendacoes === 'string') {
        // Se vier como string numerada "1. ... 2. ..."
        recomendacoes = recomendacoes.split(/\d+\.\s+/).filter(r => r.trim());
    }
    
    recomendacoes.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recomendacoesList.appendChild(li);
    });

    // Tabela
    renderPatentsTable();

    // Event listeners
    setupFilters();
}

// Setup filtros
function setupFilters() {
    const filtroFonte = document.getElementById('filtroFonte');
    const filtroAmeaca = document.getElementById('filtroAmeaca');
    const btnClearFilters = document.getElementById('btnClearFilters');

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

    // Botões de ação
    document.getElementById('btnExport').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('btnNewSearch').addEventListener('click', () => {
        if (confirm('Deseja iniciar uma nova busca? Os dados atuais serão perdidos.')) {
            localStorage.removeItem('patentAnalysis');
            window.location.href = 'index.html';
        }
    });
}

// Renderizar tabela
function renderPatentsTable() {
    const patentes = getFilteredPatents();
    const tbody = document.getElementById('patentsTableBody');
    
    tbody.innerHTML = '';
    
    if (patentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #9ca3af;">
                    Nenhuma patente encontrada com os filtros aplicados
                </td>
            </tr>
        `;
        document.getElementById('resultsCount').textContent = '0 patentes encontradas';
        return;
    }

    patentes.forEach(patente => {
        const row = createPatentRow(patente);
        tbody.appendChild(row);
    });

    document.getElementById('resultsCount').textContent = `${patentes.length} patentes encontradas`;
}

// Criar linha da tabela
function createPatentRow(patente) {
    const tr = document.createElement('tr');
    tr.onclick = () => openPatentModal(patente);

    // Limpar título se tiver [object Object]
    let titulo = patente.titulo || patente.titulo_original || 'Sem título';
    if (titulo.includes('[object Object]')) {
        titulo = 'Título não disponível';
    }

    // Truncar título longo
    if (titulo.length > 80) {
        titulo = titulo.substring(0, 80) + '...';
    }

    const fonte = patente.fonte || (patente.pais === 'BR' ? 'INPI' : 'EPO');
    const pais = fonte === 'INPI' ? 'BR' : (patente.pais || 'EPO');

    tr.innerHTML = `
        <td>
            <span class="badge ${fonte === 'INPI' ? 'badge-inpi' : 'badge-epo'}">
                ${pais}
            </span>
        </td>
        <td>
            <code class="patent-code">${patente.numero_completo || patente.numero || '-'}</code>
        </td>
        <td>
            <div style="max-width: 400px; overflow: hidden; text-overflow: ellipsis;">
                ${titulo}
            </div>
        </td>
        <td>
            <div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;">
                ${patente.applicant || 'Não informado'}
            </div>
        </td>
        <td style="text-align: center;">${patente.ano_deposito || patente.ano || '-'}</td>
        <td style="text-align: center;">
            ${patente.nivel_ameaca ? 
                `<span class="badge badge-${patente.nivel_ameaca.toLowerCase()}">${patente.nivel_ameaca}</span>` 
                : '<span style="color: #9ca3af; font-size: 0.875rem;">N/A</span>'
            }
        </td>
        <td style="text-align: center;">
            <span class="badge" style="background: #f3f4f6; color: #374151;">
                ${patente.tipo_barreira || patente.tipo_patente || '-'}
            </span>
        </td>
    `;

    return tr;
}

// Filtrar patentes
function getFilteredPatents() {
    let patentes = dashboardData.patentes || [];

    if (currentFilters.fonte) {
        patentes = patentes.filter(p => {
            const fonte = p.fonte || (p.pais === 'BR' ? 'INPI' : 'EPO');
            return fonte === currentFilters.fonte;
        });
    }

    if (currentFilters.ameaca) {
        patentes = patentes.filter(p => p.nivel_ameaca === currentFilters.ameaca);
    }

    return patentes;
}

// Modal de detalhes
function openPatentModal(patente) {
    const modal = document.getElementById('patentModal');
    const modalBody = document.getElementById('modalBody');

    let titulo = patente.titulo || patente.titulo_original || 'Sem título';
    if (titulo.includes('[object Object]')) {
        titulo = 'Título não disponível';
    }

    modalBody.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Número da Patente</div>
            <div class="detail-value">
                <code class="patent-code" style="font-size: 1rem; padding: 0.5rem;">
                    ${patente.numero_completo || patente.numero || '-'}
                </code>
            </div>
        </div>

        <div class="detail-item">
            <div class="detail-label">Título</div>
            <div class="detail-value">${titulo}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="detail-item">
                <div class="detail-label">País</div>
                <div class="detail-value">${patente.pais || patente.country || '-'}</div>
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

        ${patente.abstract && patente.abstract !== 'N/A' ? `
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
                        `<span class="badge badge-${patente.nivel_ameaca.toLowerCase()}" style="padding: 0.5rem 1rem;">
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
                        ${patente.tipo_barreira || patente.tipo_patente || '-'}
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

// Mostrar erro
function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

console.log('✅ Dashboard.js configurado');
```

---

### **TESTE AGORA:**

1. **Limpe o cache** (Ctrl+Shift+Delete)
2. **Volte para index.html**
3. **Faça uma nova busca**
4. **Abra o console** (F12) para ver os logs

Você deve ver:
```
📊 Dashboard.js carregado
✅ Dashboard iniciando...
📦 Dados brutos encontrados: [...]
✅ JSON parseado
🔄 Parseando dados...
✅ 318 patentes válidas encontradas
🎨 Renderizando dashboard...
🎉 Dashboard renderizado com sucesso!

// ========================================
// PHARMYRUS - DASHBOARD.JS (CORREÇÃO MÍNIMA)
// Mantém toda funcionalidade original
// Corrige apenas [object Object]
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
        // Buscar dados do localStorage (mesma chave do original)
        const storedData = localStorage.getItem('patentAnalysis');
        
        if (!storedData) {
            throw new Error('Nenhum dado encontrado no localStorage');
        }

        console.log('📦 Dados encontrados no localStorage');

        // Parse do JSON
        const rawData = JSON.parse(storedData);
        console.log('✅ JSON parseado');

        // Processar dados (mantém estrutura original)
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

// Parse dos dados (MANTÉM ESTRUTURA ORIGINAL)
function parsePatentData(rawData) {
    console.log('🔄 Parseando dados...');

    let data = rawData;

    // Se vier como array [{ output: "..." }]
    if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].output) {
        console.log('📝 Detectado formato com output');
        try {
            data = JSON.parse(rawData[0].output);
        } catch (e) {
            console.error('❌ Erro ao parsear output:', e);
            data = rawData[0];
        }
    }

    // GARANTIR estrutura mínima (não modifica se já existir)
    const parsed = {
        meta: data.meta || {},
        estatisticas: data.estatisticas || { 
            total_patentes: 0, 
            por_fonte: {}, 
            top_titulares: [] 
        },
        metricas_chave: data.metricas_chave || {},
        relatorio_executivo: data.relatorio_executivo || {},
        patentes: data.patentes || []
    };

    console.log(`✅ ${parsed.patentes.length} patentes encontradas`);

    return parsed;
}

// Renderizar Dashboard (MANTÉM LÓGICA ORIGINAL)
function renderDashboard() {
    console.log('🎨 Renderizando dashboard...');

    // Header
    const titulo = safeString(dashboardData.meta.nome_comercial) || 'Análise de Patentes';
    const molecula = safeString(dashboardData.meta.molecula) || '';
    const classe = safeString(dashboardData.meta.classe_terapeutica) || '';
    const subtitulo = [molecula, classe].filter(s => s).join(' | ');
    
    document.getElementById('dashboardTitle').textContent = `Dashboard - ${titulo}`;
    document.getElementById('dashboardSubtitle').textContent = subtitulo;

    // Hero Cards
    const stats = dashboardData.estatisticas;
    const metricas = dashboardData.metricas_chave;

    document.getElementById('totalPatentes').textContent = stats.total_patentes || 0;
    
    const inpiCount = (stats.por_fonte && stats.por_fonte.INPI) || 0;
    const epoCount = (stats.por_fonte && stats.por_fonte.EPO) || 0;
    document.getElementById('fontesInfo').textContent = `INPI: ${inpiCount} | EPO: ${epoCount}`;
    
    document.getElementById('anosProtecao').textContent = metricas.anos_protecao_restantes || 0;
    document.getElementById('altaAmeaca').textContent = metricas.patentes_alta_ameaca || 0;
    
    const topTitular = (stats.top_titulares && stats.top_titulares[0]) || {};
    const titularNome = safeString(topTitular.titular) || 'N/A';
    const titularDisplay = titularNome.length > 20 ? titularNome.substring(0, 20) + '...' : titularNome;
    document.getElementById('titularDominante').textContent = titularDisplay;
    document.getElementById('concentracaoInfo').textContent = `${metricas.concentracao_titular || 0}% do portfólio`;

    // Relatório Executivo
    const relatorio = dashboardData.relatorio_executivo;
    document.getElementById('panoramaGeral').textContent = safeString(relatorio.panorama_geral) || '';
    document.getElementById('titularDominanteDesc').textContent = safeString(relatorio.titular_dominante) || '';
    document.getElementById('barreirasCriticas').textContent = safeString(relatorio.barreiras_criticas) || '';
    document.getElementById('janelasOportunidade').textContent = safeString(relatorio.janelas_oportunidade) || '';

    // Recomendações
    const recomendacoesList = document.getElementById('recomendacoesList');
    recomendacoesList.innerHTML = '';
    
    let recomendacoes = relatorio.recomendacoes || [];
    
    // Se vier como string, tentar separar
    if (typeof recomendacoes === 'string') {
        recomendacoes = recomendacoes.split(/\d+\.\s+/).filter(r => r.trim());
    }
    
    // Garantir que é array
    if (!Array.isArray(recomendacoes)) {
        recomendacoes = [];
    }
    
    recomendacoes.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = safeString(rec);
        recomendacoesList.appendChild(li);
    });

    // Tabela
    renderPatentsTable();

    // Event listeners
    setupFilters();
}

// ⭐ FUNÇÃO CHAVE: Converte valores para string de forma segura
function safeString(value) {
    // Se for null ou undefined, retorna string vazia
    if (value == null) return '';
    
    // Se for objeto, retorna string vazia (evita [object Object])
    if (typeof value === 'object') {
        console.warn('⚠️ Objeto detectado, convertendo para vazio:', value);
        return '';
    }
    
    // Converter para string
    const str = String(value);
    
    // Se contém [object Object], retorna vazio
    if (str.includes('[object Object]')) {
        console.warn('⚠️ [object Object] detectado, removendo');
        return '';
    }
    
    return str;
}

// Setup filtros (MANTÉM ORIGINAL)
function setupFilters() {
    const filtroFonte = document.getElementById('filtroFonte');
    const filtroAmeaca = document.getElementById('filtroAmeaca');
    const btnClearFilters = document.getElementById('btnClearFilters');

    if (filtroFonte) {
        filtroFonte.addEventListener('change', (e) => {
            currentFilters.fonte = e.target.value;
            renderPatentsTable();
        });
    }

    if (filtroAmeaca) {
        filtroAmeaca.addEventListener('change', (e) => {
            currentFilters.ameaca = e.target.value;
            renderPatentsTable();
        });
    }

    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            currentFilters = { fonte: '', ameaca: '' };
            if (filtroFonte) filtroFonte.value = '';
            if (filtroAmeaca) filtroAmeaca.value = '';
            renderPatentsTable();
        });
    }

    // Botões de ação
    const btnExport = document.getElementById('btnExport');
    const btnNewSearch = document.getElementById('btnNewSearch');

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            window.print();
        });
    }

    if (btnNewSearch) {
        btnNewSearch.addEventListener('click', () => {
            if (confirm('Deseja iniciar uma nova busca? Os dados atuais serão perdidos.')) {
                localStorage.removeItem('patentAnalysis');
                window.location.href = 'index.html';
            }
        });
    }
}

// Renderizar tabela (COM CORREÇÃO)
function renderPatentsTable() {
    const patentes = getFilteredPatents();
    const tbody = document.getElementById('patentsTableBody');
    
    if (!tbody) {
        console.error('❌ Elemento patentsTableBody não encontrado');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (patentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #9ca3af;">
                    Nenhuma patente encontrada com os filtros aplicados
                </td>
            </tr>
        `;
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) resultsCount.textContent = '0 patentes encontradas';
        return;
    }

    patentes.forEach(patente => {
        const row = createPatentRow(patente);
        tbody.appendChild(row);
    });

    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) resultsCount.textContent = `${patentes.length} patentes encontradas`;
}

// Criar linha da tabela (COM CORREÇÃO DE [object Object])
function createPatentRow(patente) {
    const tr = document.createElement('tr');
    tr.onclick = () => openPatentModal(patente);

    // ⭐ CORREÇÃO: Usar safeString para título
    let titulo = safeString(patente.titulo) || safeString(patente.titulo_original) || 'Sem título';
    
    // Se ficou vazio, tentar pegar de outro campo
    if (!titulo || titulo === 'Sem título') {
        titulo = safeString(patente.title) || 'Sem título';
    }

    // Truncar título longo
    if (titulo.length > 80) {
        titulo = titulo.substring(0, 80) + '...';
    }

    const fonte = safeString(patente.fonte) || (patente.pais === 'BR' ? 'INPI' : 'EPO');
    const pais = fonte === 'INPI' ? 'BR' : safeString(patente.pais) || 'EPO';
    const numero = safeString(patente.numero_completo) || safeString(patente.numero) || '-';
    const applicant = safeString(patente.applicant) || 'Não informado';
    const ano = safeString(patente.ano_deposito) || safeString(patente.ano) || '-';
    const nivelAmeaca = safeString(patente.nivel_ameaca);
    const tipoBarreira = safeString(patente.tipo_barreira) || safeString(patente.tipo_patente) || '-';

    tr.innerHTML = `
        <td>
            <span class="badge ${fonte === 'INPI' ? 'badge-inpi' : 'badge-epo'}">
                ${pais}
            </span>
        </td>
        <td>
            <code class="patent-code">${numero}</code>
        </td>
        <td>
            <div style="max-width: 400px; overflow: hidden; text-overflow: ellipsis;">
                ${titulo}
            </div>
        </td>
        <td>
            <div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;">
                ${applicant}
            </div>
        </td>
        <td style="text-align: center;">${ano}</td>
        <td style="text-align: center;">
            ${nivelAmeaca ? 
                `<span class="badge badge-${nivelAmeaca.toLowerCase()}">${nivelAmeaca}</span>` 
                : '<span style="color: #9ca3af; font-size: 0.875rem;">N/A</span>'
            }
        </td>
        <td style="text-align: center;">
            <span class="badge" style="background: #f3f4f6; color: #374151;">
                ${tipoBarreira}
            </span>
        </td>
    `;

    return tr;
}

// Filtrar patentes (MANTÉM ORIGINAL)
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

// Modal de detalhes (COM CORREÇÃO)
function openPatentModal(patente) {
    const modal = document.getElementById('patentModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) {
        console.error('❌ Elementos do modal não encontrados');
        return;
    }

    // ⭐ CORREÇÃO: Usar safeString
    let titulo = safeString(patente.titulo) || safeString(patente.titulo_original) || safeString(patente.title) || 'Sem título';
    const numero = safeString(patente.numero_completo) || safeString(patente.numero) || '-';
    const pais = safeString(patente.pais) || safeString(patente.country) || '-';
    const ano = safeString(patente.ano_deposito) || safeString(patente.ano) || '-';
    const applicant = safeString(patente.applicant) || 'Não informado';
    const ipc = safeString(patente.ipc) || '-';
    const abstract = safeString(patente.abstract);
    const comentarioIA = safeString(patente.comentario_ia);
    const nivelAmeaca = safeString(patente.nivel_ameaca);
    const tipoBarreira = safeString(patente.tipo_barreira) || safeString(patente.tipo_patente) || '-';

    modalBody.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Número da Patente</div>
            <div class="detail-value">
                <code class="patent-code" style="font-size: 1rem; padding: 0.5rem;">
                    ${numero}
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
                <div class="detail-value">${pais}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Ano de Depósito</div>
                <div class="detail-value">${ano}</div>
            </div>
        </div>

        <div class="detail-item">
            <div class="detail-label">Titular</div>
            <div class="detail-value">${applicant}</div>
        </div>

        <div class="detail-item">
            <div class="detail-label">Classificação IPC</div>
            <div class="detail-value"><code>${ipc}</code></div>
        </div>

        ${abstract && abstract !== 'N/A' ? `
            <div class="detail-item">
                <div class="detail-label">Resumo</div>
                <div class="detail-value">${abstract}</div>
            </div>
        ` : ''}

        ${comentarioIA ? `
            <div class="ia-analysis">
                <div class="detail-label">📊 Análise IA</div>
                <div class="detail-value">${comentarioIA}</div>
            </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <div class="detail-item">
                <div class="detail-label">Nível de Ameaça</div>
                <div class="detail-value">
                    ${nivelAmeaca ? 
                        `<span class="badge badge-${nivelAmeaca.toLowerCase()}" style="padding: 0.5rem 1rem;">
                            ${nivelAmeaca}
                        </span>` 
                        : '<span style="color: #9ca3af;">N/A</span>'
                    }
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Tipo de Barreira</div>
                <div class="detail-value">
                    <span class="badge" style="background: #f3f4f6; color: #374151; padding: 0.5rem 1rem;">
                        ${tipoBarreira}
                    </span>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Fechar modal (MANTÉM ORIGINAL)
function closeModal() {
    const modal = document.getElementById('patentModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Mostrar erro (MANTÉM ORIGINAL)
function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

console.log('✅ Dashboard.js configurado (correção mínima aplicada)');

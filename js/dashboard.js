// ========================================
// PHARMYRUS DASHBOARD - v8.0 REFATORADO
// ========================================

console.log('🚀 Pharmyrus Dashboard v8.0 - Refatorado');

// ========================================
// STATE MANAGEMENT
// ========================================
const DashboardState = {
    rawData: null,
    parsedData: null,
    allPatents: [],
    filteredPatents: [],
    currentFilters: {
        fonte: '',
        ameaca: ''
    }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
const Utils = {
    /**
     * Converte valores para string de forma segura
     */
    safeString(value) {
        if (value == null) return '';
        if (typeof value === 'object') {
            if (Array.isArray(value)) return value.join(', ');
            return '';
        }
        const str = String(value);
        if (str.includes('[object Object]')) return '';
        return str;
    },

    /**
     * Trunca texto com reticências
     */
    truncate(text, maxLength = 80) {
        if (!text) return '';
        const safe = this.safeString(text);
        if (safe.length <= maxLength) return safe;
        return safe.substring(0, maxLength) + '...';
    },

    /**
     * Formata número com separadores de milhar
     */
    formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
};

// ========================================
// DATA LOADING & PARSING
// ========================================
const DataLoader = {
    /**
     * Carrega dados do localStorage
     */
    async loadData() {
        try {
            console.log('📦 Carregando dados do localStorage...');
            
            const stored = localStorage.getItem('patentAnalysis');
            
            if (!stored) {
                throw new Error('Nenhum dado encontrado. Por favor, faça uma nova busca.');
            }

            console.log(`✅ Dados encontrados: ${stored.length} bytes`);
            
            // Parse inicial
            const parsed = JSON.parse(stored);
            
            // Detectar estrutura e extrair dados
            const data = this.extractData(parsed);
            
            // Validar estrutura
            this.validateData(data);
            
            DashboardState.rawData = stored;
            DashboardState.parsedData = data;
            DashboardState.allPatents = data.patentes || [];
            
            console.log(`✅ ${DashboardState.allPatents.length} patentes carregadas`);
            
            return data;
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            throw error;
        }
    },

    /**
     * Extrai dados da estrutura variável
     */
    extractData(parsed) {
        console.log('🔍 Analisando estrutura dos dados...');
        
        // Caso 1: Array com output
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].output) {
            console.log('📝 Detectado: Array com campo output');
            try {
                return JSON.parse(parsed[0].output);
            } catch (e) {
                console.warn('⚠️ Erro ao parsear output, usando objeto direto');
                return parsed[0];
            }
        }
        
        // Caso 2: Array simples
        if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('📝 Detectado: Array simples');
            return parsed[0];
        }
        
        // Caso 3: Objeto direto
        if (typeof parsed === 'object') {
            console.log('📝 Detectado: Objeto direto');
            return parsed;
        }
        
        throw new Error('Estrutura de dados não reconhecida');
    },

    /**
     * Valida estrutura mínima dos dados
     */
    validateData(data) {
        if (!data) {
            throw new Error('Dados vazios ou inválidos');
        }
        
        if (!data.patentes || !Array.isArray(data.patentes)) {
            throw new Error('Campo "patentes" não encontrado ou inválido');
        }
        
        console.log('✅ Validação de dados concluída');
    }
};

// ========================================
// RENDERING FUNCTIONS
// ========================================
const Renderer = {
    /**
     * Renderiza todo o dashboard
     */
    renderDashboard(data) {
        console.log('🎨 Renderizando dashboard...');
        
        this.renderHeader(data.meta || {});
        this.renderStats(data.estatisticas || {}, data.metricas_chave || {});
        this.renderReport(data.relatorio_executivo || {});
        this.renderPatentsTable();
        
        console.log('✅ Dashboard renderizado com sucesso');
    },

    /**
     * Renderiza cabeçalho
     */
    renderHeader(meta) {
        const titulo = meta.nome_comercial || 'Análise de Patentes';
        const subtitulo = `${meta.molecula || ''} | ${meta.classe_terapeutica || ''}`.trim();
        
        document.getElementById('dashboardTitle').textContent = `Dashboard - ${titulo}`;
        document.getElementById('dashboardSubtitle').textContent = subtitulo || 'Análise Completa do Portfólio';
        document.getElementById('moleculeName').textContent = meta.molecula || '-';
        document.getElementById('brandName').textContent = meta.nome_comercial || '-';
        document.getElementById('therapeuticClass').textContent = meta.classe_terapeutica || '-';
    },

    /**
     * Renderiza cards de estatísticas
     */
    renderStats(estatisticas, metricas) {
        // Total de patentes
        const totalPatentes = estatisticas.total_patentes || 0;
        document.getElementById('totalPatentes').textContent = Utils.formatNumber(totalPatentes);
        
        // Por fonte
        const porFonte = estatisticas.por_fonte || {};
        const inpi = porFonte.INPI || 0;
        const epo = porFonte.EPO || 0;
        document.getElementById('fontesInfo').textContent = `INPI: ${inpi} | EPO: ${epo}`;
        
        // Anos de proteção
        const anosProtecao = metricas.anos_protecao_restantes || 0;
        document.getElementById('anosProtecao').textContent = anosProtecao;
        
        // Alta ameaça
        const altaAmeaca = metricas.patentes_alta_ameaca || 0;
        document.getElementById('altaAmeaca').textContent = altaAmeaca;
        
        // Titular dominante
        const topTitulares = estatisticas.top_titulares || [];
        if (topTitulares.length > 0) {
            const top = topTitulares[0];
            const nome = Utils.truncate(top.titular || 'N/A', 20);
            const percentual = metricas.concentracao_titular || 0;
            
            document.getElementById('titularDominante').textContent = nome;
            document.getElementById('concentracaoInfo').textContent = `${percentual}% do portfólio`;
        } else {
            document.getElementById('titularDominante').textContent = 'N/A';
            document.getElementById('concentracaoInfo').textContent = '-';
        }
    },

    /**
     * Renderiza relatório executivo
     */
    renderReport(relatorio) {
        document.getElementById('panoramaGeral').textContent = 
            relatorio.panorama_geral || 'Não disponível';
        
        document.getElementById('titularDominanteDesc').textContent = 
            relatorio.titular_dominante || 'Não disponível';
        
        document.getElementById('barreirasCriticas').textContent = 
            relatorio.barreiras_criticas || 'Não disponível';
        
        document.getElementById('janelasOportunidade').textContent = 
            relatorio.janelas_oportunidade || 'Não disponível';
    },

    /**
     * Renderiza tabela de patentes
     */
    renderPatentsTable() {
        const tbody = document.getElementById('patentsTableBody');
        tbody.innerHTML = '';
        
        const patents = DashboardState.filteredPatents;
        
        if (patents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #9ca3af;">
                        Nenhuma patente encontrada com os filtros aplicados
                    </td>
                </tr>
            `;
            document.getElementById('resultsCount').textContent = '0 patentes';
            return;
        }

        patents.forEach(patent => {
            const row = this.createPatentRow(patent);
            tbody.appendChild(row);
        });

        document.getElementById('resultsCount').textContent = `${patents.length} patentes`;
    },

    /**
     * Cria linha da tabela para uma patente
     */
    createPatentRow(patent) {
        const tr = document.createElement('tr');
        tr.onclick = () => Modal.open(patent);

        // Determinar fonte e badge
        const fonte = patent.fonte || (patent.pais === 'BR' ? 'INPI' : 'EPO');
        const pais = fonte === 'INPI' ? 'BR' : (patent.pais || 'EPO');
        const badgeClass = fonte === 'INPI' ? 'badge-br' : 'badge-epo';

        // Título seguro
        const titulo = Utils.truncate(Utils.safeString(patent.titulo) || 'Sem título', 80);

        // Titular seguro
        const titular = Utils.truncate(Utils.safeString(patent.applicant) || 'Não informado', 40);

        // Nível de ameaça
        const ameaca = patent.nivel_ameaca || '';
        let ameacaBadge = '<span style="color: #9ca3af; font-size: 0.75rem;">N/A</span>';
        if (ameaca) {
            const badgeAmeaca = ameaca === 'Alta' ? 'badge-alta' : 
                                ameaca === 'Média' ? 'badge-media' : 'badge-baixa';
            ameacaBadge = `<span class="badge ${badgeAmeaca}">${ameaca}</span>`;
        }

        // Tipo de barreira
        const tipo = patent.tipo_barreira || patent.tipo_patente || '-';

        tr.innerHTML = `
            <td><span class="badge ${badgeClass}">${pais}</span></td>
            <td><code>${Utils.truncate(patent.numero_completo || patent.numero || '-', 20)}</code></td>
            <td>${titulo}</td>
            <td>${titular}</td>
            <td style="text-align: center;">${patent.ano_deposito || patent.ano || '-'}</td>
            <td style="text-align: center;">${ameacaBadge}</td>
            <td style="text-align: center;"><span class="badge" style="background: #f3f4f6; color: #374151;">${tipo}</span></td>
        `;

        return tr;
    }
};

// ========================================
// FILTERING
// ========================================
const Filters = {
    /**
     * Aplica filtros às patentes
     */
    apply() {
        const { fonte, ameaca } = DashboardState.currentFilters;
        
        let filtered = DashboardState.allPatents;

        // Filtro de fonte
        if (fonte) {
            filtered = filtered.filter(p => {
                const patentFonte = p.fonte || (p.pais === 'BR' ? 'INPI' : 'EPO');
                return patentFonte === fonte;
            });
        }

        // Filtro de ameaça
        if (ameaca) {
            filtered = filtered.filter(p => p.nivel_ameaca === ameaca);
        }

        DashboardState.filteredPatents = filtered;
        Renderer.renderPatentsTable();
    },

    /**
     * Limpa todos os filtros
     */
    clear() {
        DashboardState.currentFilters = { fonte: '', ameaca: '' };
        document.getElementById('filtroFonte').value = '';
        document.getElementById('filtroAmeaca').value = '';
        this.apply();
    },

    /**
     * Configura event listeners dos filtros
     */
    setupListeners() {
        document.getElementById('filtroFonte').addEventListener('change', (e) => {
            DashboardState.currentFilters.fonte = e.target.value;
            this.apply();
        });

        document.getElementById('filtroAmeaca').addEventListener('change', (e) => {
            DashboardState.currentFilters.ameaca = e.target.value;
            this.apply();
        });

        document.getElementById('btnClearFilters').addEventListener('click', () => {
            this.clear();
        });
    }
};

// ========================================
// MODAL
// ========================================
const Modal = {
    /**
     * Abre modal com detalhes da patente
     */
    open(patent) {
        const modal = document.getElementById('patentModal');
        const modalBody = document.getElementById('modalBody');

        // Título do modal
        document.getElementById('modalTitle').textContent = 
            patent.numero_completo || patent.numero || 'Detalhes da Patente';

        // Conteúdo do modal
        const titulo = Utils.safeString(patent.titulo) || 'Sem título';
        const titular = Utils.safeString(patent.applicant) || 'Não informado';
        const abstract = Utils.safeString(patent.abstract) || '';
        const comentarioIA = Utils.safeString(patent.comentario_ia) || '';

        modalBody.innerHTML = `
            <div class="detail-item">
                <strong>Número da Patente</strong>
                <p><code style="font-size: 1rem; padding: 0.5rem;">${patent.numero_completo || patent.numero || '-'}</code></p>
            </div>

            <div class="detail-item">
                <strong>Título</strong>
                <p>${titulo}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="detail-item">
                    <strong>País</strong>
                    <p>${patent.pais || patent.country || '-'}</p>
                </div>
                <div class="detail-item">
                    <strong>Ano de Depósito</strong>
                    <p>${patent.ano_deposito || patent.ano || '-'}</p>
                </div>
            </div>

            <div class="detail-item">
                <strong>Titular</strong>
                <p>${titular}</p>
            </div>

            <div class="detail-item">
                <strong>Classificação IPC</strong>
                <p><code>${patent.ipc || '-'}</code></p>
            </div>

            ${abstract && abstract !== 'N/A' ? `
                <div class="detail-item">
                    <strong>Resumo</strong>
                    <p>${abstract}</p>
                </div>
            ` : ''}

            ${comentarioIA ? `
                <div class="detail-item" style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #667eea;">
                    <strong>📊 Análise IA</strong>
                    <p>${comentarioIA}</p>
                </div>
            ` : ''}

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                <div class="detail-item">
                    <strong>Nível de Ameaça</strong>
                    <p>${patent.nivel_ameaca ? 
                        `<span class="badge badge-${patent.nivel_ameaca.toLowerCase()}" style="padding: 0.5rem 1rem; font-size: 0.875rem;">${patent.nivel_ameaca}</span>` 
                        : '<span style="color: #9ca3af;">N/A</span>'
                    }</p>
                </div>
                <div class="detail-item">
                    <strong>Tipo de Barreira</strong>
                    <p><span class="badge" style="background: #f3f4f6; color: #374151; padding: 0.5rem 1rem; font-size: 0.875rem;">${patent.tipo_barreira || patent.tipo_patente || '-'}</span></p>
                </div>
            </div>
        `;

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Fecha modal
     */
    close() {
        const modal = document.getElementById('patentModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    },

    /**
     * Configura event listeners do modal
     */
    setupListeners() {
        // Fechar ao clicar fora
        document.getElementById('patentModal').addEventListener('click', (e) => {
            if (e.target.id === 'patentModal') {
                this.close();
            }
        });
    }
};

// ========================================
// UI FUNCTIONS
// ========================================
const UI = {
    /**
     * Mostra estado de loading
     */
    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('errorState').classList.add('hidden');
        document.getElementById('dashboardContent').classList.add('hidden');
    },

    /**
     * Mostra estado de erro
     */
    showError(message) {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('errorState').classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('dashboardContent').classList.add('hidden');
    },

    /**
     * Mostra dashboard
     */
    showDashboard() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('errorState').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');
    },

    /**
     * Configura event listeners gerais
     */
    setupListeners() {
        // Nova busca
        document.getElementById('btnNewSearch').addEventListener('click', () => {
            if (confirm('Deseja iniciar uma nova busca? Os dados atuais serão perdidos.')) {
                localStorage.removeItem('patentAnalysis');
                window.location.href = 'index.html';
            }
        });
    }
};

// ========================================
// INITIALIZATION
// ========================================
async function init() {
    try {
        console.log('🚀 Inicializando dashboard...');
        
        UI.showLoading();
        
        // Carregar dados
        const data = await DataLoader.loadData();
        
        // Aplicar filtros iniciais (sem filtros = todas as patentes)
        DashboardState.filteredPatents = DashboardState.allPatents;
        
        // Renderizar dashboard
        Renderer.renderDashboard(data);
        
        // Configurar event listeners
        Filters.setupListeners();
        Modal.setupListeners();
        UI.setupListeners();
        
        // Mostrar dashboard
        UI.showDashboard();
        
        console.log('✅ Dashboard inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        UI.showError(error.message);
    }
}

// ========================================
// GLOBAL FUNCTIONS (para uso no HTML)
// ========================================
function closeModal() {
    Modal.close();
}

// ========================================
// START APPLICATION
// ========================================
window.addEventListener('load', init);

console.log('✅ Dashboard.js carregado');

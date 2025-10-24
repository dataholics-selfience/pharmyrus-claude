// dashboard.js - Pharmyrus Dashboard
// Corrigido para evitar [object Object] nos títulos

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Recuperar dados do localStorage
        const searchData = localStorage.getItem('pharmyrus_search_data');
        
        if (!searchData) {
            showError('Nenhum dado de busca encontrado. Por favor, realize uma nova busca.');
            return;
        }

        const data = JSON.parse(searchData);
        
        // Ocultar loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('results').style.display = 'block';

        // Renderizar dados
        renderSearchParams(data.searchParams);
        renderMetrics(data.results);
        renderPatents(data.results.patents);
        
        // Buscar análise de IA
        if (data.searchParams) {
            fetchAIAnalysis(data.searchParams, data.results);
        }

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro ao processar os dados. Por favor, tente novamente.');
    }
}

function renderSearchParams(params) {
    const container = document.getElementById('search-params');
    if (!params) {
        container.innerHTML = '<p>Parâmetros de busca não disponíveis.</p>';
        return;
    }

    // CORREÇÃO: Usar propriedades individuais ao invés de concatenar objeto
    const html = `
        <div class="search-params-grid">
            <div class="param-item">
                <span class="param-label">Nome Comercial:</span>
                <span class="param-value">${escapeHtml(params.nome_comercial || '-')}</span>
            </div>
            <div class="param-item">
                <span class="param-label">Molécula:</span>
                <span class="param-value">${escapeHtml(params.nome_molecula || '-')}</span>
            </div>
            <div class="param-item">
                <span class="param-label">Titular:</span>
                <span class="param-value">${escapeHtml(params.titular || '-')}</span>
            </div>
            <div class="param-item">
                <span class="param-label">CAS Number:</span>
                <span class="param-value">${escapeHtml(params.cas_number || '-')}</span>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderMetrics(results) {
    if (!results || !results.patents) {
        console.warn('Dados de resultados inválidos');
        return;
    }

    const patents = results.patents;
    
    // Total de patentes
    document.getElementById('total-patents').textContent = patents.length;

    // Jurisdições únicas
    const jurisdictions = new Set(patents.map(p => p.jurisdiction).filter(Boolean));
    document.getElementById('total-jurisdictions').textContent = jurisdictions.size;

    // Período (data mais antiga e mais recente)
    const dates = patents
        .map(p => p.filing_date || p.publication_date)
        .filter(Boolean)
        .map(d => new Date(d))
        .sort((a, b) => a - b);

    if (dates.length > 0) {
        const oldest = dates[0].getFullYear();
        const newest = dates[dates.length - 1].getFullYear();
        document.getElementById('date-range').textContent = 
            oldest === newest ? oldest : `${oldest} - ${newest}`;
    } else {
        document.getElementById('date-range').textContent = '-';
    }

    // Patentes ativas
    const active = patents.filter(p => 
        p.status && (p.status.toLowerCase().includes('ativa') || 
                    p.status.toLowerCase().includes('granted'))
    ).length;
    document.getElementById('active-patents').textContent = active;
}

function renderPatents(patents) {
    const container = document.getElementById('patents-container');
    
    if (!patents || patents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma patente encontrada.</p>
            </div>
        `;
        return;
    }

    const html = patents.map(patent => createPatentCard(patent)).join('');
    container.innerHTML = html;

    // Adicionar event listeners para expandir/colapsar
    document.querySelectorAll('.patent-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.patent-actions')) {
                card.classList.toggle('expanded');
            }
        });
    });
}

function createPatentCard(patent) {
    // CORREÇÃO: Extrair valores individuais ao invés de usar objeto diretamente
    const title = escapeHtml(patent.title || 'Título não disponível');
    const number = escapeHtml(patent.patent_number || patent.publication_number || 'N/A');
    const jurisdiction = escapeHtml(patent.jurisdiction || 'N/A');
    const status = escapeHtml(patent.status || 'Desconhecido');
    const filingDate = formatDate(patent.filing_date);
    const publicationDate = formatDate(patent.publication_date);
    const inventor = escapeHtml(patent.inventor || 'Não informado');
    const applicant = escapeHtml(patent.applicant || 'Não informado');
    const abstract = escapeHtml(patent.abstract || 'Resumo não disponível');
    
    // Status badge color
    const statusClass = getStatusClass(status);

    return `
        <div class="patent-card">
            <div class="patent-header">
                <div class="patent-title-section">
                    <h4 class="patent-title">${title}</h4>
                    <div class="patent-meta">
                        <span class="patent-number">📄 ${number}</span>
                        <span class="patent-jurisdiction">🌍 ${jurisdiction}</span>
                        <span class="patent-status ${statusClass}">${status}</span>
                    </div>
                </div>
                <button class="expand-btn" aria-label="Expandir detalhes">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>
            
            <div class="patent-details">
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Data de Depósito:</span>
                        <span class="detail-value">${filingDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Data de Publicação:</span>
                        <span class="detail-value">${publicationDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Inventor(es):</span>
                        <span class="detail-value">${inventor}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Depositante:</span>
                        <span class="detail-value">${applicant}</span>
                    </div>
                </div>
                
                <div class="patent-abstract">
                    <h5>Resumo</h5>
                    <p>${abstract}</p>
                </div>
                
                <div class="patent-actions">
                    <button class="btn-action" onclick="viewPatentDetails('${number}')">
                        Ver Detalhes Completos
                    </button>
                    <button class="btn-action" onclick="exportPatentPDF('${number}')">
                        Exportar PDF
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function fetchAIAnalysis(searchParams, results) {
    const aiContent = document.getElementById('ai-content');
    
    try {
        // CORREÇÃO: Construir payload corretamente sem concatenar objetos
        const payload = {
            nome_comercial: searchParams.nome_comercial || '',
            nome_molecula: searchParams.nome_molecula || '',
            titular: searchParams.titular || '',
            cas_number: searchParams.cas_number || '',
            total_patents: results.patents ? results.patents.length : 0,
            jurisdictions: results.patents ? 
                [...new Set(results.patents.map(p => p.jurisdiction).filter(Boolean))] : []
        };

        const response = await fetch('https://primary-production-2e3b.up.railway.app/webhook/analise-patentes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        // CORREÇÃO: Usar a propriedade correta da resposta
        if (data.analysis || data.analise) {
            const analysis = data.analysis || data.analise;
            aiContent.innerHTML = `
                <div class="ai-result">
                    ${formatMarkdown(analysis)}
                </div>
            `;
        } else {
            throw new Error('Formato de resposta inválido');
        }

    } catch (error) {
        console.error('Erro ao buscar análise de IA:', error);
        aiContent.innerHTML = `
            <div class="ai-error">
                <p>⚠️ Não foi possível gerar a análise de IA.</p>
                <p class="error-detail">${error.message}</p>
            </div>
        `;
    }
}

// Funções auxiliares

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Não informado';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch {
        return dateString;
    }
}

function getStatusClass(status) {
    if (!status) return 'status-unknown';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ativa') || statusLower.includes('granted')) {
        return 'status-active';
    }
    if (statusLower.includes('pendente') || statusLower.includes('pending')) {
        return 'status-pending';
    }
    if (statusLower.includes('expirada') || statusLower.includes('expired')) {
        return 'status-expired';
    }
    return 'status-unknown';
}

function formatMarkdown(text) {
    if (!text) return '';
    
    // Converter markdown básico para HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.+)$/, '<p>$1</p>');
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-message').textContent = message;
}

// Event Listeners

document.getElementById('export-pdf')?.addEventListener('click', () => {
    alert('Funcionalidade de exportação em desenvolvimento');
});

document.getElementById('sort-select')?.addEventListener('change', (e) => {
    const sortValue = e.target.value;
    const searchData = JSON.parse(localStorage.getItem('pharmyrus_search_data'));
    
    if (searchData && searchData.results && searchData.results.patents) {
        const patents = [...searchData.results.patents];
        
        switch(sortValue) {
            case 'date-desc':
                patents.sort((a, b) => {
                    const dateA = new Date(a.filing_date || a.publication_date || 0);
                    const dateB = new Date(b.filing_date || b.publication_date || 0);
                    return dateB - dateA;
                });
                break;
            case 'date-asc':
                patents.sort((a, b) => {
                    const dateA = new Date(a.filing_date || a.publication_date || 0);
                    const dateB = new Date(b.filing_date || b.publication_date || 0);
                    return dateA - dateB;
                });
                break;
            case 'title':
                patents.sort((a, b) => {
                    const titleA = (a.title || '').toLowerCase();
                    const titleB = (b.title || '').toLowerCase();
                    return titleA.localeCompare(titleB);
                });
                break;
        }
        
        renderPatents(patents);
    }
});

// Funções globais (chamadas de onclick)

window.viewPatentDetails = function(patentNumber) {
    alert(`Visualizar detalhes da patente: ${patentNumber}`);
    // Implementar navegação para página de detalhes
};

window.exportPatentPDF = function(patentNumber) {
    alert(`Exportar PDF da patente: ${patentNumber}`);
    // Implementar exportação individual
};

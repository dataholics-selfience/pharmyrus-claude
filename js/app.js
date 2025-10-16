// Configuração
const WEBHOOK_PROD = 'https://primary-production-2e3b.up.railway.app/webhook/analise-patentes';
const WEBHOOK_TEST = 'https://primary-production-2e3b.up.railway.app/webhook-test/analise-patentes';
const POLLING_INTERVAL = 10000; // 10 segundos
const MAX_WAIT_TIME = 300000; // 5 minutos

// Elementos DOM
const searchForm = document.getElementById('searchForm');
const btnSearch = document.getElementById('btnSearch');
const btnTest = document.getElementById('btnTest');
const btnCancel = document.getElementById('btnCancel');
const useTestEnv = document.getElementById('useTestEnv');
const processingStatus = document.getElementById('processingStatus');
const statusMessage = document.getElementById('statusMessage');
const progressFill = document.getElementById('progressFill');
const statusTime = document.getElementById('statusTime');

let pollingInterval = null;
let startTime = null;
let abortController = null;

// Event Listeners
searchForm.addEventListener('submit', handleSubmit);
btnTest.addEventListener('click', handleTestSearch);
btnCancel.addEventListener('click', cancelSearch);

// Função principal de busca
async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        nome_molecula: document.getElementById('nomeMolecula').value.trim(),
        nome_comercial: document.getElementById('nomeComercial').value.trim()
    };

    if (!formData.nome_molecula || !formData.nome_comercial) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    await startSearch(formData);
}

// Busca de teste rápido
function handleTestSearch() {
    const testData = {
        nome_molecula: 'Abemaciclib',
        nome_comercial: 'Verzenios'
    };
    
    document.getElementById('nomeMolecula').value = testData.nome_molecula;
    document.getElementById('nomeComercial').value = testData.nome_comercial;
    
    startSearch(testData);
}

// Iniciar busca
async function startSearch(data) {
    const webhookUrl = useTestEnv.checked ? WEBHOOK_TEST : WEBHOOK_PROD;
    
    // Mostrar status de processamento
    showProcessingStatus();
    startTime = Date.now();
    
    // Criar AbortController para cancelamento
    abortController = new AbortController();
    
    try {
        updateStatus('Enviando requisição...', 10);
        
        // Enviar requisição
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: abortController.signal
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        updateStatus('Processando análise de patentes...', 20);
        
        // Iniciar polling
        startPolling(webhookUrl, result.request_id || Date.now());
        
    } catch (error) {
        if (error.name === 'AbortError') {
            updateStatus('Busca cancelada', 0);
        } else {
            console.error('Erro na busca:', error);
            alert('Erro ao iniciar busca: ' + error.message);
        }
        hideProcessingStatus();
    }
}

// Polling para checar resultado
function startPolling(webhookUrl, requestId) {
    let progress = 20;
    const progressIncrement = 60 / (MAX_WAIT_TIME / POLLING_INTERVAL);
    
    pollingInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        
        // Atualizar progresso
        progress = Math.min(progress + progressIncrement, 95);
        updateStatus('Analisando patentes e gerando insights...', progress);
        updateTimeRemaining(elapsed);
        
        // Timeout
        if (elapsed > MAX_WAIT_TIME) {
            clearInterval(pollingInterval);
            alert('Tempo limite excedido. Tente novamente.');
            hideProcessingStatus();
            return;
        }
        
        try {
            // Tentar buscar resultado (ajuste conforme sua API)
            const checkResponse = await fetch(`${webhookUrl}/status/${requestId}`);
            
            if (checkResponse.ok) {
                const data = await checkResponse.json();
                
                if (data.status === 'completed') {
                    clearInterval(pollingInterval);
                    handleSuccess(data.result);
                } else if (data.status === 'error') {
                    clearInterval(pollingInterval);
                    throw new Error(data.error);
                }
            }
        } catch (error) {
            // Continue polling em caso de erro (exceto se for erro crítico)
            console.log('Polling...', error.message);
        }
        
    }, POLLING_INTERVAL);
}

// Cancelar busca
function cancelSearch() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    
    if (abortController) {
        abortController.abort();
    }
    
    hideProcessingStatus();
}

// Sucesso - redirecionar para dashboard
function handleSuccess(data) {
    updateStatus('Análise concluída! Redirecionando...', 100);
    
    // Salvar dados no localStorage
    localStorage.setItem('patentAnalysis', JSON.stringify(data));
    
    // Redirecionar após 1 segundo
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

// Funções de UI
function showProcessingStatus() {
    processingStatus.classList.remove('hidden');
    searchForm.style.opacity = '0.5';
    searchForm.style.pointerEvents = 'none';
}

function hideProcessingStatus() {
    processingStatus.classList.add('hidden');
    searchForm.style.opacity = '1';
    searchForm.style.pointerEvents = 'auto';
}

function updateStatus(message, progress) {
    statusMessage.textContent = message;
    progressFill.style.width = `${progress}%`;
}

function updateTimeRemaining(elapsed) {
    const remaining = Math.max(0, Math.ceil((MAX_WAIT_TIME - elapsed) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    statusTime.textContent = `Tempo restante: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Limpar dados ao carregar
window.addEventListener('load', () => {
    // Limpar dados antigos
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        localStorage.removeItem('patentAnalysis');
    }
});
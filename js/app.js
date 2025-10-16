// ========================================
// PHARMYRUS - APP.JS (VERSÃO CORRIGIDA)
// ========================================

console.log('🚀 Pharmyrus App iniciado');

// Configuração
const WEBHOOK_PROD = 'https://primary-production-2e3b.up.railway.app/webhook/analise-patentes';
const WEBHOOK_TEST = 'https://primary-production-2e3b.up.railway.app/webhook-test/analise-patentes';
const TIMEOUT = 360000; // 6 minutos

// Estado
let state = {
    isProcessing: false,
    progressInterval: null,
    abortController: null,
    startTime: null
};

// Elementos DOM
let elements = {};

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado');
    
    // Capturar elementos
    elements = {
        searchForm: document.getElementById('searchForm'),
        btnSearch: document.getElementById('btnSearch'),
        btnTest: document.getElementById('btnTest'),
        btnCancel: document.getElementById('btnCancel'),
        useTestEnv: document.getElementById('useTestEnv'),
        processingStatus: document.getElementById('processingStatus'),
        statusMessage: document.getElementById('statusMessage'),
        progressFill: document.getElementById('progressFill'),
        statusTime: document.getElementById('statusTime'),
        nomeMolecula: document.getElementById('nomeMolecula'),
        nomeComercial: document.getElementById('nomeComercial')
    };

    // Verificar se todos os elementos foram encontrados
    const missingElements = Object.entries(elements)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
    
    if (missingElements.length > 0) {
        console.error('❌ Elementos não encontrados:', missingElements);
        return;
    }

    console.log('✅ Todos os elementos encontrados');

    // Adicionar event listeners
    setupEventListeners();

    // Limpar localStorage
    localStorage.removeItem('patentAnalysis');
    console.log('🧹 localStorage limpo');
});

// Configurar Event Listeners
function setupEventListeners() {
    // Prevenir submit padrão do formulário
    elements.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📝 Form submit interceptado');
        handleSubmit();
        return false;
    });

    // Botão de busca
    elements.btnSearch.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔍 Botão buscar clicado');
        handleSubmit();
    });

    // Botão de teste
    elements.btnTest.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🧪 Botão teste clicado');
        handleTestSearch();
    });

    // Botão de cancelar
    elements.btnCancel.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('❌ Botão cancelar clicado');
        cancelSearch();
    });

    console.log('✅ Event listeners configurados');
}

// Função principal de busca
function handleSubmit() {
    console.log('🚀 handleSubmit iniciado');
    
    const formData = {
        nome_molecula: elements.nomeMolecula.value.trim(),
        nome_comercial: elements.nomeComercial.value.trim()
    };

    console.log('📦 Dados do formulário:', formData);

    if (!formData.nome_molecula || !formData.nome_comercial) {
        console.warn('⚠️ Campos vazios');
        alert('Por favor, preencha todos os campos');
        return;
    }

    startSearch(formData);
}

// Busca de teste rápido
function handleTestSearch() {
    console.log('🧪 Teste rápido iniciado');
    
    const testData = {
        nome_molecula: 'Semaglutida',
        nome_comercial: 'Ozempic'
    };
    
    elements.nomeMolecula.value = testData.nome_molecula;
    elements.nomeComercial.value = testData.nome_comercial;
    
    console.log('📝 Campos preenchidos com dados de teste');
    
    startSearch(testData);
}

// Iniciar busca
async function startSearch(data) {
    console.log('🔄 startSearch iniciado');
    console.log('📊 Estado atual:', state);

    if (state.isProcessing) {
        console.warn('⚠️ Já existe uma busca em andamento');
        return;
    }

    state.isProcessing = true;
    
    const webhookUrl = elements.useTestEnv.checked ? WEBHOOK_TEST : WEBHOOK_PROD;
    
    console.log('🎯 Webhook selecionado:', webhookUrl);
    console.log('🔧 Ambiente de teste?', elements.useTestEnv.checked);
    
    // Mostrar status de processamento
    showProcessingStatus();
    state.startTime = Date.now();
    
    // Iniciar animação de progresso
    startProgressAnimation();
    
    // Criar AbortController para cancelamento
    state.abortController = new AbortController();
    
    try {
        updateStatus('📤 Enviando requisição para análise...', 5);
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 ENVIANDO REQUISIÇÃO');
        console.log('URL:', webhookUrl);
        console.log('Método: POST');
        console.log('Headers: Content-Type: application/json');
        console.log('Body:', JSON.stringify(data, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Enviar requisição COM TIMEOUT
        const response = await Promise.race([
            fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data),
                signal: state.abortController.signal
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT)
            )
        ]);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📡 RESPOSTA RECEBIDA');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro da API:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        updateStatus('📥 Recebendo dados da análise...', 90);
        
        const result = await response.json();
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ DADOS RECEBIDOS');
        console.log('Tipo:', Array.isArray(result) ? 'Array' : typeof result);
        console.log('Tamanho:', JSON.stringify(result).length, 'bytes');
        console.log('Preview:', JSON.stringify(result).substring(0, 200) + '...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Verificar se tem dados
        if (!result) {
            throw new Error('Resposta vazia da API');
        }

        if (Array.isArray(result) && result.length === 0) {
            throw new Error('Array vazio retornado pela API');
        }

        // Processar resultado
        handleSuccess(result);
        
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERRO NA REQUISIÇÃO');
        console.error('Nome:', error.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        state.isProcessing = false;
        
        if (error.name === 'AbortError') {
            alert('Busca cancelada pelo usuário');
        } else if (error.message === 'TIMEOUT') {
            alert('⏱️ Timeout: A análise demorou mais de 6 minutos.\n\nTente novamente ou use o webhook de teste.');
        } else {
            alert('❌ Erro ao processar análise:\n\n' + error.message + '\n\nAbra o console (F12) para mais detalhes.');
        }
        
        hideProcessingStatus();
    }
}

// Animação de progresso
function startProgressAnimation() {
    let progress = 5;
    
    state.progressInterval = setInterval(() => {
        progress += 0.5;
        
        if (progress <= 85) {
            updateStatus('⏳ Processando análise de patentes...', progress);
            updateTimeRemaining();
        }
    }, 2000);
}

// Cancelar busca
function cancelSearch() {
    console.log('🛑 Cancelando busca...');
    
    if (state.progressInterval) {
        clearInterval(state.progressInterval);
        state.progressInterval = null;
    }
    
    if (state.abortController) {
        state.abortController.abort();
    }
    
    state.isProcessing = false;
    hideProcessingStatus();
}

// Sucesso - redirecionar para dashboard
function handleSuccess(data) {
    console.log('🎉 handleSuccess iniciado');
    
    if (state.progressInterval) {
        clearInterval(state.progressInterval);
        state.progressInterval = null;
    }
    
    updateStatus('✅ Análise concluída! Preparando dashboard...', 100);
    
    try {
        // Garantir formato correto
        const dataToSave = Array.isArray(data) ? data : [{ output: JSON.stringify(data) }];
        
        const jsonString = JSON.stringify(dataToSave);
        
        console.log('💾 Salvando no localStorage...');
        console.log('Tamanho:', jsonString.length, 'bytes');
        
        localStorage.setItem('patentAnalysis', jsonString);
        
        console.log('✅ Dados salvos com sucesso!');
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
            console.log('🔀 Redirecionando para dashboard.html...');
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        alert('Erro ao salvar dados da análise.\n\nErro: ' + error.message);
        state.isProcessing = false;
        hideProcessingStatus();
    }
}

// Funções de UI
function showProcessingStatus() {
    console.log('👁️ Mostrando status de processamento');
    elements.processingStatus.classList.remove('hidden');
    elements.searchForm.style.opacity = '0.5';
    elements.searchForm.style.pointerEvents = 'none';
    elements.btnSearch.disabled = true;
    elements.btnTest.disabled = true;
}

function hideProcessingStatus() {
    console.log('🙈 Escondendo status de processamento');
    elements.processingStatus.classList.add('hidden');
    elements.searchForm.style.opacity = '1';
    elements.searchForm.style.pointerEvents = 'auto';
    elements.btnSearch.disabled = false;
    elements.btnTest.disabled = false;
    
    if (state.progressInterval) {
        clearInterval(state.progressInterval);
        state.progressInterval = null;
    }
}

function updateStatus(message, progress) {
    elements.statusMessage.textContent = message;
    elements.progressFill.style.width = `${progress}%`;
}

function updateTimeRemaining() {
    if (!state.startTime) return;
    
    const elapsed = Date.now() - state.startTime;
    const remaining = Math.max(0, Math.ceil((TIMEOUT - elapsed) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    elements.statusTime.textContent = `⏱️ Tempo restante: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

console.log('✅ Script app.js carregado completamente');
```

---

### **3. Testar**

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregue a página** (Ctrl+F5)
3. **Abra o Console** (F12)
4. **Clique em "Teste Rápido"**
5. **Observe os logs**

Você deve ver:
```
🚀 Pharmyrus App iniciado
📄 DOM carregado
✅ Todos os elementos encontrados
✅ Event listeners configurados
🧪 Teste rápido iniciado
📝 Campos preenchidos com dados de teste
🔄 startSearch iniciado
🎯 Webhook selecionado: https://...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 ENVIANDO REQUISIÇÃO
...

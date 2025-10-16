// Configuração
const WEBHOOK_PROD = 'https://primary-production-2e3b.up.railway.app/webhook/analise-patentes';
const WEBHOOK_TEST = 'https://primary-production-2e3b.up.railway.app/webhook-test/analise-patentes';
const TIMEOUT = 360000; // 6 minutos

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

let progressInterval = null;
let abortController = null;
let startTime = null;

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
    
    // Iniciar animação de progresso
    startProgressAnimation();
    
    // Criar AbortController para cancelamento
    abortController = new AbortController();
    
    try {
        updateStatus('Enviando requisição para análise...', 5);
        
        console.log('📤 Enviando para:', webhookUrl);
        console.log('📦 Payload:', data);
        
        // Enviar requisição COM TIMEOUT
        const response = await Promise.race([
            fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                signal: abortController.signal
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: A análise demorou mais de 6 minutos')), TIMEOUT)
            )
        ]);

        console.log('📡 Status da resposta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro da API:', errorText);
            throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }

        updateStatus('Recebendo dados da análise...', 90);
        
        const result = await response.json();
        
        console.log('✅ Dados recebidos:', result);
        
        // Verificar se tem dados
        if (!result || (Array.isArray(result) && result.length === 0)) {
            throw new Error('Resposta vazia da API');
        }

        // Processar resultado
        handleSuccess(result);
        
    } catch (error) {
        console.error('❌ Erro completo:', error);
        
        if (error.name === 'AbortError') {
            alert('Busca cancelada pelo usuário');
        } else if (error.message.includes('Timeout')) {
            alert('⏱️ A análise está demorando mais que o esperado.\n\nIsso pode acontecer quando há muitas patentes para analisar.\n\nTente novamente ou use o webhook de teste.');
        } else {
            alert('❌ Erro ao processar análise:\n\n' + error.message + '\n\nVerifique o console do navegador (F12) para mais detalhes.');
        }
        
        hideProcessingStatus();
    }
}

// Animação de progresso
function startProgressAnimation() {
    let progress = 5;
    
    progressInterval = setInterval(() => {
        progress += 1;
        
        // Progresso gradual até 95%
        if (progress <= 95) {
            updateStatus('Processando análise de patentes...', progress);
            updateTimeRemaining();
        }
    }, 3000); // Incrementa 1% a cada 3 segundos
}

// Cancelar busca
function cancelSearch() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    if (abortController) {
        abortController.abort();
    }
    
    hideProcessingStatus();
}

// Sucesso - redirecionar para dashboard
function handleSuccess(data) {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    updateStatus('✅ Análise concluída! Preparando dashboard...', 100);
    
    console.log('💾 Salvando dados no localStorage...');
    
    // Salvar dados no localStorage
    try {
        // Se vier como array, pegar o primeiro item
        const dataToSave = Array.isArray(data) ? data : [{ output: JSON.stringify(data) }];
        localStorage.setItem('patentAnalysis', JSON.stringify(dataToSave));
        
        console.log('✅ Dados salvos com sucesso!');
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
            console.log('🔀 Redirecionando para dashboard...');
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        alert('Erro ao salvar dados da análise. Verifique o console.');
        hideProcessingStatus();
    }
}

// Funções de UI
function showProcessingStatus() {
    processingStatus.classList.remove('hidden');
    searchForm.style.opacity = '0.5';
    searchForm.style.pointerEvents = 'none';
    btnSearch.disabled = true;
    btnTest.disabled = true;
}

function hideProcessingStatus() {
    processingStatus.classList.add('hidden');
    searchForm.style.opacity = '1';
    searchForm.style.pointerEvents = 'auto';
    btnSearch.disabled = false;
    btnTest.disabled = false;
    
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

function updateStatus(message, progress) {
    statusMessage.textContent = message;
    progressFill.style.width = `${progress}%`;
}

function updateTimeRemaining() {
    if (!startTime) return;
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, Math.ceil((TIMEOUT - elapsed) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    statusTime.textContent = `Tempo restante: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Limpar dados ao carregar
window.addEventListener('load', () => {
    // Limpar dados antigos apenas na página inicial
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        localStorage.removeItem('patentAnalysis');
        console.log('🧹 LocalStorage limpo');
    }
});

// Debug
console.log('✅ app.js carregado');
console.log('🔗 Webhook PROD:', WEBHOOK_PROD);
console.log('🔗 Webhook TEST:', WEBHOOK_TEST);
```

---

### **PRINCIPAIS MUDANÇAS:**

1. ✅ **Removido polling** - agora espera a resposta completa do webhook
2. ✅ **Timeout de 6 minutos** - aguarda até 6 minutos antes de cancelar
3. ✅ **Logs de debug** - você verá no console (F12) o que está acontecendo
4. ✅ **Mensagens de erro claras** - mostra exatamente onde falhou
5. ✅ **Progresso visual** - barra avança automaticamente enquanto espera
6. ✅ **Tratamento de resposta** - aceita tanto array quanto objeto direto

---

### **TESTE AGORA:**

1. **Abra o site**
2. **Abra o Console** (F12 → aba Console)
3. **Preencha o formulário**
4. **Clique em "Iniciar Análise"**
5. **Aguarde** (vai mostrar logs no console)

Você vai ver algo assim no console:
```
✅ app.js carregado
📤 Enviando para: https://...
📦 Payload: {nome_molecula: "...", nome_comercial: "..."}
📡 Status da resposta: 200
✅ Dados recebidos: [...]
💾 Salvando dados no localStorage...
✅ Dados salvos com sucesso!
🔀 Redirecionando para dashboard...

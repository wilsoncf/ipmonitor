// Função para obter a base URL da API dependendo do ambiente
function getApiBaseUrl() {
    // Verifica se estamos em produção (domínio tce.go.gov.br) ou desenvolvimento
    if (window.location.hostname.includes('tce.go.gov.br')) {
        return '/ipmonitor';
    } else {
        return '';
    }
}

// Configurações JavaScript para página de configurações
class ConfigManager {
    constructor() {
        this.form = document.getElementById('config-form');
        this.statusMessage = document.getElementById('status-message');
        this.saveBtn = document.getElementById('save-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.testBtn = document.getElementById('test-btn');
        this.apiBaseUrl = getApiBaseUrl();
        
        this.initializeEventListeners();
        this.setupDependentFields();
    }
    
    initializeEventListeners() {
        // Evento de submit do formulário
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfiguration();
        });
        
        // Botão de reset
        this.resetBtn.addEventListener('click', () => {
            this.showConfirmDialog('Tem certeza que deseja restaurar as configurações padrão?', () => {
                this.resetToDefaults();
            });
        });
        
        // Botão de teste
        this.testBtn.addEventListener('click', () => {
            this.testConfiguration();
        });
        
        // Validação em tempo real
        this.form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });
        
        // Auto-save draft (salvar rascunho automaticamente)
        this.form.addEventListener('change', () => {
            this.saveDraft();
        });
    }
    
    setupDependentFields() {
        // Habilitar/desabilitar taxa de atualização baseado na checkbox
        const autoRefreshCheckbox = document.getElementById('auto_refresh');
        const refreshRateInput = document.getElementById('refresh_rate');
        
        autoRefreshCheckbox.addEventListener('change', () => {
            refreshRateInput.disabled = !autoRefreshCheckbox.checked;
            if (!autoRefreshCheckbox.checked) {
                refreshRateInput.value = 5; // valor padrão
            }
        });
        
        // Validação de ranges para campos numéricos
        this.setupRangeValidation();
    }
    
    setupRangeValidation() {
        const numericInputs = this.form.querySelectorAll('input[type="number"]');
        
        numericInputs.forEach(input => {
            input.addEventListener('blur', () => {
                const min = parseFloat(input.min);
                const max = parseFloat(input.max);
                const value = parseFloat(input.value);
                
                if (value < min) {
                    input.value = min;
                    this.showMessage(`Valor ajustado para o mínimo permitido: ${min}`, 'info');
                } else if (value > max) {
                    input.value = max;
                    this.showMessage(`Valor ajustado para o máximo permitido: ${max}`, 'info');
                }
            });
        });
    }
    
    async saveConfiguration() {
        this.setButtonLoading(this.saveBtn, true);
        
        try {
            const formData = this.getFormData();
            
            const response = await fetch(`${this.apiBaseUrl}/api/config/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage('✅ Configurações salvas com sucesso!', 'success');
                this.clearDraft();
                
                // Atualizar timestamp na interface
                const timestampElement = document.querySelector('.readonly-value');
                if (timestampElement) {
                    timestampElement.textContent = new Date().toLocaleString('pt-BR');
                }
            } else {
                throw new Error(result.message || 'Erro ao salvar configurações');
            }
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            this.showMessage(`❌ Erro ao salvar: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(this.saveBtn, false);
        }
    }
    
    async resetToDefaults() {
        this.setButtonLoading(this.resetBtn, true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/config/reset`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage('🔄 Configurações restauradas para os valores padrão!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error(result.message || 'Erro ao restaurar configurações');
            }
        } catch (error) {
            console.error('Erro ao resetar configurações:', error);
            this.showMessage(`❌ Erro ao restaurar: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(this.resetBtn, false);
        }
    }
    
    async testConfiguration() {
        this.setButtonLoading(this.testBtn, true);
        
        try {
            const formData = this.getFormData();
            
            const response = await fetch(`${this.apiBaseUrl}/api/config/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage(`🧪 Teste concluído: ${result.message}`, 'info');
            } else {
                throw new Error(result.message || 'Erro no teste de configurações');
            }
        } catch (error) {
            console.error('Erro ao testar configurações:', error);
            this.showMessage(`❌ Erro no teste: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(this.testBtn, false);
        }
    }
    
    getFormData() {
        const formData = new FormData(this.form);
        const config = {};
        
        // Converter FormData para estrutura de configuração aninhada
        for (let [name, value] of formData.entries()) {
            this.setNestedProperty(config, name, value);
        }
        
        // Processar checkboxes separadamente (não aparecem no FormData se não marcados)
        const checkboxes = this.form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            this.setNestedProperty(config, checkbox.name, checkbox.checked);
        });
        
        return config;
    }
    
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        const lastKey = keys[keys.length - 1];
        
        // Converter tipos apropriados
        if (value === 'true' || value === 'false') {
            current[lastKey] = value === 'true';
        } else if (!isNaN(value) && value !== '') {
            current[lastKey] = parseFloat(value);
        } else {
            current[lastKey] = value;
        }
    }
    
    validateField(field) {
        const isValid = field.checkValidity();
        
        if (isValid) {
            field.style.borderColor = '#ddd';
            this.hideFieldError(field);
        } else {
            field.style.borderColor = '#e74c3c';
            this.showFieldError(field, field.validationMessage);
        }
        
        return isValid;
    }
    
    showFieldError(field, message) {
        let errorElement = field.parentElement.querySelector('.field-error');
        
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'field-error';
            errorElement.style.color = '#e74c3c';
            errorElement.style.fontSize = '12px';
            errorElement.style.marginTop = '4px';
            field.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    hideFieldError(field) {
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    showMessage(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = type;
        this.statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            this.statusMessage.classList.add('hidden');
        }, 5000);
    }
    
    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }
    
    showConfirmDialog(message, onConfirm) {
        if (confirm(message)) {
            onConfirm();
        }
    }
    
    // Salvar rascunho no localStorage
    saveDraft() {
        try {
            const formData = this.getFormData();
            localStorage.setItem('ipmonitor_config_draft', JSON.stringify(formData));
        } catch (error) {
            console.warn('Erro ao salvar rascunho:', error);
        }
    }
    
    // Limpar rascunho
    clearDraft() {
        localStorage.removeItem('ipmonitor_config_draft');
    }
    
    // Carregar rascunho (se existir)
    loadDraft() {
        try {
            const draft = localStorage.getItem('ipmonitor_config_draft');
            if (draft) {
                const config = JSON.parse(draft);
                this.populateForm(config);
                this.showMessage('📝 Rascunho carregado automaticamente', 'info');
            }
        } catch (error) {
            console.warn('Erro ao carregar rascunho:', error);
        }
    }
    
    populateForm(config) {
        // Implementar se necessário para carregar rascunhos
        // Por enquanto, deixamos o template fazer isso via servidor
    }
}

// Utilitários adicionais
class ConfigValidators {
    static validatePingInterval(value) {
        const num = parseInt(value);
        return num >= 30 && num <= 360;
    }
    
    static validateTimeout(value) {
        const num = parseFloat(value);
        return num >= 1 && num <= 10;
    }
    
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.configManager = new ConfigManager();
    
    // Mostrar informações de ajuda ao clicar em campos específicos
    setupHelpTooltips();
});

function setupHelpTooltips() {
    const helpData = {
        'ping_timeout': 'Tempo limite para cada ping individual. Valores muito baixos podem gerar falsos positivos.',
        'max_concurrent_pings': 'Número máximo de pings executados simultaneamente. Mais threads = verificação mais rápida.',
        'retry_attempts': 'Quantas vezes tentar fazer ping antes de considerar o dispositivo offline.',
        'refresh_rate': 'Frequência de atualização automática da interface em segundos.',
        'max_log_entries': 'Número máximo de entradas de log mantidas no sistema.',
    };
    
    Object.entries(helpData).forEach(([fieldId, helpText]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            const label = field.parentElement.querySelector('label');
            if (label) {
                const tooltip = document.createElement('span');
                tooltip.className = 'help-tooltip';
                tooltip.setAttribute('data-tooltip', helpText);
                label.appendChild(tooltip);
            }
        }
    });
}

// Função para exportar configurações
function exportConfiguration() {
    const config = window.configManager.getFormData();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipmonitor_config_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Função para importar configurações
function importConfiguration(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            window.configManager.populateForm(config);
            window.configManager.showMessage('📁 Configurações importadas com sucesso!', 'success');
        } catch (error) {
            window.configManager.showMessage('❌ Erro ao importar configurações: arquivo inválido', 'error');
        }
    };
    reader.readAsText(file);
}
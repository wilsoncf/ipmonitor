// Função assíncrona para buscar dados com base na VLAN selecionada
async function searchByVlan() {

    // Obtém o elemento do select com ID 'filtroVLAN'
    const vlanSelect = document.getElementById('filtroVLAN');

    // Obtém o valor selecionado no select e codifica-o para uso na URL
    const vlan = encodeURIComponent(vlanSelect.value);  
    
    // Faz uma requisição para a API usando o valor da VLAN
    const response = await fetch(`api/start-check/${vlan}`);

    // Verifica se a requisição falhou
    if (response.status !== 200) {
        console.error('Falhou para obter os dados dos IPs');
        
        // Tenta buscar novamente a cada 5 segundos, caso tenha falhado
        setInterval(searchByVlan, 5000);
        return;
    } else {
        // Limpa qualquer mensagem preliminar que possa estar exibida
        mensagem_preliminar.textContent = ``;
        
        // Converte a resposta em JSON
        const data = await response.json();

        // Obtém o corpo da tabela com os IPs
        const tbody = document.getElementById('ipTableBody');
        
        // Limpa a tabela antes de inserir novos elementos
        tbody.innerHTML = '';  

        // Percorre os dados recebidos e cria linhas para a tabela
        for (let i = 0; i < data.length; i += 3) {
            const row = document.createElement('tr');

            // Cria células para 3 colunas de dados por linha
            for (let j = 0; j < 3; j++) {
                const descriptionCell = document.createElement('td');
                const ipCell = document.createElement('td');
                const statusCell = document.createElement('td');
                const circle = document.createElement('span');

                // Verifica se há dados para a célula atual
                if (data[i + j]) {
                    descriptionCell.textContent = data[i + j].descricao;
                    ipCell.textContent = data[i + j].ip;
                    
                    // Adiciona a classe CSS 'circle' e 'red' para o status do IP
                    circle.classList.add('circle', 'red');
                }

                // Adiciona o círculo de status à célula de status
                statusCell.appendChild(circle);
                
                // Adiciona as células à linha
                row.appendChild(descriptionCell);
                row.appendChild(ipCell);
                row.appendChild(statusCell);
            }

            // Adiciona a linha à tabela
            tbody.appendChild(row);
        }
    }
}

// Quando a página carrega, define a VLAN inicial e inicia a busca
window.onload = function() {

    // Define o valor inicial do select 'filtroVLAN' para 85
    document.getElementById('filtroVLAN').value = '85';

    // Inicia o processo de busca pela VLAN
    searchByVlan();

    // (Comentado) Adiciona o event listener para disparar a função quando o valor da VLAN mudar
    // document.getElementById('filtroVLAN').addEventListener('change', searchByVlan);
};

// Eu acho que isso não é mais necessário?
setInterval(searchByVlan, 20000);

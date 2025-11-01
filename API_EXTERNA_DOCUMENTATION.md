# API Externa - Dispositivos Online por VLAN

## Visão Geral

API para consultar dispositivos online de uma VLAN específica. Retorna apenas os dispositivos que estão **online** no momento da consulta, incluindo IP, nome e descrição.

## Autenticação

A API utiliza **Bearer Token** para autenticação. Todas as requisições devem incluir o header de autorização:

```
Authorization: Bearer whatsapp_api_token_2025_helpdeskmonitor_tce
```

## Endpoint

### GET /api/external/devices/vlan/{vlan}

Retorna todos os dispositivos online de uma VLAN específica.

#### URL Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| vlan | integer | Número da VLAN a ser consultada |

#### Headers

| Header | Valor |
|--------|-------|
| Authorization | Bearer whatsapp_api_token_2025_helpdeskmonitor_tce |

#### Resposta de Sucesso

**Status Code:** `200 OK`

```json
{
  "vlan": 10,
  "total_online": 3,
  "devices": [
    {
      "ip": "172.17.10.1",
      "nome": "Servidor Principal",
      "descricao": "Servidor"
    },
    {
      "ip": "172.17.10.5",
      "nome": "Switch Core",
      "descricao": "Switch"
    },
    {
      "ip": "172.17.10.10",
      "nome": "Firewall",
      "descricao": "Firewall"
    }
  ]
}
```

#### Respostas de Erro

**401 Unauthorized** - Token não fornecido
```json
{
  "error": "Token de autenticação não fornecido"
}
```

**403 Forbidden** - Token inválido
```json
{
  "error": "Token de autenticação inválido"
}
```

**404 Not Found** - VLAN não encontrada ou não escaneada
```json
{
  "error": "VLAN não encontrada ou ainda não escaneada",
  "vlan": 10
}
```

**500 Internal Server Error** - Erro no servidor
```json
{
  "error": "Mensagem de erro detalhada"
}
```

## Exemplos de Uso

### cURL

```bash
curl -X GET "https://automacao.tce.go.gov.br/ipmonitor/api/external/devices/vlan/10" \
  -H "Authorization: Bearer whatsapp_api_token_2025_helpdeskmonitor_tce"
```

### Python (requests)

```python
import requests

url = "https://automacao.tce.go.gov.br/ipmonitor/api/external/devices/vlan/10"
headers = {
    "Authorization": "Bearer whatsapp_api_token_2025_helpdeskmonitor_tce"
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    print(f"VLAN {data['vlan']} - {data['total_online']} dispositivos online")
    for device in data['devices']:
        print(f"  - {device['ip']} | {device['nome']} | {device['descricao']}")
else:
    print(f"Erro: {response.status_code} - {response.json()}")
```

### JavaScript (fetch)

```javascript
fetch('https://automacao.tce.go.gov.br/ipmonitor/api/external/devices/vlan/10', {
  headers: {
    'Authorization': 'Bearer whatsapp_api_token_2025_helpdeskmonitor_tce'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log(`VLAN ${data.vlan} - ${data.total_online} dispositivos online`);
    data.devices.forEach(device => {
      console.log(`  - ${device.ip} | ${device.nome} | ${device.descricao}`);
    });
  })
  .catch(error => console.error('Erro:', error));
```

### PowerShell

```powershell
$headers = @{
    "Authorization" = "Bearer whatsapp_api_token_2025_helpdeskmonitor_tce"
}

$response = Invoke-RestMethod -Uri "https://automacao.tce.go.gov.br/ipmonitor/api/external/devices/vlan/10" -Headers $headers -Method Get

Write-Host "VLAN $($response.vlan) - $($response.total_online) dispositivos online"
foreach ($device in $response.devices) {
    Write-Host "  - $($device.ip) | $($device.nome) | $($device.descricao)"
}
```

## Notas Importantes

1. **Apenas dispositivos online**: A API retorna somente dispositivos que estão respondendo ping no momento da consulta.

2. **VLAN deve estar configurada**: A VLAN precisa estar configurada no sistema e ter sido escaneada pelo menos uma vez.

3. **Cache de status**: O status online/offline é baseado na última verificação em background. O intervalo de verificação pode ser configurado nas configurações do sistema.

4. **Formato do Token**: O token deve ser enviado no formato `Bearer <token>` no header Authorization.

5. **Segurança**: Mantenha o token em segurança e não o exponha em repositórios públicos ou logs.

## URL de Produção

```
GET https://automacao.tce.go.gov.br/ipmonitor/api/external/devices/vlan/{vlan}
```

## Campos Retornados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| vlan | integer | Número da VLAN consultada |
| total_online | integer | Quantidade total de dispositivos online |
| devices | array | Lista de dispositivos online |
| devices[].ip | string | Endereço IP do dispositivo |
| devices[].nome | string | Nome/descrição do dispositivo |
| devices[].descricao | string | Tipo do dispositivo (ex: Servidor, Switch, etc.) |

## Suporte

Para questões sobre a API, entre em contato com a equipe de desenvolvimento.

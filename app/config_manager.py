import json
import os
from threading import Lock

class ConfigManager:
    """Gerenciador de configurações do sistema IP Monitor"""
    
    def __init__(self, config_file='app_config.json'):
        self.config_file = config_file
        self.config_lock = Lock()
        self.config = self._load_default_config()
        self.load_config()
    
    def _load_default_config(self):
        """Carrega configurações padrão do sistema"""
        return {
            "ping_intervals": {
                "vlan_70": 60,   # Câmeras - moderada prioridade
                "vlan_80": 60,   # Alarme - alta prioridade
                "vlan_85": 60,    # Automação Ethernet - máxima prioridade
                "vlan_86": 60,   # Automação WiFi - moderada prioridade
                "vlan_200": 60,  # Telefonia IP Fixa - baixa prioridade
                "vlan_204": 60   # Telefonia IP Móvel - baixa prioridade
            },
            "network_settings": {
                "ping_timeout": 2,
                "max_concurrent_pings": 3,
                "retry_attempts": 2
            },
            "ui_settings": {
                "auto_refresh": True,
                "refresh_rate": 5,
                "show_offline_devices": True,
                "theme": "default"
            },
            "monitoring": {
                "enable_logging": True,
                "log_level": "INFO",
                "max_log_entries": 1000,
                "alert_on_device_down": False
            },
            "vlans": {
                "active_vlans": [70, 80, 85, 86, 200, 204],
                "vlan_descriptions": {
                    "70": "VLAN 70 - Câmeras",
                    "80": "VLAN 80 - Alarme",
                    "85": "VLAN 85 - Automação Ethernet", 
                    "86": "VLAN 86 - Automação WiFi",
                    "200": "VLAN 200 - Telefonia IP Fixa",
                    "204": "VLAN 204 - Telefonia IP Móvel"
                },
                "device_types": {
                    "70": ["Câmera IP", "DVR", "NVR", "Switch PoE"],
                    "80": ["Central de Alarme", "Sensor", "Sirene", "Teclado"],
                    "85": ["CLP", "IHM", "Inversor", "Controladora", "Sensor", "UPS", "GMG"],
                    "86": ["Sensor IoT", "Gateway", "Access Point", "Controladora WiFi"],
                    "200": ["Telefone IP", "Gateway SIP", "PBX", "Conversor"],
                    "204": ["Softphone", "Gateway Mobile", "Adaptador ATA", "Roteador"]
                }
            },
            "system_info": {
                "version": "2.0.0",
                "last_updated": "",
                "admin_contact": ""
            }
        }
    
    def load_config(self):
        """Carrega configurações do arquivo"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                    # Merge com configurações padrão para garantir integridade
                    self._merge_config(loaded_config)
        except Exception as e:
            print(f"Erro ao carregar configurações: {e}. Usando configurações padrão.")
    
    def _merge_config(self, loaded_config):
        """Mescla configurações carregadas com as padrão"""
        def deep_merge(default, loaded):
            for key, value in loaded.items():
                if key in default:
                    if isinstance(default[key], dict) and isinstance(value, dict):
                        deep_merge(default[key], value)
                    else:
                        default[key] = value
                else:
                    default[key] = value
        
        deep_merge(self.config, loaded_config)
    
    def save_config(self):
        """Salva configurações no arquivo"""
        try:
            with self.config_lock:
                # Atualiza timestamp
                from datetime import datetime
                self.config['system_info']['last_updated'] = datetime.now().isoformat()
                
                with open(self.config_file, 'w', encoding='utf-8') as f:
                    json.dump(self.config, f, indent=4, ensure_ascii=False)
                return True
        except Exception as e:
            print(f"Erro ao salvar configurações: {e}")
            return False
    
    def get_config(self, section=None):
        """Obtém configurações (toda ou de uma seção específica)"""
        with self.config_lock:
            if section:
                return self.config.get(section, {})
            return self.config.copy()
    
    def update_config(self, section, key, value):
        """Atualiza uma configuração específica"""
        try:
            with self.config_lock:
                if section not in self.config:
                    self.config[section] = {}
                self.config[section][key] = value
                return self.save_config()
        except Exception as e:
            print(f"Erro ao atualizar configuração: {e}")
            return False
    
    def update_section(self, section, data):
        """Atualiza uma seção inteira de configurações"""
        try:
            with self.config_lock:
                if section in self.config:
                    self.config[section].update(data)
                else:
                    self.config[section] = data
                return self.save_config()
        except Exception as e:
            print(f"Erro ao atualizar seção {section}: {e}")
            return False
    
    def get_ping_interval(self, vlan):
        """Obtém intervalo de ping para uma VLAN específica"""
        return self.config['ping_intervals'].get(f'vlan_{vlan}', 10)
    
    def get_active_vlans(self):
        """Obtém lista de VLANs ativas"""
        return self.config['vlans']['active_vlans']
    
    def get_vlan_description(self, vlan):
        """Obtém descrição de uma VLAN"""
        return self.config['vlans']['vlan_descriptions'].get(str(vlan), f'VLAN {vlan}')
    
    def get_device_types(self, vlan):
        """Obtém tipos de dispositivos para uma VLAN específica"""
        return self.config['vlans']['device_types'].get(str(vlan), [])
    
    def add_device_type(self, vlan, device_type):
        """Adiciona um novo tipo de dispositivo para uma VLAN"""
        try:
            with self.config_lock:
                vlan_str = str(vlan)
                if 'device_types' not in self.config['vlans']:
                    self.config['vlans']['device_types'] = {}
                
                if vlan_str not in self.config['vlans']['device_types']:
                    self.config['vlans']['device_types'][vlan_str] = []
                
                if device_type not in self.config['vlans']['device_types'][vlan_str]:
                    self.config['vlans']['device_types'][vlan_str].append(device_type)
                    return self.save_config()
                
                return True  # Tipo já existe
        except Exception as e:
            print(f"Erro ao adicionar tipo de dispositivo: {e}")
            return False
    
    def remove_device_type(self, vlan, device_type):
        """Remove um tipo de dispositivo de uma VLAN"""
        try:
            with self.config_lock:
                vlan_str = str(vlan)
                if (vlan_str in self.config['vlans']['device_types'] and 
                    device_type in self.config['vlans']['device_types'][vlan_str]):
                    self.config['vlans']['device_types'][vlan_str].remove(device_type)
                    return self.save_config()
                return True
        except Exception as e:
            print(f"Erro ao remover tipo de dispositivo: {e}")
            return False
    
    def reset_to_defaults(self):
        """Reseta configurações para os valores padrão"""
        with self.config_lock:
            self.config = self._load_default_config()
            return self.save_config()

# Instância global do gerenciador de configurações
config_manager = ConfigManager()
<template>
  <div class="send-command-container">
    <h2>Envoyer une commande à l'imprimante</h2>
    <h3 v-if="equipmentModel" class="equipment-model">Modèle: {{ equipmentModel }}</h3>
    
    <div class="command-form">
      <div class="form-group">
        <label for="commandType">Type de commande</label>
        <select id="commandType" v-model="selectedCommand" class="form-control">
          <option value="" disabled selected>Sélectionner une commande</option>
          <option value="temperature">Changer Temperature (Contrast)</option>
          <option value="vitesse">Changer Vitesse Impression</option>
          <option value="ip">Changer Adresse IP</option>
          <option value="custom">Commande personnalisée</option>
        </select>
      </div>

      <!-- Temperature Input -->
      <div v-if="selectedCommand === 'temperature'" class="form-group">
        <label for="temperature">Nouvelle température</label>
        <input 
          type="number" 
          id="temperature" 
          v-model.number="temperatureValue" 
          class="form-control"
          min="0"
          max="100"
          step="0.1"
          placeholder="Entrez la température"
        />
      </div>

      <!-- Speed Input -->
      <div v-if="selectedCommand === 'vitesse'" class="form-group">
        <label for="vitesse">Nouvelle vitesse</label>
        <input 
          type="number" 
          id="vitesse" 
          v-model.number="vitesseValue" 
          class="form-control"
          min="1"
          max="100"
          step="0.1"
          placeholder="Entrez la vitesse"
        />
      </div>

      <!-- IP Address Input -->
      <div v-if="selectedCommand === 'ip'" class="form-group">
        <label for="ip">Nouvelle adresse IP</label>
        <input 
          type="text" 
          id="ip" 
          v-model="ipValue" 
          class="form-control"
          placeholder="Ex: 192.168.1.100"
          pattern="^([0-9]{1,3}\.){3}[0-9]{1,3}$"
        />
      </div>

      <!-- Custom Command Input -->
      <div v-if="selectedCommand === 'custom'" class="form-group">
        <label for="customCommand">Commande personnalisée</label>
        <input 
          type="text" 
          id="customCommand" 
          v-model="customCommand" 
          class="form-control"
          placeholder="Entrez votre commande (ex: ! U1 getvar 'device.status')"
        />
        
      </div>

      <!-- Status Messages -->
      <div v-if="statusMessages.length > 0" class="status-messages">
        <div v-for="(message, index) in statusMessages" 
             :key="index" 
             class="status-message"
             :class="{ 'status-success': message.type === 'success', 'status-error': message.type === 'error' }">
          {{ message.text }}
        </div>
      </div>

      <div class="form-group">
        <button 
          class="send-button" 
          @click="sendCommand"
          :disabled="!canSendCommand || isSending"
        >
          {{ isSending ? 'En cours...' : 'Envoyer la commande' }}
        </button>
      </div>
    </div>

    <div v-if="response" class="response-container">
      <h3>Réponse de l'imprimante</h3>
      <div class="response-header">
        <span class="response-label">Commande:</span>
        <code class="command-text">{{ selectedCommand === 'custom' ? customCommand : `Commande ${selectedCommand}` }}</code>
      </div>
      <pre class="response-text">{{ response }}</pre>
      <div v-if="selectedCommand === 'custom'" class="copy-button-container">
        <button @click="copyResponseToClipboard" class="copy-button">
          <i class="fas fa-copy"></i> Copier la réponse
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'SendCommand',
  setup() {
    const route = useRoute();
    const selectedCommand = ref('');
    const customCommand = ref('');
    const temperatureValue = ref('');
    const vitesseValue = ref('');
    const ipValue = ref('');
    const response = ref('');
    const equipmentId = ref(null);
    const equipmentModel = ref('');
    const isSending = ref(false);
    const statusMessages = ref([]);

    onMounted(async () => {
      equipmentId.value = route.query.equipmentId;
      if (equipmentId.value) {
        try {
          const response = await fetch(`http://localhost:3000/api/equipment/${equipmentId.value}`);
          if (!response.ok) {
            throw new Error('Failed to fetch equipment details');
          }
          const data = await response.json();
          equipmentModel.value = data.modele;
        } catch (error) {
          console.error('Error fetching equipment details:', error);
        }
      }
    });

    const canSendCommand = computed(() => {
      if (selectedCommand.value === 'custom') {
        return customCommand.value.trim() !== '';
      } else if (selectedCommand.value === 'temperature') {
        return temperatureValue.value !== '' && 
               parseFloat(temperatureValue.value) >= 0 && 
               parseFloat(temperatureValue.value) <= 100;
      } else if (selectedCommand.value === 'vitesse') {
        return vitesseValue.value !== '' && 
               parseFloat(vitesseValue.value) >= 1 && 
               parseFloat(vitesseValue.value) <= 100;
      } else if (selectedCommand.value === 'ip') {
        const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
        return ipRegex.test(ipValue.value);
      }
      return false;
    });

    const addStatusMessage = (text, type = 'info') => {
      statusMessages.value.push({ text, type });
    };

    const clearStatusMessages = () => {
      statusMessages.value = [];
    };

    const sendCommand = async () => {
      try {
        isSending.value = true;
        clearStatusMessages();
        let commandData = {};
        let endpoint = '';
        
        switch (selectedCommand.value) {
          case 'temperature':
            endpoint = `/api/printer/${equipmentId.value}/temperature`;
            commandData = {
              value: parseFloat(temperatureValue.value)
            };
            addStatusMessage(`Lecture de la température actuelle...`, 'info');
            break;
          case 'vitesse':
            endpoint = `/api/speed/${equipmentId.value}/speed`;
            commandData = {
              value: parseFloat(vitesseValue.value)
            };
            addStatusMessage(`Lecture de la vitesse actuelle...`, 'info');
            break;
          case 'ip':
            endpoint = `/api/printer/${equipmentId.value}/ip`;
            commandData = {
              value: ipValue.value
            };
            addStatusMessage(`Vérification de la nouvelle adresse IP...`, 'info');
            break;
          case 'custom':
            endpoint = `/api/printer/${equipmentId.value}/custom`;
            commandData = {
              command: customCommand.value.trim()
            };
            addStatusMessage(`Envoi de la commande personnalisée...`, 'info');
            break;
        }

        const response = await fetch(`http://localhost:3000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commandData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send command');
        }

        if (selectedCommand.value === 'temperature') {
          const beforeTemp = parseFloat(data.before_contrast).toFixed(1);
          const afterTemp = data.after_contrast;
          addStatusMessage(`Ancienne température: ${beforeTemp}`, 'info');
          addStatusMessage(`Changement de la température à ${temperatureValue.value}...`, 'info');
          addStatusMessage(`Nouvelle température définie: ${afterTemp}`, 'success');
          response.value = data.message;
        } else if (selectedCommand.value === 'vitesse') {
          const beforeSpeed = parseFloat(data.before_speed).toFixed(1);
          const afterSpeed = parseFloat(data.after_speed).toFixed(1);
          addStatusMessage(`Ancienne vitesse: ${beforeSpeed}`, 'info');
          addStatusMessage(`Changement de la vitesse à ${afterSpeed}...`, 'info');
          addStatusMessage(`Nouvelle vitesse définie: ${afterSpeed}`, 'success');
          response.value = data.message;
        } else if (selectedCommand.value === 'ip') {
          addStatusMessage(`Ancienne adresse IP: ${data.old_ip}`, 'info');
          addStatusMessage(`Changement de l'adresse IP à ${data.new_ip}...`, 'info');
          if (data.is_reachable) {
            addStatusMessage(`Nouvelle adresse IP définie et vérifiée: ${data.new_ip}`, 'success');
          } else {
            addStatusMessage(`Nouvelle adresse IP définie: ${data.new_ip}`, 'info');
            addStatusMessage(`Note: La nouvelle adresse IP n'est pas encore accessible. Veuillez vérifier la configuration de l'imprimante.`, 'warning');
          }
          response.value = data.message;
        } else if (selectedCommand.value === 'custom') {
          if (data.success) {
            addStatusMessage(`Commande envoyée avec succès: ${customCommand.value}`, 'success');
            if (data.response && data.response !== 'No response from printer') {
              addStatusMessage(`Réponse de l'imprimante: ${data.response}`, 'info');
              response.value = data.response;
            } else {
              addStatusMessage(`Aucune réponse de l'imprimante`, 'info');
              response.value = 'La commande a été exécutée, mais l\'imprimante n\'a pas renvoyé de réponse.';
            }
          } else {
            addStatusMessage(`Erreur: La commande n'a pas été acceptée par l'imprimante`, 'error');
            if (data.error) {
              addStatusMessage(`Détails: ${data.error}`, 'error');
            }
            response.value = data.message || data.error || 'Erreur lors de l\'exécution de la commande';
          }
        }
      } catch (error) {
        console.error('Error sending command:', error);
        addStatusMessage(`Erreur: ${error.message}`, 'error');
        response.value = `Erreur: ${error.message}`;
      } finally {
        isSending.value = false;
      }
    };

    return {
      selectedCommand,
      customCommand,
      temperatureValue,
      vitesseValue,
      ipValue,
      response,
      canSendCommand,
      sendCommand,
      equipmentModel,
      isSending,
      statusMessages,
      copyResponseToClipboard() {
        if (response.value) {
          navigator.clipboard.writeText(response.value)
            .then(() => {
              addStatusMessage('Réponse copiée dans le presse-papiers', 'success');
            })
            .catch(err => {
              console.error('Erreur lors de la copie:', err);
              addStatusMessage('Erreur lors de la copie de la réponse', 'error');
            });
        }
      }
    };
  }
};
</script>

<style lang="scss" scoped>
.send-command-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #1e293b;
  margin-bottom: 16px;
  font-family: "Inter", sans-serif;
}

.equipment-model {
  color: #475569;
  margin-bottom: 24px;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
}

.command-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  color: #475569;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-family: "Inter", sans-serif;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
}

.status-messages {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-message {
  padding: 8px 12px;
  border-radius: 4px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  
  &.status-success {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }
  
  &.status-error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
}

.send-button {
  background-color: #3b82f6;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }
}

.response-container {
  margin-top: 24px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.response-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.response-label {
  font-weight: 500;
  color: #475569;
}

.command-text {
  font-family: monospace;
  background-color: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.response-text {
  white-space: pre-wrap;
  font-family: monospace;
  color: #1e293b;
  background-color: #ffffff;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  max-height: 300px;
  overflow-y: auto;
}

.copy-button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.copy-button {
  background-color: #f1f5f9;
  color: #1e293b;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-button:hover {
  background-color: #e2e8f0;
}

.help-text {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
  font-style: italic;
}

.custom-command-help {
  margin-top: 8px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;

  h4 {
    color: #1e293b;
    margin-bottom: 16px;
    font-family: "Inter", sans-serif;
  }

  .command-examples {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .command-example {
      display: flex;
      align-items: center;
      gap: 8px;

      code {
        color: #1e293b;
        font-family: monospace;
      }

      span {
        color: #475569;
        font-family: "Inter", sans-serif;
      }
    }
  }

  .command-instructions {
    color: #666;
    font-size: 12px;
    font-style: italic;
  }
}
</style> 
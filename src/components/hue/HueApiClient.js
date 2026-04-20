import https from 'node:https';
import axios from 'axios';
import { AppError } from '../../shared/errors/AppError.js';

export class HueApiClient {
  constructor({ bridgeIp, appKey, allowSelfSigned }) {
    this.client = axios.create({
      baseURL: `https://${bridgeIp}/clip/v2`,
      timeout: 10_000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: !allowSelfSigned,
      }),
      headers: {
        'hue-application-key': appKey,
      },
    });
  }

  async getLights() {
    const response = await this.client.get('/resource/light');

    return response.data?.data ?? [];
  }

  async getGroupedLights() {
    const response = await this.client.get('/resource/grouped_light');

    return response.data?.data ?? [];
  }

  async setLightColor(lightId, { x, y, brightness }) {
    try {
      await this.client.put(`/resource/light/${lightId}`, {
        on: { on: true },
        color: { xy: { x, y } },
        dimming: { brightness },
      });
    } catch (error) {
      throw new AppError('No se pudo actualizar una luz en Hue', {
        lightId,
        cause: error.message,
      });
    }
  }

  async setGroupedLightColor(groupedLightId, { x, y, brightness }) {
    try {
      await this.client.put(`/resource/grouped_light/${groupedLightId}`, {
        on: { on: true },
        color: { xy: { x, y } },
        dimming: { brightness },
      });
    } catch (error) {
      throw new AppError('No se pudo actualizar un grupo de luces en Hue', {
        groupedLightId,
        cause: error.message,
      });
    }
  }
}

import { describe, expect, it, vi } from 'vitest';
import { HueLightService } from '../src/components/hue/HueLightService.js';

const createService = ({ lights = [], groupedLights = [], configuredLightIds = [], configuredGroupedLightIds = [] } = {}) => {
  const hueApiClient = {
    getLights: vi.fn().mockResolvedValue(lights),
    getGroupedLights: vi.fn().mockResolvedValue(groupedLights),
    setLightColor: vi.fn().mockResolvedValue(undefined),
    setGroupedLightColor: vi.fn().mockResolvedValue(undefined),
  };

  const service = new HueLightService({
    hueApiClient,
    defaultBrightness: 80,
    configuredLightIds,
    configuredGroupedLightIds,
    logger: { info: vi.fn() },
  });

  return { service, hueApiClient };
};

describe('HueLightService', () => {
  it('usa solo grouped_light cuando HUE_GROUPED_LIGHT_IDS esta configurado', async () => {
    const { service, hueApiClient } = createService({
      lights: [{ id: 'light-1' }, { id: 'light-2' }],
      groupedLights: [{ id: 'group-1' }, { id: 'group-2' }],
      configuredGroupedLightIds: ['group-2'],
    });

    await service.setColor({
      name: 'azul',
      hex: '#0000ff',
      rgb: { r: 0, g: 0, b: 255 },
    });

    expect(hueApiClient.setLightColor).not.toHaveBeenCalled();
    expect(hueApiClient.setGroupedLightColor).toHaveBeenCalledTimes(1);
    expect(hueApiClient.setGroupedLightColor).toHaveBeenCalledWith(
      'group-2',
      expect.objectContaining({ brightness: 80 }),
    );
  });

  it('usa todas las luces individuales cuando no hay targets configurados', async () => {
    const { service, hueApiClient } = createService({
      lights: [{ id: 'light-1' }, { id: 'light-2' }],
      groupedLights: [{ id: 'group-1' }],
    });

    await service.setColor({
      name: 'rojo',
      hex: '#ff0000',
      rgb: { r: 255, g: 0, b: 0 },
    });

    expect(hueApiClient.setLightColor).toHaveBeenCalledTimes(2);
    expect(hueApiClient.setGroupedLightColor).not.toHaveBeenCalled();
  });
});
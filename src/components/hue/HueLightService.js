import { rgbToXy } from './color-conversion.js';
import { AppError } from '../../shared/errors/AppError.js';

export class HueLightService {
  constructor({
    hueApiClient,
    defaultBrightness = 80,
    configuredLightIds = [],
    configuredGroupedLightIds = [],
    logger,
  }) {
    this.hueApiClient = hueApiClient;
    this.defaultBrightness = defaultBrightness;
    this.configuredLightIds = configuredLightIds;
    this.configuredGroupedLightIds = configuredGroupedLightIds;
    this.logger = logger;
  }

  async setColor(color) {
    const xy = rgbToXy(color.rgb);
    const lights = await this.hueApiClient.getLights();
    const groupedLights = await this.hueApiClient.getGroupedLights();
    const hasExplicitTargets =
      this.configuredLightIds.length > 0 || this.configuredGroupedLightIds.length > 0;

    if (lights.length === 0 && groupedLights.length === 0) {
      throw new AppError('No hay recursos disponibles en Hue');
    }

    const selectedLightIds =
      this.configuredLightIds.length > 0
        ? lights
            .filter((light) => this.configuredLightIds.includes(light.id))
            .map((light) => light.id)
        : hasExplicitTargets
          ? []
          : lights.map((light) => light.id);

    const selectedGroupedLightIds =
      this.configuredGroupedLightIds.length > 0
        ? groupedLights
            .filter((groupedLight) => this.configuredGroupedLightIds.includes(groupedLight.id))
            .map((groupedLight) => groupedLight.id)
        : [];

    if (selectedLightIds.length === 0 && selectedGroupedLightIds.length === 0) {
      throw new AppError('Ninguna luz o grupo coincide con HUE_LIGHT_IDS o HUE_GROUPED_LIGHT_IDS');
    }

    await Promise.all(
      [
        ...selectedLightIds.map((lightId) =>
          this.hueApiClient.setLightColor(lightId, {
            ...xy,
            brightness: this.defaultBrightness,
          }),
        ),
        ...selectedGroupedLightIds.map((groupedLightId) =>
          this.hueApiClient.setGroupedLightColor(groupedLightId, {
            ...xy,
            brightness: this.defaultBrightness,
          }),
        ),
      ],
    );

    this.logger.info(
      {
        lights: selectedLightIds,
        groupedLights: selectedGroupedLightIds,
        color,
        xy,
      },
      'Color aplicado en luces Hue',
    );
  }
}

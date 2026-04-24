export class FunaCommand {
  constructor({
    identityService,
    cooldownService,
    funaService,
    logger,
  }) {
    this.name = 'funa';
    this.identityService = identityService;
    this.cooldownService = cooldownService;
    this.funaService = funaService;
    this.logger = logger;
  }

  async execute(context) {
    const { channel, user, args, text } = context;

    // Validar que se pasó un nombre de usuario
    if (!args || args.length === 0) {
      return 'Uso: !funa <usuario>';
    }

    const targetUsername = args[0].replace(/^@+/, '');

    // Verificar cooldown por canal (scope global)
    const scopeKey = `${channel}:global`;
    const cooldownCheck = this.cooldownService.checkCooldown(this.name, scopeKey);

    if (cooldownCheck.onCooldown) {
      return `Espera un poco, acaban de usar esto. Intenta en ${cooldownCheck.remainingSeconds}s.`;
    }

    try {
      // Obtener o crear identidad del actor (quien ejecuta el comando)
      const actorIdentity = this.identityService.getOrCreateIdentity(
        'twitch',
        user.id,
        user.username,
        user.displayName,
      );

      // Buscar usuario target: usar registro existente o crear uno pendiente.
      let targetUser = null;
      const candidateMatches = this.identityService.findSimilarUsers(targetUsername);

      if (candidateMatches.length > 0) {
        // Tomar el mejor match
        targetUser = candidateMatches[0];
      } else {
        const unresolvedIdentity = this.identityService.getOrCreateUnresolvedIdentity(
          'twitch',
          targetUsername,
        );

        targetUser = {
          user_id: unresolvedIdentity.user_id,
          username: unresolvedIdentity.username,
        };
      }

      // Registrar evento de funa
      this.funaService.recordFunaEvent(
        actorIdentity.id,
        targetUser.user_id,
        'twitch',
        text, // sourceMessageId
      );

      // Obtener conteo actualizado
      const funaCount = this.funaService.getFunaCount(targetUser.user_id);

      // Registrar uso de comando (actualizar cooldown)
      this.cooldownService.recordUsage(this.name, scopeKey);

      return `${targetUser.username} ha sido funado ${funaCount} veces 😅`;
    } catch (error) {
      this.logger?.error({
        command: this.name,
        user: user?.displayName ?? user?.username,
        targetUsername,
        error: error.message,
      }, 'Error ejecutando comando funa');

      return 'Hubo un error al procesar el funa. Intenta de nuevo.';
    }
  }
}

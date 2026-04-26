import { describe, expect, it, vi } from 'vitest';
import { CustomCommandTemplateService } from '../src/core/services/CustomCommandTemplateService.js';

describe('CustomCommandTemplateService', () => {
  it('reemplaza variables de usuario en sintaxis ${} y $()', () => {
    const service = new CustomCommandTemplateService();
    const rendered = service.render('Hola ${user} / $(user)', {
      user: {
        username: 'dmaster',
        displayName: 'DMaster',
      },
    });

    expect(rendered).toBe('Hola DMaster / DMaster');
  });

  it('reemplaza args y arg por índice', () => {
    const service = new CustomCommandTemplateService();
    const rendered = service.render('args=${args}; arg0=${arg.0}; arg1=${arg.1}', {
      args: ['hola', 'mundo'],
    });

    expect(rendered).toBe('args=hola mundo; arg0=hola; arg1=mundo');
  });

  it('genera random numérico en rango inclusive', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const service = new CustomCommandTemplateService();

    const rendered = service.render('n=${random.0-20}', {});

    expect(rendered).toBe('n=10');
    randomSpy.mockRestore();
  });

  it('elige un random chatter y hace fallback al usuario si no hay chatters', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const service = new CustomCommandTemplateService();

    const renderedWithChatters = service.render('${random.chatter}', {
      user: { username: 'dmaster', displayName: 'DMaster' },
      chatters: ['waffle', 'lucy'],
    });

    const renderedFallback = service.render('${random.chatter}', {
      user: { username: 'dmaster', displayName: 'DMaster' },
      chatters: [],
    });

    expect(renderedWithChatters).toBe('waffle');
    expect(renderedFallback).toBe('DMaster');
    randomSpy.mockRestore();
  });

  it('resuelve random.pick con strings entre comillas', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const service = new CustomCommandTemplateService();

    const rendered = service.render("${random.pick 'uno' 'dos' 'tres'}", {});

    expect(rendered).toBe('tres');
    randomSpy.mockRestore();
  });

  it('resuelve random.when para ramas condicionales por rango', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.6); // 12 en rango 0-20
    const service = new CustomCommandTemplateService();

    const rendered = service.render(
      "${random.when 0-20 >10 'sacale un id propio' =0 'se escondio la tortuga' else 'meh'}",
      {},
    );

    expect(rendered).toBe('sacale un id propio');
    randomSpy.mockRestore();
  });

  it('random.when permite rama exacta y fallback else', () => {
    const service = new CustomCommandTemplateService();

    const randomZeroSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // 0 en rango 0-20
    const renderedZero = service.render(
      "${random.when 0-20 >10 'alto' =0 'se escondio la tortuga' else 'normal'}",
      {},
    );
    randomZeroSpy.mockRestore();

    const randomMidSpy = vi.spyOn(Math, 'random').mockReturnValue(0.3); // 6 en rango 0-20
    const renderedMid = service.render(
      "${random.when 0-20 >10 'alto' =0 'se escondio la tortuga' else 'normal'}",
      {},
    );
    randomMidSpy.mockRestore();

    expect(renderedZero).toBe('se escondio la tortuga');
    expect(renderedMid).toBe('normal');
  });
});

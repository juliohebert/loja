/**
 * Definição dos temas disponíveis no sistema
 *
 * REGRA: O tema 'padrao' nunca modifica nada — Tailwind funciona nativamente.
 * Temas alternativos aplicam CSS variables sob a classe html.tema-ativo.
 */

export const TEMAS_DISPONIVEIS = {
  padrao: {
    id: 'padrao',
    nome: 'Azul Profissional',
    descricao: 'Tema padrão do sistema — sem alterações',
    preview: { primaria: '#135bec', secundaria: '#1e293b', fundo: '#f6f6f8' },
    cores: null // null = não aplica nenhum override
  },

  rosaElegante: {
    id: 'rosaElegante',
    nome: 'Rosa Elegante',
    descricao: 'Tema inspirado em tons de rosê e marrom quente',
    preview: { primaria: '#4A3B3B', secundaria: '#7a6060', fundo: '#BA9797' },
    cores: {
      background:           '#BA9797', // rosê acinzentado — fundo principal
      backgroundSecundario: 'rgba(255, 255, 255, 0.4)', // cards semi-transparentes (igual ao site ref)
      texto:                '#2D1F1F', // quase preto quentinho
      textoSecundario:      '#5C4A4A', // marrom médio
      primaria:             '#4A3B3B', // marrom escuro — botões de ação
      primariaHover:        '#3a2d2d', // hover mais escuro
      secundaria:           '#7a6060', // marrom médio — ações secundárias
      secundariaHover:      '#6a5050',
      sucesso:              '#3E5A44', // verde discreto harmonizado
      aviso:                '#B8761F', // âmbar quentinho
      erro:                 '#8B4444', // vermelho rosado
      borda:                '#c9aaaa', // borda sutil rosê
      sidebar:              '#4A3B3B', // marrom escuro — menu lateral
      sidebarTexto:         '#FDD7D7'  // rosa clarinho — texto do menu
    }
  }
};

export const TEMA_PADRAO = 'padrao';

export function obterTema(id) {
  return TEMAS_DISPONIVEIS[id] || TEMAS_DISPONIVEIS[TEMA_PADRAO];
}

export function listarTemas() {
  return Object.values(TEMAS_DISPONIVEIS);
}

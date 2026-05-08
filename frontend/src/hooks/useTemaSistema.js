import { useEffect } from 'react';
import { obterTema, TEMA_PADRAO } from '../config/temas';
import { getAuthHeaders } from '../utils/auth';
import API_URL from '../config/apiUrl';

const VARIAVEIS_CSS = [
  '--color-background', '--color-background-secundario',
  '--color-texto', '--color-texto-secundario',
  '--color-primaria', '--color-primaria-hover',
  '--color-secundaria', '--color-secundaria-hover',
  '--color-sucesso', '--color-aviso', '--color-erro',
  '--color-borda', '--color-sidebar', '--color-sidebar-texto'
];

export function aplicarTemaNoDOM(temaId) {
  const html = document.documentElement;

  if (!temaId || temaId === TEMA_PADRAO) {
    // Remove TUDO — Tailwind volta a funcionar normalmente
    html.classList.remove('tema-ativo');
    VARIAVEIS_CSS.forEach(v => html.style.removeProperty(v));
    document.body.style.removeProperty('background-color');
    document.body.style.removeProperty('color');
    return;
  }

  const tema = obterTema(temaId);
  if (!tema || !tema.cores) return;

  // Ativa scoping class + aplica CSS variables
  html.classList.add('tema-ativo');
  const cores = tema.cores;
  html.style.setProperty('--color-background',            cores.background);
  html.style.setProperty('--color-background-secundario', cores.backgroundSecundario);
  html.style.setProperty('--color-texto',                 cores.texto);
  html.style.setProperty('--color-texto-secundario',      cores.textoSecundario);
  html.style.setProperty('--color-primaria',              cores.primaria);
  html.style.setProperty('--color-primaria-hover',        cores.primariaHover);
  html.style.setProperty('--color-secundaria',            cores.secundaria);
  html.style.setProperty('--color-secundaria-hover',      cores.secundariaHover);
  html.style.setProperty('--color-sucesso',               cores.sucesso);
  html.style.setProperty('--color-aviso',                 cores.aviso);
  html.style.setProperty('--color-erro',                  cores.erro);
  html.style.setProperty('--color-borda',                 cores.borda);
  html.style.setProperty('--color-sidebar',               cores.sidebar);
  html.style.setProperty('--color-sidebar-texto',         cores.sidebarTexto);

  document.body.style.backgroundColor = cores.background;
  document.body.style.color = cores.texto;
}

export function useTemaSistema() {
  useEffect(() => {
    carregarEAplicar();
  }, []);

  async function carregarEAplicar() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/configurations/tema_selecionado`, {
        headers: getAuthHeaders()
      });

      let temaId = TEMA_PADRAO;
      if (res.ok) {
        const data = await res.json();
        temaId = data.data?.valor || TEMA_PADRAO;
      }

      aplicarTemaNoDOM(temaId);
    } catch {
      aplicarTemaNoDOM(TEMA_PADRAO);
    }
  }
}

export default useTemaSistema;

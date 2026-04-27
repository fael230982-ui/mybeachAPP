import { create } from 'zustand';

export type BeachData = {
  id: string;
  cityId?: string | null;
  name: string;
  temp: string;
  waves: string;
  wind: string;
  uv: string;
  flag: string;
  updatedAt: string;
  curiosidades: string[];
  ruas: string[];
  pontosTuristicos: string[];
  locaisInstagramaveis: string[];
  regrasDaPraia: string[];
  comerciosSugeridos: string[];
};

type BeachStore = {
  selectedBeach: BeachData | null;
  setSelectedBeach: (beach: BeachData) => void;
  clearBeach: () => void;
};

export const useBeachStore = create<BeachStore>((set) => ({
  selectedBeach: null,
  setSelectedBeach: (beach) => set({ selectedBeach: beach }),
  clearBeach: () => set({ selectedBeach: null }),
}));

export const defaultBeachData: BeachData = {
  id: 'pitangueiras-default',
  cityId: null,
  name: 'Pitangueiras',
  temp: '--',
  waves: '--',
  wind: '--',
  uv: '--',
  flag: 'verde',
  updatedAt: 'Agora',
  curiosidades: ['Selecione uma praia cadastrada para carregar os dados operacionais do backend.'],
  ruas: ['Aguardar integracao geografica detalhada.'],
  pontosTuristicos: ['Dados complementares ainda nao carregados.'],
  locaisInstagramaveis: ['Dados complementares ainda nao carregados.'],
  regrasDaPraia: ['Siga sempre as orientacoes dos guarda-vidas e da sinalizacao local.'],
  comerciosSugeridos: ['Nenhum comercio sincronizado para esta praia no momento.'],
};
